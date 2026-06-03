import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()
async function main() {
  const roles = await prisma.role.findMany({ select: { slug: true, name: true, isActive: true } })
  console.log("Rôles en base:")
  roles.forEach(r => console.log(`  - ${r.slug} | ${r.name} | actif: ${r.isActive}`))
  const perms = await prisma.permission.findMany({ where: { module: "uhh" }, select: { slug: true, name: true } })
  console.log("Permissions UHH:")
  perms.forEach(p => console.log(`  - ${p.slug}`))
}
main().finally(() => prisma.$disconnect())
