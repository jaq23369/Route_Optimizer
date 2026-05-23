import { useRef, useCallback, useEffect, useState, useMemo } from 'react'
import { GoogleMap, MarkerF, PolylineF } from '@react-google-maps/api'

/* ── Constants ── */
const GUATEMALA_CENTER = { lat: 14.6349, lng: -90.5069 }
const MAP_CONTAINER_STYLE = { width: '100%', height: '100%' }

const MAP_OPTIONS = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  clickableIcons: false,
  styles: [
    { elementType: 'geometry',            stylers: [{ color: '#1a2035' }] },
    { elementType: 'labels.text.fill',    stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke',  stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country',  elementType: 'geometry.stroke',    stylers: [{ color: '#4b6878' }] },
    { featureType: 'landscape.natural',       elementType: 'geometry',            stylers: [{ color: '#023e58' }] },
    { featureType: 'poi',                     elementType: 'geometry',            stylers: [{ color: '#283d6a' }] },
    { featureType: 'poi',                     elementType: 'labels.text.fill',    stylers: [{ color: '#6f9ba5' }] },
    { featureType: 'poi.park',                elementType: 'geometry.fill',       stylers: [{ color: '#023e58' }] },
    { featureType: 'road',                    elementType: 'geometry',            stylers: [{ color: '#304a7d' }] },
    { featureType: 'road',                    elementType: 'labels.text.fill',    stylers: [{ color: '#98a5be' }] },
    { featureType: 'road',                    elementType: 'labels.text.stroke',  stylers: [{ color: '#1d2c4d' }] },
    { featureType: 'road.highway',            elementType: 'geometry',            stylers: [{ color: '#2c6675' }] },
    { featureType: 'road.highway',            elementType: 'labels.text.fill',    stylers: [{ color: '#b0d5ce' }] },
    { featureType: 'road.highway',            elementType: 'labels.text.stroke',  stylers: [{ color: '#023747' }] },
    { featureType: 'transit.line',            elementType: 'geometry.fill',       stylers: [{ color: '#283d6a' }] },
    { featureType: 'water',                   elementType: 'geometry',            stylers: [{ color: '#0e1626' }] },
    { featureType: 'water',                   elementType: 'labels.text.fill',    stylers: [{ color: '#4e6d70' }] },
  ],
}

/* ── Custom numbered SVG pin ── */
function createPinIcon(number) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="50" viewBox="0 0 40 50">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%"   stop-color="#00c6ff"/>
          <stop offset="100%" stop-color="#0072ff"/>
        </linearGradient>
        <filter id="s">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.45)"/>
        </filter>
      </defs>
      <path filter="url(#s)"
        d="M20 0C8.954 0 0 8.954 0 20c0 14.5 20 30 20 30S40 34.5 40 20C40 8.954 31.046 0 20 0z"
        fill="url(#g)"/>
      <circle cx="20" cy="20" r="12" fill="white"/>
      <text x="20" y="25"
        font-family="Inter,Arial,sans-serif"
        font-size="${number > 9 ? 11 : 13}"
        font-weight="700"
        fill="#0072ff"
        text-anchor="middle">${number}</text>
    </svg>`

  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(40, 50),
    anchor:     new window.google.maps.Point(20, 50),
  }
}

/* ── Map Component ── */
export default function Map({ isLoaded, result, positions, mode }) {
  const mapRef = useRef(null)
  const directionsRequestRef = useRef(0)
  const [directions, setDirections] = useState(null)

  const onMapLoad = useCallback((map) => {
    mapRef.current = map
  }, [])

  /* Ordered positions for markers and polyline */
  const orderedPositions = useMemo(() => {
    return result && positions
      ? result.order.map((i) => positions[i]).filter(Boolean)
      : []
  }, [result, positions])

  const routeKey = useMemo(() => {
    return JSON.stringify({
      mode,
      path: orderedPositions.map((pos) => [
        Number(pos.lat).toFixed(6),
        Number(pos.lng).toFixed(6),
      ]),
    })
  }, [mode, orderedPositions])

  const directionsPath = useMemo(() => {
    const overviewPath = directions?.routes?.[0]?.overview_path
    if (!overviewPath) return []

    return overviewPath.map((point) => ({
      lat: point.lat(),
      lng: point.lng(),
    }))
  }, [directions])

  /* Auto-fit bounds whenever a new result arrives */
  useEffect(() => {
    if (!result || !positions || !mapRef.current) return

    const bounds = new window.google.maps.LatLngBounds()
    result.order.forEach((origIdx) => {
      const pos = positions[origIdx]
      if (pos) bounds.extend(pos)
    })

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 })
    }
  }, [result, positions])

  /* Fetch street-by-street directions when path changes */
  useEffect(() => {
    if (!isLoaded || orderedPositions.length < 2) {
      directionsRequestRef.current += 1
      setDirections(null)
      return
    }

    const requestId = directionsRequestRef.current + 1
    directionsRequestRef.current = requestId
    setDirections(null)

    const directionsService = new window.google.maps.DirectionsService()

    const origin = orderedPositions[0]
    let destination
    let waypoints = []

    if (mode === 'closed') {
      destination = orderedPositions[0]
      waypoints = orderedPositions.slice(1).map((pos) => ({
        location: new window.google.maps.LatLng(pos.lat, pos.lng),
        stopover: true,
      }))
    } else {
      destination = orderedPositions[orderedPositions.length - 1]
      waypoints = orderedPositions.slice(1, -1).map((pos) => ({
        location: new window.google.maps.LatLng(pos.lat, pos.lng),
        stopover: true,
      }))
    }

    directionsService.route(
      {
        origin: new window.google.maps.LatLng(origin.lat, origin.lng),
        destination: new window.google.maps.LatLng(destination.lat, destination.lng),
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (directionsRequestRef.current !== requestId) return

        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(response)
        } else {
          console.error('Directions request failed due to ' + status)
          setDirections(null) // Fallback to straight line
        }
      }
    )
  }, [isLoaded, orderedPositions, mode])

  /* Close the polyline path for closed routes (used as fallback) */
  const polylinePath =
    mode === 'closed' && orderedPositions.length > 0
      ? [...orderedPositions, orderedPositions[0]]
      : orderedPositions

  /* Loading state */
  if (!isLoaded) {
    return (
      <div className="map-loading">
        <div className="spinner-lg" />
        <span>Cargando mapa…</span>
      </div>
    )
  }

  return (
    <div className="map-wrapper">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={GUATEMALA_CENTER}
        zoom={11}
        options={MAP_OPTIONS}
        onLoad={onMapLoad}
      >
        {/* Numbered markers in optimal order */}
        {result && orderedPositions.map((pos, index) => (
          <MarkerF
            key={index}
            position={pos}
            icon={createPinIcon(index + 1)}
            title={result.route_details[index]}
          />
        ))}

        {/* Route directions (street-by-street path controlled by React) */}
        {directionsPath.length > 1 ? (
          <PolylineF
            key={routeKey}
            path={directionsPath}
            options={{
              strokeColor:   '#00c6ff',
              strokeWeight:  5,
              strokeOpacity: 0.9,
              geodesic:      false,
            }}
          />
        ) : (
          /* Fallback straight line polyline */
          orderedPositions.length > 1 && (
            <PolylineF
              path={polylinePath}
              options={{
                strokeColor:   '#00c6ff',
                strokeWeight:  3.5,
                strokeOpacity: 0.85,
                geodesic:      true,
              }}
            />
          )
        )}
      </GoogleMap>

      {/* Hint when no route yet */}
      {!result && (
        <div className="map-empty-overlay">
          <span className="map-empty-kicker">Mapa listo</span>
          <span>Ingresa tus destinos y calcula la ruta óptima.</span>
        </div>
      )}
    </div>
  )
}
