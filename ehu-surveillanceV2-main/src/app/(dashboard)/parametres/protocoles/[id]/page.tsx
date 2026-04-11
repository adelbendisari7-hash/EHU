import { notFound } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import ProtocoleForm from "@/components/protocoles/protocole-form"

export default async function EditProtocolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const protocole = await prisma.protocole.findUnique({
    where: { id },
    include: { maladie: true },
  })
  if (!protocole) notFound()

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parametres/protocoles" className="text-sm text-gray-400 hover:text-gray-600">← Protocoles</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Modifier — {protocole.maladie.nom}</h1>
      </div>
      <ProtocoleForm initial={{
        id: protocole.id,
        maladieId: protocole.maladieId,
        titre: protocole.titre,
        conduiteMedicale: protocole.conduiteMedicale as never,
        actionsAdministratives: protocole.actionsAdministratives as never,
        investigationSteps: protocole.investigationSteps as never,
        dureeSurveillance: protocole.dureeSurveillance?.toString() ?? "",
      }} />
    </div>
  )
}
