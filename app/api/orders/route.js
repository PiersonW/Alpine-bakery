import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getDb, ensureSchema } from "../../../lib/db";

export const dynamic = "force-dynamic";

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

export async function PUT(request) {
  const { id, status } = await request.json();
  if (!id || !status) {
    return NextResponse.json({ error: "id and status are required" }, { status: 400 });
  }
  const db = getDb();
  await db.execute({
    sql: "UPDATE orders SET status = ? WHERE id = ?",
    args: [status, id],
  });
  return NextResponse.json({ success: true });
}
