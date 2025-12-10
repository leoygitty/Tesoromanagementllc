// api/quote.ts
import { Resend } from "resend";

// Tiny shim so TypeScript stops complaining about "process" on Vercel
declare const process: {
  env: {
    RESEND_API_KEY?: string;
    RESEND_FROM_EMAIL?: string;
    QUOTE_TO_EMAIL?: string;
  };
};

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const QUOTE_TO_EMAIL = process.env.QUOTE_TO_EMAIL;

// Fallbacks – but ideally your env vars are all set correctly in Vercel
const FROM_EMAIL =
  RESEND_FROM_EMAIL || "Neighborhood Krew <quotes@neighborhoodkrew.com>";

const ADMIN_RECIPIENTS: string[] = [
  QUOTE_TO_EMAIL || "tesoromanagements@gmail.com",
  "neighborhoodkrew@gmail.com",
];

export default async function handler(req: any, res: any) {
  console.log("📨 /api/quote hit", {
    method: req.method,
    hasBody: !!req.body,
  });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res
      .status(405)
      .json({ ok: false, error: "Method not allowed. Use POST." });
  }

  if (!RESEND_API_KEY) {
    console.error("❌ RESEND_API_KEY is missing. Check Vercel env vars.");
    return res
      .status(500)
      .json({ ok: false, error: "Email service not configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const { name, email, phone, service, details, estimateRange } = body || {};

  if (!name || !email || !service || !details) {
    console.error("❌ Missing required fields in /api/quote payload:", body);
    return res.status(400).json({
      ok: false,
      error: "Missing required fields (name, email, service, details)",
    });
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
    "Thanks for reaching out to Neighborhood Krew! Here’s a copy of what you submitted so you can refer back to it:",
    "",
    metaLine,
    estimateLine,
    "",
    "Details:",
    details,
    "",
    "This range is an estimate only. A member of the Krew will review everything and reach out to lock in a firm quote and move date.",
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

    console.log("✅ Quote emails sent successfully");
    return res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error("❌ Error sending quote emails via Resend:", error);
    return res.status(500).json({
      ok: false,
      error: "Failed to send quote emails",
      detail: error?.message || String(error),
    });
  }
}
