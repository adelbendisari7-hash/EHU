/**
 * Standalone script to create the UISTI role, permissions and user without reseeding everything.
 * Run: npm run db:seed:uisti
 */
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("Creating UISTI role and user...")

  const uistiPerms = [
    { slug: "uisti.morbidite", name: "Accéder à la morbidité hospitalière MDO", module: "uisti" },
    { slug: "uisti.mortalite", name: "Accéder au croisement mortalité-MDO", module: "uisti" },
  ]

  const permIds: Record<string, string> = {}
  for (const p of uistiPerms) {
    const perm = await prisma.permission.upsert({
      where: { slug: p.slug },
      update: { name: p.name, module: p.module },
      create: p,
    })
    permIds[p.slug] = perm.id
  }

  const role = await prisma.role.upsert({
    where: { slug: "uisti" },
    update: { name: "Unité UISTI", description: "Unité d'Information Sanitaire et Techniques Informatiques" },
    create: {
      name: "Unité UISTI",
      slug: "uisti",
      description: "Unité d'Information Sanitaire et Techniques Informatiques — accès aux données MDO hospitalisées",
      color: "#B45309",
      isSystem: true,
      isActive: true,
    },
  })

  for (const slug of Object.keys(permIds)) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permIds[slug] } },
      update: {},
      create: { roleId: role.id, permissionId: permIds[slug] },
    })
  }

  const ehu = await prisma.etablissement.findFirst({ where: { nom: "EHU Oran" } })
  const oranWilaya = await prisma.wilaya.findFirst({ where: { code: "31" } })

  const passwordHash = await bcrypt.hash("Uisti@2024", 12)
  const user = await prisma.user.upsert({
    where: { email: "uisti@ehu-oran.dz" },
    update: {},
    create: {
      email: "uisti@ehu-oran.dz",
      passwordHash,
      firstName: "Unité",
      lastName: "UISTI",
      etablissementId: ehu?.id ?? null,
      wilayadId: oranWilaya?.id ?? null,
      isActive: true,
    },
  })

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: {},
    create: { userId: user.id, roleId: role.id },
  })

  console.log("\n✓ UISTI setup complete")
  console.log("  Email    : uisti@ehu-oran.dz")
  console.log("  Password : Uisti@2024")
  console.log("\n  API Endpoints:")
  console.log("  GET  /api/uisti/patients   — morbidité hospitalière MDO")
  console.log("  GET  /api/uisti/mortalite  — croisement MDO → mortalité + taux de létalité")
  console.log("  POST /api/uisti/mortalite  — signaler un décès MDO non déclaré (génère une alerte)")
}

main()
  .catch(e => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
