import { Resend } from "resend";

type ApiReq = {
  method?: string;
  body?: any;
};

type ApiRes = {
  status: (code: number) => ApiRes;
  json: (data: any) => void;
  setHeader?: (name: string, value: string) => void;
};

const CODE = process.env.PROMO_CODE || "KREW25";
const FROM = process.env.PROMO_FROM_EMAIL || "promo@neighborhoodkrew.com";
const OWNER_EMAIL = process.env.PROMO_OWNER_EMAIL || "Neighborhoodkrew@gmail.com";
const MANAGER_EMAIL =
  process.env.PROMO_MANAGER_EMAIL || "tesoromanagements@gmail.com";

const SUBJECT =
  process.env.PROMO_SUBJECT || "Your $25 Neighborhood Krew Discount (Code Inside)";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default async function handler(req: ApiReq, res: ApiRes) {
  // Allow only POST
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    res.status(500).json({ ok: false, error: "Missing RESEND_API_KEY" });
    return;
  }

  const email = String(req.body?.email || "").trim();
  if (!email || !isValidEmail(email)) {
    res.status(400).json({ ok: false, error: "Valid email is required" });
    return;
  }

  const resend = new Resend(apiKey);

  // Customer-facing email
  const html = `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; line-height:1.5; color:#111;">
    <h2 style="margin:0 0 12px;">Here’s your $25 off code 🎉</h2>
    <p style="margin:0 0 14px;">
      Thanks for reaching out to Neighborhood Krew. Use the code below for <strong>$25 off</strong> your next move.
    </p>
    <div style="display:inline-block; padding:14px 18px; border-radius:14px; background:#b6e300; font-weight:800; letter-spacing:1px; font-size:18px;">
      ${CODE}
    </div>
    <p style="margin:14px 0 0; color:#444;">
      Reply to this email if you have questions or want to lock in a date.
    </p>
    <p style="margin:10px 0 0; color:#666; font-size:12px;">
      Neighborhood Krew Inc · ${OWNER_EMAIL}
    </p>
  </div>
  `;

  // Send to customer; CC owner + manager so both get the lead automatically
  try {
    const result = await resend.emails.send({
      from: FROM,
      to: email,
      cc: [OWNER_EMAIL, MANAGER_EMAIL],
      subject: SUBJECT,
      html,
    });

    res.status(200).json({
      ok: true,
      code: CODE,
      id: (result as any)?.id,
    });
  } catch (err: any) {
    console.error(err);
    res.status(500).json({
      ok: false,
      error: "Failed to send promo email",
      details: err?.message || String(err),
    });
  }
}
