import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(
  req: any,
  res: any
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, source, utm } = req.body;

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

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Checklist email failed:", err);
    return res.status(500).json({ error: "Email failed to send" });
  }
}
