import { useState, useCallback } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import DestinationInput from './components/DestinationInput'
import Map from './components/Map'
import RouteResult from './components/RouteResult'
import { calculateRoute } from './services/cloudFunction'

/* Defined outside component and frozen — prevents LoadScript from reloading on HMR */
const LIBRARIES = Object.freeze(['places'])

/**
 * App — root component.
 *
 * State kept here so Fase 4 can wrap this with <AuthProvider>
 * and inject a <LoginScreen> before rendering this component,
 * without touching any of the logic below.
 */
export default function App() {
  const [result,    setResult]    = useState(null)
  const [positions, setPositions] = useState(null)  // lat/lng per original index
  const [mode,      setMode]      = useState('open')
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState(null)

  /* Load Google Maps + Places API */
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
    version: 'weekly',        // required for PlaceAutocompleteElement
  })

  /* Called by DestinationInput when user hits "Calcular" */
  const handleCalculate = useCallback(async (addresses, routeMode, routePositions) => {
    setLoading(true)
    setError(null)
    setResult(null)
    setMode(routeMode)
    setPositions(routePositions)

    try {
      const data = await calculateRoute(addresses, routeMode)
      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  return (
    <div className="app">

      {/* Missing API key warning */}
      {!apiKey && (
        <div className="error-banner" role="alert" style={{ margin: '10px 16px 0', borderRadius: 10 }}>
          <strong>⚠ Falta la API Key de Google Maps</strong>
          Crea el archivo <code>frontend/.env</code> con <code>VITE_GOOGLE_MAPS_API_KEY=tu_clave</code> y reinicia el servidor.
        </div>
      )}

      {/* ── Header ── */}
      <header className="header">
        <div className="header-logo" aria-hidden="true">
          {/* Route icon */}
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6"  cy="19" r="2"/>
            <circle cx="18" cy="5"  r="2"/>
            <path d="M6 17V9a6 6 0 0 1 6-6h2"/>
            <path d="M18 7v8a6 6 0 0 1-6 6H9"/>
          </svg>
        </div>
        <h1 className="header-title">Route Optimizer</h1>
        <span className="header-tag">Algoritmo Genético</span>
      </header>

      {/* ── Main ── */}
      <div className="main-layout">

        {/* Left sidebar */}
        <aside className="sidebar">

          {/* Destination form */}
          <DestinationInput
            isLoaded={isLoaded}
            onCalculate={handleCalculate}
            loading={loading}
          />

          {/* Error notification */}
          {error && (
            <div className="error-banner" role="alert">
              <strong>⚠ Error al calcular la ruta</strong>
              {error}
            </div>
          )}

          {/* Optimized route result */}
          {result && (
            <RouteResult result={result} mode={mode} />
          )}

        </aside>

        {/* Map fills remaining space */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Map
            isLoaded={isLoaded}
            result={result}
            positions={positions}
            mode={mode}
          />
        </main>

      </div>
    </div>
  )
}
