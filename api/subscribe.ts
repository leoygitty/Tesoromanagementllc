// api/subscribe.ts

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const { email } = req.body || {};

  if (!email) {
    return res.status(400).json({ ok: false, error: "Email is required" });
  }

  // For now we just accept and pretend we stored it.
  // Later you can wire this into Resend's audience or a list.
  return res.status(200).json({ ok: true });
}
