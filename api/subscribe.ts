import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false });
    }

    const email = req.body?.email;

    if (!email || typeof email !== "string") {
      console.error("INVALID BODY:", req.body);
      return res.status(400).json({ ok: false });
    }

    const recipients: string[] = [];

    if (process.env.PROMO_OWNER_EMAIL) {
      recipients.push(process.env.PROMO_OWNER_EMAIL);
    }

    if (process.env.PROMO_MANAGER_EMAIL) {
      recipients.push(process.env.PROMO_MANAGER_EMAIL);
    }

    await resend.emails.send({
      from: "Neighborhood Krew <quotes@neighborhoodkrew.com>",
      to: recipients,
      subject: process.env.PROMO_SUBJECT || "New Promo Signup",
      html: `
        <h2>New Promo Signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Promo Code:</strong> ${process.env.PROMO_CODE}</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SUBSCRIBE FUNCTION ERROR:", err);
    return res.status(500).json({ ok: false });
  }
}
