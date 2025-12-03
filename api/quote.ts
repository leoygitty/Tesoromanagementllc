// api/quote.ts
// Handles quote submissions from the Quiz / QuoteWizard
// Sends email via Resend to owner + Leo

const OWNER_EMAIL = "Neighborhoodkrew@gmail.com";
const LEO_EMAIL = "tesoromanagements@gmail.com";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail =
    process.env.RESEND_FROM_EMAIL || "Neighborhood Krew <onboarding@resend.dev>";

  if (!apiKey) {
    console.error("Missing RESEND_API_KEY environment variable");
    // Frontend only checks res.ok, so still return 200 with ok:false
    return res
      .status(200)
      .json({ ok: false, error: "Email service not configured" });
  }

  let body: any;
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  } catch (err) {
    console.error("Invalid JSON body for /api/quote:", err);
    return res.status(400).json({ ok: false, error: "Invalid JSON" });
  }

  const { name, email, phone, service, details } = body || {};

  if (!name || !email || !service || !details) {
    return res.status(400).json({
      ok: false,
      error: "Missing required fields (name, email, service, details)",
    });
  }

  const subject = `New quote request – ${service}`;
  const text = [
    `New quote request from the website quiz funnel`,
    "",
    `Name: ${name}`,
    `Customer email: ${email}`,
    `Customer phone: ${phone || "N/A"}`,
    "",
    "Service:",
    `  ${service}`,
    "",
    "Details:",
    details,
    "",
    "This email was sent automatically from neighborhoodkrew.com.",
    "You can reply directly to this thread to respond to the customer.",
  ].join("\n");

  try {
    // Call Resend REST API directly via fetch (no extra npm package needed)
    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [OWNER_EMAIL, LEO_EMAIL],
        reply_to: email,
        subject,
        text,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text().catch(() => "");
      console.error("Resend API error:", resp.status, errText);
      // Still 200 so frontend shows the “we tried but had an issue” message
      return res.status(200).json({
        ok: false,
        error: "Failed to send via Resend",
      });
    }

    const data = await resp.json().catch(() => ({}));
    console.log("Resend email sent:", data);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Unexpected error calling Resend:", err);
    return res.status(200).json({
      ok: false,
      error: "Unexpected error sending email",
    });
  }
}
