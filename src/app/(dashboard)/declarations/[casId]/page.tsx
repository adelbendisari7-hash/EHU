import { auth } from "@/lib/auth"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Copy, FileText, ImageIcon, Paperclip } from "lucide-react"
import { prisma } from "@/lib/prisma"
import CasStatusBadge from "@/components/declarations/cas-status-badge"
import CasExportPdfButton from "@/components/declarations/cas-export-pdf-button"
import { formatDate } from "@/utils/format-date"
import { calculateAge, calculateAgeDetailed } from "@/utils/calculate-age"
import type { CasStatut } from "@/types"
import CasStatusChanger from "@/components/declarations/cas-status-changer"

export default async function CasDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ casId: string }>
  searchParams: Promise<{ tab?: string }>
}) {
  const { casId } = await params
  const { tab = "clinique" } = await searchParams
  const session = await auth()

  const cas = await prisma.casDeclare.findUnique({
    where: { id: casId },
    include: {
      patient: { include: { commune: true } },
      maladie: true,
      commune: true,
      etablissement: true,
      medecin: { select: { firstName: true, lastName: true, email: true } },
      fichiers: true,
      investigation: {
        include: {
          contacts: true,
          epidemiologiste: { select: { firstName: true, lastName: true } },
        },
      },
      symptomes: { include: { symptome: true } },
      lieux: { orderBy: { ordre: "asc" }, include: { commune: true } },
      resultatsLabo: { include: { germe: true }, orderBy: { createdAt: "desc" } },
      casSimilaireRef: { select: { id: true, codeCas: true, patient: { select: { firstName: true, lastName: true } }, maladie: { select: { nom: true } } } },
      structureHospitalisation: { select: { id: true, nom: true } },
    },
  })

  // Ensure TypeScript knows about the extra fields returned by Prisma
  type CasWithExtras = typeof cas & {
    observation?: string | null
    modeConfirmation?: string | null
    symptomesTexte?: string | null
    ageAns?: number | null
    ageMois?: number | null
    ageJours?: number | null
  }

  if (!cas) notFound()

  // Timeline — audit log entries for this case
  const timeline = await prisma.auditLog.findMany({
    where: { OR: [{ entityId: casId }, { entityId: cas.patient.id }] },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { firstName: true, lastName: true } } },
    take: 50,
  })

  const casTyped = cas as CasWithExtras
  const age = calculateAge(cas.patient.dateOfBirth)
  // Use stored age fields if available, otherwise calculate from date of birth
  const ageLabel = (casTyped.ageAns != null || casTyped.ageMois != null || casTyped.ageJours != null)
    ? [
        casTyped.ageAns ? `${casTyped.ageAns} an${casTyped.ageAns > 1 ? "s" : ""}` : null,
        casTyped.ageMois ? `${casTyped.ageMois} mois` : null,
        casTyped.ageJours ? `${casTyped.ageJours} jour${casTyped.ageJours > 1 ? "s" : ""}` : null,
      ].filter(Boolean).join(" ") || `${age} ans`
    : calculateAgeDetailed(cas.patient.dateOfBirth).label

  const canChangeStatus = session?.user.role === "epidemiologiste" || session?.user.role === "admin"

  // Completeness score
  const completenessFields = [
    cas.patient.firstName, cas.patient.lastName, cas.patient.dateOfBirth, cas.patient.sex,
    cas.patient.address, cas.patient.commune?.nom,
    cas.maladie?.nom, cas.dateDebutSymptomes, casTyped.observation,
    cas.service, cas.etablissement?.nom,
  ]
  const filled = completenessFields.filter(Boolean).length
  const completeness = Math.round((filled / completenessFields.length) * 100)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/declarations" className="text-sm text-gray-400 hover:text-gray-600">← Retour</Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-xl font-semibold text-gray-800">{cas.codeCas}</h1>
          <CasStatusBadge statut={cas.statut as CasStatut} />
        </div>
        <div className="flex gap-2">
          {canChangeStatus && <CasStatusChanger casId={cas.id} currentStatut={cas.statut as CasStatut} />}
          <CasExportPdfButton cas={{
            codeCas: cas.codeCas,
            statut: cas.statut,
            maladie: cas.maladie?.nom ?? "—",
            codeCim10: cas.maladie?.codeCim10 ?? "—",
            patient: {
              identifiant: cas.patient.identifiant,
              firstName: cas.patient.firstName,
              lastName: cas.patient.lastName,
              sex: cas.patient.sex,
              age,
              phone: cas.patient.phone ?? "—",
              address: cas.patient.address ?? "—",
              commune: cas.patient.commune?.nom ?? "—",
            },
            etablissement: cas.etablissement?.nom ?? "—",
            commune: cas.commune?.nom ?? "—",
            service: cas.service ?? "—",
            modeConfirmation: cas.modeConfirmation ?? "—",
            dateDebutSymptomes: formatDate(cas.dateDebutSymptomes),
            dateDiagnostic: formatDate(cas.dateDiagnostic),
            dateDeclaration: formatDate(cas.createdAt),
            medecin: cas.medecin ? `Dr. ${cas.medecin.firstName} ${cas.medecin.lastName}` : "—",
            notesCliniques: cas.notesCliniques ?? undefined,
            resultatLabo: cas.resultatLabo ?? undefined,
          }} />
          <Link href={`/declarations/new?copy=${cas.id}`} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Copy size={14} /> Copier
          </Link>
          <Link href={`/declarations/${cas.id}/edit`} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            Modifier
          </Link>
        </div>
      </div>

      {/* 2-col layout */}
      <div className="flex gap-5">
        {/* Patient Sidebar */}
        <div className="w-72 shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-20">
            <div className="flex flex-col items-center text-center mb-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3" style={{ backgroundColor: "#1B4F8A" }}>
                {cas.patient.firstName[0]}{cas.patient.lastName[0]}
              </div>
              <p className="font-semibold text-gray-800">{cas.patient.firstName} {cas.patient.lastName}</p>
              <p className="text-sm text-gray-500">{ageLabel} • {cas.patient.sex}</p>
            </div>
            {/* Completeness bar */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-gray-500">Complétude</span>
                <span className={`text-[11px] font-bold ${completeness >= 80 ? "text-green-600" : completeness >= 50 ? "text-amber-600" : "text-red-600"}`}>
                  {completeness}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${completeness}%`,
                    backgroundColor: completeness >= 80 ? "#059669" : completeness >= 50 ? "#D97706" : "#DC2626",
                  }}
                />
              </div>
            </div>

            <div className="space-y-2 text-sm">
              {[
                { label: "Identifiant", value: cas.patient.identifiant },
                { label: "Téléphone", value: cas.patient.phone ?? "—" },
                { label: "Commune", value: cas.patient.commune?.nom ?? "—" },
                { label: "Établissement", value: cas.etablissement?.nom ?? "—" },
                { label: "Maladie", value: cas.maladie?.nom ?? "—" },
                { label: "Déclaré le", value: formatDate(cas.createdAt) },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-1.5 border-b border-gray-50">
                  <span className="text-gray-400 text-xs font-medium">{item.label}</span>
                  <span className="text-gray-700 text-xs text-right max-w-[130px] truncate">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main content tabs */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
            {/* Tab headers */}
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {[
                { key: "clinique", label: "Données Cliniques" },
                { key: "labo", label: "Résultats Labo" },
                { key: "investigation", label: "Investigation" },
                { key: "timeline", label: "Chronologie" },
              ].map(t => (
                <Link
                  key={t.key}
                  href={`/declarations/${casId}?tab=${t.key}`}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
                    tab === t.key
                      ? "border-b-2 text-[#1B4F8A]"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={tab === t.key ? { borderBottomColor: "#1B4F8A" } : {}}
                >
                  {t.label}
                </Link>
              ))}
            </div>

            {/* Tab content */}
            {tab === "timeline" && (
              <div className="p-5">
                {timeline.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-8">Aucun événement enregistré</p>
                ) : (
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-gray-100" />
                    <div className="space-y-4">
                      {[
                        { createdAt: cas.createdAt, label: "Cas déclaré", detail: `Par ${cas.medecin ? `Dr. ${cas.medecin.firstName} ${cas.medecin.lastName}` : "—"}`, color: "#1B4F8A" },
                        ...timeline.map(e => ({
                          createdAt: e.createdAt,
                          label: e.action,
                          detail: e.user ? `${e.user.firstName} ${e.user.lastName}` : "Système",
                          color: e.action.includes("delete") ? "#DC2626" : e.action.includes("create") ? "#059669" : "#6B7280",
                        })),
                      ].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()).map((event, idx) => (
                        <div key={idx} className="flex items-start gap-4 pl-2">
                          <div className="w-6 h-6 rounded-full border-2 border-white shadow-sm flex items-center justify-center shrink-0 z-10" style={{ backgroundColor: event.color }}>
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                          <div className="flex-1 pb-1">
                            <p className="text-sm font-medium text-gray-800 capitalize">{event.label.replace(/_/g, " ")}</p>
                            <p className="text-xs text-gray-500">{event.detail}</p>
                            <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(event.createdAt)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab !== "timeline" && <div className="p-5 space-y-4">
              {/* Observation badge — Confirmé / Suspect */}
              {casTyped.observation && (
                <div className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
                  casTyped.observation === "cas_confirme"
                    ? "bg-green-50 border-green-200"
                    : "bg-amber-50 border-amber-200"
                }`}>
                  <span className={`text-sm font-semibold ${
                    casTyped.observation === "cas_confirme" ? "text-green-700" : "text-amber-700"
                  }`}>
                    {casTyped.observation === "cas_confirme" ? "✓ Cas Confirmé" : "⚠ Cas Suspect"}
                  </span>
                  {casTyped.observation === "cas_confirme" && casTyped.modeConfirmation && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium capitalize">
                      {casTyped.modeConfirmation === "epidemiologique" ? "Épidémiologique" : casTyped.modeConfirmation.charAt(0).toUpperCase() + casTyped.modeConfirmation.slice(1)}
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "Maladie", value: cas.maladie?.nom ?? "—" },
                  { label: "Code CIM-10", value: cas.maladie?.codeCim10 ?? "—" },
                  { label: "Début Symptômes", value: formatDate(cas.dateDebutSymptomes) },
                  { label: "Date Diagnostic", value: formatDate(cas.dateDiagnostic) },
                  { label: "Service", value: cas.service },
                  { label: "Médecin Déclarant", value: cas.medecin ? `Dr. ${cas.medecin.firstName} ${cas.medecin.lastName}` : "—" },
                  { label: "Âge précis", value: ageLabel },
                  { label: "Statut", value: cas.statut },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">{item.label}</p>
                    <p className="text-sm font-medium text-gray-800 capitalize">{item.value ?? "—"}</p>
                  </div>
                ))}
                {casTyped.symptomesTexte && (
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Symptômes</p>
                    <p className="text-sm text-gray-700">{casTyped.symptomesTexte}</p>
                  </div>
                )}
                {cas.notesCliniques && (
                  <div className="col-span-2 bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Notes Cliniques</p>
                    <p className="text-sm text-gray-700">{cas.notesCliniques}</p>
                  </div>
                )}
              </div>

              {/* Symptômes codés */}
              {cas.symptomes.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Symptômes codés</p>
                  <div className="flex flex-wrap gap-1.5">
                    {cas.symptomes.map(cs => (
                      <span key={cs.id} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                        {cs.symptome.nom}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lieux fréquentés */}
              {cas.lieux.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Lieux fréquentés</p>
                  <div className="space-y-2">
                    {cas.lieux.map(lieu => (
                      <div key={lieu.id} className="flex items-start gap-3 text-sm">
                        <span className="w-5 h-5 rounded bg-gray-200 text-gray-600 text-xs font-bold flex items-center justify-center shrink-0">{lieu.ordre}</span>
                        <div>
                          <p className="font-medium text-gray-800">{lieu.nom}</p>
                          <p className="text-xs text-gray-500">
                            {lieu.type && <span className="capitalize">{lieu.type}</span>}
                            {lieu.adresse && <span> — {lieu.adresse}</span>}
                            {lieu.commune && <span> ({lieu.commune.nom})</span>}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cas similaire lié */}
              {cas.casSimilaireRef && (
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                  <p className="text-xs font-medium text-blue-400 uppercase tracking-wider mb-1">Cas similaire lié</p>
                  <Link href={`/declarations/${cas.casSimilaireRef.id}`} className="text-sm font-medium text-blue-700 hover:text-blue-900">
                    {cas.casSimilaireRef.codeCas} — {cas.casSimilaireRef.patient.lastName} {cas.casSimilaireRef.patient.firstName} ({cas.casSimilaireRef.maladie?.nom ?? "—"})
                  </Link>
                </div>
              )}

              {/* Hospitalisation details */}
              {cas.estHospitalise && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Hospitalisation</p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {cas.dateHospitalisation && (
                      <div>
                        <span className="text-gray-400 text-xs">Date :</span>{" "}
                        <span className="text-gray-700">{formatDate(cas.dateHospitalisation)}</span>
                      </div>
                    )}
                    {cas.structureHospitalisation && (
                      <div>
                        <span className="text-gray-400 text-xs">Structure :</span>{" "}
                        <span className="text-gray-700">{cas.structureHospitalisation.nom}</span>
                      </div>
                    )}
                    {cas.serviceHospitalisation && (
                      <div>
                        <span className="text-gray-400 text-xs">Service :</span>{" "}
                        <span className="text-gray-700">{cas.serviceHospitalisation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Évaluation clinique */}
              {cas.evaluationClinique && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Évaluation clinique</p>
                  <p className="text-sm text-gray-700">{typeof cas.evaluationClinique === "object" && cas.evaluationClinique !== null && "notes" in (cas.evaluationClinique as Record<string, unknown>) ? String((cas.evaluationClinique as Record<string, unknown>).notes) : JSON.stringify(cas.evaluationClinique)}</p>
                </div>
              )}

              {/* Résultats Laboratoire */}
              {cas.resultatsLabo.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">Résultats Laboratoire</p>
                  <div className="space-y-3">
                    {cas.resultatsLabo.map(r => (
                      <div key={r.id} className="bg-white rounded-lg border border-gray-100 p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-800">{r.typePrelevement}</span>
                          {r.resultat && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              r.resultat === "positif" ? "bg-red-100 text-red-700" :
                              r.resultat === "negatif" ? "bg-green-100 text-green-700" :
                              "bg-gray-100 text-gray-600"
                            }`}>
                              {r.resultat}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 space-y-0.5">
                          <p>Prélèvement : {formatDate(r.datePrelevement)}</p>
                          {r.germe && <p>Germe : <span className="font-medium text-gray-700">{r.germe.nom}</span></p>}
                          {r.laboratoire && <p>Laboratoire : {r.laboratoire}</p>}
                          {r.antibiogramme && <p>Antibiogramme : {r.antibiogramme}</p>}
                          {r.notes && <p>Notes : {r.notes}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Patient address */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-1">Adresse Patient</p>
                <p className="text-sm text-gray-700">{cas.patient.address}</p>
              </div>

              {/* Pièces jointes */}
              {cas.fichiers.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <Paperclip size={14} className="text-gray-400" />
                    <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Pièces jointes</p>
                    <span className="text-[10px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full font-medium">{cas.fichiers.length}</span>
                  </div>

                  {/* Declaration proof files */}
                  {cas.fichiers.filter(f => f.type === "declaration").length > 0 && (
                    <div className="mb-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Preuve de déclaration</p>
                      <div className="grid grid-cols-2 gap-2">
                        {cas.fichiers.filter(f => f.type === "declaration").map(f => {
                          const isPdf = f.filename.toLowerCase().endsWith(".pdf") || f.url.toLowerCase().endsWith(".pdf")
                          const isImage = /\.(jpe?g|png|webp|gif)$/i.test(f.filename)
                          return (
                            <a
                              key={f.id}
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="group flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white hover:border-[#1B4F8A] hover:shadow-sm transition-all"
                            >
                              {isImage ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={f.url} alt={f.filename} className="w-full h-28 object-cover bg-gray-100" />
                              ) : (
                                <div className="w-full h-28 flex flex-col items-center justify-center bg-red-50 gap-2">
                                  <FileText size={32} className="text-red-400" />
                                  <span className="text-[10px] text-red-500 font-medium uppercase">PDF</span>
                                </div>
                              )}
                              <div className="px-2 py-1.5 flex items-center gap-1.5">
                                {isImage ? <ImageIcon size={11} className="text-blue-400 shrink-0" /> : <FileText size={11} className="text-red-400 shrink-0" />}
                                <span className="text-[11px] text-gray-600 truncate group-hover:text-[#1B4F8A]">{f.filename}</span>
                              </div>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Lab result files */}
                  {cas.fichiers.filter(f => f.type === "resultat_labo").length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Documents de laboratoire</p>
                      <div className="space-y-1.5">
                        {cas.fichiers.filter(f => f.type === "resultat_labo").map(f => {
                          const isPdf = /\.pdf$/i.test(f.filename)
                          return (
                            <a
                              key={f.id}
                              href={f.url}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-2.5 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-[#1B4F8A] hover:shadow-sm transition-all group"
                            >
                              {isPdf
                                ? <FileText size={15} className="text-red-400 shrink-0" />
                                : <ImageIcon size={15} className="text-blue-400 shrink-0" />
                              }
                              <span className="flex-1 text-xs text-gray-700 truncate group-hover:text-[#1B4F8A]">{f.filename}</span>
                              <span className="text-[10px] text-[#1B4F8A] font-medium opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Voir →</span>
                            </a>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>}
          </div>
        </div>
      </div>
    </div>
  )
}
