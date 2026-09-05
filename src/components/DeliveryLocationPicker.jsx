import { useState, useEffect, useRef } from 'react'

export default function DeliveryLocationPicker({ onSelectLocation, currentAddress }) {
  const [loading, setLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState('')
  const [coords, setCoords] = useState({ lat: 19.0760, lng: 72.8777 }) // Default: Mumbai / Cafe Downtown
  const [addressDetail, setAddressDetail] = useState(currentAddress || '')
  const [mapLoaded, setMapLoaded] = useState(false)
  const mapRef = useRef(null)
  const leafletInstanceRef = useRef(null)
  const markerRef = useRef(null)

  // Reverse geocode coordinates to street address using OpenStreetMap Nominatim API
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        { headers: { 'Accept-Language': 'en' } }
      )
      if (!response.ok) return null
      const data = await response.json()
      
      if (data && data.address) {
        const road = data.address.road || data.address.pedestrian || data.address.suburb || ''
        const neighbourhood = data.address.neighbourhood || data.address.residential || data.address.suburb || ''
        const city = data.address.city || data.address.town || data.address.village || data.address.county || ''
        const state = data.address.state || ''
        const postcode = data.address.postcode || ''
        
        const street = [road, neighbourhood].filter(Boolean).join(', ')
        const formattedAddress = data.display_name || `${street}, ${city}`

        return {
          address: street || formattedAddress.split(',')[0],
          city: city || state,
          zip: postcode || '',
          fullAddress: formattedAddress,
        }
      }
    } catch (err) {
      console.warn('Reverse geocoding error:', err)
    }
    return null
  }

  // Handle position update from live GPS or map drag
  const handleLocationUpdate = async (lat, lng, sourceLabel = 'Map selection') => {
    setCoords({ lat, lng })
    setLoading(true)
    setLocationStatus(`Fetching address for ${sourceLabel}...`)

    const geocoded = await reverseGeocode(lat, lng)
    setLoading(false)

    if (geocoded) {
      setAddressDetail(geocoded.fullAddress)
      setLocationStatus(`📍 Selected: ${geocoded.address}, ${geocoded.city}`)
      if (onSelectLocation) {
        onSelectLocation({
          address: geocoded.address || geocoded.fullAddress,
          city: geocoded.city,
          zip: geocoded.zip,
          lat,
          lng,
        })
      }
    } else {
      setLocationStatus(`📍 Selected coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`)
      if (onSelectLocation) {
        onSelectLocation({
          address: `${lat.toFixed(5)}, ${lng.toFixed(5)}`,
          city: '',
          zip: '',
          lat,
          lng,
        })
      }
    }
  }

  // Load Leaflet dynamically from CDN if not present
  useEffect(() => {
    if (window.L) {
      setMapLoaded(true)
      return
    }

    const cssLink = document.createElement('link')
    cssLink.rel = 'stylesheet'
    cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(cssLink)

    const script = document.createElement('script')
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
    script.onload = () => setMapLoaded(true)
    document.body.appendChild(script)
  }, [])

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || leafletInstanceRef.current) return

    const L = window.L
    const initialLat = coords.lat
    const initialLng = coords.lng

    const map = L.map(mapRef.current).setView([initialLat, initialLng], 14)
    leafletInstanceRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(map)

    // Custom Marker Icon
    const customIcon = L.divIcon({
      className: 'custom-map-pin',
      html: `<div class="relative flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white shadow-xl shadow-orange-500/50 ring-4 ring-white transition-transform hover:scale-110">
               <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
               </svg>
             </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    })

    const marker = L.marker([initialLat, initialLng], { draggable: true, icon: customIcon }).addTo(map)
    markerRef.current = marker

    marker.on('dragend', () => {
      const position = marker.getLatLng()
      handleLocationUpdate(position.lat, position.lng, 'Pin placement')
    })

    map.on('click', (e) => {
      const { lat, lng } = e.latlng
      marker.setLatLng([lat, lng])
      handleLocationUpdate(lat, lng, 'Map click')
    })
  }, [mapLoaded])

  // Get current HTML5 Geolocation
  const detectLiveLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolocation is not supported by your browser.')
      return
    }

    setLoading(true)
    setLocationStatus('Locating your GPS position...')

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        setCoords({ lat: latitude, lng: longitude })

        if (leafletInstanceRef.current && markerRef.current) {
          const L = window.L
          leafletInstanceRef.current.setView([latitude, longitude], 16)
          markerRef.current.setLatLng([latitude, longitude])
        }

        handleLocationUpdate(latitude, longitude, 'GPS Location')
      },
      (error) => {
        setLoading(false)
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationStatus('Location permission denied. Please click on the map to set your address.')
            break
          case error.POSITION_UNAVAILABLE:
            setLocationStatus('Location unavailable. Please select your location on the map.')
            break
          case error.TIMEOUT:
            setLocationStatus('Location request timed out. Please select location manually.')
            break
          default:
            setLocationStatus('Could not detect location. Please click on the map.')
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            📍 Delivery Location Map
          </h3>
          <p className="text-xs text-slate-500">
            Click on the map or use live GPS to pin your exact delivery address
          </p>
        </div>

        <button
          type="button"
          onClick={detectLiveLocation}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:bg-orange-700 active:scale-95 disabled:opacity-50"
        >
          {loading ? (
            <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
          {loading ? 'Detecting...' : 'Use My Live GPS Location'}
        </button>
      </div>

      {/* Interactive Map Container */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 shadow-inner">
        <div ref={mapRef} className="h-64 w-full bg-slate-200" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/90 text-sm font-semibold text-slate-600">
            Loading interactive map...
          </div>
        )}
      </div>

      {/* Location Status & Address Readout */}
      {locationStatus && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-3 text-xs font-semibold text-orange-900">
          {locationStatus}
        </div>
      )}
      
      {addressDetail && (
        <p className="text-xs text-slate-600">
          <strong className="text-slate-800">Selected location:</strong> {addressDetail}
        </p>
      )}
    </div>
  )
}
