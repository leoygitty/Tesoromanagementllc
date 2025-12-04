// api/quote.ts

// We deliberately do NOT import Resend at the top level,
// so a missing module or runtime issue can't crash the function
// before we send a response.

const resendApiKey = process.env.RESEND_API_KEY;

// Use a verified from-address from your Resend domain
// Make sure this domain matches exactly what is VERIFIED in Resend.
const FROM_EMAIL = "Neighborhood Krew <quotes@neighborhoodkrew.com>";
const OWNER_EMAIL = "Neighborhoodkrew@gmail.com";
const FORWARD_EMAIL = "tesoromanagements@gmail.com";

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST");
      return res
        .status(405)
        .json({ ok: false, error: "Method not allowed. Use POST." });
    }

    if (!resendApiKey) {
      console.error(
        "[/api/quote] RESEND_API_KEY is missing – set it in Vercel env vars."
      );
      return res.status(500).json({
        ok: false,
        error: "Email service not configured (missing RESEND_API_KEY)",
      });
    }

    const { name, email, phone, service, details } = req.body || {};
    console.log("[/api/quote] Incoming body:", req.body);

    if (!name || !email || !service || !details) {
      console.error("[/api/quote] Missing fields in payload:", req.body);
      return res
        .status(400)
        .json({ ok: false, error: "Missing required quote fields" });
    }

    // Dynamic import so a missing "resend" module doesn't crash the whole function
    const { Resend } = await import("resend");
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

    // Send to owner + internal inbox
    const ownerResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL, FORWARD_EMAIL],
      subject,
      text: ownerText,
    });
    console.log("[/api/quote] Owner email result:", ownerResult);

    // Send confirmation to customer
    const customerResult = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "We received your quote request",
      text: customerText,
    });
    console.log("[/api/quote] Customer email result:", customerResult);

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("[/api/quote] Fatal error:", err);

    // Surface some detail while we’re debugging
    const message =
      err?.message ||
      err?.name ||
      err?.toString?.() ||
      "Failed to send quote emails";

    // Always return JSON so the frontend never sees the generic Vercel 500 page
    return res.status(500).json({ ok: false, error: message });
  }
}
