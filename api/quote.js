import { Resend } from "resend";

export const config = {
  api: {
    bodyParser: false, // Required for file uploads
  },
};

const resend = new Resend(process.env.RESEND_API_KEY!);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ ok: false, message: "Method not allowed" });
    }

    // --- Parse incoming formdata (text + photos)
    const formData = await new Promise((resolve, reject) => {
      const chunks: any[] = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => {
        try {
          const buf = Buffer.concat(chunks);
          const fd = new FormData();
          fd.append("raw", buf); // temp workaround for Vercel
          resolve(fd);
        } catch (err) {
          reject(err);
        }
      });
    });

    // We receive JSON in a field called `payload`
    const payloadJSON = req.headers["x-payload"];
    const payload = JSON.parse(payloadJSON);

    const {
      name,
      email,
      phone,
      service,
      details,
    } = payload;

    // --- HANDLE FILES FROM FRONTEND ---
    let attachments: any[] = [];

    if (payload.photoFiles && Array.isArray(payload.photoFiles)) {
      for (const file of payload.photoFiles) {
        attachments.push({
          filename: file.name,
          content: file.base64.replace(/^data:image\/\w+;base64,/, ""),
          encoding: "base64",
        });
      }
    }

    // --- Build HTML email
    const htmlBody = `
      <h2>New Quote Request</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Service:</strong> ${service}</p>
      <pre style="white-space:pre-wrap;font-size:14px;margin-top:20px;">
${details}
      </pre>
    `;

    // --- SEND EMAIL TO OWNER(S)
    const ownerSend = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: [
        process.env.OWNER_EMAIL!,
        process.env.OWNER_EMAIL_SECONDARY!,
      ],
      subject: "New Quote Request – Neighborhood Krew",
      html: htmlBody,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    // --- SEND CONFIRMATION TO CUSTOMER
    const confirmationSend = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: "We received your quote request ✔️",
      html: `
        <h2>Thanks for reaching out!</h2>
        <p>We've received your information and the crew will review it shortly.</p>
        <p><strong>Here’s a copy of what you submitted:</strong></p>
        <pre style="white-space:pre-wrap;font-size:14px;">
${details}
        </pre>
      `,
    });

    return res.status(200).json({ ok: true, ownerSend, confirmationSend });

  } catch (err) {
    console.error("QUOTE API ERROR:", err);
    return res.status(500).json({ ok: false, message: "Server error", err });
  }
}
