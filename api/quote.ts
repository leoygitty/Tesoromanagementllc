// api/quote.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Verified sending identity
const FROM_EMAIL = "Neighborhood Krew <quotes@neighborhoodkrew.com>";

// Internal recipients
const OWNER_EMAIL = "Neighborhoodkrew@gmail.com";
const FORWARD_EMAIL = "tesoromanagements@gmail.com";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST.",
    });
  }

  const { name, email, phone, service, details } = req.body || {};

  if (!name || !email || !service || !details) {
    console.error("❌ Missing required fields:", req.body);
    return res.status(400).json({
      ok: false,
      error: "Missing required quote fields",
    });
  }

  // Email content
  const subject = `New Quote Request — ${service}`;
  const meta = `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "N/A"}\nService: ${service}`;

  const internalMessage = `${meta}\n\nDetails:\n${details}`;
  const customerMessage = `Hi ${name},

Thanks for requesting a quote from Neighborhood Krew!

Here is a copy of the information you submitted:

${meta}

Details:
${details}

A team member will reach out shortly to provide a firm quote and next steps.

— Neighborhood Krew Inc
`;

  try {
    console.log("📨 Sending internal emails...");

    // Send to owner + you
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL, FORWARD_EMAIL],
      subject,
      text: internalMessage,
    });

    console.log("📨 Sending customer confirmation...");

    // Send confirmation to customer
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "We received your quote request!",
      text: customerMessage,
    });

    console.log("✅ Email flow complete.");
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("❌ Resend email error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to send quote emails",
      details: err?.message || err,
    });
  }
}
