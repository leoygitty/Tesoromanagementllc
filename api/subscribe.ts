import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({ success: false }),
        { status: 200 }
      );
    }

    const fromEmail =
      process.env.PROMO_FROM_EMAIL ||
      process.env.RESEND_FROM_EMAIL ||
      "Neighborhood Krew <onboarding@resend.dev>";

    const ownerEmail = process.env.PROMO_OWNER_EMAIL;
    const managerEmail = process.env.PROMO_MANAGER_EMAIL;

    /* 1️⃣ Notify you (internal notification) */
    await resend.emails.send({
      from: fromEmail,
      to: [ownerEmail, managerEmail].filter(Boolean) as string[],
      subject: process.env.PROMO_SUBJECT || "New Promo Signup",
      html: `
        <h2>New Promo Signup</h2>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Promo Code:</strong> ${process.env.PROMO_CODE}</p>
      `,
    });

    /* 2️⃣ Send promo email to the user */
    await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: process.env.PROMO_SUBJECT || "Your Neighborhood Krew Promo Code",
      html: `
        <h2>Your Promo Code</h2>
        <p>Thanks for joining Neighborhood Krew!</p>
        <p>Your promo code is:</p>
        <h3 style="font-size:24px; letter-spacing:1px;">
          ${process.env.PROMO_CODE}
        </h3>
        <p>Use this when booking your move.</p>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200 }
    );
  } catch (err) {
    console.error("Promo subscribe error:", err);

    // UX-safe: never break frontend
    return new Response(
      JSON.stringify({ success: false }),
      { status: 200 }
    );
  }
}
