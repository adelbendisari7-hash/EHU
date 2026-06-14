/**
 * scripts/test-alerte.ts
 * Crée une déclaration de test pour Méningite à méningocoque (seuil=1 cas, urgence)
 * et vérifie que l'alerte est bien générée automatiquement.
 *
 * npx tsx scripts/test-alerte.ts
 */

import { PrismaClient } from "@prisma/client"
import { checkAndTriggerThresholds } from "../src/lib/check-thresholds"

const prisma = new PrismaClient()

async function main() {
  console.log("=== Test de déclenchement d'alerte — Méningite à méningocoque ===\n")

  // 1. Récupérer la maladie
  const maladie = await prisma.maladie.findUnique({ where: { codeCim10: "G01A39" } })
  if (!maladie) throw new Error("Maladie G01A39 introuvable — relancer le seed")
  console.log(`✓ Maladie : ${maladie.nom} (seuil=${maladie.seuilDefaut}, période=${maladie.periodeDefautJours}j)`)

  // 2. Récupérer le SeuilAlerte pour cette maladie
  const seuil = await prisma.seuilAlerte.findFirst({ where: { maladieId: maladie.id, isActive: true } })
  if (!seuil) throw new Error("Aucun SeuilAlerte configuré — lancer scripts/fix-seuils.ts d'abord")
  console.log(`✓ SeuilAlerte : ${seuil.seuilNombre} cas / ${seuil.periodejours} jour(s) — périmètre: ${seuil.perimetre}`)

  // 3. Commune d'Oran pour le test
  const commune = await prisma.commune.findFirst({ where: { nom: "Oran" } })
  console.log(`✓ Commune : ${commune?.nom ?? "non trouvée (cas national)"}`)

  // 4. Créer un patient test
  const patientId = `TEST-MENING-${Date.now()}`
  const patient = await prisma.patient.create({
    data: {
      identifiant: patientId,
      firstName: "Test",
      lastName: "Alerte",
      dateOfBirth: new Date("1990-01-01"),
      sex: "homme",
      address: "123 Rue de la République, Oran",
      communeId: commune?.id ?? null,
    },
  })
  console.log(`✓ Patient créé : ${patient.firstName} ${patient.lastName} (${patientId})`)

  // 5. Créer la déclaration
  const cas = await prisma.casDeclare.create({
    data: {
      codeCas: `CAS-TEST-${Date.now()}`,
      patientId: patient.id,
      maladieId: maladie.id,
      statut: "suspect",
      communeId: commune?.id ?? null,
      dateDebutSymptomes: new Date(),
      dateDiagnostic: new Date(),
      symptomesTexte: "Fièvre, céphalée, raideur de la nuque",
      serviceDeclarant: "Réanimation médicale",
    },
  })
  console.log(`✓ Déclaration créée : ${cas.codeCas}`)

  // 6. Déclencher la vérification des seuils (comme le ferait l'API POST /api/cas)
  console.log("\n⏳ Vérification des seuils d'alerte...")
  await checkAndTriggerThresholds(maladie.id, commune?.id ?? null)

  // 7. Vérifier si une alerte a été créée
  const alerte = await prisma.alerte.findFirst({
    where: { maladieId: maladie.id, statut: "active" },
    orderBy: { createdAt: "desc" },
    include: { maladie: { select: { nom: true } } },
  })

  if (alerte) {
    console.log("\n🚨 ALERTE CRÉÉE AVEC SUCCÈS !")
    console.log(`   Type    : ${alerte.type}`)
    console.log(`   Titre   : ${alerte.titre}`)
    console.log(`   Statut  : ${alerte.statut}`)
    console.log(`   Maladie : ${alerte.maladie?.nom}`)
    console.log(`   Cas     : ${alerte.nombreCas}`)
    console.log(`   Créée à : ${alerte.createdAt.toLocaleString("fr-FR")}`)
    console.log("\n✅ Les alertes fonctionnent parfaitement !")
    console.log("   Rendez-vous sur http://localhost:3000/alertes pour voir le bandeau URGENCE pulsant.")
  } else {
    console.log("\n⚠️  Aucune alerte générée.")
    console.log("   Vérifiez que le SeuilAlerte est bien configuré (lancer scripts/fix-seuils.ts).")
  }

  // 8. Résumé des alertes actives
  const totalActives = await prisma.alerte.count({ where: { statut: "active" } })
  console.log(`\n📊 Total alertes actives en base : ${totalActives}`)
}

main()
  .catch(e => { console.error("\n❌ Erreur :", e.message); process.exit(1) })
  .finally(() => prisma.$disconnect())
