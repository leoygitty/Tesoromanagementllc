// api/create-checkout-session.ts
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-04-10",
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

  // $75.00 deposit in cents
  const depositAmount = 7500;

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: depositAmount,
      currency: "usd",
      receipt_email: email,
      metadata: {
        kind: "move_deposit",
        service,
        date,
        timeWindow: timeWindow || "",
      },
      automatic_payment_methods: { enabled: true },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err: any) {
    console.error("Stripe PaymentIntent error:", err);
    return res
      .status(500)
      .json({ error: "Unable to create payment intent" });
  }
}
