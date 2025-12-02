// api/quote.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Helper: basic type for incoming payload
type QuotePayload = {
  type?: string;
  name?: string;
  email?: string;
  phone?: string;
  service?: string;
  details?: string;
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = (req.body || {}) as QuotePayload;

    const {
      type = "quote",
      name = "Unknown",
      email = "",
      phone = "",
      service,
      details,
    } = body;

    // Build a safe text body no matter what shape we get
    const lines: string[] = [];

    lines.push(`New ${type === "hiring_application" ? "Hiring Application" : "Quote Lead"} from website`);
    lines.push("");
    lines.push(`Name: ${name}`);
    if (email) lines.push(`Email: ${email}`);
    if (phone) lines.push(`Phone: ${phone}`);
    if (service) lines.push(`Service: ${service}`);
    lines.push("");

    if (details && details.trim().length > 0) {
      lines.push("Details:");
      lines.push(details.trim());
    } else {
      lines.push("Details: (none provided)");
    }

    const textBody = lines.join("\n");

    // Send email via Resend
    // Make sure RESEND_API_KEY is set in Vercel
    const toOwner = "Neighborhoodkrew@gmail.com";
    const ccCustomer = email && email.includes("@") ? email : undefined;
    const bccYou = "tesoromanagements@gmail.com";

    await resend.emails.send({
      from: "Neighborhood Krew Website <no-reply@neighborhood-krew.com>",
      to: [toOwner],
      cc: ccCustomer ? [ccCustomer] : undefined,
      bcc: [bccYou],
      subject:
        type === "hiring_application"
          ? `New Hiring Application – ${name}`
          : `New Quote Request – ${name}`,
      text: textBody,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("QUOTE API ERROR:", err);
    // Important: still respond with a clear error so the frontend knows
    return res
      .status(500)
      .json({ ok: false, error: "EMAIL_SEND_FAILED" });
  }
}
