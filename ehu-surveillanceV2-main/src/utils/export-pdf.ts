"use client"

// PDF export utilities using jsPDF + jsPDF-AutoTable
// All functions run client-side only (browser)

const EHU_BLUE    = [27, 79, 138]  as [number, number, number]
const EHU_DARK    = [15, 35, 65]   as [number, number, number]
const LIGHT_GRAY  = [248, 249, 250] as [number, number, number]
const MID_GRAY    = [240, 242, 245] as [number, number, number]
const TEXT_DARK   = [30, 30, 30]   as [number, number, number]
const TEXT_MUTED  = [120, 130, 140] as [number, number, number]
const WHITE       = [255, 255, 255] as [number, number, number]
const GOLD        = [180, 140, 50]  as [number, number, number]

function addOfficialHeader(
  doc: InstanceType<typeof import("jspdf").default>,
  title: string,
  subtitle: string,
  docRef: string,
) {
  const pageW = 210

  // Top blue band
  doc.setFillColor(...EHU_DARK)
  doc.rect(0, 0, pageW, 8, "F")
  doc.setFillColor(...EHU_BLUE)
  doc.rect(0, 8, pageW, 26, "F")

  // Gold accent line
  doc.setFillColor(...GOLD)
  doc.rect(0, 34, pageW, 0.7, "F")

  // EHU logo badge
  doc.setFillColor(...WHITE)
  doc.roundedRect(8, 10, 22, 22, 3, 3, "F")
  doc.setFontSize(6.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("EHU", 19, 18, { align: "center" })
  doc.setFontSize(5)
  doc.setFont("helvetica", "normal")
  doc.text("ORAN", 19, 23, { align: "center" })
  doc.setFontSize(4.5)
  doc.text("وهران", 19, 27.5, { align: "center" })

  // Republic header (top left)
  doc.setFontSize(6)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...WHITE)
  doc.text("RÉPUBLIQUE ALGÉRIENNE DÉMOCRATIQUE ET POPULAIRE", 35, 6.5)

  // Title block
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...WHITE)
  doc.text(title, 35, 20)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(200, 220, 245)
  doc.text(subtitle, 35, 27)

  // Right block: date + ref
  const now = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  doc.setFontSize(7.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...WHITE)
  doc.text(now, pageW - 8, 18, { align: "right" })
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(200, 220, 245)
  doc.text(`Réf: ${docRef}`, pageW - 8, 25, { align: "right" })

  // Ministry subtitle
  doc.setFillColor(...LIGHT_GRAY)
  doc.rect(0, 34.7, pageW, 8, "F")
  doc.setFontSize(7)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...EHU_BLUE)
  doc.text(
    "Établissement Hospitalier Universitaire d'Oran  •  Service d'Épidémiologie et de Médecine Préventive",
    pageW / 2, 39.5, { align: "center" }
  )
}

function addOfficialFooter(
  doc: InstanceType<typeof import("jspdf").default>,
  pageNum: number,
  totalPages: number,
) {
  const pageW = 210
  const y = 285

  doc.setDrawColor(...TEXT_MUTED)
  doc.setLineWidth(0.3)
  doc.line(10, y - 2, pageW - 10, y - 2)

  doc.setFontSize(6.5)
  doc.setTextColor(...TEXT_MUTED)
  doc.text("EHU Oran — Système de Surveillance Épidémiologique  •  Confidentiel — Usage médical uniquement", 10, y + 2)
  doc.text(`Page ${pageNum} / ${totalPages}`, pageW - 10, y + 2, { align: "right" })

  // Bottom band
  doc.setFillColor(...EHU_BLUE)
  doc.rect(0, 292, pageW, 5, "F")
}

function addSignatureZone(
  doc: InstanceType<typeof import("jspdf").default>,
  startY: number,
): number {
  const pageW = 210
  const margin = 10
  const zoneW = (pageW - margin * 2 - 8) / 3

  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("SIGNATURES & VALIDATION", margin, startY)
  startY += 4

  const zones = [
    { title: "Médecin Déclarant", sub: "Nom, signature & date" },
    { title: "Responsable de Service", sub: "Visa & date" },
    { title: "Cachet de l'Établissement", sub: "Tampon officiel" },
  ]

  zones.forEach((zone, i) => {
    const x = margin + i * (zoneW + 4)

    // Box
    doc.setFillColor(...LIGHT_GRAY)
    doc.setDrawColor(...TEXT_MUTED)
    doc.setLineWidth(0.4)
    doc.roundedRect(x, startY, zoneW, 28, 2, 2, "FD")

    // Title bar
    doc.setFillColor(...EHU_BLUE)
    doc.roundedRect(x, startY, zoneW, 7, 2, 2, "F")
    doc.rect(x, startY + 3, zoneW, 4, "F") // fill bottom corners

    doc.setFontSize(7)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...WHITE)
    doc.text(zone.title, x + zoneW / 2, startY + 5, { align: "center" })

    // Sub label
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "italic")
    doc.setTextColor(...TEXT_MUTED)
    doc.text(zone.sub, x + zoneW / 2, startY + 12, { align: "center" })

    // Signature line
    doc.setDrawColor(180, 190, 200)
    doc.setLineWidth(0.5)
    doc.line(x + 4, startY + 24, x + zoneW - 4, startY + 24)

    // For stamp zone: dotted border
    if (i === 2) {
      doc.setDrawColor(...EHU_BLUE)
      doc.setLineWidth(0.3)
      doc.setLineDashPattern([1, 1.5], 0)
      doc.roundedRect(x + 4, startY + 9, zoneW - 8, 14, 1.5, 1.5, "S")
      doc.setLineDashPattern([], 0)
    }
  })

  return startY + 33
}

// ---------- Single Case PDF ----------
export interface CasPdfData {
  codeCas: string
  statut: string
  maladie: string
  codeCim10: string
  patient: {
    identifiant: string
    firstName: string
    lastName: string
    sex: string
    age: number
    phone: string
    address: string
    commune: string
  }
  etablissement: string
  commune: string
  service: string
  modeConfirmation: string
  dateDebutSymptomes: string
  dateDiagnostic: string
  dateDeclaration: string
  medecin: string
  notesCliniques?: string
  resultatLabo?: string
}

export async function exportCasPdf(cas: CasPdfData) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const ref = `FD-${cas.codeCas}-${new Date().getFullYear()}`
  addOfficialHeader(doc, `Fiche de Déclaration — ${cas.codeCas}`, `${cas.maladie}  •  Statut : ${cas.statut.replace("_", " ").toUpperCase()}`, ref)

  let y = 48

  // ── Bande de statut colorée ──
  const statutColors: Record<string, [number, number, number]> = {
    confirme: [5, 150, 105],
    infirme:  [220, 38, 38],
    en_cours: [37, 99, 235],
    nouveau:  [107, 114, 128],
    cloture:  [75, 85, 99],
  }
  const col = statutColors[cas.statut] ?? EHU_BLUE
  doc.setFillColor(...col)
  doc.roundedRect(10, y, 190, 8, 2, 2, "F")
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...WHITE)
  doc.text(`STATUT : ${cas.statut.replace("_", " ").toUpperCase()}  •  CODE CIM-10 : ${cas.codeCim10}  •  DATE DÉCLARATION : ${cas.dateDeclaration}`, 105, y + 5.2, { align: "center" })
  y += 12

  // ── A. Informations Patient ──
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("A — INFORMATIONS PATIENT", 10, y)
  y += 4

  autoTable(doc, {
    startY: y,
    body: [
      ["Identifiant Patient", cas.patient.identifiant, "Nom & Prénom", `${cas.patient.lastName.toUpperCase()} ${cas.patient.firstName}`],
      ["Sexe", cas.patient.sex === "homme" ? "Masculin" : "Féminin", "Âge", `${cas.patient.age} ans`],
      ["Téléphone", cas.patient.phone || "—", "Commune de résidence", cas.patient.commune || "—"],
      ["Adresse", cas.patient.address || "—", "", ""],
    ],
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
      1: { cellWidth: 53, textColor: TEXT_DARK },
      2: { cellWidth: 42, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
      3: { cellWidth: 53, textColor: TEXT_DARK },
    },
    styles: { fontSize: 8, cellPadding: 3, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    theme: "grid",
    margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // ── B. Données Cliniques ──
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("B — DONNÉES CLINIQUES & ÉPIDÉMIOLOGIQUES", 10, y)
  y += 4

  autoTable(doc, {
    startY: y,
    body: [
      ["Maladie", cas.maladie, "Code CIM-10", cas.codeCim10],
      ["Début des Symptômes", cas.dateDebutSymptomes, "Date du Diagnostic", cas.dateDiagnostic],
      ["Mode de Confirmation", cas.modeConfirmation, "Service Déclarant", cas.service || "—"],
      ["Établissement", cas.etablissement || "—", "Commune du Cas", cas.commune || "—"],
      ["Médecin Déclarant", cas.medecin || "—", "", ""],
    ],
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
      1: { cellWidth: 53, textColor: TEXT_DARK },
      2: { cellWidth: 42, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
      3: { cellWidth: 53, textColor: TEXT_DARK },
    },
    styles: { fontSize: 8, cellPadding: 3, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    theme: "grid",
    margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // ── C. Notes & Résultats ──
  if (cas.notesCliniques || cas.resultatLabo) {
    doc.setFontSize(8.5)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...EHU_BLUE)
    doc.text("C — OBSERVATIONS CLINIQUES & RÉSULTATS", 10, y)
    y += 4
    const notesBody: string[][] = []
    if (cas.notesCliniques) notesBody.push(["Observations Cliniques", cas.notesCliniques])
    if (cas.resultatLabo)   notesBody.push(["Résultats de Laboratoire", cas.resultatLabo])
    autoTable(doc, {
      startY: y,
      body: notesBody,
      columnStyles: {
        0: { cellWidth: 52, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
        1: { cellWidth: 138, textColor: TEXT_DARK },
      },
      styles: { fontSize: 8, cellPadding: 3, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
      theme: "grid",
      margin: { left: 10, right: 10 },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  // ── Signature zone ──
  if (y > 220) { doc.addPage(); y = 20 }
  y = addSignatureZone(doc, y)

  // ── Footers ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addOfficialFooter(doc, i, totalPages)
  }

  doc.save(`fiche-declaration-${cas.codeCas}.pdf`)
}

export async function printCasPdf(cas: CasPdfData) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const ref = `FD-${cas.codeCas}-${new Date().getFullYear()}`
  addOfficialHeader(doc, `Fiche de Déclaration — ${cas.codeCas}`, `${cas.maladie}  •  Statut : ${cas.statut.replace("_", " ").toUpperCase()}`, ref)

  let y = 48

  const statutColors: Record<string, [number, number, number]> = {
    confirme: [5, 150, 105], infirme: [220, 38, 38],
    en_cours: [37, 99, 235], nouveau: [107, 114, 128], cloture: [75, 85, 99],
  }
  const col = statutColors[cas.statut] ?? EHU_BLUE
  doc.setFillColor(...col)
  doc.roundedRect(10, y, 190, 8, 2, 2, "F")
  doc.setFontSize(8)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...WHITE)
  doc.text(`STATUT : ${cas.statut.replace("_", " ").toUpperCase()}  •  CODE CIM-10 : ${cas.codeCim10}  •  DATE DÉCLARATION : ${cas.dateDeclaration}`, 105, y + 5.2, { align: "center" })
  y += 12

  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...EHU_BLUE)
  doc.text("A — INFORMATIONS PATIENT", 10, y); y += 4

  autoTable(doc, {
    startY: y,
    body: [
      ["Identifiant Patient", cas.patient.identifiant, "Nom & Prénom", `${cas.patient.lastName.toUpperCase()} ${cas.patient.firstName}`],
      ["Sexe", cas.patient.sex === "homme" ? "Masculin" : "Féminin", "Âge", `${cas.patient.age} ans`],
      ["Téléphone", cas.patient.phone || "—", "Commune de résidence", cas.patient.commune || "—"],
      ["Adresse", cas.patient.address || "—", "", ""],
    ],
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
      1: { cellWidth: 53, textColor: TEXT_DARK },
      2: { cellWidth: 42, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
      3: { cellWidth: 53, textColor: TEXT_DARK },
    },
    styles: { fontSize: 8, cellPadding: 3, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    theme: "grid", margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...EHU_BLUE)
  doc.text("B — DONNÉES CLINIQUES & ÉPIDÉMIOLOGIQUES", 10, y); y += 4

  autoTable(doc, {
    startY: y,
    body: [
      ["Maladie", cas.maladie, "Code CIM-10", cas.codeCim10],
      ["Début des Symptômes", cas.dateDebutSymptomes, "Date du Diagnostic", cas.dateDiagnostic],
      ["Mode de Confirmation", cas.modeConfirmation, "Service Déclarant", cas.service || "—"],
      ["Établissement", cas.etablissement || "—", "Commune du Cas", cas.commune || "—"],
      ["Médecin Déclarant", cas.medecin || "—", "", ""],
    ],
    columnStyles: {
      0: { cellWidth: 42, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
      1: { cellWidth: 53, textColor: TEXT_DARK },
      2: { cellWidth: 42, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
      3: { cellWidth: 53, textColor: TEXT_DARK },
    },
    styles: { fontSize: 8, cellPadding: 3, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    theme: "grid", margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  if (cas.notesCliniques || cas.resultatLabo) {
    doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...EHU_BLUE)
    doc.text("C — OBSERVATIONS CLINIQUES & RÉSULTATS", 10, y); y += 4
    const notesBody: string[][] = []
    if (cas.notesCliniques) notesBody.push(["Observations Cliniques", cas.notesCliniques])
    if (cas.resultatLabo) notesBody.push(["Résultats de Laboratoire", cas.resultatLabo])
    autoTable(doc, {
      startY: y, body: notesBody,
      columnStyles: {
        0: { cellWidth: 52, fontStyle: "bold", fillColor: MID_GRAY, textColor: TEXT_MUTED },
        1: { cellWidth: 138, textColor: TEXT_DARK },
      },
      styles: { fontSize: 8, cellPadding: 3, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
      theme: "grid", margin: { left: 10, right: 10 },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6
  }

  if (y > 220) { doc.addPage(); y = 20 }
  addSignatureZone(doc, y)

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addOfficialFooter(doc, i, totalPages) }

  // Open in new window and trigger print dialog
  doc.autoPrint()
  const blobUrl = doc.output("bloburl")
  window.open(blobUrl as unknown as string, "_blank")
}

// ---------- Analytics / Rapport mensuel PDF ----------
export interface AnalyticsPdfData {
  summary: { total: number; confirmes: number; tauxConfirmation: number; maladiesActives: number }
  prevalence: { name: string; count: number }[]
  weeklyTrend: { date: string; count: number }[]
  ageDistribution: { name: string; count: number }[]
  sexDistribution: { name: string; count: number }[]
  statutDistribution: { name: string; count: number }[]
  period: string
}

const STATUT_LABELS: Record<string, string> = {
  nouveau: "Nouveau", en_cours: "En cours", confirme: "Confirmé", infirme: "Infirmé", cloture: "Clôturé",
}

export async function exportAnalysesPdf(data: AnalyticsPdfData) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const ref = `RA-${new Date().toISOString().slice(0, 7)}-EHU`
  addOfficialHeader(doc, "Rapport d'Analyse Épidémiologique", `Période : ${data.period}`, ref)

  let y = 48

  // ── KPI band ──
  const kpis = [
    { label: "Total Cas",         value: String(data.summary.total),              color: EHU_BLUE },
    { label: "Cas Confirmés",     value: String(data.summary.confirmes),           color: [5, 150, 105] as [number, number, number] },
    { label: "Taux Confirmation", value: `${data.summary.tauxConfirmation}%`,      color: [37, 99, 235] as [number, number, number] },
    { label: "Maladies Actives",  value: String(data.summary.maladiesActives),     color: [180, 140, 50] as [number, number, number] },
  ]
  const kpiW = 45
  kpis.forEach((kpi, i) => {
    const x = 10 + i * (kpiW + 1.67)
    doc.setFillColor(...LIGHT_GRAY)
    doc.roundedRect(x, y, kpiW, 20, 2.5, 2.5, "F")
    doc.setFillColor(...kpi.color)
    doc.roundedRect(x, y, kpiW, 5, 2.5, 2.5, "F")
    doc.rect(x, y + 2, kpiW, 3, "F")
    doc.setFontSize(15)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...kpi.color)
    doc.text(kpi.value, x + kpiW / 2, y + 14, { align: "center" })
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...TEXT_MUTED)
    doc.text(kpi.label.toUpperCase(), x + kpiW / 2, y + 19, { align: "center" })
  })
  y += 26

  // ── Prévalence par maladie ──
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("PRÉVALENCE PAR MALADIE DÉCLARABLE", 10, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [["Maladie", "Cas", "% du Total", "Tendance"]],
    body: data.prevalence.map((d, idx) => [
      d.name,
      String(d.count),
      data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%",
      idx === 0 ? "▲ Prédominant" : "",
    ]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center", fontStyle: "italic", textColor: [5, 150, 105] } },
    margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  if (y > 220) { doc.addPage(); y = 20 }

  // ── Age + Sex côte à côte ──
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("RÉPARTITION PAR TRANCHE D'ÂGE", 10, y)
  doc.text("RÉPARTITION PAR SEXE", 115, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [["Tranche d'Âge", "Cas", "%"]],
    body: data.ageDistribution.map(d => [
      d.name,
      String(d.count),
      data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%",
    ]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    margin: { left: 10, right: 115 },
    tableWidth: 95,
  })

  autoTable(doc, {
    startY: y,
    head: [["Sexe", "Cas", "%"]],
    body: data.sexDistribution.map(d => [
      d.name === "M" ? "♂ Masculin" : d.name === "F" ? "♀ Féminin" : d.name,
      String(d.count),
      data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%",
    ]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 7.5, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    margin: { left: 115, right: 10 },
    tableWidth: 85,
  })

  y = Math.max(
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY,
    y + 30,
  ) + 8

  if (y > 230) { doc.addPage(); y = 20 }

  // ── Statuts ──
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("RÉPARTITION PAR STATUT DE CAS", 10, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [["Statut", "Nombre de Cas", "Proportion"]],
    body: data.statutDistribution.map(d => [
      STATUT_LABELS[d.name] ?? d.name,
      String(d.count),
      data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%",
    ]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 3, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  if (y > 220) { doc.addPage(); y = 20 }

  // ── Tendance hebdomadaire ──
  doc.setFontSize(8.5)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("TENDANCE ÉPIDÉMIOLOGIQUE HEBDOMADAIRE", 10, y)
  y += 4

  autoTable(doc, {
    startY: y,
    head: [["Semaine", "Nombre de Cas"]],
    body: data.weeklyTrend.map(d => [d.date, String(d.count)]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" } },
    margin: { left: 10, right: 10 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // ── Zone de signatures ──
  if (y > 210) { doc.addPage(); y = 20 }
  addSignatureZone(doc, y)

  // ── Footers ──
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addOfficialFooter(doc, i, totalPages)
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`rapport-epidemiologique-ehu-${dateStr}.pdf`)
}

export async function printAnalysesPdf(data: AnalyticsPdfData) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

  const ref = `RA-${new Date().toISOString().slice(0, 7)}-EHU`
  addOfficialHeader(doc, "Rapport d'Analyse Épidémiologique", `Période : ${data.period}`, ref)

  let y = 48

  const kpis = [
    { label: "Total Cas",         value: String(data.summary.total),              color: EHU_BLUE },
    { label: "Cas Confirmés",     value: String(data.summary.confirmes),           color: [5, 150, 105] as [number, number, number] },
    { label: "Taux Confirmation", value: `${data.summary.tauxConfirmation}%`,      color: [37, 99, 235] as [number, number, number] },
    { label: "Maladies Actives",  value: String(data.summary.maladiesActives),     color: [180, 140, 50] as [number, number, number] },
  ]
  const kpiW = 45
  kpis.forEach((kpi, i) => {
    const x = 10 + i * (kpiW + 1.67)
    doc.setFillColor(...LIGHT_GRAY); doc.roundedRect(x, y, kpiW, 20, 2.5, 2.5, "F")
    doc.setFillColor(...kpi.color); doc.roundedRect(x, y, kpiW, 5, 2.5, 2.5, "F"); doc.rect(x, y + 2, kpiW, 3, "F")
    doc.setFontSize(15); doc.setFont("helvetica", "bold"); doc.setTextColor(...kpi.color)
    doc.text(kpi.value, x + kpiW / 2, y + 14, { align: "center" })
    doc.setFontSize(6.5); doc.setFont("helvetica", "normal"); doc.setTextColor(...TEXT_MUTED)
    doc.text(kpi.label.toUpperCase(), x + kpiW / 2, y + 19, { align: "center" })
  })
  y += 26

  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...EHU_BLUE)
  doc.text("PRÉVALENCE PAR MALADIE DÉCLARABLE", 10, y); y += 4

  autoTable(doc, {
    startY: y,
    head: [["Maladie", "Cas", "% du Total", "Tendance"]],
    body: data.prevalence.map((d, idx) => [d.name, String(d.count), data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%", idx === 0 ? "▲ Prédominant" : ""]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 7.5, textColor: TEXT_DARK }, alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" }, 3: { halign: "center", fontStyle: "italic", textColor: [5, 150, 105] } },
    margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  if (y > 220) { doc.addPage(); y = 20 }

  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...EHU_BLUE)
  doc.text("RÉPARTITION PAR TRANCHE D'ÂGE", 10, y); doc.text("RÉPARTITION PAR SEXE", 115, y); y += 4

  autoTable(doc, {
    startY: y, head: [["Tranche d'Âge", "Cas", "%"]], body: data.ageDistribution.map(d => [d.name, String(d.count), data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%"]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 7.5, fontStyle: "bold" }, bodyStyles: { fontSize: 7.5 }, alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 }, columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    margin: { left: 10, right: 115 }, tableWidth: 95,
  })
  autoTable(doc, {
    startY: y, head: [["Sexe", "Cas", "%"]], body: data.sexDistribution.map(d => [d.name === "M" ? "♂ Masculin" : d.name === "F" ? "♀ Féminin" : d.name, String(d.count), data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%"]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 7.5, fontStyle: "bold" }, bodyStyles: { fontSize: 7.5 }, alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 }, columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    margin: { left: 115, right: 10 }, tableWidth: 85,
  })
  y = Math.max((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY, y + 30) + 8
  if (y > 230) { doc.addPage(); y = 20 }

  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...EHU_BLUE)
  doc.text("RÉPARTITION PAR STATUT DE CAS", 10, y); y += 4
  autoTable(doc, {
    startY: y, head: [["Statut", "Nombre de Cas", "Proportion"]], body: data.statutDistribution.map(d => [STATUT_LABELS[d.name] ?? d.name, String(d.count), data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%"]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 8, fontStyle: "bold" }, bodyStyles: { fontSize: 8, textColor: TEXT_DARK }, alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 3, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 }, columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  if (y > 220) { doc.addPage(); y = 20 }

  doc.setFontSize(8.5); doc.setFont("helvetica", "bold"); doc.setTextColor(...EHU_BLUE)
  doc.text("TENDANCE ÉPIDÉMIOLOGIQUE HEBDOMADAIRE", 10, y); y += 4
  autoTable(doc, {
    startY: y, head: [["Semaine", "Nombre de Cas"]], body: data.weeklyTrend.map(d => [d.date, String(d.count)]),
    headStyles: { fillColor: EHU_BLUE, textColor: WHITE, fontSize: 8, fontStyle: "bold" }, bodyStyles: { fontSize: 8, textColor: TEXT_DARK }, alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [225, 228, 232] as [number, number, number], lineWidth: 0.3 }, columnStyles: { 1: { halign: "center" } }, margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  if (y > 210) { doc.addPage(); y = 20 }
  addSignatureZone(doc, y)

  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addOfficialFooter(doc, i, totalPages) }

  doc.autoPrint()
  const blobUrl = doc.output("bloburl")
  window.open(blobUrl as unknown as string, "_blank")
}
