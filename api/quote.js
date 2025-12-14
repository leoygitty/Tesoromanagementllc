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
     CUSTOMER CONFIRMATION
  ---------------------------- */
  const customerSubject = "We received your quote request";
  const customerText = [
    `Hi ${name},`,
    "",
    "Thanks for contacting Neighborhood Krew.",
    "",
    "We’ve received your quote request and a member of the crew",
    "will review it shortly and follow up to finalize pricing and scheduling.",
    "",
    "Here’s what you submitted:",
    "",
    `Service: ${service}`,
    `Phone: ${phone || "N/A"}`,
    "",
    details,
    "",
    "If anything changes, reply to this email or call us directly:",
    "(215) 531-0907",
    "",
    "— Neighborhood Krew",
  ].join("\n");

  /* ---------------------------
     CHECKLIST EMAIL (HTML)
  ---------------------------- */
  const checklistSubject =
    "Your Moving Day Checklist – Neighborhood Krew";

  const checklistHtml = `
    <p>Hi ${name},</p>

    <p>
      Thanks again for requesting a quote with
      <strong>Neighborhood Krew</strong>.
    </p>

    <p>
      To help your move go smoothly, here’s our professional
      <strong>Moving Day Checklist</strong>:
    </p>

    <p>
      👉
      <a href="https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf">
        Download Moving Day Checklist (PDF)
      </a>
    </p>

    <p><strong>Important reminders:</strong></p>
    <ul>
      <li>Please ensure adequate parking for our box truck</li>
      <li>Extra items not listed may result in additional charges</li>
      <li>
        We do not haul food trash, paint, oil, tires, or propane tanks
        (must be removed from grills)
      </li>
    </ul>

    <p>
      <strong>Promo Code:</strong>
      <span style="font-size:16px;">KREW25</span>
    </p>

    <p>
      If you have questions or updates, reply to this email or call us at
      <strong>(215) 531-0907</strong>.
    </p>

    <p>— Neighborhood Krew</p>
  `;

  /* ---------------------------
     SEND EMAILS
  ---------------------------- */
  try {
    const internalRecipients = [
      RESEND_OWNER_EMAIL,
      RESEND_FORWARD_EMAIL,
    ].filter(Boolean);

    // Owner / internal email
    await resend.emails.send({
      from: `Neighborhood Krew <${RESEND_FROM_EMAIL}>`,
      to: internalRecipients,
      subject: ownerSubject,
      text: ownerText,
      attachments,
    });
