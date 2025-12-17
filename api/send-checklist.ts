import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, source, utm } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    // Normalize UTM data (safe defaults)
    const utmData = {
      utm_source: utm?.utm_source || "",
      utm_medium: utm?.utm_medium || "",
      utm_campaign: utm?.utm_campaign || "",
      utm_term: utm?.utm_term || "",
      utm_content: utm?.utm_content || "",
    };

    // Build lead record (for logs / future DB)
    const leadRecord = {
      email,
      source: source || "unknown",
      ...utmData,
      timestamp: new Date().toISOString(),
      ip:
        req.headers["x-forwarded-for"] ||
        req.socket?.remoteAddress ||
        "",
      userAgent: req.headers["user-agent"] || "",
    };

    // 🔍 Log for verification (Vercel → Functions → Logs)
    console.log("Checklist lead captured:", leadRecord);

    const checklistUrl =
      "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf";

    // Send email
    await resend.emails.send({
      from: "Neighborhood Krew <@neighborhoodkrew.com>",
      to: email,
      subject: "Your Moving Day Checklist 🏠",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Your Moving Day Checklist</h2>

          <p>
            Thanks for requesting our professional, mover-approved checklist.
            This guide helps prevent delays, damage, and surprise charges.
          </p>

          <p>
            👉 <a href="${checklistUrl}" target="_blank">
              Click here to download your checklist
            </a>
          </p>

          <p style="margin-top:16px; font-size:13px; color:#666;">
            Source: ${source || "unknown"}<br/>
            Campaign: ${utmData.utm_campaign || "n/a"}
          </p>

          <hr style="margin:24px 0;" />

          <p style="font-size:13px; color:#666;">
            Neighborhood Krew Inc<br/>
            Licensed & Insured Movers
          </p>
        </div>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Checklist email failed:", err);
    return res.status(500).json({ error: "Email failed to send" });
  }
}
