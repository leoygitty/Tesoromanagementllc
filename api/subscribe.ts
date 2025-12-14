import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: Request) {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return new Response(JSON.stringify({ ok: false }), { status: 200 });
    }

    // 🔒 known-safe sender
    await resend.emails.send({
      from: "Neighborhood Krew <onboarding@resend.dev>",
      to: "neighborhoodkrew@gmail.com",
      subject: "New Promo Signup",
      html: `<p>Email: ${email}</p>`,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("SUBSCRIBE ERROR:", err);

    // NEVER let frontend break
    return new Response(JSON.stringify({ ok: false }), { status: 200 });
  }
}
