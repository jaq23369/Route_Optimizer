import { useState } from 'react'
import PlaceAutocompleteInput from './PlaceAutocompleteInput'

/* Unique ID counter for destination items */
let _nextId = 3

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
      <p className="card-label">Destinos ({items.length}/15)</p>

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
                ×
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
        + Agregar destino
      </button>

      {/* Route mode */}
      <div style={{ marginTop: 18, marginBottom: 4 }}>
        <p className="card-label">Tipo de ruta</p>
        <div className="mode-row">
          <button
            id="mode-open"
            className={`mode-btn ${mode === 'open' ? 'active' : ''}`}
            onClick={() => handleModeChange('open')}
          >
            → Abierta
          </button>
          <button
            id="mode-closed"
            className={`mode-btn ${mode === 'closed' ? 'active' : ''}`}
            onClick={() => handleModeChange('closed')}
          >
            ↩ Cerrada
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
          : '⚡ Calcular Ruta Óptima'}
      </button>

      {!allValid && !loading && (
        <p className="hint">Selecciona cada destino del menú desplegable</p>
      )}
    </div>
  )
}
