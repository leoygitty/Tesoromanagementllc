import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    email,
    source,
    utm,
  } = req.body || {};

  const lead = {
    email: email || null,
    source: source || "unknown",
    utm: utm || {},
    timestamp: new Date().toISOString(),
    ip: req.headers["x-forwarded-for"] || null,
    userAgent: req.headers["user-agent"] || null,
  };

  await kv.lpush("checklist_leads", JSON.stringify(lead));

  return res.status(200).json({ ok: true });
}
