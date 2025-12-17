import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  // Only allow POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, source } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const checklistUrl =
      "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf";

    await resend.emails.send({
      from: "Neighborhood Krew <no-reply@neighborhoodkrew.com>",
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
            👉 <a href="${checklistUrl}" target="_blank" rel="noopener noreferrer">
              Click here to download your checklist
            </a>
          </p>

          <p style="margin-top:16px; font-size:13px; color:#666;">
            Request source: ${source || "unknown"}
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
