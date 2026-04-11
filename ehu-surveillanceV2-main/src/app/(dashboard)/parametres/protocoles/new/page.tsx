import Link from "next/link"
import ProtocoleForm from "@/components/protocoles/protocole-form"

export default function NewProtocolePage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/parametres/protocoles" className="text-sm text-gray-400 hover:text-gray-600">← Protocoles</Link>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-800">Nouveau Protocole</h1>
      </div>
      <ProtocoleForm />
    </div>
  )
}
