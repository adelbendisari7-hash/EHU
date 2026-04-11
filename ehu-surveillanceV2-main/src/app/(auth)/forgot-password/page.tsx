export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "linear-gradient(135deg, #E8F0FE 0%, #ffffff 100%)" }}>
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-semibold text-gray-800 mb-2">Mot de passe oublié</h1>
        <p className="text-sm text-gray-500 mb-6">Contactez votre administrateur système pour réinitialiser votre mot de passe.</p>
        <a href="/login" className="text-sm text-[#1B4F8A] hover:underline">← Retour à la connexion</a>
      </div>
    </div>
  )
}
