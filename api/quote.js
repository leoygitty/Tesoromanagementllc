// /api/quote.js
const { Resend } = require("resend");

// Environment variables (configured in Vercel)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "quotes@neighborhoodkrew.com";
const RESEND_OWNER_EMAIL =
  process.env.RESEND_OWNER_EMAIL || "neighborhoodkrew@gmail.com";
const RESEND_FORWARD_EMAIL =
  process.env.RESEND_FORWARD_EMAIL || "tesoromanagements@gmail.com";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({
      ok: false,
      error: "Method not allowed. Use POST.",
    });
  }

  if (!RESEND_API_KEY) {
    console.error("[quote] RESEND_API_KEY missing");
    return res.status(500).json({
      ok: false,
      error: "Email service not configured",
    });
  }

  const resend = new Resend(RESEND_API_KEY);

  const {
    name,
    email,
    phone,
    service,
    details,
    photoFiles = [],
  } = req.body || {};

  if (!name || !email || !service || !details) {
    return res.status(400).json({
      ok: false,
      error: "Missing required fields",
    });
  }

  /* ---------------------------
     Build photo attachments
  ---------------------------- */
  let attachments = [];
  let photoSummary = "Uploaded photos: none.";

  if (Array.isArray(photoFiles) && photoFiles.length > 0) {
    const lines = [];

    attachments = photoFiles
      .filter((p) => p?.base64)
      .map((p, idx) => {
        const filename = p.name || `photo-${idx + 1}.jpg`;
        const type = p.type || "image/jpeg";

        lines.push(`- ${filename}`);

        return {
          filename,
          content: Buffer.from(p.base64, "base64"),
          contentType: type,
        };
      });

    photoSummary = `Uploaded photos (${attachments.length}):\n${lines.join(
      "\n"
    )}\n\n(Photos attached to this email.)`;
  }

  /* ---------------------------
     OWNER EMAIL
  ---------------------------- */
  const ownerSubject = `New Quote Request – ${service}`;
  const ownerText = [
    "New quote request from NeighborhoodKrew.com",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "N/A"}`,
    `Service: ${service}`,
    "",
    "Customer details:",
    "----------------",
    details,
    "",
    photoSummary,
    "",
    "— Automated website lead",
  ].join("\n");

  /* ---------------------------
     CUSTOMER CONFIRMATION (UPDATED)
     - Subject uses optimized header
     - Your intro placed at top of body
     - Checklist link included above move details
  ---------------------------- */
  const customerSubject =
    "We received your quote — here’s your free Moving Day Checklist";

  const checklistUrl =
    "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf";

  const customerText = [
    "Hello,",
    "",
    "We have recieved your quote request, a member of the Krew will reach out to you shortly.",
    "Here is a free moving checklist that you can should download and look over.",
    "We created this from real moves we’ve completed to help avoid delays, surprise charges, and day-of stress.",
    "",
    `Download your Moving Day Checklist: ${checklistUrl}`,
    "",
    "— Neighborhood Krew",
    "Licensed & insured local movers",
    "",
    "--------------------------------",
    "Move details you submitted:",
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
    "If anything changes, reply to this email or call us directly:",
    "(215) 531-0907",
    "",
    "— Neighborhood Krew",
  ].join("\n");

  /* ---------------------------
     SEND EMAILS
  ---------------------------- */
  try {
    const internalRecipients = [
      RESEND_OWNER_EMAIL,
      RESEND_FORWARD_EMAIL,
    ].filter(Boolean);

    // Owner / internal email (includes attachments)
    await resend.emails.send({
      from: `Neighborhood Krew <${RESEND_FROM_EMAIL}>`,
      to: internalRecipients,
      subject: ownerSubject,
      text: ownerText,
      attachments,
    });

    // Customer confirmation (NOW includes checklist link + intro at top)
    await resend.emails.send({
      from: `Neighborhood Krew <${RESEND_FROM_EMAIL}>`,
      to: email,
      subject: customerSubject,
      text: customerText,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[quote] Email error:", err);
    return res.status(500).json({
      ok: false,
      error: "Failed to process quote",
    });
  }
};
