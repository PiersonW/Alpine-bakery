import { Resend } from "resend";
import { formatPickupTime } from "./pickupTimes";

let resend;

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Sends the bakery owner a plain-text summary of a new order. Any error
// here is caught by the caller -- a failed notification email should
// never cause the customer's payment or checkout to look like it failed.
export async function sendOwnerOrderEmail({
  pickupDate,
  pickupTime,
  customerEmail,
  customerPhone,
  lineItems,
  totalCents,
}) {
  const itemLines = lineItems
    .filter((li) => li.description !== "Sales tax (7%)")
    .map((li) => `  ${li.quantity} x ${li.description} — $${(li.amount_total / 100).toFixed(2)}`)
    .join("\n");

  const taxLine = lineItems.find((li) => li.description === "Sales tax (7%)");
  const prettyTime = pickupTime ? formatPickupTime(pickupTime) : "not specified";

  const text = `New order from Alpine Bakery website!

Pickup date: ${pickupDate}
Pickup time: ${prettyTime}
Customer email: ${customerEmail || "not provided"}
Customer phone: ${customerPhone || "not provided"}

Items:
${itemLines}
${taxLine ? `\nSales tax: $${(taxLine.amount_total / 100).toFixed(2)}` : ""}

Total paid: $${(totalCents / 100).toFixed(2)}

(This order was also confirmed to the customer by Stripe automatically.)`;

  await getResend().emails.send({
    from: "Alpine Bakery <orders@alpinebakery.org>",
    to: "alpinebakery0901@gmail.com",
    subject: `New order — pickup ${pickupDate} at ${prettyTime}`,
    text,
  });
}
