import type { ProcedureOrder, ProcedureRequirement } from "./assistantProcedures.types"

export function isConsentRequirement(req: ProcedureRequirement): boolean {
  return req.kind === "consent"
}

export function findConsentRequirement(order: ProcedureOrder): ProcedureRequirement | null {
  return order.requirements.find(isConsentRequirement) ?? null
}

export function nonConsentRequirements(order: ProcedureOrder): ProcedureRequirement[] {
  return order.requirements.filter((req) => !isConsentRequirement(req))
}

export function dataUrlToFile(dataUrl: string, filename: string): File {
  const [header, base64] = dataUrl.split(",")
  const mime = header.match(/:(.*?);/)?.[1] ?? "image/png"
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], filename, { type: mime })
}

export type ConsentFormDownloadContent = {
  title: string
  body: string
  patientName: string
  patientId: string
  patientAge: number
  procedureName: string
  doctorName: string
  scheduledLabel: string
  labels: {
    patient: string
    procedure: string
    physician: string
    patientSignature: string
    guardianSignature: string
    guardianRelationship: string
    date: string
    footer: string
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function buildConsentFormHtml(content: ConsentFormDownloadContent): string {
  const scheduled = escapeHtml(content.scheduledLabel)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(content.title)}</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; color: #1a1f1e; max-width: 720px; margin: 40px auto; padding: 0 24px; line-height: 1.6; }
    h1 { font-size: 22px; margin-bottom: 8px; color: #1a5345; }
    .meta { font-size: 13px; margin-bottom: 24px; color: #6b7870; }
    .meta p { margin: 4px 0; }
    .body { font-size: 14px; margin: 24px 0; text-align: justify; }
    .signatures { margin-top: 48px; display: grid; gap: 32px; }
    .sign-block { border-top: 1px solid #1a1f1e; padding-top: 8px; min-height: 56px; }
    .sign-label { font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7870; }
    .footer { margin-top: 40px; font-size: 11px; color: #6b7870; border-top: 1px solid #e8e6e0; padding-top: 12px; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>${escapeHtml(content.title)}</h1>
  <div class="meta">
    <p><strong>${escapeHtml(content.labels.patient)}:</strong> ${escapeHtml(content.patientName)} · #${escapeHtml(content.patientId)} · ${content.patientAge}</p>
    <p><strong>${escapeHtml(content.labels.procedure)}:</strong> ${escapeHtml(content.procedureName)}</p>
    <p><strong>${escapeHtml(content.labels.physician)}:</strong> ${escapeHtml(content.doctorName)}</p>
    <p><strong>${escapeHtml(content.labels.date)}:</strong> ${scheduled}</p>
  </div>
  <div class="body">${escapeHtml(content.body)}</div>
  <div class="signatures">
    <div>
      <div class="sign-block"></div>
      <p class="sign-label">${escapeHtml(content.labels.patientSignature)}</p>
    </div>
    <div>
      <div class="sign-block"></div>
      <p class="sign-label">${escapeHtml(content.labels.guardianSignature)}</p>
      <p style="font-size:12px;color:#6b7870;margin-top:4px;">${escapeHtml(content.labels.guardianRelationship)}</p>
    </div>
    <div>
      <div class="sign-block"></div>
      <p class="sign-label">${escapeHtml(content.labels.date)}</p>
    </div>
  </div>
  <p class="footer">${escapeHtml(content.labels.footer)}</p>
</body>
</html>`
}

export function downloadConsentForm(content: ConsentFormDownloadContent, filename: string): void {
  const html = buildConsentFormHtml(content)
  const blob = new Blob([html], { type: "text/html;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
