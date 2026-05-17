import { createRequire } from "module"
import { writeFileSync } from "fs"

const require = createRequire(import.meta.url)
const { jsPDF } = require("jspdf")

const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })

const PW  = 210
const ML  = 12
const MR  = 12
const CW  = PW - ML - MR   // 186 mm
let y = 0

// ── Typography helpers ────────────────────────────────────────
function font(style, size) { doc.setFont("helvetica", style); doc.setFontSize(size) }
function rgb(r, g, b)       { doc.setTextColor(r, g, b) }
function draw(r, g, b, w)   { doc.setDrawColor(r, g, b); doc.setLineWidth(w ?? 0.3) }
function fill(r, g, b)      { doc.setFillColor(r, g, b) }

// ── Single field: label + underline, returns new y ────────────
function field(label, x, yy, w, required) {
  font("normal", 7)
  rgb(90, 90, 90)
  doc.text(label + (required ? " *" : ""), x, yy)
  draw(170, 170, 170, 0.25)
  doc.line(x, yy + 5, x + w, yy + 5)
}

// Full-width field
function fieldFull(label, yy, required) {
  field(label, ML, yy, CW, required)
  return yy + 8
}

// Two-column fields
function field2(l1, l2, yy, r1, r2) {
  const w = (CW - 4) / 2
  field(l1, ML,         yy, w, r1)
  field(l2, ML + w + 4, yy, w, r2)
  return yy + 8
}

// Three-column fields
function field3(l1, l2, l3, yy) {
  const w = (CW - 6) / 3
  field(l1, ML,             yy, w)
  field(l2, ML + w + 3,     yy, w)
  field(l3, ML + w * 2 + 6, yy, w)
  return yy + 8
}

// Checkbox item
function cb(label, x, yy) {
  draw(130, 130, 130, 0.25)
  doc.rect(x, yy - 2.8, 3, 3)
  font("normal", 7.5)
  rgb(30, 30, 30)
  doc.text(label, x + 4, yy)
}

// Radio item
function rd(label, x, yy) {
  draw(130, 130, 130, 0.25)
  doc.circle(x + 1.5, yy - 1.5, 1.5, "S")
  font("normal", 7.5)
  rgb(30, 30, 30)
  doc.text(label, x + 4.5, yy)
}

// Label line (small caps style)
function lbl(text, yy) {
  font("bold", 7)
  rgb(80, 80, 80)
  doc.text(text, ML, yy)
}

// Section header (full-width black bar)
function section(num, title, yy) {
  fill(20, 20, 20)
  doc.rect(ML, yy, CW, 7, "F")
  fill(255, 255, 255)
  doc.circle(ML + 5.5, yy + 3.5, 3, "F")
  font("bold", 8); rgb(20, 20, 20)
  doc.text(String(num), ML + 5.5, yy + 4.6, { align: "center" })
  font("bold", 9); rgb(255, 255, 255)
  doc.text(title, ML + 12, yy + 4.8)
  return yy + 10
}

// Thin separator
function sep(yy) {
  draw(200, 200, 200, 0.2)
  doc.setLineDashPattern([1, 1.5], 0)
  doc.line(ML, yy, ML + CW, yy)
  doc.setLineDashPattern([], 0)
  return yy + 3.5
}

// Measure text width
function tw(text, size) {
  font("normal", size ?? 7.5)
  return doc.getTextWidth(text)
}

// ── Grid of checkboxes / radios with auto-wrap ────────────────
// items: [{lbl}], x=start, yy, colW=column width per item, returns new y
function cbGrid(items, x, yy, colW, gap) {
  const realGap = gap ?? colW
  let cx = x, cy = yy
  items.forEach(item => {
    if (cx + realGap > ML + CW + 2) { cx = x; cy += 5.5 }
    cb(item, cx, cy)
    cx += realGap
  })
  return cy + 5.5
}

function rdRow(items, x, yy, colW) {
  let cx = x, cy = yy
  items.forEach(item => {
    if (cx + colW > ML + CW + 2) { cx = x; cy += 5.5 }
    rd(item, cx, cy)
    cx += colW
  })
  return cy + 5.5
}

// ══════════════════════════════════════════════════════════════
//  PAGE 1
// ══════════════════════════════════════════════════════════════
y = 8

// ── HEADER ───────────────────────────────────────────────────
draw(20, 20, 20, 0.5)
doc.rect(ML, y, CW, 9, "F")   // black top band via fill below
fill(20, 20, 20)
doc.rect(ML, y, CW, 9, "F")

// Circle logo
fill(255, 255, 255)
doc.circle(ML + 7, y + 4.5, 4, "F")
font("bold", 6.5); rgb(20, 20, 20)
doc.text("EHU", ML + 7, y + 5.3, { align: "center" })

font("bold", 10); rgb(255, 255, 255)
doc.text("FICHE DE DÉCLARATION — MALADIE À DÉCLARATION OBLIGATOIRE (MDO)", ML + 14, y + 3.8)
font("normal", 7); rgb(220, 220, 220)
doc.text("Établissement Hospitalier Universitaire d'Oran — Service Épidémiologie & Prévention", ML + 14, y + 7.5)

y += 11

// Meta info row
fill(245, 245, 245)
doc.rect(ML, y, CW, 8.5, "F")
draw(200, 200, 200, 0.3)
doc.rect(ML, y, CW, 8.5)

const mw = CW / 4
field("Mois",              ML + 2,            y + 6, mw - 20)
field("Année",             ML + mw - 14,      y + 6, 18)
field("Médecin déclarant", ML + mw + 3,       y + 6, mw - 3)
field("Service déclarant", ML + mw * 2 + 3,   y + 6, mw - 3)
field("Date de déclaration", ML + mw * 3 + 2, y + 6, mw - 4)
y += 11

field("Identifiant du cas (généré automatiquement par le système)", ML, y, CW * 0.55)
font("normal", 7); rgb(130, 130, 130)
doc.text("* Champ obligatoire", ML + CW * 0.6, y)
y += 10

// ══════════════════════════════════════════════════════════════
//  SECTION 1 — INFORMATIONS ADMINISTRATIVES
// ══════════════════════════════════════════════════════════════
y = section(1, "Informations Administratives du Patient", y)

y = field2("Nom", "Prénom", y, true, true)
y = field2("N° d'Identification Nationale (NIN)", "Date de naissance", y)

// Âge
lbl("Âge", y); y += 4
const aw = 28
field("ans",   ML,           y, aw)
field("mois",  ML + aw + 5,  y, aw)
field("jours", ML + aw * 2 + 10, y, aw)
y += 8

// Sexe
lbl("Sexe *", y); y += 4
rd("Masculin", ML,    y)
rd("Féminin",  ML + 30, y)
y += 7

y = field2("Wilaya de résidence", "Commune", y, true, true)
y = fieldFull("Adresse complète", y)
y = field2("Profession", "Téléphone", y)
y = field2("E-mail", "Lieu de travail / École", y)

// Étranger
lbl("Ressortissant étranger", y); y += 4
rd("Oui", ML, y)
rd("Non", ML + 22, y)
field("Si oui, nationalité", ML + 50, y, CW - 50)
y += 9

// ══════════════════════════════════════════════════════════════
//  SECTION 2 — HOSPITALISATION & ÉVACUATION
// ══════════════════════════════════════════════════════════════
y = section(2, "Hospitalisation & Évacuation", y)

lbl("Hospitalisation", y); y += 4
rd("Oui", ML, y); rd("Non", ML + 22, y)
y += 7

font("bold", 7); rgb(60, 60, 60)
doc.text("Si hospitalisé(e) :", ML, y); y += 4
y = field3("Date d'hospitalisation", "Structure / Établissement", "Service hospitalisation", y)

lbl("Évacuation", y); y += 4
rd("Oui", ML, y); rd("Non", ML + 22, y)
y += 7

font("bold", 7); rgb(60, 60, 60)
doc.text("Si évacué(e) :", ML, y); y += 4
y = field2("Date d'évacuation", "Structure d'évacuation", y)

// Évolution — 2 rows of 3
lbl("Évolution du patient", y); y += 4
const evItems = ["Guérison", "En cours de guérison", "Sortant", "Toujours malade", "Autre", "Décès"]
const evW = CW / 3
evItems.forEach((item, i) => {
  const col = i % 3
  const row = Math.floor(i / 3)
  rd(item, ML + col * evW, y + row * 5.5)
})
y += 12

y = field2("Date de sortie", "Date de décès (si applicable)", y)

// ══════════════════════════════════════════════════════════════
//  PAGE 2
// ══════════════════════════════════════════════════════════════
doc.addPage()
y = 8

// ══════════════════════════════════════════════════════════════
//  SECTION 3 — DONNÉES CLINIQUES
// ══════════════════════════════════════════════════════════════
y = section(3, "Données Cliniques", y)

lbl("Maladie à déclaration obligatoire (MDO) *", y); y += 4
field("Nom de la maladie",                    ML,          y, CW - 42)
field("Code CIM-10",                          ML + CW - 39, y, 37)
y += 9

y = field2("Date d'apparition des symptômes", "Date du diagnostic", y)

// Asymptomatique
cb("Asymptomatique (aucun symptôme)", ML, y); y += 7

// Symptômes — 3 colonnes, wrapping auto
lbl("Symptômes (cocher)", y); y += 4
const syms = [
  "Fièvre",          "Céphalées",          "Toux",
  "Dyspnée",         "Diarrhée",           "Vomissements",
  "Douleurs abdom.", "Éruption cutanée",   "Ictère",
  "Convulsions",     "Raideur de nuque",   "Paralysie",
  "Adénopathie",     "Asthénie",           "Anorexie",
  "Frissons",        "Myalgies",           "Arthralgies",
  "Autres : ______", "_______________",    "_______________",
]
const sw3 = CW / 3
syms.forEach((s, i) => {
  const col = i % 3
  const row = Math.floor(i / 3)
  cb(s, ML + col * sw3, y + row * 5.2)
})
y += Math.ceil(syms.length / 3) * 5.2 + 3

// Observation
lbl("Observation — détermine le statut du cas *", y); y += 4
const obsW = (CW - 6) / 2

// Suspect
draw(20, 20, 20, 0.4); fill(242, 242, 242)
doc.rect(ML, y, obsW, 10, "FD")
doc.circle(ML + 6, y + 5, 2, "S")
font("bold", 8.5); rgb(20, 20, 20)
doc.text("Cas suspect", ML + 11, y + 4.2)
font("normal", 7); rgb(100, 100, 100)
doc.text("Statut → Suspect", ML + 11, y + 8)

// Confirmé
draw(20, 20, 20, 0.4); fill(255, 255, 255)
doc.rect(ML + obsW + 6, y, obsW, 10, "D")
doc.circle(ML + obsW + 12, y + 5, 2, "S")
font("bold", 8.5); rgb(20, 20, 20)
doc.text("Cas confirmé", ML + obsW + 17, y + 4.2)
font("normal", 7); rgb(100, 100, 100)
doc.text("Statut → Confirmé", ML + obsW + 17, y + 8)
y += 14

// Mode confirmation
lbl("Mode de confirmation (si cas confirmé)", y); y += 4
rd("Clinique",        ML,      y)
rd("Biologique",      ML + 36, y)
rd("Épidémiologique", ML + 76, y)
y += 8

// ATCD
lbl("ATCD — Antécédents médicaux (cocher)", y); y += 4
const atcds = [
  "Diabète",          "Hypertension (HTA)",    "Insuffisance rénale",
  "Cardiopathie",     "Immunodépression",       "Grossesse",
  "Autres : ______",  "____________________",   "____________________",
]
atcds.forEach((a, i) => {
  const col = i % 3
  const row = Math.floor(i / 3)
  cb(a, ML + col * sw3, y + row * 5.2)
})
y += Math.ceil(atcds.length / 3) * 5.2 + 3

// Cas similaires
lbl("Cas similaire dans l'entourage", y); y += 4
rd("Oui", ML, y); rd("Non", ML + 22, y)
field("Si oui, nombre", ML + 52, y, 38)
y += 9

// ══════════════════════════════════════════════════════════════
//  SECTION 4 — LIEUX FRÉQUENTÉS
// ══════════════════════════════════════════════════════════════
y = section(4, "Lieux Fréquentés (période de contagiosité — max. 4)", y)

const lieuTypes = ["Domicile", "École", "Travail", "Marché", "Mosquée", "Hammam", "Hôpital", "Autre"]
const lieuTypeW = CW / 4   // 4 per row → 2 rows of 4

for (let n = 1; n <= 2; n++) {
  font("bold", 7); rgb(50, 50, 50)
  doc.text(`Lieu ${n}`, ML, y); y += 4

  y = field2("Nom du lieu", "Adresse", y)

  lbl("Type :", y); y += 4
  lieuTypes.forEach((t, i) => {
    const col = i % 4
    const row = Math.floor(i / 4)
    cb(t, ML + col * lieuTypeW, y + row * 5.2)
  })
  y += Math.ceil(lieuTypes.length / 4) * 5.2 + 2

  y = field2("Date début fréquentation", "Date fin fréquentation", y)
  y = sep(y)
}

// Lieux 3 & 4 condensés
for (let n = 3; n <= 4; n++) {
  font("bold", 7); rgb(50, 50, 50)
  doc.text(`Lieu ${n}`, ML, y); y += 4
  y = field3("Nom du lieu", "Type de lieu", "Dates (début → fin)", y)
  y = sep(y)
}

// ══════════════════════════════════════════════════════════════
//  PAGE 3
// ══════════════════════════════════════════════════════════════
doc.addPage()
y = 8

// ══════════════════════════════════════════════════════════════
//  SECTION 5 — PRÉLÈVEMENTS & RÉSULTATS LABORATOIRE
// ══════════════════════════════════════════════════════════════
y = section(5, "Prélèvements & Résultats Laboratoire", y)

for (let n = 1; n <= 3; n++) {
  font("bold", 7.5); rgb(50, 50, 50)
  doc.text(`Prélèvement ${n}`, ML, y); y += 4

  y = field2("Type de prélèvement", "Date du prélèvement", y)

  lbl("Résultat", y); y += 4
  rd("Positif",    ML,      y)
  rd("Négatif",    ML + 32, y)
  rd("En attente", ML + 64, y)
  y += 7

  y = field2("Germe identifié", "Code CIM-10 du germe", y)
  y = field2("Laboratoire",     "Antibiogramme",         y)
  y = fieldFull("Notes / Observations", y)
  y = sep(y)
}

// ══════════════════════════════════════════════════════════════
//  SECTION 6 — FICHE SPÉCIFIQUE
// ══════════════════════════════════════════════════════════════
y = section(6, "Fiche Spécifique (conditionnelle — selon la maladie déclarée)", y)

font("normal", 8); rgb(60, 60, 60)
const noteText = "Pour certaines maladies (choléra, méningite, tuberculose, hépatite virale, leishmaniose, typhoïde, brucellose, etc.), une fiche spécifique complémentaire est générée automatiquement par le système lors de la saisie."
const noteLines = doc.splitTextToSize(noteText, CW)
doc.text(noteLines, ML, y)
y += noteLines.length * 4.5 + 4

// Lignes vides pour notes libres
font("bold", 7); rgb(90, 90, 90)
doc.text("Notes complémentaires :", ML, y); y += 5
for (let i = 0; i < 7; i++) {
  draw(180, 180, 180, 0.25)
  doc.line(ML, y, ML + CW, y)
  y += 6
}
y += 4

// ── BLOC SIGNATURES ───────────────────────────────────────────
const sigW = (CW - 6) / 2
draw(20, 20, 20, 0.4)
doc.rect(ML,            y, sigW, 26)
doc.rect(ML + sigW + 6, y, sigW, 26)

font("bold", 7.5); rgb(30, 30, 30)
doc.text("Cachet & Signature du Médecin Déclarant", ML + sigW / 2,       y + 4, { align: "center" })
doc.text("Cachet du Service / Établissement",       ML + sigW + 6 + sigW / 2, y + 4, { align: "center" })
y += 30

// ── PIED DE PAGE ──────────────────────────────────────────────
draw(180, 180, 180, 0.3)
doc.line(ML, y, ML + CW, y)
y += 3.5
font("normal", 6.5); rgb(130, 130, 130)
const today = new Date().toLocaleDateString("fr-DZ", { day: "2-digit", month: "2-digit", year: "numeric" })
doc.text("EHU d'Oran — Service Épidémiologie et Prévention", ML, y)
doc.text("Système de Surveillance des MDO", ML + CW / 2, y, { align: "center" })
doc.text(`Généré le ${today}`, ML + CW, y, { align: "right" })

// Numéros de page
const total = doc.getNumberOfPages()
for (let p = 1; p <= total; p++) {
  doc.setPage(p)
  font("normal", 6.5); rgb(160, 160, 160)
  doc.text(`Page ${p} / ${total}`, PW / 2, 290, { align: "center" })
}

// ── EXPORT ────────────────────────────────────────────────────
const buf = Buffer.from(doc.output("arraybuffer"))
writeFileSync("public/fiche-declaration-mdo.pdf", buf)
console.log("✓ PDF généré : public/fiche-declaration-mdo.pdf")
