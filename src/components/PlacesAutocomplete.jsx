// Places Autocomplete Component for Google Maps
// Uses the new PlaceAutocompleteElement (web component) instead of deprecated Autocomplete
import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsAPI, loadGoogleMapsLibrary } from '../services/googleMapsService';

function PlacesAutocomplete({ 
  value, 
  onChange, 
  onPlaceSelect, 
  placeholder = 'Enter address...',
  className = 'input',
  types = ['address'],
  componentRestrictions = null,
}) {
  const containerRef = useRef(null);
  const autocompleteElementRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [localValue, setLocalValue] = useState(value || '');
  const [error, setError] = useState(null);
  const [useLegacy, setUseLegacy] = useState(false); // Fallback to legacy if new API fails

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    let mounted = true;

    const initializeAutocomplete = async () => {
      try {
        await loadGoogleMapsAPI();
        
        if (!mounted || !containerRef.current) return;

        // Try new PlaceAutocompleteElement first (web component)
        try {
          await loadGoogleMapsLibrary('places');
          
          // Check if web component is available
          // The web component is registered automatically when places library loads
          // We need to create it and attach it to our container
          
          // Create a wrapper div for the web component
          const wrapper = document.createElement('div');
          wrapper.style.width = '100%';
          wrapper.style.position = 'relative';
          
          // Create the web component
          const autocompleteElement = document.createElement('gmp-place-autocomplete');
          
          // Set attributes
          if (placeholder) {
            autocompleteElement.setAttribute('placeholder', placeholder);
          }
          
          // Set types
          if (types && types.length > 0) {
            // Map types to new API format
            const typeMapping = {
              'address': 'ADDRESS',
              'establishment': 'ESTABLISHMENT',
              'geocode': 'GEOCODE',
            };
            const mappedTypes = types.map(t => typeMapping[t] || t.toUpperCase()).join(' ');
            autocompleteElement.setAttribute('requested-result-types', mappedTypes);
          }
          
          // Set country restrictions
          if (componentRestrictions?.country) {
            const countries = Array.isArray(componentRestrictions.country) 
              ? componentRestrictions.country.join(' ')
              : componentRestrictions.country;
            autocompleteElement.setAttribute('country-restrictions', countries);
          }

          // Style the element
          autocompleteElement.style.width = '100%';
          autocompleteElement.style.display = 'block';
          
          // Add event listener for place selection
          autocompleteElement.addEventListener('gmp-placechanged', async (event) => {
            try {
              const place = event.detail.place;
              
              // Fetch required fields using the new API
              await place.fetchFields({ 
                fields: ['formattedAddress', 'location', 'addressComponents', 'id', 'displayName'] 
              });

              if (place.location) {
                // Handle both new API (LatLng object) and legacy format
                const lat = typeof place.location.lat === 'function' 
                  ? place.location.lat() 
                  : place.location.lat;
                const lng = typeof place.location.lng === 'function' 
                  ? place.location.lng() 
                  : place.location.lng;
                
                // Extract address components
                const addressComponents = {
                  address: place.formattedAddress || place.displayName || '',
                  city: '',
                  state: '',
                  country: '',
                  zipCode: '',
                  coordinates: {
                    lat,
                    lng,
                  },
                };

                // Parse address components (new API structure)
                if (place.addressComponents) {
                  place.addressComponents.forEach((component) => {
                    const componentTypes = component.types;
                    if (componentTypes.includes('locality') || componentTypes.includes('sublocality')) {
                      addressComponents.city = component.longText || component.shortText;
                    } else if (componentTypes.includes('administrative_area_level_1')) {
                      addressComponents.state = component.shortText;
                    } else if (componentTypes.includes('country')) {
                      addressComponents.country = component.shortText;
                    } else if (componentTypes.includes('postal_code')) {
                      addressComponents.zipCode = component.longText || component.shortText;
                    }
                  });
                }

                const formattedAddress = place.formattedAddress || place.displayName || '';
                setLocalValue(formattedAddress);
                
                if (onChange) {
                  onChange(formattedAddress);
                }
                
                if (onPlaceSelect) {
                  onPlaceSelect({
                    formattedAddress,
                    coordinates: { lat, lng },
                    addressComponents: addressComponents,
                    placeId: place.id,
                  });
                }
              }
            } catch (err) {
              console.error('Error processing place selection:', err);
              setError('Error processing selected place. Please try again.');
            }
          });

          wrapper.appendChild(autocompleteElement);
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(wrapper);
          
          // Add styles for the web component
          if (!document.getElementById('gmp-place-autocomplete-styles')) {
            const style = document.createElement('style');
            style.id = 'gmp-place-autocomplete-styles';
            style.textContent = `
              gmp-place-autocomplete {
                width: 100%;
                display: block;
              }
              gmp-place-autocomplete::part(input) {
                width: 100%;
                padding: 0.5rem 0.75rem;
                border: 1px solid #d1d5db;
                border-radius: 0.375rem;
                font-size: 1rem;
                line-height: 1.5;
                background-color: white;
              }
              gmp-place-autocomplete::part(input):focus {
                outline: none;
                border-color: #2563eb;
                box-shadow: 0 0 0 1px #2563eb;
              }
              gmp-place-autocomplete::part(input):hover {
                border-color: #9ca3af;
              }
            `;
            document.head.appendChild(style);
          }

          autocompleteElementRef.current = autocompleteElement;
          setIsLoaded(true);
          setError(null);
        } catch (newApiError) {
          console.warn('New PlaceAutocompleteElement not available, falling back to legacy:', newApiError);
          
          // Fallback to legacy Autocomplete if new API fails
          if (newApiError.message?.includes('BillingNotEnabled')) {
            setError('⚠️ Billing is not enabled. Enable billing at https://console.cloud.google.com/project/_/billing/enable to use autocomplete. You can still enter addresses manually.');
            // Still try legacy as fallback
            setUseLegacy(true);
            initializeLegacyAutocomplete();
            return;
          }
          
          // Try legacy autocomplete as fallback
          setUseLegacy(true);
          initializeLegacyAutocomplete();
        }
      } catch (error) {
        console.error('Error initializing Places Autocomplete:', error);
        if (error.message?.includes('BillingNotEnabled')) {
          setError('⚠️ Billing is not enabled. Enable billing at https://console.cloud.google.com/project/_/billing/enable to use autocomplete. You can still enter addresses manually.');
        } else {
          setError('⚠️ Places Autocomplete is not available. You can still enter addresses manually.');
        }
        // Create a basic input as fallback
        if (containerRef.current) {
          const input = document.createElement('input');
          input.type = 'text';
          input.className = className;
          input.placeholder = placeholder;
          input.value = localValue;
          input.autocomplete = 'off';
          input.style.width = '100%';
          
          input.addEventListener('input', (e) => {
            const newValue = e.target.value;
            setLocalValue(newValue);
            if (onChange) {
              onChange(newValue);
            }
          });
          
          containerRef.current.innerHTML = '';
          containerRef.current.appendChild(input);
        }
      }
    };

    const initializeLegacyAutocomplete = () => {
      if (!containerRef.current) return;
      
      // Create a regular input for legacy autocomplete
      const input = document.createElement('input');
      input.type = 'text';
      input.className = className;
      input.placeholder = placeholder;
      input.value = localValue;
      input.autocomplete = 'off';
      
      input.addEventListener('input', (e) => {
        const newValue = e.target.value;
        setLocalValue(newValue);
        if (onChange) {
          onChange(newValue);
        }
      });

      containerRef.current.innerHTML = '';
      containerRef.current.appendChild(input);

      // Initialize legacy Autocomplete
      if (window.google?.maps?.places) {
        try {
          const autocomplete = new window.google.maps.places.Autocomplete(
            input,
            {
              types: types,
              componentRestrictions: componentRestrictions,
              fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
            }
          );

          autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace();
            
            if (place.geometry && place.geometry.location) {
              const lat = place.geometry.location.lat();
              const lng = place.geometry.location.lng();
              
              const addressComponents = {
                address: place.formatted_address || '',
                city: '',
                state: '',
                country: '',
                zipCode: '',
                coordinates: { lat, lng },
              };

              if (place.address_components) {
                place.address_components.forEach((component) => {
                  const componentTypes = component.types;
                  if (componentTypes.includes('locality') || componentTypes.includes('sublocality')) {
                    addressComponents.city = component.long_name;
                  } else if (componentTypes.includes('administrative_area_level_1')) {
                    addressComponents.state = component.short_name;
                  } else if (componentTypes.includes('country')) {
                    addressComponents.country = component.short_name;
                  } else if (componentTypes.includes('postal_code')) {
                    addressComponents.zipCode = component.long_name;
                  }
                });
              }

              setLocalValue(place.formatted_address);
              
              if (onChange) {
                onChange(place.formatted_address);
              }
              
              if (onPlaceSelect) {
                onPlaceSelect({
                  formattedAddress: place.formatted_address,
                  coordinates: { lat, lng },
                  addressComponents: addressComponents,
                  placeId: place.place_id,
                });
              }
            }
          });

          autocompleteElementRef.current = autocomplete;
          setIsLoaded(true);
        } catch (legacyError) {
          console.error('Legacy autocomplete also failed:', legacyError);
          setError('Places Autocomplete is not available. Please enter addresses manually.');
        }
      }
    };

    initializeAutocomplete();

    return () => {
      mounted = false;
      if (autocompleteElementRef.current && useLegacy) {
        window.google?.maps?.event?.clearInstanceListeners?.(autocompleteElementRef.current);
      }
    };
  }, [types, componentRestrictions, onChange, onPlaceSelect, placeholder, className, useLegacy]);

  return (
    <div className="w-full">
      <div ref={containerRef} className={className} style={{ padding: 0, border: 'none' }} />
      {error && (
        <p className="text-xs text-yellow-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

export default PlacesAutocomplete;

