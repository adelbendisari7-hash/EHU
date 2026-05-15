"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { cn } from "@/utils/cn"
import { Eye, EyeOff, AlertCircle, Loader2, Shield } from "lucide-react"

const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Minimum 8 caractères"),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError(null)
    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })
      if (result?.ok) {
        window.location.href = "/dashboard"
        return
      }
      setError("Email ou mot de passe incorrect.")
    } catch {
      setError("Erreur serveur. Veuillez réessayer.")
    }
    setLoading(false)
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: "#0D1B2E" }}
    >
      {/* Background grid pattern */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Gradient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(27,79,138,0.18) 0%, transparent 65%)" }}
      />

      <div className="w-full max-w-[400px] relative">
        {/* Logo + Title */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 relative"
            style={{ background: "linear-gradient(140deg, #1B4F8A 0%, #2563EB 100%)", boxShadow: "0 8px 24px rgba(27,79,138,0.35)" }}
          >
            <Shield size={26} className="text-white" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/15" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bienvenue</h1>
          <p className="text-[14px] mt-1.5 text-center max-w-[280px] leading-snug" style={{ color: "rgba(255,255,255,0.52)" }}>
            Système de Surveillance Épidémiologique — EHU Oran
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-7"
          style={{
            backgroundColor: "rgba(255,255,255,0.07)",
            borderColor: "rgba(255,255,255,0.12)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 48px rgba(0,0,0,0.3)",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                Email institutionnel
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="prenom.nom@ehu-oran.dz"
                autoComplete="email"
                className={cn(
                  "w-full h-11 px-3.5 rounded-lg text-[14px] outline-none transition-all",
                  "text-white",
                  errors.email && "border-red-400/60"
                )}
                style={{
                  backgroundColor: errors.email ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.08)",
                  border: `1px solid ${errors.email ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.14)"}`,
                  color: "#fff",
                }}
                onFocus={e => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)"
                  e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.10)"
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = errors.email ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.14)"
                  e.currentTarget.style.backgroundColor = errors.email ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.08)"
                }}
              />
              {errors.email && (
                <p className="text-[13px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>
                Mot de passe
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    "w-full h-11 px-3.5 pr-11 rounded-lg text-[14px] outline-none transition-all text-white"
                  )}
                  style={{
                    backgroundColor: errors.password ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${errors.password ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.14)"}`,
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)"
                    e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.10)"
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = errors.password ? "rgba(248,113,113,0.5)" : "rgba(255,255,255,0.14)"
                    e.currentTarget.style.backgroundColor = errors.password ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.08)"
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: "rgba(255,255,255,0.40)" }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-[13px] text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={12} />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error alert */}
            {error && (
              <div
                className="flex items-center gap-2.5 p-3.5 rounded-lg"
                style={{
                  backgroundColor: "rgba(220,38,38,0.12)",
                  border: "1px solid rgba(248,113,113,0.25)",
                }}
              >
                <AlertCircle size={15} className="text-red-400 shrink-0" />
                <p className="text-[14px] text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-white text-[14px] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                backgroundColor: "#1B4F8A",
                boxShadow: "0 4px 14px rgba(27,79,138,0.35)",
              }}
              onMouseOver={e => !loading && (e.currentTarget.style.backgroundColor = "#2563EB")}
              onMouseOut={e => !loading && (e.currentTarget.style.backgroundColor = "#1B4F8A")}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                "Se Connecter"
              )}
            </button>

            <div className="text-center">
              <a
                href="/forgot-password"
                className="text-[13px] transition-colors"
                style={{ color: "rgba(255,255,255,0.45)" }}
                onMouseOver={e => (e.currentTarget.style.color = "rgba(255,255,255,0.70)")}
                onMouseOut={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              >
                Mot de passe oublié ?
              </a>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[12px] mt-6" style={{ color: "rgba(255,255,255,0.30)" }}>
          EHU Oran — Surveillance des Maladies à Déclaration Obligatoire
        </p>
      </div>
    </div>
  )
}
