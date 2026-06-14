/**
 * scripts/fix-seuils.ts
 *
 * Met à jour les maladies et les SeuilAlerte existants selon le tableau MDO officiel
 * (Tableau_groupe_de_maladies.pdf — USTO-MB).
 *
 * Exécuter avec :
 *   npx ts-node --compiler-options '{"module":"CommonJS"}' scripts/fix-seuils.ts
 * ou :
 *   npx tsx scripts/fix-seuils.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// ─── Données officielles du PDF ───────────────────────────────────────────────
// Colonnes : codeCim10, seuilNombre, periodeJours, gravite
// periodeJours = délai de déclaration traduit en fenêtre de comptage :
//   Immédiat/24h → 1 jour | Hebdomadaire → 7 jours | Mensuel → 30 jours
//   Exception PAVM : 7 jours (PDF : « même service / 7j »)
//   Exception ISO  : 7 jours (regroupement pratique même service)

const CORRECTIONS: {
  codeCim10: string
  seuilDefaut: number
  periodeDefautJours: number
}[] = [
  // ── Urgence / Immédiat ──────────────────────────────────────────────────
  { codeCim10: "U82",    seuilDefaut: 1, periodeDefautJours: 1  }, // BMR
  { codeCim10: "Y62",    seuilDefaut: 2, periodeDefautJours: 7  }, // ISO (même service)
  { codeCim10: "G000",   seuilDefaut: 1, periodeDefautJours: 1  }, // Méningite Hib
  { codeCim10: "G01A39", seuilDefaut: 1, periodeDefautJours: 1  }, // Méningite méningocoque
  { codeCim10: "G01",    seuilDefaut: 2, periodeDefautJours: 1  }, // Méningite pneumocoque
  { codeCim10: "G03",    seuilDefaut: 2, periodeDefautJours: 1  }, // Méningite virale
  { codeCim10: "G05",    seuilDefaut: 1, periodeDefautJours: 1  }, // Méningo-encéphalite
  { codeCim10: "B54",    seuilDefaut: 1, periodeDefautJours: 1  }, // Paludisme
  { codeCim10: "G82",    seuilDefaut: 1, periodeDefautJours: 1  }, // PFA
  { codeCim10: "J95",    seuilDefaut: 2, periodeDefautJours: 7  }, // PAVM (PDF : « / 7j »)
  { codeCim10: "A80",    seuilDefaut: 1, periodeDefautJours: 1  }, // Poliomyélite
  // ── Quotidien (24h) ─────────────────────────────────────────────────────
  { codeCim10: "A05.1",  seuilDefaut: 1, periodeDefautJours: 1  }, // Botulisme
  { codeCim10: "A23",    seuilDefaut: 2, periodeDefautJours: 1  }, // Brucellose
  { codeCim10: "A22",    seuilDefaut: 1, periodeDefautJours: 1  }, // Charbon
  { codeCim10: "A37",    seuilDefaut: 2, periodeDefautJours: 1  }, // Coqueluche
  { codeCim10: "A36",    seuilDefaut: 1, periodeDefautJours: 1  }, // Diphtérie
  { codeCim10: "A06",    seuilDefaut: 3, periodeDefautJours: 1  }, // Dysenterie
  { codeCim10: "B67",    seuilDefaut: 2, periodeDefautJours: 1  }, // Échinococcose
  { codeCim10: "A01",    seuilDefaut: 2, periodeDefautJours: 1  }, // Typhoïde
  { codeCim10: "B15",    seuilDefaut: 2, periodeDefautJours: 1  }, // Hépatite A
  { codeCim10: "A48",    seuilDefaut: 2, periodeDefautJours: 1  }, // Légionellose
  { codeCim10: "B551",   seuilDefaut: 3, periodeDefautJours: 1  }, // Leish. cutanée
  { codeCim10: "B550",   seuilDefaut: 1, periodeDefautJours: 1  }, // Leish. viscérale
  { codeCim10: "A30",    seuilDefaut: 1, periodeDefautJours: 1  }, // Lèpre
  { codeCim10: "A27",    seuilDefaut: 1, periodeDefautJours: 1  }, // Leptospirose
  { codeCim10: "A32",    seuilDefaut: 1, periodeDefautJours: 1  }, // Listériose
  { codeCim10: "A20",    seuilDefaut: 1, periodeDefautJours: 1  }, // Peste
  { codeCim10: "A82",    seuilDefaut: 1, periodeDefautJours: 1  }, // Rage
  { codeCim10: "A77",    seuilDefaut: 1, periodeDefautJours: 1  }, // Rickettsioses
  { codeCim10: "B05",    seuilDefaut: 1, periodeDefautJours: 1  }, // Rougeole
  { codeCim10: "B06",    seuilDefaut: 2, periodeDefautJours: 1  }, // Rubéole
  { codeCim10: "B65",    seuilDefaut: 1, periodeDefautJours: 1  }, // Schistosomiase
  { codeCim10: "A33",    seuilDefaut: 1, periodeDefautJours: 1  }, // Tétanos néonatal
  { codeCim10: "A35",    seuilDefaut: 1, periodeDefautJours: 1  }, // Tétanos non néonatal
  { codeCim10: "A05.9",  seuilDefaut: 2, periodeDefautJours: 1  }, // TIAC
  { codeCim10: "A71",    seuilDefaut: 1, periodeDefautJours: 1  }, // Trachome
  { codeCim10: "A75",    seuilDefaut: 1, periodeDefautJours: 1  }, // Typhus
  { codeCim10: "A92",    seuilDefaut: 1, periodeDefautJours: 1  }, // Chikungunya
  { codeCim10: "A00",    seuilDefaut: 1, periodeDefautJours: 1  }, // Choléra
  { codeCim10: "A90",    seuilDefaut: 1, periodeDefautJours: 1  }, // Dengue
  { codeCim10: "A984",   seuilDefaut: 1, periodeDefautJours: 1  }, // Ébola
  { codeCim10: "A95",    seuilDefaut: 1, periodeDefautJours: 1  }, // Fièvre jaune
  { codeCim10: "A923",   seuilDefaut: 1, periodeDefautJours: 1  }, // West Nile
  { codeCim10: "A924",   seuilDefaut: 1, periodeDefautJours: 1  }, // Rift
  { codeCim10: "A988",   seuilDefaut: 1, periodeDefautJours: 1  }, // Fièvres hémorr.
  { codeCim10: "J10",    seuilDefaut: 1, periodeDefautJours: 1  }, // Grippe nouveau
  { codeCim10: "U04",    seuilDefaut: 1, periodeDefautJours: 1  }, // SARS
  { codeCim10: "U07",    seuilDefaut: 1, periodeDefautJours: 1  }, // SARS-CoV-2
  { codeCim10: "U071",   seuilDefaut: 1, periodeDefautJours: 1  }, // MERS
  { codeCim10: "B03",    seuilDefaut: 1, periodeDefautJours: 1  }, // Variole
  // ── Hebdomadaire (7 jours) ───────────────────────────────────────────────
  { codeCim10: "B16",    seuilDefaut: 3, periodeDefautJours: 7  }, // Hépatite B
  { codeCim10: "B17",    seuilDefaut: 3, periodeDefautJours: 7  }, // Hépatite C
  { codeCim10: "A74",    seuilDefaut: 3, periodeDefautJours: 7  }, // Chlamydia
  { codeCim10: "B24",    seuilDefaut: 1, periodeDefautJours: 7  }, // VIH/SIDA
  { codeCim10: "A53",    seuilDefaut: 3, periodeDefautJours: 7  }, // Syphilis
  { codeCim10: "A54",    seuilDefaut: 3, periodeDefautJours: 7  }, // Gonococcie
  // ── Mensuel (30 jours) ──────────────────────────────────────────────────
  { codeCim10: "A15",    seuilDefaut: 5, periodeDefautJours: 30 }, // TB pulmonaire
  { codeCim10: "A18",    seuilDefaut: 5, periodeDefautJours: 30 }, // TB extra-pulm.
]

async function main() {
  console.log("=== Correction des seuils MDO selon le tableau officiel PDF ===\n")

  let majMaladies = 0
  let majSeuils = 0

  for (const c of CORRECTIONS) {
    const maladie = await prisma.maladie.findUnique({ where: { codeCim10: c.codeCim10 } })
    if (!maladie) {
      console.warn(`  ⚠ Maladie introuvable : CIM10=${c.codeCim10}`)
      continue
    }

    // 1. Mettre à jour seuilDefaut et periodeDefautJours dans la table Maladie
    await prisma.maladie.update({
      where: { codeCim10: c.codeCim10 },
      data: {
        seuilDefaut: c.seuilDefaut,
        periodeDefautJours: c.periodeDefautJours,
      },
    })
    majMaladies++

    // 2. Mettre à jour tous les SeuilAlerte existants liés à cette maladie
    const result = await prisma.seuilAlerte.updateMany({
      where: { maladieId: maladie.id, isActive: true },
      data: {
        seuilNombre: c.seuilDefaut,
        periodejours: c.periodeDefautJours,
      },
    })
    if (result.count > 0) {
      majSeuils += result.count
      console.log(`  ✓ ${maladie.nom} (${c.codeCim10}) → seuil=${c.seuilDefaut}, période=${c.periodeDefautJours}j [${result.count} seuil(s) mis à jour]`)
    } else {
      console.log(`  ✓ ${maladie.nom} (${c.codeCim10}) → seuil=${c.seuilDefaut}, période=${c.periodeDefautJours}j [maladie mise à jour, aucun SeuilAlerte existant]`)
    }
  }

  console.log(`\n✅ Terminé : ${majMaladies} maladies mises à jour, ${majSeuils} SeuilAlerte mis à jour.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
