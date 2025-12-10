// api/apply.ts

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(200).json({ ok: true });
  }

  // Just log the application payload for now (view it in Vercel logs)
  console.log("New job application:", req.body);

  // Always succeed from the frontend’s perspective
  return res.status(200).json({ ok: true });
}
