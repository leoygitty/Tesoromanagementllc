// api/quote.ts
import Busboy from "busboy";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "");

// Optional CRM webhook forward
async function sendToWebhook(payload: any) {
  const url = process.env.QUOTE_WEBHOOK_URL;
  if (!url) return;
  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("Error sending to webhook:", err);
  }
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const fields: Record<string, string> = {};
  const files: { filename: string; mimeType: string; data: Buffer }[] = [];

  try {
    const busboy = Busboy({ headers: req.headers });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (_name, file, info) => {
      const { filename, mimeType } = info;
      const chunks: Buffer[] = [];

      file.on("data", (data: Buffer) => {
        chunks.push(data);
      });

      file.on("end", () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length > 0) {
          files.push({
            filename: filename || "attachment",
            mimeType,
            data: buffer,
          });
        }
      });
    });

    await new Promise<void>((resolve, reject) => {
      busboy.on("finish", resolve);
      busboy.on("error", reject);
      req.pipe(busboy);
    });

    const {
      name = "",
      email = "",
      phone = "",
      service = "",
      details = "",
    } = fields;

    if (!name || !email || !service) {
      return res
        .status(400)
        .json({ error: "Missing required fields: name, email, or service" });
    }

    const ownerEmail =
      process.env.QUOTE_TO_EMAIL || "Neighborhoodkrew@gmail.com";
    const yourEmail = "tesoromanagements@gmail.com";

    const subject = `New quote request – ${service} from ${name}`;

    const plainText = `
New quote request from Neighborhood Krew site:

Name: ${name}
Email: ${email}
Phone: ${phone || "N/A"}
Service: ${service}

Details:
${details || "(none provided)"}

Attached photos: ${files.length}
    `.trim();

    const html = `
      <h2>New quote request from Neighborhood Krew website</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone || "N/A"}</p>
      <p><strong>Service:</strong> ${service}</p>
      <p><strong>Details:</strong><br/>${(details || "")
        .replace(/\n/g, "<br/>")}</p>
      <p><strong>Attached photos:</strong> ${files.length}</p>
    `;

    const attachments =
      files.length > 0
        ? files.map((f) => ({
            filename: f.filename,
            content: f.data.toString("base64"),
            type: f.mimeType,
          }))
        : [];

    if (!process.env.RESEND_API_KEY) {
      console.warn("RESEND_API_KEY not set – skipping email send.");
    } else {
      await resend.emails.send({
        from: "Neighborhood Krew <no-reply@your-domain.com>",
        to: [ownerEmail, yourEmail], // Owner + you
        subject,
        text: plainText,
        html,
        attachments,
      });
    }

    await sendToWebhook({
      type: "quote_request",
      fields,
      fileCount: files.length,
      createdAt: new Date().toISOString(),
    });

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Error handling quote:", err);
    return res
      .status(500)
      .json({ error: "Error processing quote request" });
  }
}
