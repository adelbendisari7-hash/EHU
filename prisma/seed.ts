import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"
import { MALADIES_SEED } from "./seeds/maladies"

// Mapping codeCim10 → groupeEpidemiologique (catégories PDF JO 2022)
const GROUPE_EPID_MAP: Record<string, string> = {
  // Nosocomiale
  "U82": "nosocomiale", "Y62": "nosocomiale", "J95": "nosocomiale",
  "U82.0": "nosocomiale", "U82.1": "nosocomiale", "U82.2": "nosocomiale",
  "U82.2a": "nosocomiale", "U82.2b": "nosocomiale", "U82.2c": "nosocomiale",
  "U82.2d": "nosocomiale", "U82.2e": "nosocomiale", "U82.3": "nosocomiale",
  "U82.4": "nosocomiale", "U82.5": "nosocomiale", "U82.8": "nosocomiale",
  "U82.8a": "nosocomiale", "U82.9": "nosocomiale", "U83.0": "nosocomiale",
  "U83.0a": "nosocomiale", "U83.1": "nosocomiale", "U83.1a": "nosocomiale",
  "U83.8": "nosocomiale", "U83.9": "nosocomiale", "U84.0": "nosocomiale",
  "U84.1": "nosocomiale", "U84.2": "nosocomiale", "B96.4": "nosocomiale",
  "B96.9": "nosocomiale",
  // PEV — Programme Élargi de Vaccination
  "G000": "pev", "G82": "pev", "A37": "pev", "A36": "pev",
  "B05": "pev", "B06": "pev", "A33": "pev", "A35": "pev",
  "A15": "pev", "A18": "pev", "A80": "pev", "B03": "pev",
  // Autre
  "G01A39": "autre", "G01": "autre", "G03": "autre", "G05": "autre",
  "A30": "autre", "J10": "autre", "U04": "autre", "U07": "autre", "U071": "autre",
  // Vectorielle
  "B54": "vectorielle", "B551": "vectorielle", "B550": "vectorielle",
  "A20": "vectorielle", "A77": "vectorielle", "A71": "vectorielle", "A75": "vectorielle",
  "A92": "vectorielle", "A90": "vectorielle", "A984": "vectorielle",
  "A95": "vectorielle", "A924": "vectorielle", "A923": "vectorielle", "A988": "vectorielle",
  // Zoonose
  "A23": "zoonose", "A22": "zoonose", "B67": "zoonose",
  "A27": "zoonose", "A32": "zoonose", "A82": "zoonose",
  // MTH — Maladies à Transmission Hydrique
  "A05.1": "mth", "A06": "mth", "A01": "mth", "B15": "mth",
  "A48": "mth", "A00": "mth", "B65": "mth", "A05.9": "mth",
  // IST — Infections Sexuellement Transmissibles
  "B16": "ist", "B17": "ist", "A74": "ist", "B24": "ist", "A53": "ist", "A54": "ist",
}
import { PERMISSIONS_SEED, ROLES_SEED } from "./seeds/roles-permissions"
import { COMMUNES_ALL } from "./seeds/communes-all"
import { GERMES } from "../src/constants/germes"
import { SYMPTOMS } from "../src/constants/symptoms"

const prisma = new PrismaClient()

const WILAYAS = [
  { code: "01", nom: "Adrar" }, { code: "02", nom: "Chlef" }, { code: "03", nom: "Laghouat" },
  { code: "04", nom: "Oum El Bouaghi" }, { code: "05", nom: "Batna" }, { code: "06", nom: "Béjaïa" },
  { code: "07", nom: "Biskra" }, { code: "08", nom: "Béchar" }, { code: "09", nom: "Blida" },
  { code: "10", nom: "Bouira" }, { code: "11", nom: "Tamanrasset" }, { code: "12", nom: "Tébessa" },
  { code: "13", nom: "Tlemcen" }, { code: "14", nom: "Tiaret" }, { code: "15", nom: "Tizi Ouzou" },
  { code: "16", nom: "Alger" }, { code: "17", nom: "Djelfa" }, { code: "18", nom: "Jijel" },
  { code: "19", nom: "Sétif" }, { code: "20", nom: "Saïda" }, { code: "21", nom: "Skikda" },
  { code: "22", nom: "Sidi Bel Abbès" }, { code: "23", nom: "Annaba" }, { code: "24", nom: "Guelma" },
  { code: "25", nom: "Constantine" }, { code: "26", nom: "Médéa" }, { code: "27", nom: "Mostaganem" },
  { code: "28", nom: "M'Sila" }, { code: "29", nom: "Mascara" }, { code: "30", nom: "Ouargla" },
  { code: "31", nom: "Oran" }, { code: "32", nom: "El Bayadh" }, { code: "33", nom: "Illizi" },
  { code: "34", nom: "Bordj Bou Arréridj" }, { code: "35", nom: "Boumerdès" }, { code: "36", nom: "El Tarf" },
  { code: "37", nom: "Tindouf" }, { code: "38", nom: "Tissemsilt" }, { code: "39", nom: "El Oued" },
  { code: "40", nom: "Khenchela" }, { code: "41", nom: "Souk Ahras" }, { code: "42", nom: "Tipaza" },
  { code: "43", nom: "Mila" }, { code: "44", nom: "Aïn Defla" }, { code: "45", nom: "Naâma" },
  { code: "46", nom: "Aïn Témouchent" }, { code: "47", nom: "Ghardaïa" }, { code: "48", nom: "Relizane" },
  // Wilayas 49-58 — réforme administrative algérienne de 2019/2021
  { code: "49", nom: "Timimoun" },
  { code: "50", nom: "Bordj Badji Mokhtar" },
  { code: "51", nom: "Ouled Djellal" },
  { code: "52", nom: "Béni Abbès" },
  { code: "53", nom: "In Salah" },
  { code: "54", nom: "In Guezzam" },
  { code: "55", nom: "Touggourt" },
  { code: "56", nom: "Djanet" },
  { code: "57", nom: "El M'Ghair" },
  { code: "58", nom: "El Menia" },
]

// Chefs-lieux des wilayas 49-58 (pour COMMUNES_ALL non encore disponibles)
const NEW_WILAYAS_COMMUNES: Record<string, { nom: string; lat?: number; lng?: number }[]> = {
  "49": [{ nom: "Timimoun", lat: 29.263, lng: 0.230 }, { nom: "Charouine", lat: 29.016, lng: -0.274 }, { nom: "Aougrout", lat: 28.937, lng: 0.432 }],
  "50": [{ nom: "Bordj Badji Mokhtar", lat: 21.328, lng: 0.948 }, { nom: "Timiaouine", lat: 20.5, lng: 1.5 }],
  "51": [{ nom: "Ouled Djellal", lat: 34.424, lng: 5.063 }, { nom: "Sidi Khaled", lat: 34.379, lng: 4.981 }, { nom: "Ras El Miaad", lat: 34.5, lng: 5.3 }],
  "52": [{ nom: "Béni Abbès", lat: 30.129, lng: -2.166 }, { nom: "Kerzaz", lat: 29.458, lng: -1.442 }, { nom: "Beni Ounif", lat: 32.049, lng: -1.243 }],
  "53": [{ nom: "In Salah", lat: 27.196, lng: 2.463 }, { nom: "In Ghar", lat: 27.943, lng: 2.958 }, { nom: "Foggaret Ezzaouïa", lat: 27.369, lng: 2.883 }],
  "54": [{ nom: "In Guezzam", lat: 19.563, lng: 5.769 }, { nom: "Tin Zaouatine", lat: 21.143, lng: 2.922 }],
  "55": [{ nom: "Touggourt", lat: 33.099, lng: 6.060 }, { nom: "Megarine", lat: 33.249, lng: 6.117 }, { nom: "El Hadjira", lat: 32.965, lng: 5.504 }, { nom: "Temacine", lat: 33.055, lng: 6.055 }],
  "56": [{ nom: "Djanet", lat: 24.555, lng: 9.485 }, { nom: "Illizi", lat: 26.483, lng: 8.483 }],
  "57": [{ nom: "El M'Ghair", lat: 33.953, lng: 5.928 }, { nom: "Djamaa", lat: 33.534, lng: 5.995 }, { nom: "Sidi Amrane", lat: 33.502, lng: 6.354 }],
  "58": [{ nom: "El Menia", lat: 30.584, lng: 2.880 }, { nom: "Hassi Gara", lat: 29.972, lng: 3.488 }],
}


async function main() {
  console.log("Starting seed...")

  // Wilayas
  console.log("Seeding wilayas...")
  const wilayas: Record<string, string> = {}
  for (const w of WILAYAS) {
    const wilaya = await prisma.wilaya.upsert({
      where: { code: w.code },
      update: { nom: w.nom },
      create: { nom: w.nom, code: w.code },
    })
    wilayas[w.code] = wilaya.id
  }

  // Toutes les communes d'Algérie
  console.log("Seeding toutes les communes d'Algérie...")
  let totalCommunes = 0
  for (const [code, communes] of Object.entries(COMMUNES_ALL)) {
    const wilayadId = wilayas[code]
    if (!wilayadId) continue
    for (const c of communes) {
      const existing = await prisma.commune.findFirst({ where: { nom: c.nom, wilayadId } })
      if (!existing) {
        await prisma.commune.create({
          data: {
            nom: c.nom,
            wilayadId,
            latitude: c.lat ?? null,
            longitude: c.lng ?? null,
          },
        })
        totalCommunes++
      }
    }
  }
  console.log(`  ✓ ${totalCommunes} communes ajoutées`)

  // Communes des nouvelles wilayas 49-58 (non présentes dans COMMUNES_ALL)
  console.log("Seeding communes des wilayas 49-58...")
  let newWilayaCommunes = 0
  for (const [code, communes] of Object.entries(NEW_WILAYAS_COMMUNES)) {
    const wilayadId = wilayas[code]
    if (!wilayadId) continue
    for (const c of communes) {
      const existing = await prisma.commune.findFirst({ where: { nom: c.nom, wilayadId } })
      if (!existing) {
        await prisma.commune.create({
          data: { nom: c.nom, wilayadId, latitude: c.lat ?? null, longitude: c.lng ?? null },
        })
        newWilayaCommunes++
      }
    }
  }
  console.log(`  ✓ ${newWilayaCommunes} communes (wilayas 49-58) ajoutées`)

  // Symptômes
  console.log("Seeding symptômes...")
  for (const s of SYMPTOMS) {
    await prisma.symptome.upsert({
      where: { code: s.code },
      update: { nom: s.nom, categorie: s.categorie },
      create: { code: s.code, nom: s.nom, categorie: s.categorie },
    })
  }
  console.log(`  ✓ ${SYMPTOMS.length} symptômes`)

  // Germes BMR CIM-10
  console.log("Seeding germes BMR CIM-10...")
  for (const g of GERMES) {
    await prisma.germe.upsert({
      where: { nom: g.nom },
      update: { code: g.code, type: g.type, isActive: true },
      create: { code: g.code, nom: g.nom, type: g.type, isActive: true },
    })
  }
  console.log(`  ✓ ${GERMES.length} germes`)

  // 83 Maladies CIM-10
  console.log("Seeding 83 maladies CIM-10...")
  for (const m of MALADIES_SEED) {
    await prisma.maladie.upsert({
      where: { codeCim10: m.codeCim10 },
      update: {
        nom: m.nom, categorie: m.categorie, nomCourt: m.nomCourt,
        seuilDefaut: m.seuilDefaut, categorieGravite: m.categorieGravite,
        delaiNotificationHeures: m.delaiNotificationHeures,
        periodeDefautJours: (m as { periodeDefautJours?: number }).periodeDefautJours ?? null,
        hasFicheSpecifique: m.hasFicheSpecifique,
        ficheSpecifiqueSlug: (m as { ficheSpecifiqueSlug?: string }).ficheSpecifiqueSlug ?? null,
        groupeEpidemiologique: GROUPE_EPID_MAP[m.codeCim10] ?? null,
      },
      create: {
        nom: m.nom, codeCim10: m.codeCim10, categorie: m.categorie,
        nomCourt: m.nomCourt ?? null, seuilDefaut: m.seuilDefaut ?? null,
        categorieGravite: m.categorieGravite ?? null,
        delaiNotificationHeures: m.delaiNotificationHeures ?? null,
        periodeDefautJours: (m as { periodeDefautJours?: number }).periodeDefautJours ?? null,
        hasFicheSpecifique: m.hasFicheSpecifique,
        ficheSpecifiqueSlug: (m as { ficheSpecifiqueSlug?: string }).ficheSpecifiqueSlug ?? null,
        groupeEpidemiologique: GROUPE_EPID_MAP[m.codeCim10] ?? null,
        isActive: true,
      },
    })
  }

  // Etablissement EHU
  console.log("Seeding EHU Oran...")
  const oranId = wilayas["31"]
  const oranCommune = await prisma.commune.findFirst({ where: { nom: "Oran", wilayadId: oranId } })
  let ehu = await prisma.etablissement.findFirst({ where: { nom: "EHU Oran" } })
  if (!ehu) {
    ehu = await prisma.etablissement.create({
      data: { nom: "EHU Oran", type: "CHU", communeId: oranCommune?.id, wilayadId: oranId, adresse: "BP 4166 Ibn Rochd, Oran 31000" },
    })
  }

  // 30 Permissions
  console.log("Seeding 30 permissions...")
  const permissionIds: Record<string, string> = {}
  for (const p of PERMISSIONS_SEED) {
    const perm = await prisma.permission.upsert({
      where: { slug: p.slug },
      update: { name: p.name, module: p.module },
      create: { slug: p.slug, name: p.name, module: p.module },
    })
    permissionIds[p.slug] = perm.id
  }

  // 3 Roles
  console.log("Seeding 3 roles systeme...")
  const roleIds: Record<string, string> = {}
  for (const r of ROLES_SEED) {
    const role = await prisma.role.upsert({
      where: { slug: r.slug },
      update: { name: r.name, description: r.description, color: r.color },
      create: { name: r.name, slug: r.slug, description: r.description, color: r.color, isSystem: r.isSystem, isActive: true },
    })
    roleIds[r.slug] = role.id
    for (const permSlug of r.permissions) {
      const permId = permissionIds[permSlug]
      if (!permId) continue
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
        update: {},
        create: { roleId: role.id, permissionId: permId },
      })
    }
  }

  // Demo users
  console.log("Seeding demo users...")
  const adminHash = await bcrypt.hash("Admin@1234", 12)
  const admin = await prisma.user.upsert({
    where: { email: "admin@ehu-oran.dz" },
    update: {},
    create: { email: "admin@ehu-oran.dz", passwordHash: adminHash, firstName: "Admin", lastName: "Systeme", etablissementId: ehu.id, wilayadId: oranId, isActive: true },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: admin.id, roleId: roleIds["admin"] } },
    update: {}, create: { userId: admin.id, roleId: roleIds["admin"] },
  })

  const medecinHash = await bcrypt.hash("Medecin@1234", 12)
  const medecin = await prisma.user.upsert({
    where: { email: "medecin@ehu-oran.dz" },
    update: {},
    create: { email: "medecin@ehu-oran.dz", passwordHash: medecinHash, firstName: "Dr. Ahmed", lastName: "Benali", etablissementId: ehu.id, wilayadId: oranId, isActive: true },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: medecin.id, roleId: roleIds["medecin"] } },
    update: {}, create: { userId: medecin.id, roleId: roleIds["medecin"] },
  })

  const epidHash = await bcrypt.hash("Epidemio@1234", 12)
  const epid = await prisma.user.upsert({
    where: { email: "epidemio@ehu-oran.dz" },
    update: {},
    create: { email: "epidemio@ehu-oran.dz", passwordHash: epidHash, firstName: "Dr. Fatima", lastName: "Hadj", etablissementId: ehu.id, wilayadId: oranId, isActive: true },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: epid.id, roleId: roleIds["epidemiologiste"] } },
    update: {}, create: { userId: epid.id, roleId: roleIds["epidemiologiste"] },
  })

  const uistiHash = await bcrypt.hash("Uisti@2024", 12)
  const uisti = await prisma.user.upsert({
    where: { email: "uisti@ehu-oran.dz" },
    update: {},
    create: { email: "uisti@ehu-oran.dz", passwordHash: uistiHash, firstName: "Unité", lastName: "UISTI", etablissementId: ehu.id, wilayadId: oranId, isActive: true },
  })
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: uisti.id, roleId: roleIds["uisti"] } },
    update: {}, create: { userId: uisti.id, roleId: roleIds["uisti"] },
  })

  console.log("\nSeed complete!")
  console.log("  admin@ehu-oran.dz     / Admin@1234")
  console.log("  medecin@ehu-oran.dz   / Medecin@1234")
  console.log("  epidemio@ehu-oran.dz  / Epidemio@1234")
  console.log("  uisti@ehu-oran.dz     / Uisti@2024")
}

main().catch(console.error).finally(() => prisma.$disconnect())
