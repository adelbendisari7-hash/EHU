import type { Metadata } from "next"
import { IBM_Plex_Sans } from "next/font/google"
import Providers from "./providers"
import "./globals.css"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-sans",
  display: "swap",
})

export const metadata: Metadata = {
  title: "EHU Oran — Surveillance Épidémiologique",
  description: "Système de surveillance des maladies à déclaration obligatoire",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className={ibmPlexSans.variable}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
