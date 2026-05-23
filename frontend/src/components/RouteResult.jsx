/**
 * RouteResult Component
 * Displays the optimized route: total distance, mode badge,
 * and the ordered list of destinations.
 */
export default function RouteResult({ result, mode }) {
  const distanceKm = (result.total_distance / 1000).toFixed(2)
  const stopsCount = result.route_details.length

  return (
    <div className="card result-card">
      {/* Header: title + mode badge */}
      <div className="result-header">
        <div>
          <p className="card-label">Resultado</p>
          <h2>Ruta óptima</h2>
        </div>
        <span className={`mode-badge mode-badge--${mode}`}>
          {mode === 'open' ? 'Abierta' : 'Cerrada'}
        </span>
      </div>

      {/* Total distance */}
      <div className="result-distance-block">
        <div>
          <span className="result-distance-number">{distanceKm}</span>
          <span className="result-distance-unit">km</span>
        </div>
        <span className="result-stops">{stopsCount} paradas</span>
      </div>

      {/* Ordered stop list */}
      <ol className="route-list">
        {result.route_details.map((destination, index) => (
          <li
            key={index}
            className="route-item"
            style={{ '--i': index }}
          >
            <span className="route-item__num">{index + 1}</span>
            <span className="route-item__name" title={destination}>
              {destination}
            </span>
          </li>
        ))}

        {/* Closed route: show return to start */}
        {mode === 'closed' && (
          <li className="route-item route-item--return">
            <span className="route-item__num">R</span>
            <span className="route-item__name" title={result.route_details[0]}>
              {result.route_details[0]}
            </span>
          </li>
        )}
      </ol>
    </div>
  )
}
