// api/ping.js
module.exports = (req, res) => {
  console.log("🔔 /api/ping called with method:", req.method);
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ ok: true, message: "ping alive" }));
};
