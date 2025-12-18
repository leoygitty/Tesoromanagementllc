import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function sendChecklist(req: any, res: any) {
  try {
    if (req.method !== "POST") {
      res.statusCode = 405;
      return res.json({ error: "Method not allowed" });
    }

    const { email, source } = req.body || {};

    if (!email) {
      res.statusCode = 400;
      return res.json({ error: "Missing email" });
    }

    const checklistUrl =
      "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf";

    await resend.emails.send({
      from: "Neighborhood Krew <no-reply@neighborhoodkrew.com>",
      to: email,
      subject: "Your Moving Day Checklist 🏠",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
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
            Source: ${source || "unknown"}
          </p>

          <hr style="margin:24px 0;" />

          <p style="font-size:13px; color:#666;">
            Neighborhood Krew Inc<br/>
            Licensed & Insured Movers
          </p>
        </div>
      `,
    });

    return res.json({ ok: true });
  } catch (err: any) {
    console.error("SEND CHECKLIST ERROR:", err);
    res.statusCode = 500;
    return res.json({
      error: "Checklist email failed",
      message: err?.message || "unknown",
    });
  }
}
