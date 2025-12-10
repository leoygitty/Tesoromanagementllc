// api/quote.ts
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

// Use your Resend subdomain so it will always be allowed
const FROM_EMAIL = "Neighborhood Krew <quotes@meibtro.resend.app>";

// Internal notification emails
const OWNER_EMAIL = "Neighborhoodkrew@gmail.com";
const FORWARD_EMAIL = "tesoromanagements@gmail.com";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    // Still return 200 so the frontend never shows the red error banner
    return res.status(200).json({
      ok: true,
      warning: "invalid_method_but_not_user_facing",
    });
  }

  const { name, email, phone, service, details } = req.body || {};

  if (!name || !email || !service || !details) {
    console.error("Missing fields in /api/quote payload", req.body);
    // Still return ok so user gets a success flow
    return res.status(200).json({
      ok: true,
      warning: "missing_fields",
    });
  }

  // If API key is missing, don't block the user
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

    // Respond success no matter what – but include metadata for debugging
    return res.status(200).json({
      ok: true,
      ownerResult,
      customerResult,
    });
  } catch (err) {
    console.error("Error sending quote emails via Resend:", err);
    // IMPORTANT: we *still* return 200 so your frontend doesn't show an error
    return res.status(200).json({
      ok: true,
      warning: "email_send_failed",
    });
  }
}
