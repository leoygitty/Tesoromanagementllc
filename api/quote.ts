// api/quote.ts
import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL; // uses env var
  const forwardEmail = process.env.QUOTE_TO_EMAIL; // uses env var

  if (!resendApiKey) {
    console.error("Missing RESEND_API_KEY");
    return res.status(500).json({ ok: false, error: "Email service not configured." });
  }

  if (!fromEmail) {
    console.error("Missing RESEND_FROM_EMAIL");
    return res.status(500).json({ ok: false, error: "Sender email not configured." });
  }

  const { name, email, phone, service, details } = req.body || {};

  if (!name || !email || !service || !details) {
    return res.status(400).json({ ok: false, error: "Missing required fields." });
  }

  const resend = new Resend(resendApiKey);

  const subject = `New quote request – ${service}`;
  const metaLine = `From: ${name} <${email}> | Phone: ${phone || "N/A"}`;

  // Email to you (the owner)
  const ownerText = `
New quote request from the website:

${metaLine}

${details}
  `;

  // Email to customer
  const customerText = `
Hi ${name},

Thanks for reaching out to Neighborhood Krew! Here's a copy of your quote request:

${metaLine}

${details}

We'll review this and reach out shortly with a firm estimate.

— Neighborhood Krew Inc
  `;

  try {
    // Send internal notification
    await resend.emails.send({
      from: `Neighborhood Krew <${fromEmail}>`,
      to: forwardEmail,
      subject,
      text: ownerText,
    });

    // Send copy to customer
    await resend.emails.send({
      from: `Neighborhood Krew <${fromEmail}>`,
      to: email,
      subject: "We received your quote request",
      text: customerText,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Resend email error:", err);
    return res.status(500).json({ ok: false, error: "Failed to send email." });
  }
}
