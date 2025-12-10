// api/quote.ts

// Let TypeScript know `process` exists in this serverless env
declare const process: any;

import { Resend } from "resend";

const resendApiKey: string | undefined = process.env.RESEND_API_KEY;

// Use your Resend subdomain as the from-address (fully verified by Resend)
const FROM_EMAIL = "Neighborhood Krew <quotes@meibtro.resend.app>";

// Internal notification emails
const OWNER_EMAIL = "Neighborhoodkrew@gmail.com";
const FORWARD_EMAIL = "tesoromanagements@gmail.com";

export default async function handler(req: any, res: any) {
  // Always respond 200 so the frontend never shows the scary error
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(200).json({
      ok: true,
      warning: "invalid_method",
    });
  }

  const { name, email, phone, service, details } = req.body || {};

  if (!name || !email || !service || !details) {
    console.error("Missing fields in /api/quote payload", req.body);
    return res.status(200).json({
      ok: true,
      warning: "missing_fields",
    });
  }

  if (!resendApiKey) {
    console.error(
      "RESEND_API_KEY is missing – set it in Vercel env vars (Production)."
    );
    return res.status(200).json({
      ok: true,
      warning: "resend_not_configured",
    });
  }

  const resend = new Resend(resendApiKey);

  const subject = `New quote request – ${service}`;
  const metaLine = `From: ${name} <${email}> | Phone: ${phone || "N/A"}`;

  const ownerText = [
    "New quote request from the website quiz:",
    "",
    metaLine,
    "",
    details,
  ].join("\n");

  const customerText = [
    `Hi ${name},`,
    "",
    "Thanks for reaching out to Neighborhood Krew. Here’s a copy of the info you submitted so you can refer back to it:",
    "",
    metaLine,
    "",
    details,
    "",
    "This range is an estimate only. A member of the crew will review it and reach out to lock in a firm quote and move date.",
    "",
    "If anything changes, you can always reply directly to this email.",
    "",
    "— Neighborhood Krew Inc",
  ].join("\n");

  try {
    // 1) Owner + your copy
    const ownerResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL, FORWARD_EMAIL],
      subject,
      text: ownerText,
    });

    // 2) Customer confirmation
    const customerResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "We received your quote request",
      text: customerText,
    });

    return res.status(200).json({
      ok: true,
      ownerResult,
      customerResult,
    });
  } catch (err) {
    console.error("Error sending quote emails via Resend:", err);
    // IMPORTANT: still return 200 so the user doesn’t see an error
    return res.status(200).json({
      ok: true,
      warning: "email_send_failed",
    });
  }
}
