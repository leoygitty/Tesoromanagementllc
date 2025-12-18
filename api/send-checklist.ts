import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

export default async function handler(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { email, source, utm } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY is missing");
      return res.status(500).json({ error: "Email service not configured" });
    }

    const checklistUrl =
      "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf";

    let result;
    try {
      result = await resend.emails.send({
        from: "Neighborhood Krew <no-reply@neighborhoodkrew.com>",
        to: email,
        subject: "Your Moving Day Checklist 🏠",
        html: `
          <h2>Your Moving Day Checklist</h2>
          <p>
            👉 <a href="${checklistUrl}" target="_blank">
              Click here to download your checklist
            </a>
          </p>
          <p style="font-size:12px;color:#666;">
            Source: ${source || "unknown"}
          </p>
        `,
      });
    } catch (emailError: any) {
      console.error("Resend send failed:", emailError);
      return res.status(500).json({
        error: "Email provider error",
        details: emailError?.message || String(emailError),
      });
    }

    return res.status(200).json({
      ok: true,
      id: result?.id || null,
    });
  } catch (err: any) {
    console.error("Unhandled send-checklist error:", err);
    return res.status(500).json({
      error: "Unhandled server error",
      details: err?.message || String(err),
    });
  }
}
