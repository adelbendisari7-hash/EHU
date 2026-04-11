import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import UserManagement from "@/components/utilisateurs/user-management"

export default async function UtilisateursPage() {
  const session = await auth()
  if (session?.user.role !== "admin") redirect("/dashboard")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { etablissement: { select: { nom: true } }, wilaya: { select: { nom: true } } },
  })

  const etablissements = await prisma.etablissement.findMany({ orderBy: { nom: "asc" }, select: { id: true, nom: true } })
  const wilayas = await prisma.wilaya.findMany({ orderBy: { code: "asc" }, select: { id: true, nom: true, code: true } })

  return <UserManagement initialUsers={users as never} etablissements={etablissements} wilayas={wilayas} />
}
