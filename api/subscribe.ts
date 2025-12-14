import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).send("Method Not Allowed");
  }

  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(200).json({ ok: false });
    }

    await resend.emails.send({
      from: process.env.PROMO_FROM_EMAIL!, // quotes@neighborhoodkrew.com
      to: [
        process.env.PROMO_OWNER_EMAIL!,
        process.env.PROMO_MANAGER_EMAIL!,
      ].filter(Boolean),
      subject: process.env.PROMO_SUBJECT!,
      html: `
        <h2>New Promo Signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Promo Code:</strong> ${process.env.PROMO_CODE}</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SUBSCRIBE ERROR:", err);
    return res.status(200).json({ ok: false });
  }
}
