"use client"

// PDF export utilities using jsPDF + jsPDF-AutoTable
// All functions run client-side only (browser)

const EHU_BLUE = [27, 79, 138] as [number, number, number]
const LIGHT_GRAY = [248, 249, 250] as [number, number, number]
const TEXT_DARK = [30, 30, 30] as [number, number, number]
const TEXT_MUTED = [120, 130, 140] as [number, number, number]

function addHeader(doc: InstanceType<typeof import("jspdf").default>, title: string, subtitle: string) {
  // Blue header bar
  doc.setFillColor(...EHU_BLUE)
  doc.rect(0, 0, 210, 28, "F")

  // Logo square
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(10, 6, 16, 16, 2, 2, "F")
  doc.setFontSize(7)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("EHU", 18, 16, { align: "center" })

  // Title
  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(255, 255, 255)
  doc.text(title, 32, 12)

  doc.setFontSize(8)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(200, 215, 235)
  doc.text(subtitle, 32, 20)

  // Date on the right
  const now = new Date().toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
  doc.setFontSize(8)
  doc.setTextColor(200, 215, 235)
  doc.text(`Généré le ${now}`, 200, 20, { align: "right" })
}

function addFooter(doc: InstanceType<typeof import("jspdf").default>, pageNum: number, totalPages: number) {
  doc.setFontSize(7)
  doc.setTextColor(...TEXT_MUTED)
  doc.text("EHU Oran — Système de Surveillance Épidémiologique", 10, 290)
  doc.text(`Page ${pageNum} / ${totalPages}`, 200, 290, { align: "right" })
  doc.setDrawColor(...TEXT_MUTED)
  doc.setLineWidth(0.3)
  doc.line(10, 286, 200, 286)
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

  addHeader(doc, `Fiche de Cas — ${cas.codeCas}`, `${cas.maladie} • ${cas.statut.replace("_", " ").toUpperCase()}`)

  let y = 36

  // --- Section A: Patient ---
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("A. INFORMATIONS PATIENT", 10, y)
  y += 5

  autoTable(doc, {
    startY: y,
    body: [
      ["Identifiant", cas.patient.identifiant, "Nom & Prénom", `${cas.patient.firstName} ${cas.patient.lastName}`],
      ["Sexe", cas.patient.sex, "Âge", `${cas.patient.age} ans`],
      ["Téléphone", cas.patient.phone || "—", "Commune", cas.patient.commune || "—"],
      ["Adresse", cas.patient.address || "—", "", ""],
    ],
    columnStyles: {
      0: { cellWidth: 38, fontStyle: "bold", fillColor: LIGHT_GRAY, textColor: TEXT_MUTED as [number, number, number] },
      1: { cellWidth: 57, textColor: TEXT_DARK as [number, number, number] },
      2: { cellWidth: 38, fontStyle: "bold", fillColor: LIGHT_GRAY, textColor: TEXT_MUTED as [number, number, number] },
      3: { cellWidth: 57, textColor: TEXT_DARK as [number, number, number] },
    },
    styles: { fontSize: 8.5, cellPadding: 3, lineColor: [230, 230, 230] as [number, number, number], lineWidth: 0.3 },
    theme: "grid",
    margin: { left: 10, right: 10 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // --- Section B: Données Cliniques ---
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("B. DONNÉES CLINIQUES", 10, y)
  y += 5

  autoTable(doc, {
    startY: y,
    body: [
      ["Maladie", cas.maladie, "Code CIM-10", cas.codeCim10],
      ["Début Symptômes", cas.dateDebutSymptomes, "Date Diagnostic", cas.dateDiagnostic],
      ["Mode Confirmation", cas.modeConfirmation, "Service", cas.service || "—"],
      ["Établissement", cas.etablissement || "—", "Commune Cas", cas.commune || "—"],
      ["Statut", cas.statut.replace("_", " "), "Date Déclaration", cas.dateDeclaration],
      ["Médecin Déclarant", cas.medecin || "—", "", ""],
    ],
    columnStyles: {
      0: { cellWidth: 38, fontStyle: "bold", fillColor: LIGHT_GRAY, textColor: TEXT_MUTED as [number, number, number] },
      1: { cellWidth: 57, textColor: TEXT_DARK as [number, number, number] },
      2: { cellWidth: 38, fontStyle: "bold", fillColor: LIGHT_GRAY, textColor: TEXT_MUTED as [number, number, number] },
      3: { cellWidth: 57, textColor: TEXT_DARK as [number, number, number] },
    },
    styles: { fontSize: 8.5, cellPadding: 3, lineColor: [230, 230, 230] as [number, number, number], lineWidth: 0.3 },
    theme: "grid",
    margin: { left: 10, right: 10 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6

  // --- Section C: Notes ---
  if (cas.notesCliniques || cas.resultatLabo) {
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...EHU_BLUE)
    doc.text("C. NOTES ET RÉSULTATS", 10, y)
    y += 5

    const notesBody: string[][] = []
    if (cas.notesCliniques) notesBody.push(["Notes Cliniques", cas.notesCliniques])
    if (cas.resultatLabo) notesBody.push(["Résultats Laboratoire", cas.resultatLabo])

    autoTable(doc, {
      startY: y,
      body: notesBody,
      columnStyles: {
        0: { cellWidth: 45, fontStyle: "bold", fillColor: LIGHT_GRAY, textColor: TEXT_MUTED as [number, number, number] },
        1: { cellWidth: 145, textColor: TEXT_DARK as [number, number, number] },
      },
      styles: { fontSize: 8.5, cellPadding: 3, lineColor: [230, 230, 230] as [number, number, number], lineWidth: 0.3 },
      theme: "grid",
      margin: { left: 10, right: 10 },
    })
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  doc.save(`fiche-cas-${cas.codeCas}.pdf`)
}

// ---------- Analytics Report PDF ----------
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

  addHeader(doc, "Rapport d'Analyse Épidémiologique", `Période: ${data.period}`)

  let y = 36

  // --- Summary KPIs ---
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("RÉSUMÉ", 10, y)
  y += 5

  const kpiW = 45
  const kpis = [
    { label: "Total Cas", value: String(data.summary.total) },
    { label: "Cas Confirmés", value: String(data.summary.confirmes) },
    { label: "Taux Confirmation", value: `${data.summary.tauxConfirmation}%` },
    { label: "Maladies Actives", value: String(data.summary.maladiesActives) },
  ]
  kpis.forEach((kpi, i) => {
    const x = 10 + i * (kpiW + 1)
    doc.setFillColor(...LIGHT_GRAY)
    doc.roundedRect(x, y, kpiW, 18, 2, 2, "F")
    doc.setDrawColor(220, 225, 230)
    doc.setLineWidth(0.3)
    doc.roundedRect(x, y, kpiW, 18, 2, 2, "S")
    doc.setFontSize(7)
    doc.setFont("helvetica", "normal")
    doc.setTextColor(...TEXT_MUTED)
    doc.text(kpi.label.toUpperCase(), x + kpiW / 2, y + 6, { align: "center" })
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.setTextColor(...EHU_BLUE)
    doc.text(kpi.value, x + kpiW / 2, y + 14, { align: "center" })
  })
  y += 24

  // --- Prevalence par Maladie ---
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("PRÉVALENCE PAR MALADIE", 10, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [["Maladie", "Nombre de Cas", "% du Total"]],
    body: data.prevalence.map(d => [
      d.name,
      String(d.count),
      data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%",
    ]),
    headStyles: { fillColor: EHU_BLUE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK as [number, number, number] },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 3, lineColor: [230, 230, 230] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    margin: { left: 10, right: 10 },
  })
  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  // Check if we need a new page
  if (y > 220) { doc.addPage(); y = 20 }

  // --- Two-column: Age + Sex side by side ---
  const leftX = 10
  const rightX = 110

  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("RÉPARTITION PAR ÂGE", leftX, y)
  doc.text("RÉPARTITION PAR SEXE", rightX, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [["Tranche d'Âge", "Cas"]],
    body: data.ageDistribution.map(d => [d.name, String(d.count)]),
    headStyles: { fillColor: EHU_BLUE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [230, 230, 230] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" } },
    margin: { left: leftX, right: 110 },
    tableWidth: 90,
  })

  autoTable(doc, {
    startY: y,
    head: [["Sexe", "Cas", "%"]],
    body: data.sexDistribution.map(d => [
      d.name === "M" ? "Masculin" : d.name === "F" ? "Féminin" : d.name,
      String(d.count),
      data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%",
    ]),
    headStyles: { fillColor: EHU_BLUE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [230, 230, 230] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    margin: { left: rightX, right: 10 },
    tableWidth: 90,
  })

  y = Math.max(
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY,
    y + 30
  ) + 8

  if (y > 240) { doc.addPage(); y = 20 }

  // --- Statut Distribution ---
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("RÉPARTITION PAR STATUT", 10, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [["Statut", "Cas", "% du Total"]],
    body: data.statutDistribution.map(d => [
      STATUT_LABELS[d.name] ?? d.name,
      String(d.count),
      data.summary.total > 0 ? `${Math.round((d.count / data.summary.total) * 100)}%` : "0%",
    ]),
    headStyles: { fillColor: EHU_BLUE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK as [number, number, number] },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 3, lineColor: [230, 230, 230] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" }, 2: { halign: "center" } },
    margin: { left: 10, right: 10 },
  })

  y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8

  if (y > 230) { doc.addPage(); y = 20 }

  // --- Weekly Trend ---
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...EHU_BLUE)
  doc.text("TENDANCE HEBDOMADAIRE", 10, y)
  y += 5

  autoTable(doc, {
    startY: y,
    head: [["Semaine", "Nombre de Cas"]],
    body: data.weeklyTrend.map(d => [d.date, String(d.count)]),
    headStyles: { fillColor: EHU_BLUE, textColor: [255, 255, 255] as [number, number, number], fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8, textColor: TEXT_DARK as [number, number, number] },
    alternateRowStyles: { fillColor: LIGHT_GRAY },
    styles: { cellPadding: 2.5, lineColor: [230, 230, 230] as [number, number, number], lineWidth: 0.3 },
    columnStyles: { 1: { halign: "center" } },
    margin: { left: 10, right: 10 },
  })

  // Footers
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    addFooter(doc, i, totalPages)
  }

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`rapport-analyses-ehu-${dateStr}.pdf`)
}
