// api/quote.ts
// Disable TypeScript checking for this file.
// This avoids Node typings issues in Vercel.
// @ts-nocheck

import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;   // quotes@neighborhoodkrew.com
  const ownerEmail = process.env.QUOTE_TO_EMAIL;     // Neighborhoodkrew@gmail.com

  if (!apiKey || !fromEmail || !ownerEmail) {
    console.error("Missing env vars in /api/quote", {
      hasApiKey: !!apiKey,
      fromEmail,
      ownerEmail,
    });
    return res.status(500).json({
      ok: false,
      error: "Email env vars not configured on server.",
    });
  }

  const { name, email, phone, service, details } = req.body || {};

  if (!name || !email || !service || !details) {
    console.error("Missing fields in /api/quote payload", req.body);
    return res
      .status(400)
      .json({ ok: false, error: "Missing required fields in request." });
  }

  const resend = new Resend(apiKey);

  const subject = `New quote request – ${service}`;
  const metaLine = `From: ${name} <${email}> | Phone: ${phone || "N/A"}`;

  const ownerText = `
New quote request from the website:

${metaLine}

${details}
`.trim();

  const customerText = `
Hi ${name},

Thanks for reaching out to Neighborhood Krew! Here's a copy of your quote request:

${metaLine}

${details}

We'll review this and reach out shortly with a firm estimate.

— Neighborhood Krew Inc
`.trim();

  try {
    // 1) Email to you (owner)
    const { data: ownerData, error: ownerError } = await resend.emails.send({
      from: fromEmail,          // e.g. "quotes@neighborhoodkrew.com"
      to: ownerEmail,           // your Gmail
      subject,
      text: ownerText,
    });

    if (ownerError) {
      console.error("Owner email send error:", ownerError);
      return res.status(500).json({
        ok: false,
        error: "Failed to send internal quote email.",
        stage: "owner",
      });
    }

    // 2) Confirmation email to customer
    const { data: customerData, error: customerError } =
      await resend.emails.send({
        from: fromEmail,
        to: email,
        subject: "We received your quote request",
        text: customerText,
      });

    if (customerError) {
      console.error("Customer email send error:", customerError);
      return res.status(500).json({
        ok: false,
        error: "Failed to send confirmation email.",
        stage: "customer",
      });
    }

    // All good
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Unexpected Resend error in /api/quote:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Unexpected email error." });
  }
}
