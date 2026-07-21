import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getDb, ensureSchema } from "../../../lib/db";

export async function POST(request) {
  await ensureSchema();
  const { items, pickup_date } = await request.json();

  if (!items || items.length === 0) {
    return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
  }

  if (!pickup_date || !/^\d{4}-\d{2}-\d{2}$/.test(pickup_date)) {
    return NextResponse.json(
      { error: "Please choose a pickup date." },
      { status: 400 }
    );
  }

  const db = getDb();

  // Re-check the pickup date server-side -- the date could have been
  // blocked by the owner after the customer's page loaded.
  const blockedCheck = await db.execute({
    sql: "SELECT 1 FROM blocked_dates WHERE date = ?",
    args: [pickup_date],
  });
  if (blockedCheck.rows.length > 0) {
    return NextResponse.json(
      { error: "That pickup date just became unavailable. Please pick another." },
      { status: 400 }
    );
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const chosenDate = new Date(pickup_date + "T00:00:00");
  if (chosenDate < today) {
    return NextResponse.json(
      { error: "That pickup date has already passed. Please pick another." },
      { status: 400 }
    );
  }
  const ids = items.map((i) => i.id);
  const placeholders = ids.map(() => "?").join(",");
  const result = await db.execute({
    sql: `SELECT * FROM products WHERE id IN (${placeholders})`,
    args: ids,
  });

  const productsById = Object.fromEntries(result.rows.map((p) => [p.id, p]));

  const line_items = [];
  for (const item of items) {
    const product = productsById[item.id];
    if (!product || !product.available) {
      return NextResponse.json(
        { error: `"${item.name}" is no longer available. Please remove it from your cart.` },
        { status: 400 }
      );
    }
    const qty = Math.max(1, Math.min(50, Math.round(item.qty)));
    line_items.push({
      quantity: qty,
      price_data: {
        currency: "usd",
        unit_amount: product.price_cents,
        product_data: {
          name: product.name,
          images: product.image_url ? [product.image_url] : [],
        },
      },
    });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.headers.get("origin");

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items,
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}&pickup_date=${pickup_date}`,
    cancel_url: `${baseUrl}/cart`,
    // Home-baked goods usually mean local pickup rather than shipping.
    // Switch this on (and add shipping_options) if you ever want to mail orders.
    phone_number_collection: { enabled: true },
    metadata: { pickup_date },
    payment_intent_data: {
      metadata: { pickup_date },
      description: `Pickup date: ${pickup_date}`,
    },
  });

  return NextResponse.json({ url: session.url });
}
