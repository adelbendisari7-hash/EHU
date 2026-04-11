"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { isRedirectError } from "next/dist/client/components/redirect-error"

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "Email et mot de passe requis." }
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    })
    return { success: true, error: null }
  } catch (error) {
    if (isRedirectError(error)) {
      // signIn with redirect:false shouldn't redirect, but just in case
      return { success: true, error: null }
    }
    if (error instanceof AuthError) {
      return { success: false, error: "Email ou mot de passe incorrect." }
    }
    console.error("Login error:", error)
    return { success: false, error: "Erreur serveur. Veuillez réessayer." }
  }
}
