"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { cn } from "@/utils/cn"
import { Eye, EyeOff, AlertCircle, Loader2, Shield } from "lucide-react"
import { loginAction } from "./actions"

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
    const formData = new FormData()
    formData.append("email", data.email)
    formData.append("password", data.password)
    const result = await loginAction(formData)
    if (result.success) {
      window.location.href = "/dashboard"
      return
    }
    setError(result.error || "Une erreur est survenue.")
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden" style={{ backgroundColor: "#0F1A2E" }}>
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full opacity-10" style={{ background: "radial-gradient(circle, #1B4F8A 0%, transparent 70%)" }} />

      <div className="w-full max-w-[380px] relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 relative" style={{ background: "linear-gradient(135deg, #1B4F8A 0%, #2563EB 100%)" }}>
            <Shield size={24} className="text-white" />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10" />
          </div>
          <h1 className="text-[22px] font-bold text-white tracking-tight">Bienvenue</h1>
          <p className="text-[13px] text-white/40 mt-1">Système de Surveillance Épidémiologique — EHU Oran</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.06] backdrop-blur-xl rounded-2xl border border-white/10 p-7 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Email institutionnel
              </label>
              <input
                {...register("email")}
                type="email"
                placeholder="prenom.nom@ehu-oran.dz"
                autoComplete="email"
                className={cn(
                  "w-full h-10 px-3 rounded-lg text-[13px] outline-none transition-all",
                  "bg-white/[0.07] border border-white/10 text-white placeholder:text-white/25",
                  "focus:border-white/25 focus:bg-white/[0.09] focus:ring-1 focus:ring-white/10",
                  errors.email && "border-red-400/60 bg-red-500/5"
                )}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12px] font-medium text-white/60 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  {...register("password")}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className={cn(
                    "w-full h-10 px-3 pr-10 rounded-lg text-[13px] outline-none transition-all",
                    "bg-white/[0.07] border border-white/10 text-white placeholder:text-white/25",
                    "focus:border-white/25 focus:bg-white/[0.09] focus:ring-1 focus:ring-white/10",
                    errors.password && "border-red-400/60 bg-red-500/5"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
                  <AlertCircle size={11} />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 p-3 rounded-lg bg-red-500/10 border border-red-400/20">
                <AlertCircle size={14} className="text-red-400 shrink-0" />
                <p className="text-[13px] text-red-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                "w-full h-11 rounded-lg text-white text-[13px] font-semibold transition-all",
                "bg-[#1B4F8A] hover:bg-[#2563EB] active:bg-[#1D4ED8]",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "flex items-center justify-center gap-2",
                "shadow-lg shadow-blue-500/10"
              )}
            >
              {loading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Connexion...
                </>
              ) : (
                "Se Connecter"
              )}
            </button>

            <div className="text-center">
              <a href="/forgot-password" className="text-[12px] text-white/35 hover:text-white/60 transition-colors">
                Mot de passe oublié ?
              </a>
            </div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-white/20 mt-6">
          EHU Oran — Surveillance des Maladies à Déclaration Obligatoire
        </p>
      </div>
    </div>
  )
}
