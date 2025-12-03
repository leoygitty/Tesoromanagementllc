// api/apply.ts
import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;

// Same FROM as /api/quote
const FROM_EMAIL = "Neighborhood Krew <quotes@neighborhoodkrew.com>";
const OWNER_EMAIL = "Neighborhoodkrew@gmail.com";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { name, email, phone, city, role, availability, notes } = req.body || {};

  if (!name || !email || !phone) {
    return res
      .status(400)
      .json({ ok: false, error: "Missing required fields" });
  }

  // If email not configured, just succeed so the form doesn't break
  if (!resendApiKey) {
    console.warn("RESEND_API_KEY missing; skipping email send for /api/apply");
    return res.status(200).json({ ok: true, skippedEmail: true });
  }

  const resend = new Resend(resendApiKey);

  const text = [
    "New job application from the website:",
    "",
    `Name: ${name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    city ? `City: ${city}` : "",
    role ? `Role: ${role}` : "",
    availability ? `Availability: ${availability}` : "",
    "",
    "Notes:",
    notes || "(none)",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: OWNER_EMAIL,
      subject: "New mover / driver application",
      text,
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error sending application email:", err);
    return res
      .status(500)
      .json({ ok: false, error: "Failed to send application email" });
  }
}
