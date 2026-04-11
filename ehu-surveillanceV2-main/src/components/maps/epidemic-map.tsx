"use client"

import { useEffect, useRef } from "react"

interface Marker {
  id: string
  lat: number
  lng: number
  statut: string
  maladie: string
  commune: string
  date: string
}

const STATUT_COLORS: Record<string, string> = {
  nouveau: "#3A7BD5",
  en_cours: "#F39C12",
  confirme: "#E74C3C",
  infirme: "#27AE60",
  cloture: "#7F8C8D",
}

export default function EpidemicMap({ markers }: { markers: Marker[] }) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)

  useEffect(() => {
    if (!mapRef.current) return

    let destroyed = false

    import("leaflet").then((L) => {
      if (destroyed || !mapRef.current) return

      // If container already has a map instance, remove it first
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapInstanceRef.current as any)?.remove()
        mapInstanceRef.current = null
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const map = L.map(mapRef.current).setView([35.6969, -0.6331], 10)
      mapInstanceRef.current = map

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map)

      markers.forEach(marker => {
        const color = STATUT_COLORS[marker.statut] ?? "#3A7BD5"
        const circle = L.circleMarker([marker.lat, marker.lng], {
          radius: 8,
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85,
        })
        circle.bindPopup(`
          <div style="font-size:12px;min-width:150px">
            <strong style="color:#1B4F8A">${marker.maladie}</strong><br/>
            <span style="color:#666">${marker.commune}</span><br/>
            <span style="color:#999">${new Date(marker.date).toLocaleDateString("fr-FR")}</span>
          </div>
        `)
        circle.addTo(map)
      })
    })

    return () => {
      destroyed = true
      if (mapInstanceRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(mapInstanceRef.current as any).remove()
        mapInstanceRef.current = null
      }
    }
  }, [markers])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "320px" }} />
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-xl">
          <p className="text-sm text-gray-400">Aucun cas géolocalisé</p>
        </div>
      )}
    </div>
  )
}
