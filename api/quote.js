import { Resend } from "resend";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.info("[info] Incoming quote payload:", req.body);

    const {
      name,
      email,
      phone,
      service,
      details,
      attachments = []
    } = req.body;

    // Parse details block (sent from your quiz funnel already formatted)
    const moveDetails = details || "No additional details provided.";

    // Build owner email HTML
    const ownerHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 20px;">
        <h2>📦 New Moving Quote – ${name}</h2>

        <h3>Customer Info</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone}</p>

        <h3>Move Details</h3>
        <pre style="background:#f6f6f6; padding:15px; border-radius:6px;">
${moveDetails}
        </pre>

        ${
          attachments.length > 0
            ? `<h3>Photos Attached (${attachments.length})</h3>
               <ul>${attachments
                 .map(a => `<li>${a.filename}</li>`)
                 .join("")}</ul>`
            : "<p><em>No photos were uploaded.</em></p>"
        }
      </div>
    `;

    const resend = new Resend(process.env.RESEND_API_KEY);

    const ownerEmails = [
      "tesoromanagements@gmail.com",
      "neighborhoodkrew@gmail.com"
    ];

    console.info("[info] Sending owner quote email to:", ownerEmails);

    const ownerResult = await resend.emails.send({
      from: `send@neighborhoodkrew.com`,
      to: ownerEmails,
      subject: `New Moving Quote – ${name}`,
      html: ownerHtml,
      attachments: attachments.map((file) => ({
        filename: file.filename,
        content: file.content, // base64
      })),
    });

    console.info("[info] Owner email result:", ownerResult);

    // CUSTOMER CONFIRMATION EMAIL
    const customerHtml = `
      <div style="font-family: Arial; padding: 20px;">
        <h2>Thank you, ${name}! 🎉</h2>
        <p>Your moving request has been submitted successfully. A crew member will reach out shortly.</p>

        <h3>Your Submitted Details</h3>
        <pre style="background:#f6f6f6; padding:15px; border-radius:6px;">
${moveDetails}
        </pre>

        <p style="margin-top: 20px;">We appreciate you choosing Neighborhood Krew!</p>
      </div>
    `;

    console.info("[info] Sending confirmation to:", email);

    const customerResult = await resend.emails.send({
      from: `send@neighborhoodkrew.com`,
      to: email,
      subject: `We Received Your Moving Request!`,
      html: customerHtml,
    });

    console.info("[info] Customer email result:", customerResult);

    return res.json({ ok: true, message: "Quote sent successfully." });
  } catch (err) {
    console.error("[error] Quote handler failed:", err);
    return res.status(500).json({ error: "Failed to send email." });
  }
}
