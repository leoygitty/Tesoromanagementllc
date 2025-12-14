import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function (req: any, res: any) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    return res.end("Method Not Allowed");
  }

  try {
    const body = typeof req.body === "string"
      ? JSON.parse(req.body)
      : req.body;

    const email = body?.email;

    if (!email || typeof email !== "string") {
      res.statusCode = 200;
      return res.end(JSON.stringify({ ok: false }));
    }

    await resend.emails.send({
      from: process.env.PROMO_FROM_EMAIL || "Neighborhood Krew <onboarding@resend.dev>",
      to: [
        process.env.PROMO_OWNER_EMAIL,
        process.env.PROMO_MANAGER_EMAIL,
      ].filter(Boolean),
      subject: process.env.PROMO_SUBJECT || "New Promo Signup",
      html: `
        <h2>New Promo Signup</h2>
        <p>Email: ${email}</p>
        <p>Promo Code: ${process.env.PROMO_CODE || "N/A"}</p>
      `,
    });

    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true }));
  } catch (err) {
    console.error("PROMO SUBSCRIBE ERROR:", err);
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: false }));
  }
};
