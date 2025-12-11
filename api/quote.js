// /api/quote.js

const { Resend } = require("resend");

// Read config from environment variables set in Vercel
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "quotes@neighborhoodkrew.com";
const RESEND_OWNER_EMAIL =
  process.env.RESEND_OWNER_EMAIL || "neighborhoodkrew@gmail.com";
const RESEND_FORWARD_EMAIL =
  process.env.RESEND_FORWARD_EMAIL || "tesoromanagements@gmail.com";

// Vercel Node serverless function (CommonJS)
module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed. Use POST." });
  }

  // Basic safety check – if env is missing, log loudly
  if (!RESEND_API_KEY) {
    console.log("[info] RESEND_API_KEY is missing in environment");
    return res
      .status(500)
      .json({ ok: false, error: "Email service not configured" });
  }

  const resend = new Resend(RESEND_API_KEY);

  // Payload from the quiz funnel (App.tsx)
  const {
    type,
    name,
    email,
    phone,
    service,
    details,
    photoFiles,
  } = req.body || {};

  console.log("[info] Incoming quote payload:", req.body);

  if (!name || !email || !service || !details) {
    console.log("[info] Missing fields in quote payload");
    return res
      .status(400)
      .json({ ok: false, error: "Missing required quote fields" });
  }

  // Build a nice summary of uploaded photos (filenames only)
  let photoSummary = "Uploaded photos: none attached via quiz.";
  if (Array.isArray(photoFiles) && photoFiles.length > 0) {
    const lines = photoFiles.map(
      (f, idx) =>
        `- ${f.name || `image-${idx + 1}`}${
          f.type ? ` (${f.type})` : ""
        }`
    );
    photoSummary = `Uploaded photos (${photoFiles.length}):\n${lines.join(
      "\n"
    )}`;
  }

  // Owner / internal email body
  const ownerSubject = `New quote request – ${service}`;
  const ownerText = [
    "New quote request from NeighborhoodKrew.com",
    "",
    `Customer: ${name} <${email}>`,
    `Phone: ${phone || "N/A"}`,
    `Service: ${service}`,
    "",
    "Customer responses:",
    "-------------------",
    details,
    "",
    photoSummary,
    "",
    "— Automated lead from the website quiz",
  ].join("\n");

  // Customer confirmation email body
  const customerSubject = "We received your quote request";
  const customerText = [
    `Hi ${name},`,
    "",
    "Thanks for reaching out to Neighborhood Krew.",
    "",
    "Here’s a copy of the details you submitted so you can refer back to it:",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "N/A"}`,
    `Service: ${service}`,
    "",
    "Your responses:",
    "----------------",
    details,
    "",
    "This range is an estimate only. A member of the crew will review it,",
    "match it to the right truck and team, and reach out to lock in a firm",
    "quote and schedule.",
    "",
    "If anything changes, you can reply directly to this email or call:",
    "Neighborhood Krew Inc",
    "Phone: (215) 531-0907",
    "Email: Neighborhoodkrew@gmail.com",
  ].join("\n");

  try {
    // 1) Send to owner + forwarding email
    const toInternal = [RESEND_OWNER_EMAIL, RESEND_FORWARD_EMAIL].filter(
      Boolean
    );
    console.log("[info] Sending owner quote email to:", toInternal);

    const ownerResult = await resend.emails.send({
      from: `Neighborhood Krew <${RESEND_FROM_EMAIL}>`,
      to: toInternal,
      subject: ownerSubject,
      text: ownerText,
    });

    console.log("[info] Owner email result:", ownerResult);

    // 2) Send confirmation to customer
    console.log("[info] Sending confirmation to:", email);

    const customerResult = await resend.emails.send({
      from: `Neighborhood Krew <${RESEND_FROM_EMAIL}>`,
      to: email,
      subject: customerSubject,
      text: customerText,
    });

    console.log("[info] Customer email result:", customerResult);

    // Even if one of them fails, we still tell the frontend "ok"
    // so the user sees their estimate and doesn't get spooked.
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[error] Error sending quote emails:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to send quote emails" });
  }
};
