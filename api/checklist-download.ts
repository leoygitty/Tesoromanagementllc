import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  const pdfUrl =
    "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf";

  // Optional: log email + timestamp here later
  const { email } = req.query;

  return res.redirect(302, pdfUrl);
}
