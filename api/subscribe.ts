export const config = { runtime: "edge" };

type Json = Record<string, any>;

function json(data: Json, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default async function handler(req: Request) {
  if (req.method !== "POST") return json({ ok: false, error: "Method not allowed" }, 405);

  const RESEND_API_KEY = (process.env.RESEND_API_KEY || "").trim();
  if (!RESEND_API_KEY) return json({ ok: false, error: "Missing RESEND_API_KEY" }, 500);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const email = body?.email;
  if (!email || typeof email !== "string") {
    return json({ ok: false, error: "Email is required" }, 400);
  }

  const from = (process.env.PROMO_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "").trim()
    || "Neighborhood Krew <quotes@neighborhoodkrew.com>";

  const toList = [
    process.env.PROMO_OWNER_EMAIL,
    process.env.PROMO_MANAGER_EMAIL,
  ].filter((v): v is string => typeof v === "string" && v.trim().length > 0);

  // Safety: ensure there's at least one recipient
  if (toList.length === 0) {
    return json({ ok: false, error: "Missing promo recipient emails in env vars" }, 500);
  }

  const subject = process.env.PROMO_SUBJECT || "New Promo Signup";
  const promoCode = process.env.PROMO_CODE || "";

  const html = `
    <h2>New Promo Signup</h2>
    <p><strong>Email:</strong> ${email}</p>
    ${promoCode ? `<p><strong>Promo Code:</strong> ${promoCode}</p>` : ""}
  `;

  // Send via Resend REST API (Edge-safe)
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: toList,
      subject,
      html,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    return json({ ok: false, error: "Resend API error", detail: text }, 500);
  }

  return json({ ok: true }, 200);
}
