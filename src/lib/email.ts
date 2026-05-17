export async function sendAlertEmail(
  to: string[],
  alertTitle: string,
  alertDescription: string,
  alertType: string
) {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.startsWith("re_placeholder")) {
    console.log("[EMAIL SKIPPED] No Resend API key configured")
    return
  }

  const typeLabels: Record<string, string> = {
    epidemique: "🔴 ALERTE ÉPIDÉMIQUE",
    seuil: "🟡 SEUIL ATTEINT",
    information: "🔵 INFORMATION",
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Resend } = require("resend") as { Resend: new (key: string) => { emails: { send: (opts: Record<string, unknown>) => Promise<unknown> } } }
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.FROM_EMAIL ?? "alertes@ehu-oran.dz",
      to,
      subject: `${typeLabels[alertType] ?? "ALERTE"} — ${alertTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #1B4F8A; padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">EHU Oran — Surveillance Épidémiologique</h1>
          </div>
          <div style="background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
            <h2 style="color: #1B4F8A; margin-top: 0;">${typeLabels[alertType] ?? "ALERTE"}</h2>
            <h3 style="color: #232B3B;">${alertTitle}</h3>
            <p style="color: #4A5164;">${alertDescription}</p>
            <p style="color: #8A909B; font-size: 12px; margin-top: 24px;">
              Cet email a été envoyé automatiquement par le système de surveillance EHU Oran.
            </p>
          </div>
        </div>
      `,
    })
  } catch (err) {
    console.error("[EMAIL ERROR]", err)
  }
}
