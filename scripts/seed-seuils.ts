/**
 * Seed les seuils d'alerte officiels pour toutes les maladies MDO
 * selon le référentiel algérien (décret exécutif 03-476 du 2 janvier 2004)
 *
 * Usage : npx tsx scripts/seed-seuils.ts
 */
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

type Gravite = "attention" | "urgent" | "critique"
type Perimetre = "national" | "wilaya" | "commune"

interface SeuilDefault {
  seuilNombre: number
  periodejours: number
  gravite: Gravite
  perimetre: Perimetre
}

const SEUILS_MDO: Array<{ keywords: string[]; seuil: SeuilDefault }> = [
  { keywords: ["haemophilus"],                                      seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["méningocoque", "meningocoque"],                     seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["pneumocoque"],                                      seuil: { seuilNombre: 2, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["méningite virale", "meningite virale"],             seuil: { seuilNombre: 2, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["méningo-encéphalite", "meningo-encephalite"],       seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["hépatite virale a", "hepatite virale a"],           seuil: { seuilNombre: 2, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["hépatite virale b", "hepatite b"],                  seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention", perimetre: "national" } },
  { keywords: ["hépatite virale c", "hepatite c"],                  seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention", perimetre: "national" } },
  { keywords: ["multirésistante", "multiresistante", "bmr"],        seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["site opératoire", "site operatoire"],               seuil: { seuilNombre: 2, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["pneumopathie", "ventilation mécanique"],            seuil: { seuilNombre: 2, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["chlamydia"],                                        seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention", perimetre: "national" } },
  { keywords: ["vih", "sida"],                                      seuil: { seuilNombre: 1, periodejours: 7,  gravite: "urgent",    perimetre: "national" } },
  { keywords: ["tuberculose pulmonaire"],                           seuil: { seuilNombre: 5, periodejours: 30, gravite: "attention", perimetre: "national" } },
  { keywords: ["tuberculose extra", "tuberculose extrapulmonaire"], seuil: { seuilNombre: 5, periodejours: 30, gravite: "attention", perimetre: "national" } },
  { keywords: ["botulisme"],                                        seuil: { seuilNombre: 1, periodejours: 7,  gravite: "urgent",    perimetre: "national" } },
  { keywords: ["brucellose"],                                       seuil: { seuilNombre: 2, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["charbon"],                                          seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["coqueluche"],                                       seuil: { seuilNombre: 2, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["diphtérie", "diphterie"],                           seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["dysenterie"],                                       seuil: { seuilNombre: 3, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["échinococcose", "echinococcose", "hydatique"],      seuil: { seuilNombre: 2, periodejours: 30, gravite: "attention", perimetre: "national" } },
  { keywords: ["typhoïde", "typhoide", "paratyphoïde"],             seuil: { seuilNombre: 2, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["légionellose", "legionellose"],                     seuil: { seuilNombre: 2, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["leischmaniose cutanée", "leishmaniose cutanée"],    seuil: { seuilNombre: 3, periodejours: 30, gravite: "attention", perimetre: "national" } },
  { keywords: ["leischmaniose viscérale", "leishmaniose viscérale"],seuil: { seuilNombre: 1, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["lèpre", "lepre"],                                   seuil: { seuilNombre: 1, periodejours: 30, gravite: "attention", perimetre: "national" } },
  { keywords: ["leptospirose"],                                     seuil: { seuilNombre: 1, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["listériose", "listeriose"],                         seuil: { seuilNombre: 1, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["paludisme"],                                        seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["paralysie flasque"],                                seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["peste"],                                            seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["rage"],                                             seuil: { seuilNombre: 1, periodejours: 30, gravite: "critique",  perimetre: "national" } },
  { keywords: ["rickettsiose", "fièvre boutonneuse", "fievre boutonneuse"], seuil: { seuilNombre: 1, periodejours: 30, gravite: "urgent", perimetre: "national" } },
  { keywords: ["rougeole"],                                         seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["rubéole", "rubeole"],                               seuil: { seuilNombre: 2, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["schistosomiase", "bilharziose"],                    seuil: { seuilNombre: 1, periodejours: 30, gravite: "attention", perimetre: "national" } },
  { keywords: ["syphilis"],                                         seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention", perimetre: "national" } },
  { keywords: ["tétanos néonatal", "tetanos neonatal"],             seuil: { seuilNombre: 1, periodejours: 30, gravite: "critique",  perimetre: "national" } },
  { keywords: ["tétanos non néonatal", "tetanos non neonatal"],     seuil: { seuilNombre: 1, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["toxi-infection", "tiac"],                           seuil: { seuilNombre: 2, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["trachome"],                                         seuil: { seuilNombre: 1, periodejours: 30, gravite: "attention", perimetre: "national" } },
  { keywords: ["typhus"],                                           seuil: { seuilNombre: 1, periodejours: 30, gravite: "urgent",    perimetre: "national" } },
  { keywords: ["urétrite gonococcique", "uretrite gonococcique"],   seuil: { seuilNombre: 3, periodejours: 7,  gravite: "attention", perimetre: "national" } },
  { keywords: ["chikungunya"],                                      seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["choléra", "cholera"],                               seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["dengue"],                                           seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["ebola"],                                            seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["fièvre jaune", "fievre jaune"],                     seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["west nile"],                                        seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["vallée du rift", "vallee du rift", "rift"],         seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["hémorragique", "hemorragique"],                     seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["nouveau sous-type", "grippe causée", "grippe causee"], seuil: { seuilNombre: 1, periodejours: 7, gravite: "critique", perimetre: "national" } },
  { keywords: ["poliomyélite", "poliomyelite"],                     seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["sars-cov-2", "covid"],                              seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["sras"],                                             seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["mers"],                                             seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
  { keywords: ["variole"],                                          seuil: { seuilNombre: 1, periodejours: 7,  gravite: "critique",  perimetre: "national" } },
]

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
}

function getSeuilDefaut(nomMaladie: string): SeuilDefault {
  const nom = normalize(nomMaladie)
  for (const entry of SEUILS_MDO) {
    if (entry.keywords.some(kw => nom.includes(normalize(kw)))) {
      return entry.seuil
    }
  }
  // Valeur par défaut si aucune correspondance
  return { seuilNombre: 2, periodejours: 30, gravite: "urgent", perimetre: "national" }
}

async function main() {
  console.log("🔍 Chargement des maladies MDO...")
  const maladies = await prisma.maladie.findMany({ orderBy: { nom: "asc" } })
  console.log(`   → ${maladies.length} maladies trouvées\n`)

  // Seuils déjà existants
  const existants = await prisma.seuilAlerte.findMany({ select: { maladieId: true } })
  const existantsIds = new Set(existants.map(s => s.maladieId))

  let created = 0
  let skipped = 0

  for (const maladie of maladies) {
    if (existantsIds.has(maladie.id)) {
      console.log(`⏭  Seuil déjà existant : ${maladie.nom}`)
      skipped++
      continue
    }

    const defaut = getSeuilDefaut(maladie.nom)

    await prisma.seuilAlerte.create({
      data: {
        maladieId:       maladie.id,
        perimetre:       defaut.perimetre,
        seuilNombre:     defaut.seuilNombre,
        periodejours:    defaut.periodejours,
        gravite:         defaut.gravite,
        autoAlerte:      true,
        autoNotification: true,
        isActive:        true,
      },
    })

    console.log(`✅ ${maladie.nom.padEnd(55)} → ${defaut.seuilNombre} cas / ${defaut.periodejours}j [${defaut.gravite}]`)
    created++
  }

  console.log(`\n✨ Terminé : ${created} seuils créés, ${skipped} déjà configurés.`)
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
