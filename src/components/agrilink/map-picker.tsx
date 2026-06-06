'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Navigation, Search, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// India center coordinates
const INDIA_CENTER: [number, number] = [20.5937, 78.9629]
const INDIA_ZOOM = 5

interface MapPickerProps {
  latitude?: string
  longitude?: string
  address?: string
  onLocationSelect: (data: { latitude: string; longitude: string; address: string }) => void
  label?: string
  markerColor?: string
  height?: string
}

// The actual map component that uses Leaflet dynamically
function MapComponent({
  latitude,
  longitude,
  onLocationSelect,
  markerColor = '#10b981',
  height = '280px',
}: {
  latitude?: string
  longitude?: string
  onLocationSelect: (data: { latitude: string; longitude: string; address: string }) => void
  markerColor?: string
  height?: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [leafletLoaded, setLeafletLoaded] = useState(false)

  useEffect(() => {
    // Dynamic import of Leaflet (client-side only)
    const loadLeaflet = async () => {
      try {
        const L = (await import('leaflet')).default

        // Fix default icon issue in webpack
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        if (!mapRef.current || mapInstanceRef.current) return

        const lat = latitude ? parseFloat(latitude) : INDIA_CENTER[0]
        const lng = longitude ? parseFloat(longitude) : INDIA_CENTER[1]
        const zoom = latitude && longitude ? 12 : INDIA_ZOOM

        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom,
          zoomControl: true,
          scrollWheelZoom: true,
        })

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19,
        }).addTo(map)

        // Custom colored marker
        const customIcon = L.divIcon({
          className: 'custom-marker',
          html: `<div style="width:28px;height:28px;border-radius:50% 50% 50% 0;background:${markerColor};transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:8px;height:8px;border-radius:50%;background:white;transform:rotate(45deg);"></div></div>`,
          iconSize: [28, 28],
          iconAnchor: [14, 28],
        })

        // Add marker if coordinates exist
        if (latitude && longitude) {
          markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map)
        }

        // Click to place marker
        map.on('click', async (e: any) => {
          const { lat, lng } = e.latlng

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng])
          } else {
            markerRef.current = L.marker([lat, lng], { icon: customIcon }).addTo(map)
          }

          // Reverse geocode to get address
          try {
            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressformats=1&accept-language=en`)
            const data = await res.json()
            const address = data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`
            onLocationSelect({ latitude: lat.toFixed(6), longitude: lng.toFixed(6), address })
          } catch {
            onLocationSelect({ latitude: lat.toFixed(6), longitude: lng.toFixed(6), address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` })
          }
        })

        mapInstanceRef.current = map
        setLeafletLoaded(true)
      } catch (err) {
        console.error('Failed to load Leaflet:', err)
      }
    }

    loadLeaflet()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
        markerRef.current = null
      }
    }
  }, [])

  // Update marker position when props change
  useEffect(() => {
    if (!mapInstanceRef.current || !latitude || !longitude) return
    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)
    if (isNaN(lat) || isNaN(lng)) return

    mapInstanceRef.current.setView([lat, lng], 12)

    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    }
  }, [latitude, longitude])

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ height }}>
      {!leafletLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/5 z-10">
          <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
        </div>
      )}
      <div ref={mapRef} className="w-full h-full" style={{ minHeight: height }} />
    </div>
  )
}

// Search location using Nominatim
async function searchLocation(query: string): Promise<Array<{ lat: number; lon: number; display_name: string }>> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=in&limit=5`)
    return await res.json()
  } catch {
    return []
  }
}

export function MapPicker({
  latitude,
  longitude,
  address,
  onLocationSelect,
  label = 'Select Location',
  markerColor = '#10b981',
  height = '280px',
}: MapPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ lat: number; lon: number; display_name: string }>>([])
  const [searching, setSearching] = useState(false)
  const [showResults, setShowResults] = useState(false)

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return
    setSearching(true)
    setShowResults(true)
    try {
      const results = await searchLocation(searchQuery)
      setSearchResults(results)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  const handleSelectResult = (result: { lat: number; lon: number; display_name: string }) => {
    onLocationSelect({
      latitude: result.lat.toFixed(6),
      longitude: result.lon.toFixed(6),
      address: result.display_name,
    })
    setSearchQuery('')
    setShowResults(false)
    setSearchResults([])
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
        {label}
      </Label>

      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search for a location in India..."
            className="pl-9 h-9 bg-white/5 border-white/10 text-sm"
          />
        </div>
        <Button
          size="sm"
          variant="outline"
          className="h-9 border-white/10 hover:bg-white/5"
          onClick={handleSearch}
          disabled={searching}
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* Search Results Dropdown */}
      {showResults && searchResults.length > 0 && (
        <div className="glass-card p-2 space-y-1 max-h-48 overflow-y-auto">
          {searchResults.map((result, idx) => (
            <button
              key={idx}
              className="w-full text-left p-2 rounded-lg hover:bg-white/5 text-xs text-foreground transition-colors"
              onClick={() => handleSelectResult(result)}
            >
              <MapPin className="w-3 h-3 text-emerald-400 inline mr-1.5" />
              {result.display_name}
            </button>
          ))}
        </div>
      )}

      {/* Map */}
      <MapComponent
        latitude={latitude}
        longitude={longitude}
        onLocationSelect={onLocationSelect}
        markerColor={markerColor}
        height={height}
      />

      {/* Current coordinates display */}
      {latitude && longitude && (
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <Navigation className="w-3 h-3 text-emerald-400" />
          <span>{parseFloat(latitude).toFixed(4)}°N, {parseFloat(longitude).toFixed(4)}°E</span>
        </div>
      )}

      {/* Current address display */}
      {address && (
        <div className="text-xs text-muted-foreground bg-white/5 p-2 rounded-lg">
          <MapPin className="w-3 h-3 text-emerald-400 inline mr-1" />
          {address}
        </div>
      )}
    </div>
  )
}

// A simpler read-only map display component
export function LocationMap({
  latitude,
  longitude,
  address,
  pickupLat,
  pickupLng,
  dropLat,
  dropLng,
  height = '200px',
}: {
  latitude?: string
  longitude?: string
  address?: string
  pickupLat?: string
  pickupLng?: string
  dropLat?: string
  dropLng?: string
  height?: string
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)

  useEffect(() => {
    const loadMap = async () => {
      try {
        const L = (await import('leaflet')).default
        delete (L.Icon.Default.prototype as any)._getIconUrl
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        })

        if (!mapRef.current || mapInstanceRef.current) return

        const lat = latitude ? parseFloat(latitude) : INDIA_CENTER[0]
        const lng = longitude ? parseFloat(longitude) : INDIA_CENTER[1]
        const hasCoords = latitude && longitude
        const zoom = hasCoords ? 12 : INDIA_ZOOM

        const map = L.map(mapRef.current, {
          center: [lat, lng],
          zoom,
          zoomControl: false,
          scrollWheelZoom: false,
          dragging: false,
        })

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map)

        // Single location marker
        if (hasCoords && !pickupLat) {
          const icon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#10b981;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:6px;height:6px;border-radius:50%;background:white;transform:rotate(45deg);"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          })
          L.marker([lat, lng], { icon }).addTo(map)
        }

        // Pickup + Drop markers with route line
        if (pickupLat && pickupLng && dropLat && dropLng) {
          const pLat = parseFloat(pickupLat)
          const pLng = parseFloat(pickupLng)
          const dLat = parseFloat(dropLat)
          const dLng = parseFloat(dropLng)

          const pickupIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#10b981;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:6px;height:6px;border-radius:50%;background:white;transform:rotate(45deg);"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          })
          const dropIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="width:24px;height:24px;border-radius:50% 50% 50% 0;background:#ef4444;transform:rotate(-45deg);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;"><div style="width:6px;height:6px;border-radius:50%;background:white;transform:rotate(45deg);"></div></div>`,
            iconSize: [24, 24],
            iconAnchor: [12, 24],
          })

          L.marker([pLat, pLng], { icon: pickupIcon }).addTo(map).bindPopup('Pickup Location')
          L.marker([dLat, dLng], { icon: dropIcon }).addTo(map).bindPopup('Drop-off Location')

          // Route line
          L.polyline([[pLat, pLng], [dLat, dLng]], {
            color: '#10b981',
            weight: 2,
            opacity: 0.6,
            dashArray: '6 4',
          }).addTo(map)

          // Fit bounds to show both markers
          map.fitBounds([[pLat, pLng], [dLat, dLng]], { padding: [40, 40] })
        }

        mapInstanceRef.current = map
      } catch (err) {
        console.error('Failed to load map:', err)
      }
    }

    loadMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [latitude, longitude, pickupLat, pickupLng, dropLat, dropLng])

  return (
    <div className="space-y-2">
      <div className="rounded-xl overflow-hidden border border-white/10" style={{ height }}>
        <div ref={mapRef} className="w-full h-full" style={{ minHeight: height }} />
      </div>
      {address && (
        <p className="text-xs text-muted-foreground">
          <MapPin className="w-3 h-3 text-emerald-400 inline mr-1" />
          {address}
        </p>
      )}
    </div>
  )
}
