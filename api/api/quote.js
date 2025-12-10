// api/quote.js — Vercel Node serverless function (CommonJS)
const { Resend } = require("resend");

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;

// Fallback sender — guaranteed to work with Resend even if your own domain is weird
const FROM_EMAIL =
  RESEND_FROM_EMAIL || "Neighborhood Krew <onboarding@resend.dev>";

// Admin recipients (you + owner)
const ADMIN_RECIPIENTS = [
  "tesoromanagements@gmail.com",
  "neighborhoodkrew@gmail.com",
];

// Helper to read raw body on Node req
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => {
      data += chunk;
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

module.exports = async (req, res) => {
  console.log("📨 [/api/quote] invoked with method:", req.method);

  // --- Simple GET test so you can confirm function is actually live ---
  if (req.method === "GET") {
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: true,
        message: "quote API alive – function is deployed",
      })
    );
    return;
  }

  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ ok: false, error: "Method not allowed. Use POST." })
    );
    return;
  }

  if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing. Check Vercel env vars.");
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({ ok: false, error: "Email service not configured" })
    );
    return;
  }

  // --- Read + parse JSON body ---
  let rawBody = "";
  try {
    rawBody = await readBody(req);
    console.log("📩 Raw request body:", rawBody);
  } catch (err) {
    console.error("❌ Error reading request body:", err);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Invalid request body" }));
    return;
  }

  let body = {};
  try {
    body = rawBody ? JSON.parse(rawBody) : {};
  } catch (err) {
    console.error("❌ Failed to parse JSON body:", err);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: false, error: "Invalid JSON payload" }));
    return;
  }

  const { name, email, phone, service, details, estimateRange } = body;

  if (!name || !email || !service || !details) {
    console.error("❌ Missing required fields in payload:", body);
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error: "Missing required fields (name, email, service, details)",
      })
    );
    return;
  }

  const resend = new Resend(RESEND_API_KEY);

  const subject = `New quote request – ${service}`;
  const metaLine = `From: ${name} <${email}> | Phone: ${phone || "N/A"}`;
  const estimateLine = estimateRange
    ? `Estimated range: ${estimateRange}`
    : "";

  const adminText = [
    "New quote request from the website quiz:",
    "",
    metaLine,
    estimateLine,
    "",
    "Details:",
    details,
  ]
    .filter(Boolean)
    .join("\n");

  const customerText = [
    `Hi ${name},`,
    "",
    "Thanks for reaching out to Neighborhood Krew! Here’s a copy of what you submitted:",
    "",
    metaLine,
    estimateLine,
    "",
    "Details:",
    details,
    "",
    "This range is an estimate only. A member of the Krew will review it and reach out to lock in a firm quote and move date.",
    "",
    "If anything changes, you can reply directly to this email.",
    "",
    "— Neighborhood Krew",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    console.log("📤 Sending admin email to:", ADMIN_RECIPIENTS);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_RECIPIENTS,
      subject,
      text: adminText,
    });

    console.log("📤 Sending customer email to:", email);

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "We received your quote request",
      text: customerText,
    });

    console.log("✅ All quote emails sent successfully");
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error("❌ Error sending quote emails via Resend:", error);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        ok: false,
        error: "Failed to send quote emails",
      })
    );
  }
};
