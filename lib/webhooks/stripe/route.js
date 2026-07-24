import Stripe from "stripe";
import { sendOwnerOrderEmail } from "../../../../lib/email";

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

    try {
      const lineItemsResult = await stripe.checkout.sessions.listLineItems(
        session.id,
        { limit: 100 }
      );

      await sendOwnerOrderEmail({
        pickupDate: session.metadata?.pickup_date || "not specified",
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
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}
