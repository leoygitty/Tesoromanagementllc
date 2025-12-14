import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false });
    return;
  }

  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const email = body?.email;

    if (!email || typeof email !== "string") {
      res.status(200).json({ ok: false });
      return;
    }

    await resend.emails.send({
      from: `Neighborhood Krew <quotes@neighborhoodkrew.com>`,
      to: [
        process.env.PROMO_OWNER_EMAIL,
        process.env.PROMO_MANAGER_EMAIL,
      ].filter(Boolean),
      subject: process.env.PROMO_SUBJECT || "New Promo Signup",
      html: `
        <h2>New Promo Signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Promo Code:</strong> ${process.env.PROMO_CODE}</p>
      `,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SUBSCRIBE ERROR:", err);
    res.status(500).json({ ok: false });
  }
}
