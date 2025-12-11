// api/quote.js

const { Resend } = require("resend");

// ENV VARS (set in Vercel → Settings → Environment Variables)
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "quotes@neighborhoodkrew.com";
const MAIN_OWNER_EMAIL =
  process.env.QUOTE_TO_EMAIL || "neighborhoodkrew@gmail.com";

// Second owner email is hard-coded per your request
const SECOND_OWNER_EMAIL = "tesoromanagements@gmail.com";

// Create client once (Vercel reuses the same Lambda between calls)
const resend = new Resend(RESEND_API_KEY);

module.exports = async function handler(req, res) {
  // Simple health check so /api/quote in browser doesn’t error
  if (req.method === "GET") {
    return res.status(200).json({
      ok: true,
      message: "quote API alive – function is deployed",
    });
  }

  if (req.method !== "POST") {
    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  if (!RESEND_API_KEY) {
    console.error("Missing RESEND_API_KEY env var");
    return res
      .status(500)
      .json({ ok: false, error: "Email service not configured" });
  }

  // Vercel parses JSON body for us when content-type is application/json
  const { name, email, phone, service, details } = req.body || {};

  if (!name || !email || !service) {
    console.error("Missing required fields in quote request:", req.body);
    return res
      .status(400)
      .json({ ok: false, error: "Missing required fields" });
  }

  const ownerSubject = `New quote request – ${service}`;
  const ownerText = [
    "New quote request from the website quiz:",
    "",
    `Name:  ${name}`,
    `Email: ${email}`,
    `Phone: ${phone || "N/A"}`,
    `Service: ${service}`,
    "",
    "Details:",
    details || "(no extra details provided)",
  ].join("\n");

  const customerSubject = "We received your quote request";
  const customerText = [
    `Hi ${name},`,
    "",
    "Thanks for reaching out to Neighborhood Krew. We’ve received your request and a crew member will reach out shortly.",
    "",
    "Here’s what we got from you:",
    `Service: ${service}`,
    `Phone: ${phone || "N/A"}`,
    "",
    "Details:",
    details || "(no extra details provided)",
    "",
    "If anything looks off, you can reply directly to this email with corrections.",
    "",
    "— Neighborhood Krew",
  ].join("\n");

  try {
    const ownerRecipients = [MAIN_OWNER_EMAIL, SECOND_OWNER_EMAIL].filter(
      Boolean
    );

    console.log("Sending owner quote email to:", ownerRecipients);
    const ownerResult = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: ownerRecipients,
      subject: ownerSubject,
      text: ownerText,
    });
    console.log("Owner email result:", ownerResult);

    console.log("Sending customer confirmation email to:", email);
    const customerResult = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to: email,
      subject: customerSubject,
      text: customerText,
    });
    console.log("Customer email result:", customerResult);

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error sending emails via Resend:", error);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to send quote emails" });
  }
};
