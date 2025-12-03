// api/create-checkout-session.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, service, date, timeWindow } = req.body || {};

  if (!email || !service || !date) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const depositAmount = 7500; // $75 in cents

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: depositAmount,
            product_data: {
              name: `Move date deposit – ${service}`,
              description: `Preferred date: ${date}${
                timeWindow ? ` (${timeWindow})` : ""
              }`,
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        kind: "move_deposit",
        service,
        date,
        timeWindow: timeWindow || "",
      },
      success_url: `${
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://neighborhoodkrew.com"
      }/booking-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${
        process.env.NEXT_PUBLIC_SITE_URL ||
        "https://neighborhoodkrew.com"
      }/booking-cancelled`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res
      .status(500)
      .json({ error: "Unable to create checkout session" });
  }
}
