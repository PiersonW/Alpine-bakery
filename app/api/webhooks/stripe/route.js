import Stripe from "stripe";
import { sendOwnerOrderEmail } from "../../../../lib/email";
import { getDb, ensureSchema } from "../../../../lib/db";

// Sending email needs Node's networking, which isn't available in the
// lightweight "Edge" runtime -- this forces the regular Node runtime.
export const runtime = "nodejs";

export async function POST(request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = request.headers.get("stripe-signature");
  const rawBody = await request.text();

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return new Response(`Webhook signature verification failed: ${err.message}`, {
      status: 400,
    });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    let lineItemsResult;
    try {
      lineItemsResult = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 100 }
      );
    } catch (err) {
      console.error("Failed to fetch line items:", err);
      lineItemsResult = { data: [] };
    }

    try {
      await sendOwnerOrderEmail({
        pickupDate: session.metadata?.pickup_date || "not specified",
        pickupTime: session.metadata?.pickup_time || null,
        customerEmail: session.customer_details?.email,
        customerPhone: session.customer_details?.phone,
        lineItems: lineItemsResult.data,
        totalCents: session.amount_total,
      });
    } catch (err) {
      // Log but don't fail the webhook -- Stripe retries failed webhooks,
      // and the customer's payment already succeeded regardless.
      console.error("Failed to send owner order email:", err);
    }

    try {
      await ensureSchema();
      const db = getDb();
      const items = lineItemsResult.data.map((item) => ({
        description: item.description,
        quantity: item.quantity,
        amount_total: item.amount_total,
      }));

      await db.execute({
        sql: `INSERT OR IGNORE INTO orders
              (id, stripe_session_id, customer_email, customer_phone, pickup_date, pickup_time, items, total_cents, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
        args: [
          session.id,
          session.id,
          session.customer_details?.email || null,
          session.customer_details?.phone || null,
          session.metadata?.pickup_date || null,
          session.metadata?.pickup_time || null,
          JSON.stringify(items),
          session.amount_total,
        ],
      });
    } catch (err) {
      // Same principle as above: log it, but never fail the webhook over this.
      console.error("Failed to save order to database:", err);
    }
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
