// api/checklist-download.ts

module.exports = async function handler(req, res) {
  try {
    const email = req.query?.email || "unknown";

    console.log("CHECKLIST_PDF_CLICKED", {
      email,
      timestamp: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "unknown",
    });

    // Redirect to the actual PDF
    res.writeHead(302, {
      Location:
        "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf",
    });
    res.end();
  } catch (err) {
    console.error("Checklist redirect failed:", err);
    res.statusCode = 500;
    res.end("Server error");
  }
};
