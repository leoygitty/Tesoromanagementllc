const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const body = req.body || {};
    const email = body.email;
    const source = body.source || "unknown";

    if (!email) {
      return res.status(400).json({ error: "Email required" });
    }

    if (!process.env.RESEND_API_KEY) {
      console.error("RESEND_API_KEY missing");
      return res.status(500).json({ error: "Email service not configured" });
    }

    const checklistUrl =
      "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf";

    await resend.emails.send({
      from: "Neighborhood Krew <no-reply@neighborhoodkrew.com>",
      to: email,
      subject: "Your Moving Day Checklist",
      html: `
        <h2>Your Moving Day Checklist</h2>
        <p>Thanks for requesting our professional, mover-approved checklist.</p>
        <p>
          <a href="${checklistUrl}" target="_blank">
            Click here to download your checklist
          </a>
        </p>
        <p style="font-size:12px;color:#666;">
          Source: ${source}
        </p>
      `,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("SEND CHECKLIST ERROR:", err);
    return res.status(500).json({ error: "Failed to send checklist" });
  }
};
