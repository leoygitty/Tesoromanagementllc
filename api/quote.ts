// api/quote.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY as string);

// Owner & internal notification emails
const OWNER_EMAIL = "Neighborhoodkrew@gmail.com";
const CC_EMAIL = "tesoromanagements@gmail.com";

// Use an address on your verified Resend domain
// After domain verifies, you can literally use quotes@neighborhoodkrew.com
const FROM_EMAIL = "Neighborhood Krew <quotes@neighborhoodkrew.com>";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { type, name, email, phone, service, details } = req.body || {};

  if (!name || !email || !service || !details) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing required fields" });
  }

  const jobTypeLabel = type ? String(type) : "quote";

  const subject = `[Quote Lead] ${service} from ${name}`;
  const summaryLine = `New ${jobTypeLabel} request from ${name} (${email}${
    phone ? `, ${phone}` : ""
  }).`;

  const ownerText = `${summaryLine}

Service: ${service}
Phone: ${phone || "N/A"}

Details:
${details}

This lead was generated via the Instant Quote Wizard on neighborhoodkrew.com.
You and tesoromanagements@gmail.com both received this email.`;

  const ownerHtml = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #111;">
      <h2>New quote request from ${name}</h2>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Job type:</strong> ${jobTypeLabel}</p>
      <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
      <p><strong>Phone:</strong> ${phone || "N/A"}</p>
      <hr />
      <p><strong>Details from quiz:</strong></p>
      <pre style="white-space: pre-wrap; background:#f6f6f6; padding:12px; border-radius:8px; border:1px solid #e5e5e5;">${details}</pre>
      <p style="font-size:12px; color:#555; margin-top:16px;">
        Lead generated from the Instant Quote Wizard on <a href="https://neighborhoodkrew.com">neighborhoodkrew.com</a>.
      </p>
    </div>
  `;

  const firstName = String(name).split(" ")[0] || name;

  const customerSubject = "We received your Neighborhood Krew quote request";
  const customerText = `Hi ${firstName},

Thanks for requesting a quote with Neighborhood Krew.

We’ve received the details you submitted and a move coordinator will review everything and follow up with a custom quote and next steps.

If anything changes, you can reply directly to this email or call ${OWNER_EMAIL} / ${phone || "(215) 531-0907"}.

- Neighborhood Krew`;

  const customerHtml = `
    <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.5; color: #111;">
      <h2>We received your quote request 👍</h2>
      <p>Hi ${firstName},</p>
      <p>
        Thanks for reaching out to Neighborhood Krew about your move. Our team
        has your details and will follow up with a custom quote and clear next steps.
      </p>
      <p>
        If anything changes, you can simply reply to this email or call
        <a href="tel:+12155310907">(215) 531-0907</a>.
      </p>
      <hr />
      <p style="font-size:13px; color:#555;">Here’s a copy of what you submitted:</p>
      <pre style="white-space: pre-wrap; background:#f6f6f6; padding:12px; border-radius:8px; border:1px solid #e5e5e5;">${details}</pre>
      <p style="margin-top:16px;">– Neighborhood Krew</p>
    </div>
  `;

  try {
    // 1) Send to owner + your internal copy
    await resend.emails.send({
      from: FROM_EMAIL,
      to: [OWNER_EMAIL, CC_EMAIL],
      reply_to: email,
      subject,
      text: ownerText,
      html: ownerHtml,
    });

    // 2) Send confirmation to customer
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: customerSubject,
      text: customerText,
      html: customerHtml,
    });

    // Frontend only checks res.ok, so { ok: true } is plenty
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error sending quote email via Resend:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Error sending emails" });
  }
}
