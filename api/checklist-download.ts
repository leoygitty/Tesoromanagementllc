export default async function handler(req, res) {
  try {
    const email = req.query.email || null;

    // Log the download (non-blocking)
    fetch(`${process.env.SITE_URL}/api/log-checklist-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        source: "desktop_download",
      }),
    }).catch(() => {});

    // Redirect to the actual PDF
    res.writeHead(302, {
      Location:
        "https://neighborhoodkrew.com/NeighborhoodKrewMovingDayChecklist.pdf",
    });
    res.end();
  } catch (err) {
    res.status(500).send("Checklist download failed");
  }
}
