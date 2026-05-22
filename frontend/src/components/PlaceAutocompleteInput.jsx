import { useEffect, useRef } from 'react'

/**
 * PlaceAutocompleteInput
 * Wrapper around the new google.maps.places.PlaceAutocompleteElement web component.
 * Replaces the deprecated Autocomplete widget.
 *
 * Props:
 *  isLoaded       {boolean}   Maps API ready
 *  placeholder    {string}
 *  inputId        {string}
 *  ariaLabel      {string}
 *  onPlaceSelect  {({address, position}) => void}
 *  onInputChange  {() => void}  called when user edits text (clears position)
 */
export default function PlaceAutocompleteInput({
  isLoaded,
  placeholder,
  inputId,
  ariaLabel,
  onPlaceSelect,
  onInputChange,
}) {
  const containerRef = useRef(null)
  const elementRef   = useRef(null)

  // Keep callback refs stable so the effect doesn't re-run on every render
  const onSelectRef = useRef(onPlaceSelect)
  const onChangeRef = useRef(onInputChange)
  onSelectRef.current = onPlaceSelect
  onChangeRef.current = onInputChange

  useEffect(() => {
    if (!isLoaded || !containerRef.current) return

    const Places = window.google?.maps?.places
    if (!Places?.PlaceAutocompleteElement) {
      console.warn('[Route Optimizer] PlaceAutocompleteElement not found in Maps API.')
      return
    }

    /* Create the web component */
    const element = new Places.PlaceAutocompleteElement({
      componentRestrictions: { country: 'gt' },
    })

    if (placeholder) element.setAttribute('placeholder', placeholder)
    if (inputId)     element.id = inputId
    if (ariaLabel)   element.setAttribute('aria-label', ariaLabel)

    /* Place selected from dropdown */
    const handleSelect = async (event) => {
      const { placePrediction } = event
      if (!placePrediction) return
      const place = placePrediction.toPlace()
      try {
        await place.fetchFields({
          fields: ['formattedAddress', 'displayName', 'location'],
        })
        onSelectRef.current({
          address:  place.formattedAddress || place.displayName?.text || '',
          position: {
            lat: place.location.lat(),
            lng: place.location.lng(),
          },
        })
      } catch (err) {
        console.error('[Route Optimizer] fetchFields error:', err)
      }
    }

    /* User typed → position is no longer valid */
    const handleInput = () => onChangeRef.current?.()

    element.addEventListener('gmp-select', handleSelect)
    element.addEventListener('input',      handleInput)

    containerRef.current.appendChild(element)
    elementRef.current = element

    return () => {
      element.removeEventListener('gmp-select', handleSelect)
      element.removeEventListener('input',      handleInput)
      try { containerRef.current?.removeChild(element) } catch {}
    }
  }, [isLoaded]) // only runs once after Maps API is ready

  return (
    <div
      ref={containerRef}
      className="places-autocomplete-wrapper"
    />
  )
}
