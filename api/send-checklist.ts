import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, source } = req.body as {
      email?: string;
      source?: string;
    };

    if (!email) {
      return res.status(400).json({ error: "Missing email" });
    }

    const checklistUrl =
      "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf";

    const result = await resend.emails.send({
      from: "Neighborhood Krew <quote@neighborhoodkrew.com>",
      to: [email], // REQUIRED
      subject: "Your Moving Day Checklist 🏠",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2>Your Moving Day Checklist</h2>
          <p>Thanks for requesting our professional checklist.</p>
          <p>
            👉 <a href="${checklistUrl}" target="_blank" rel="noopener noreferrer">
              Download your checklist
            </a>
          </p>
          <p style="font-size:12px;color:#666;">Source: ${source || "unknown"}</p>
        </div>
      `,
    });

    if (!result || result.error) {
      console.error("Resend error:", result?.error);
      return res.status(500).json({ error: "Email failed" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Checklist email failed:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
