import { Resend } from "resend";

export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({ ok: true, message: "quote API alive" }),
        { status: 200 }
      );
    }

    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
      });
    }

    const body = await req.json();

    const { name, email, phone, service } = body;
    console.log("[info] Incoming quote payload:", body);

    // ENV VARS
    const resendApiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "send@neighborhoodkrew.com";

    // OWNER EMAILS
    const ownerEmails = [
      "tesoromanagements@gmail.com",
      "neighborhoodkrew@gmail.com",
    ];

    const resend = new Resend(resendApiKey);

    // ----------------------------------
    // SEND EMAIL TO BUSINESS
    // ----------------------------------
    console.log("[info] Sending owner quote email to:", ownerEmails);

    const ownerResult = await resend.emails.send({
      from: fromEmail,
      to: ownerEmails,
      subject: `New Moving Quote – ${name}`,
      html: `
        <h2>New Quote Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>
        <p><strong>Service:</strong> ${service}</p>
      `,
    });

    console.log("[info] Owner email result:", ownerResult);

    // ----------------------------------
    // SEND CUSTOMER CONFIRMATION
    // ----------------------------------
    console.log("[info] Sending confirmation to:", email);

    const customerResult = await resend.emails.send({
      from: fromEmail,
      to: email,
      subject: "We've received your quote request",
      html: `
        <h2>Thanks ${name}!</h2>
        <p>Your quote request has been received. Our team will contact you shortly.</p>
        <p><strong>Neighborhood Krew Moving</strong></p>
      `,
    });

    console.log("[info] Customer email result:", customerResult);

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  } catch (err) {
    console.error("[error] Quote API error:", err);
    return new Response(
      JSON.stringify({ error: "Internal Server Error", details: err.message }),
      { status: 500 }
    );
  }
}
