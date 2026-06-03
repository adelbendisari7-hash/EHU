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

interface WilayaStat {
  id: string
  code: string
  nom: string
  count: number
}

// Precise coordinates of each wilaya's administrative capital
const WILAYA_CENTROIDS: Record<string, [number, number]> = {
  "01": [27.87, -0.29],  // Adrar
  "02": [36.16,  1.33],  // Chlef
  "03": [33.80,  2.87],  // Laghouat
  "04": [35.88,  7.11],  // Oum El Bouaghi
  "05": [35.56,  6.17],  // Batna
  "06": [36.75,  5.06],  // Béjaïa
  "07": [34.85,  5.73],  // Biskra
  "08": [31.62, -2.22],  // Béchar
  "09": [36.47,  2.82],  // Blida
  "10": [36.37,  3.90],  // Bouira
  "11": [22.79,  5.52],  // Tamanrasset
  "12": [35.40,  8.12],  // Tébessa
  "13": [34.88, -1.32],  // Tlemcen
  "14": [35.37,  1.32],  // Tiaret
  "15": [36.72,  4.05],  // Tizi Ouzou
  "16": [36.74,  3.09],  // Alger
  "17": [34.67,  3.26],  // Djelfa
  "18": [36.82,  5.77],  // Jijel
  "19": [36.19,  5.41],  // Sétif
  "20": [34.83,  0.15],  // Saïda
  "21": [36.88,  6.91],  // Skikda
  "22": [35.19, -0.63],  // Sidi Bel Abbès
  "23": [36.90,  7.77],  // Annaba
  "24": [36.46,  7.43],  // Guelma
  "25": [36.37,  6.61],  // Constantine
  "26": [36.26,  2.75],  // Médéa
  "27": [35.93,  0.09],  // Mostaganem
  "28": [35.71,  4.54],  // M'Sila
  "29": [35.40,  0.14],  // Mascara
  "30": [31.95,  5.32],  // Ouargla
  "31": [35.69, -0.64],  // Oran
  "32": [33.68,  1.02],  // El Bayadh
  "33": [26.50,  8.47],  // Illizi
  "34": [36.07,  4.76],  // Bordj Bou Arréridj
  "35": [36.77,  3.48],  // Boumerdès
  "36": [36.77,  8.31],  // El Tarf
  "37": [27.67, -8.14],  // Tindouf
  "38": [35.61,  1.81],  // Tissemsilt
  "39": [33.36,  6.87],  // El Oued
  "40": [35.44,  7.14],  // Khenchela
  "41": [36.29,  7.95],  // Souk Ahras
  "42": [36.59,  2.45],  // Tipaza
  "43": [36.45,  6.27],  // Mila
  "44": [36.27,  1.97],  // Aïn Defla
  "45": [33.27, -0.31],  // Naâma
  "46": [35.30, -1.14],  // Aïn Témouchent
  "47": [32.49,  3.67],  // Ghardaïa
  "48": [35.74,  0.56],  // Relizane
}

function getChoroplethColor(count: number, max: number): string {
  if (count === 0 || max === 0) return "#94A3B8"
  const ratio = count / max
  if (ratio < 0.15) return "#22C55E"
  if (ratio < 0.35) return "#84CC16"
  if (ratio < 0.55) return "#F59E0B"
  if (ratio < 0.75) return "#F97316"
  return "#EF4444"
}

function getMarkerColor(statut: string): string {
  const colors: Record<string, string> = {
    nouveau: "#3A7BD5", en_cours: "#F39C12",
    confirme: "#E74C3C", infirme: "#27AE60", cloture: "#7F8C8D",
  }
  return colors[statut] ?? "#3A7BD5"
}

interface Props {
  markers: Marker[]
  wilayaStats: WilayaStat[]
  selectedWilayadIds: string[]
  allWilayas?: Array<{ id: string; code: string }>
}

export default function EpidemicMap({ markers, wilayaStats, selectedWilayadIds, allWilayas }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<unknown>(null)
  const layersRef = useRef<unknown[]>([])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeRemoveMap = (m: any) => {
    if (!m) return
    try { m.stop() } catch { /* ignore */ }
    try { m.off() } catch { /* ignore */ }
    try { m.remove() } catch { /* ignore */ }
  }

  useEffect(() => {
    if (!mapRef.current) return
    let destroyed = false

    import("leaflet").then((L) => {
      if (destroyed || !mapRef.current) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if ((mapRef.current as any)._leaflet_id) {
        safeRemoveMap(mapInstanceRef.current)
        mapInstanceRef.current = null
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const initialCenter: [number, number] = selectedWilayadIds.length === 1 && allWilayas
        ? (() => {
            const w = allWilayas.find(w => w.id === selectedWilayadIds[0])
            return (w && WILAYA_CENTROIDS[w.code]) ? WILAYA_CENTROIDS[w.code] : [28.0, 2.7]
          })()
        : [28.0, 2.7]
      const initialZoom = selectedWilayadIds.length === 1 ? 9 : 5
      const map = L.map(mapRef.current, { zoomControl: true }).setView(initialCenter, initialZoom)
      mapInstanceRef.current = map
      layersRef.current = []

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: "abcd",
        maxZoom: 19,
        opacity: 0.9,
      }).addTo(map)

      // ── Wilaya choropleth circles ─────────────────────────────────────────
      const maxCount = Math.max(...wilayaStats.map(w => w.count), 1)
      const wilayaById = Object.fromEntries(wilayaStats.map(w => [w.id, w]))
      const selectedSet = new Set(selectedWilayadIds)
      const hasSelection = selectedWilayadIds.length > 0

      // Build a lookup: code → wilayaStat
      const wilayaByCode = Object.fromEntries(wilayaStats.map(w => [w.code, w]))

      Object.entries(WILAYA_CENTROIDS).forEach(([code, [lat, lng]]) => {
        const stat = wilayaByCode[code] ?? wilayaByCode[String(parseInt(code, 10))]
        if (!stat || stat.count === 0) return

        const count = stat.count
        const nom = stat.nom
        const isSelected = selectedSet.has(stat.id)
        const isFiltered = hasSelection && !isSelected

        const color = getChoroplethColor(count, maxCount)
        const radius = 14

        const circle = L.circleMarker([lat, lng], {
          radius,
          fillColor: color,
          color: isSelected ? "#1B4F8A" : "white",
          weight: isSelected ? 3 : 1.5,
          opacity: isFiltered ? 0.3 : 1,
          fillOpacity: isFiltered ? 0.15 : 0.82,
        })

        const popupHtml = `
          <div style="font-size:12px;min-width:140px;padding:2px">
            <p style="font-weight:600;color:#1B4F8A;margin:0 0 4px">${nom}</p>
            <p style="color:#374151;margin:0">${count} cas déclarés</p>
            ${isSelected ? '<p style="color:#1B4F8A;font-size:11px;margin:4px 0 0">✓ Filtre actif</p>' : ""}
          </div>
        `
        circle.bindTooltip(nom, { permanent: false, direction: "top", className: "leaflet-tooltip-custom" })
        circle.bindPopup(popupHtml)
        circle.addTo(map)
        layersRef.current.push(circle)
      })

      // ── Case markers (individual cases with coords) ───────────────────────
      markers.forEach(marker => {
        const color = getMarkerColor(marker.statut)
        const dot = L.circleMarker([marker.lat, marker.lng], {
          radius: 5,
          fillColor: color,
          color: "#fff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9,
        })
        dot.bindPopup(`
          <div style="font-size:12px;min-width:150px">
            <strong style="color:#1B4F8A">${marker.maladie}</strong><br/>
            <span style="color:#666">${marker.commune}</span><br/>
            <span style="color:#999">${new Date(marker.date).toLocaleDateString("fr-FR")}</span>
          </div>
        `)
        dot.addTo(map)
        layersRef.current.push(dot)
      })

      // Auto-zoom already handled in initialCenter/initialZoom above
    })

    return () => {
      destroyed = true
      safeRemoveMap(mapInstanceRef.current)
      mapInstanceRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [markers, wilayaStats, selectedWilayadIds, allWilayas])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden">
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} style={{ width: "100%", height: "100%", minHeight: "320px" }} />

      {/* Legend */}
      {wilayaStats.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md border border-gray-200 z-[1000]">
          <p className="text-[10px] font-semibold text-gray-600 mb-1.5">Cas déclarés</p>
          <div className="flex items-center gap-1.5">
            {[["#22C55E","Faible"],["#F59E0B","Moyen"],["#EF4444","Élevé"]].map(([c,l]) => (
              <div key={l} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                <span className="text-[10px] text-gray-500">{l}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {wilayaStats.length === 0 && markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50/80 rounded-xl pointer-events-none">
          <p className="text-sm text-gray-400">Aucune donnée géographique</p>
        </div>
      )}
    </div>
  )
}
