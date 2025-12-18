import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const { email, source } = body || {};

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
        <p>Thanks for requesting our professional checklist.</p>
        <p><a href="${checklistUrl}" target="_blank">Download your checklist</a></p>
        <p style="font-size:12px;color:#666">Source: ${source || "unknown"}</p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err: any) {
    console.error("CHECKLIST ERROR:", err);
    return res.status(500).json({
      error: "Checklist email failed",
      message: err?.message,
    });
  }
}
