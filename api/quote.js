// api/quote.js
const { Resend } = require("resend");

module.exports = async (req, res) => {
  // Simple health check for GET
  if (req.method === "GET") {
    return res
      .status(200)
      .json({ ok: true, message: "quote API alive – function is deployed" });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, GET");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed. Use POST." });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is missing in environment variables");
    return res
      .status(500)
      .json({ ok: false, error: "Email service not configured" });
  }

  const resend = new Resend(apiKey);

  // Body comes from your quiz fetch('/api/quote', { method: 'POST', body: JSON.stringify(payload) })
  const { name, email, phone, service, details } = req.body || {};

  console.log("Incoming quote payload:", { name, email, phone, service });

  if (!name || !email || !service || !details) {
    console.error("Missing required fields in /api/quote payload:", req.body);
    return res
      .status(400)
      .json({ ok: false, error: "Missing required quote fields" });
  }

  // 👉 Make sure this matches your verified Resend domain.
  // If your sending domain is neighborhoodkrew.com, this is fine.
  // If it's something like mail.neighborhoodkrew.com, change the part after @.
  const FROM_EMAIL = "Neighborhood Krew <quotes@neighborhoodkrew.com>";

  const OWNER_EMAILS = [
    "neighborhoodkrew@gmail.com",
    "tesoromanagements@gmail.com",
  ];

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
    // 1) Email to you + the owner
    const ownerResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAILS,
      subject,
      text: ownerText,
    });

    console.log("Owner email sent result:", ownerResult);

    // 2) Confirmation to the customer
    const customerResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "We received your quote request",
      text: customerText,
    });

    console.log("Customer email sent result:", customerResult);

    // Success response for the frontend
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error sending quote emails via Resend:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to send quote emails" });
  }
};
