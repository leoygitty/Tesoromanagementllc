export default function handler(req: any, res: any) {
  const pdfUrl =
    "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf";

  return res.redirect(302, pdfUrl);
}
