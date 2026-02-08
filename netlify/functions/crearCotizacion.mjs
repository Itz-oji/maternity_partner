import { google } from "googleapis";
import PDFDocument from "pdfkit";
import { Resend } from "resend";

function resp(statusCode, body) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, X-FORM-KEY",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
    body: JSON.stringify(body),
  };
}

function buildPdfBuffer(c) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const chunks = [];
    doc.on("data", (d) => chunks.push(d));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(18).text("Cotización", { align: "center" });
    doc.moveDown();
    doc.fontSize(11).text(`Fecha: ${new Date().toLocaleDateString("es-CL")}`);
    doc.text(`Nombre: ${c.nombre ?? "-"}`);
    doc.text(`Email: ${c.email ?? "-"}`);
    doc.text(`Comuna: ${c.comuna ?? "-"}`);
    doc.text(`Dirección: ${c.direccion ?? "-"}`);
    doc.moveDown();
    doc.fontSize(12).text("Detalle", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Tipo: ${c.tipoServicio ?? "-"}`);
    doc.text(`Días: ${c.diasSemana ?? "-"}`);
    doc.text(`Fecha inicio: ${c.fechaInicio ?? "-"}`);
    doc.text(`Turno adaptativo: ${c.turnoAdaptativo ?? "-"}`);
    if (c.fechaAdaptativa) doc.text(`Fecha adaptativa: ${c.fechaAdaptativa}`);
    doc.moveDown();
    doc.fontSize(12).text("Total", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`${c.total ?? "-"}`);
    doc.end();
  });
}

async function uploadToDrive({ pdfBuffer, fileName, folderId }) {
  const sa = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);

  const auth = new google.auth.JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/drive.file"],
  });

  const drive = google.drive({ version: "v3", auth });

  const res = await drive.files.create({
    requestBody: {
      name: fileName,
      mimeType: "application/pdf",
      parents: [folderId],
    },
    media: { mimeType: "application/pdf", body: Buffer.from(pdfBuffer) },
    fields: "id, webViewLink",
  });

  return { fileId: res.data.id, webViewLink: res.data.webViewLink };
}

export async function handler(event) {
  if (event.httpMethod === "OPTIONS") return resp(200, { ok: true });
  if (event.httpMethod !== "POST") return resp(405, { error: "Método no permitido" });

  const headers = event.headers || {};
  const received = String(
    headers["x-form-key"] ??
    headers["X-FORM-KEY"] ??
    headers["X-Form-Key"] ??
    headers["x-form-key".toLowerCase()] ??
    ""
  ).trim();

  const expected = String(process.env.FORM_API_KEY || "").trim();

  // Debug seguro (no imprime el valor esperado)
  console.log("AUTH DEBUG", {
    receivedLen: received.length,
    expectedSet: expected.length > 0,
    headerKeys: Object.keys(headers),
    receivedPreview: received ? received.slice(0, 6) + "***" : "",
  });

  if (!expected) return resp(500, { error: "Falta FORM_API_KEY en env vars" });
  if (!received || received !== expected) return resp(401, { error: "No autorizado" });

  try {
    const data = JSON.parse(event.body || "{}");
    if (!data.email || !String(data.email).includes("@")) {
      return resp(400, { error: "Email inválido" });
    }

    const folderId = process.env.GDRIVE_FOLDER_ID;
    if (!folderId) return resp(500, { error: "Falta GDRIVE_FOLDER_ID" });

    const ts = new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-");
    const safeEmail = String(data.email).replace(/[^a-zA-Z0-9@._-]/g, "_");
    const fileName = `Cotizacion_${safeEmail}_${ts}.pdf`;

    // 1) PDF
    const pdfBuffer = await buildPdfBuffer(data);

    // 2) Drive
    const { fileId, webViewLink } = await uploadToDrive({ pdfBuffer, fileName, folderId });

    // 3) Email (opcional por ahora)
    const hasResend = !!process.env.RESEND_API_KEY && !!process.env.EMAIL_FROM;
    if (hasResend) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: data.email,
        subject: "Tu cotización (PDF)",
        html: `<p>Hola${data.nombre ? ` ${data.nombre}` : ""},</p>
               <p>Adjuntamos tu cotización en PDF.</p>`,
        attachments: [{ filename: fileName, content: pdfBuffer.toString("base64") }],
      });
    }

    return resp(200, { ok: true, fileId, webViewLink, emailed: hasResend });
  } catch (e) {
    console.error(e);
    return resp(500, { error: "Error interno", detail: String(e?.message || e) });
  }
}
