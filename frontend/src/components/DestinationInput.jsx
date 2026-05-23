import { useState } from 'react'
import PlaceAutocompleteInput from './PlaceAutocompleteInput'

/* Unique ID counter for destination items */
let _nextId = 3

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5v14"/>
      <path d="M5 12h14"/>
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  )
}

function ArrowRouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 18h7a5 5 0 0 0 0-10H9"/>
      <path d="m13 4 4 4-4 4"/>
    </svg>
  )
}

function LoopRouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M17 2v5h-5"/>
      <path d="M7 22v-5h5"/>
      <path d="M19 11a7 7 0 0 0-12.3-4.6L5 8"/>
      <path d="M5 13a7 7 0 0 0 12.3 4.6L19 16"/>
    </svg>
  )
}

function CalculateIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m13 2-7 12h6l-1 8 7-12h-6l1-8z"/>
    </svg>
  )
}

/**
 * DestinationInput Component
 * Uses the new PlaceAutocompleteElement (not the deprecated Autocomplete widget).
 *
 * Props:
 *  isLoaded    {boolean}   Google Maps API ready
 *  onCalculate {Function}  (addresses[], mode, positions[]) => void
 *  onDraftChange {Function} clears stale route output when user edits inputs
 *  loading     {boolean}   calculation in progress
 */
export default function DestinationInput({ isLoaded, onCalculate, onDraftChange, loading }) {
  const [items, setItems] = useState([
    { id: 1, address: '', position: null },
    { id: 2, address: '', position: null },
  ])
  const [mode, setMode] = useState('open')

  /* Called when user picks a suggestion */
  const handlePlaceSelect = (id, { address, position }) => {
    onDraftChange?.()
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, address, position } : item
      )
    )
  }

  /* Called when user edits the text field — clears stored position */
  const handleInputChange = (id) => {
    onDraftChange?.()
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, position: null } : item
      )
    )
  }

  const addItem = () => {
    if (items.length >= 15) return
    onDraftChange?.()
    setItems((prev) => [...prev, { id: _nextId++, address: '', position: null }])
  }

  const removeItem = (id) => {
    if (items.length <= 2) return
    onDraftChange?.()
    setItems((prev) => prev.filter((item) => item.id !== id))
  }

  const handleModeChange = (nextMode) => {
    onDraftChange?.()
    setMode(nextMode)
  }

  const allValid  = items.every((i) => i.address && i.position)
  const canSubmit = allValid && !loading

  const handleCalculate = () => {
    if (!canSubmit) return
    onCalculate(
      items.map((i) => i.address),
      mode,
      items.map((i) => i.position),
    )
  }

  return (
    <div className="card" id="destination-input">
      <div className="card-heading">
        <div>
          <p className="card-label">Plan de ruta</p>
          <h2>Destinos</h2>
        </div>
        <span className="count-pill">{items.length}/15</span>
      </div>

      {/* Destination list */}
      <div className="dest-list">
        {items.map((item, index) => (
          <div key={item.id} className="dest-row">

            {/* Step number */}
            <div className="dest-badge">{index + 1}</div>

            {/* Places autocomplete (new API) */}
            <PlaceAutocompleteInput
              isLoaded={isLoaded}
              placeholder={`Destino ${index + 1}…`}
              inputId={`dest-input-${item.id}`}
              ariaLabel={`Destino ${index + 1}`}
              onPlaceSelect={(place) => handlePlaceSelect(item.id, place)}
              onInputChange={() => handleInputChange(item.id)}
            />

            {/* Remove button */}
            {items.length > 2 && (
              <button
                className="btn-remove"
                onClick={() => removeItem(item.id)}
                aria-label={`Eliminar destino ${index + 1}`}
                title="Eliminar"
              >
                <XIcon />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add destination */}
      <button
        id="btn-add-destination"
        className="btn-add"
        onClick={addItem}
        disabled={items.length >= 15}
      >
        <PlusIcon />
        Agregar destino
      </button>

      {/* Route mode */}
      <div className="route-mode-section">
        <p className="card-label">Tipo de ruta</p>
        <div className="mode-row">
          <button
            id="mode-open"
            className={`mode-btn ${mode === 'open' ? 'active' : ''}`}
            onClick={() => handleModeChange('open')}
            aria-pressed={mode === 'open'}
          >
            <ArrowRouteIcon />
            Abierta
          </button>
          <button
            id="mode-closed"
            className={`mode-btn ${mode === 'closed' ? 'active' : ''}`}
            onClick={() => handleModeChange('closed')}
            aria-pressed={mode === 'closed'}
          >
            <LoopRouteIcon />
            Cerrada
          </button>
        </div>
      </div>

      {/* Calculate button */}
      <button
        id="btn-calculate"
        className="btn-calc"
        onClick={handleCalculate}
        disabled={!canSubmit}
      >
        {loading
          ? <><span className="spinner" /> Calculando…</>
          : <><CalculateIcon /> Calcular ruta óptima</>}
      </button>

      {!allValid && !loading && (
        <p className="hint">Selecciona cada destino del menú desplegable</p>
      )}
    </div>
  )
}
