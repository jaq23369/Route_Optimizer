import { useEffect, useState, useCallback } from 'react'
import { useJsApiLoader } from '@react-google-maps/api'
import DestinationInput from './components/DestinationInput'
import Map from './components/Map'
import RouteResult from './components/RouteResult'
import { calculateRoute } from './services/cloudFunction'
import { login, logout, onAuthStateChanged } from './services/firebase'

/* Defined outside component and frozen — prevents LoadScript from reloading on HMR */
const LIBRARIES = Object.freeze(['places'])

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6" cy="19" r="2"/>
      <circle cx="18" cy="5" r="2"/>
      <path d="M6 17V9a6 6 0 0 1 6-6h2"/>
      <path d="M18 7v8a6 6 0 0 1-6 6H9"/>
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      <path d="m9 12 2 2 4-5"/>
    </svg>
  )
}

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
  const [authReady, setAuthReady] = useState(false)
  const [user,      setUser]      = useState(null)
  const [authError, setAuthError] = useState(null)

  /* Load Google Maps + Places API */
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: LIBRARIES,
    version: 'weekly',        // required for PlaceAutocompleteElement
  })

  useEffect(() => {
    return onAuthStateChanged((currentUser) => {
      setUser(currentUser)
      setAuthReady(true)
      if (!currentUser) {
        setResult(null)
        setPositions(null)
      }
    })
  }, [])

  useEffect(() => {
    if (!user) return undefined

    const verifyCurrentSession = async () => {
      try {
        await user.getIdToken(true)
      } catch {
        await logout()
      }
    }

    const handleFocus = () => {
      verifyCurrentSession()
    }

    window.addEventListener('focus', handleFocus)
    const intervalId = window.setInterval(verifyCurrentSession, 60_000)

    return () => {
      window.removeEventListener('focus', handleFocus)
      window.clearInterval(intervalId)
    }
  }, [user])

  const handleLogin = useCallback(async () => {
    setAuthError(null)

    try {
      await login()
    } catch (err) {
      setAuthError(err.message || 'No se pudo iniciar sesión con Google.')
    }
  }, [])

  const handleLogout = useCallback(async () => {
    setAuthError(null)
    setError(null)

    try {
      await logout()
    } catch (err) {
      setAuthError(err.message || 'No se pudo cerrar la sesión.')
    }
  }, [])

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

  const handleDraftChange = useCallback(() => {
    setError(null)
    setResult(null)
    setPositions(null)
  }, [])

  if (!authReady) {
    return (
      <div className="app auth-shell">
        <div className="auth-panel">
          <div className="header-logo auth-logo" aria-hidden="true">
            <RouteIcon />
          </div>
          <h1 className="auth-title">Route Optimizer</h1>
          <div className="spinner-lg" />
          <p className="auth-copy">Validando sesión...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="app auth-shell">
        <section className="auth-panel">
          <div className="header-logo auth-logo" aria-hidden="true">
            <RouteIcon />
          </div>
          <p className="card-label">Acceso seguro</p>
          <h1 className="auth-title">Route Optimizer</h1>
          <p className="auth-copy">
            Planifica rutas en Guatemala con autenticación Firebase, Google Maps y un backend protegido.
          </p>
          <div className="auth-proof">
            <ShieldIcon />
            <span>Sesión requerida para ejecutar el cálculo optimizado.</span>
          </div>

          <button className="btn-calc auth-button" onClick={handleLogin}>
            <span className="google-mark" aria-hidden="true">G</span>
            Continuar con Google
          </button>

          {authError && (
            <div className="error-banner auth-error" role="alert">
              <strong>Error de autenticación</strong>
              {authError}
            </div>
          )}
        </section>
      </div>
    )
  }

  return (
    <div className="app">

      {/* Missing API key warning */}
      {!apiKey && (
        <div className="error-banner api-warning" role="alert">
          <strong>Falta la API Key de Google Maps</strong>
          Crea el archivo <code>frontend/.env</code> con <code>VITE_GOOGLE_MAPS_API_KEY=tu_clave</code> y reinicia el servidor.
        </div>
      )}

      {/* ── Header ── */}
      <header className="header">
        <div className="header-logo" aria-hidden="true">
          <RouteIcon />
        </div>
        <div className="header-copy">
          <h1 className="header-title">Route Optimizer</h1>
          <span className="header-subtitle">Despacho inteligente de rutas</span>
        </div>
        <span className="header-tag">Algoritmo genético</span>
        <div className="header-user">
          <span className="user-name" title={user.email || user.displayName || 'Usuario autenticado'}>
            {user.displayName || user.email}
          </span>
          <button className="btn-logout" onClick={handleLogout}>
            Salir
          </button>
        </div>
      </header>

      {/* ── Main ── */}
      <div className="main-layout">

        {/* Left sidebar */}
        <aside className="sidebar">

          {/* Destination form */}
          <DestinationInput
            isLoaded={isLoaded}
            onCalculate={handleCalculate}
            onDraftChange={handleDraftChange}
            loading={loading}
          />

          {/* Error notification */}
          {error && (
            <div className="error-banner" role="alert">
              <strong>Error al calcular la ruta</strong>
              {error}
            </div>
          )}

          {/* Optimized route result */}
          {result && (
            <RouteResult result={result} mode={mode} />
          )}

        </aside>

        {/* Map fills remaining space */}
        <main className="map-panel">
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
