/**
 * Cloud Function Service
 * Calls the GCP Cloud Function endpoint to calculate the optimal route.
 * URL is read from the VITE_CLOUD_FUNCTION_URL environment variable.
 */
const CLOUD_FUNCTION_URL = import.meta.env.VITE_CLOUD_FUNCTION_URL

/**
 * Sends destinations and mode to the Cloud Function.
 * @param {string[]} destinations - Array of 2–15 destination address strings.
 * @param {string} mode - "open" or "closed"
 * @returns {{ order: number[], total_distance: number, route_details: string[] }}
 * @throws {Error} With a descriptive message on failure.
 */
export async function calculateRoute(destinations, mode) {
  if (!CLOUD_FUNCTION_URL) {
    throw new Error(
      'VITE_CLOUD_FUNCTION_URL no está configurado. Agrega la variable al archivo .env'
    )
  }

  let response
  try {
    response = await fetch(CLOUD_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ destinations, mode }),
    })
  } catch {
    throw new Error(
      'No se pudo conectar con el servidor. Verifica tu conexión a internet.'
    )
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status} del servidor.`)
  }

  return data
}
