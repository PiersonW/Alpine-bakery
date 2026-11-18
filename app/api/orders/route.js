import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import { getDb, ensureSchema } from "../../../lib/db";

export const dynamic = "force-dynamic";

// Online orders saved before the webhook started recording the
// customer's name have no name. Look each one up in Stripe once and
// save it. If Stripe has no name either, save "" so we don't ask again.
async function fillMissingNamesFromStripe(db, orders) {
  const missing = orders.filter(
    (o) => o.stripe_session_id && o.customer_name === null
  );
  if (missing.length === 0 || !process.env.STRIPE_SECRET_KEY) return;

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  await Promise.all(
    missing.slice(0, 50).map(async (order) => {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        const name = (session.customer_details?.name || "").trim();
        await db.execute({
          sql: "UPDATE orders SET customer_name = ? WHERE id = ? AND customer_name IS NULL",
          args: [name, order.id],
        });
        order.customer_name = name;
      } catch (err) {
        // Leave it for next time; the orders list still loads.
        console.error("Couldn't look up name for order", order.id, err.message);
      }
    })
  );
}

export async function GET() {
  await ensureSchema();
  const db = getDb();
  const result = await db.execute(
    "SELECT * FROM orders ORDER BY created_at DESC"
  );
  const orders = result.rows.map((row) => ({
    ...row,
    items: JSON.parse(row.items || "[]"),
  }));
  await fillMissingNamesFromStripe(db, orders);
  return NextResponse.json(orders, {
    headers: { "Cache-Control": "no-store" },
  });
}

// Lets the owner add an order taken over the phone, rather than through
// Stripe checkout -- same shape as a Stripe-originated order, just entered
// by hand.
export async function POST(request) {
  await ensureSchema();
  const body = await request.json();
  const {
    customer_name,
    customer_email,
    customer_phone,
    pickup_date,
    pickup_time,
    items,
    total_cents,
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Add at least one item." }, { status: 400 });
  }
  if (!total_cents || total_cents <= 0) {
    return NextResponse.json({ error: "Order total must be greater than $0." }, { status: 400 });
  }

  const db = getDb();
  const id = `manual_${randomUUID()}`;

  await db.execute({
    sql: `INSERT INTO orders
          (id, stripe_session_id, customer_name, customer_email, customer_phone, pickup_date, pickup_time, items, total_cents, status)
          VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, 'new')`,
    args: [
      id,
      customer_name || null,
      customer_email || null,
      customer_phone || null,
      pickup_date || null,
      pickup_time || null,
      JSON.stringify(items),
      total_cents,
    ],
  });

  return NextResponse.json({ id });
}

// Fields the owner can change on an existing order. Sending only
// { id, status } still just changes the status.
const EDITABLE = [
  "customer_name",
  "customer_email",
  "customer_phone",
  "pickup_date",
  "pickup_time",
  "items",
  "total_cents",
  "status",
];

export async function PUT(request) {
  const body = await request.json();
  const { id } = body;
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const sets = [];
  const args = [];
  for (const field of EDITABLE) {
    if (!(field in body)) continue;
    let value = body[field];
    if (field === "items") {
      if (!Array.isArray(value) || value.length === 0) {
        return NextResponse.json({ error: "Add at least one item." }, { status: 400 });
      }
      value = JSON.stringify(value);
    } else if (field === "total_cents") {
      if (!Number.isInteger(value) || value <= 0) {
        return NextResponse.json({ error: "Order total must be greater than $0." }, { status: 400 });
      }
    } else if (field === "status") {
      if (!value) {
        return NextResponse.json({ error: "status can't be empty" }, { status: 400 });
      }
    } else if (typeof value === "string") {
      value = value.trim() || null;
    } else if (value !== null) {
      return NextResponse.json({ error: `${field} must be text` }, { status: 400 });
    }
    sets.push(`${field} = ?`);
    args.push(value);
  }

  if (sets.length === 0) {
    return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  }

  const db = getDb();
  const result = await db.execute({
    sql: `UPDATE orders SET ${sets.join(", ")} WHERE id = ?`,
    args: [...args, id],
  });
  if (result.rowsAffected === 0) {
    return NextResponse.json({ error: "That order wasn't found." }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function DELETE(request) {
  const { id } = await request.json();
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }
  const db = getDb();
  await db.execute({
    sql: "DELETE FROM orders WHERE id = ?",
    args: [id],
  });
  return NextResponse.json({ success: true });
}
