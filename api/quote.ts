// api/quote.ts
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

// If your verified sending domain in Resend is "send.neighborhoodkrew.com",
// set FROM_EMAIL to use that domain, e.g. quotes@send.neighborhoodkrew.com.
const FROM_EMAIL = "Neighborhood Krew <quotes@neighborhoodkrew.com>";
const OWNER_EMAIL = "Neighborhoodkrew@gmail.com";
const FORWARD_EMAIL = "tesoromanagements@gmail.com";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed. Use POST." });
  }

  if (!resendApiKey) {
    console.error("RESEND_API_KEY is missing – set it in Vercel env vars.");
    return res
      .status(500)
      .json({ ok: false, error: "Email service not configured" });
  }

  const { name, email, phone, service, details } = req.body || {};

  if (!name || !email || !service || !details) {
    console.error("Missing fields in /api/quote payload", req.body);
    return res
      .status(400)
      .json({ ok: false, error: "Missing required quote fields" });
  }

  const resend = new Resend(resendApiKey);

  const subject = `New quote request – ${service}`;
  const metaLine = `From: ${name} <${email}> | Phone: ${phone || "N/A"}`;

  // Email to owner + your copy
  const ownerText = [
    "New quote request from the website quiz:",
    "",
    metaLine,
    "",
    details,
  ].join("\n");

  // Confirmation to customer
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
    // 1) Owner + your backup copy
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL, FORWARD_EMAIL],
      subject,
      text: ownerText,
    });

    // 2) Customer confirmation
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "We received your quote request",
      text: customerText,
    });

    // ✅ This is what makes your frontend show success instead of the error message
    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("Error sending quote emails via Resend:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to send quote emails" });
  }
}
