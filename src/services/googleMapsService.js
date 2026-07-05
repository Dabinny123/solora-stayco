// Google Maps Service for Solora StayCo
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyDKV_Tnv2V8bI4Dznq8VoBIck9aZZG4Y2Q';

/**
 * Load Google Maps JavaScript API
 * @returns {Promise<void>}
 */
export async function loadGoogleMapsAPI() {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.maps) {
      resolve();
      return;
    }

    if (document.querySelector('script[src*="maps.googleapis.com"]')) {
      // Script already loading
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geometry&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve();
      } else {
        reject(new Error('Google Maps API failed to load'));
      }
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps API'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Load Google Maps library using the new importLibrary method
 * @param {string} libraryName - Library name (e.g., 'places', 'maps', 'marker')
 * @returns {Promise<any>}
 */
export async function loadGoogleMapsLibrary(libraryName) {
  await loadGoogleMapsAPI();
  
  if (!window.google?.maps?.importLibrary) {
    throw new Error('Google Maps importLibrary is not available. Please ensure you are using the latest API version.');
  }
  
  try {
    return await window.google.maps.importLibrary(libraryName);
  } catch (error) {
    console.error(`Error loading ${libraryName} library:`, error);
    if (error.message?.includes('BillingNotEnabled')) {
      throw new Error('Billing is not enabled on your Google Cloud Project. Please enable billing at https://console.cloud.google.com/project/_/billing/enable');
    }
    throw error;
  }
}

/**
 * Geocode an address to coordinates
 * @param {string} address - Address to geocode
 * @returns {Promise<{lat: number, lng: number, formattedAddress: string}>}
 */
export async function geocodeAddress(address) {
  await loadGoogleMapsAPI();
  
  return new Promise((resolve, reject) => {
    // First try using Places API (more reliable if Geocoding API is restricted)
    if (window.google?.maps?.places) {
      const service = new window.google.maps.places.PlacesService(document.createElement('div'));
      const request = {
        query: address,
        fields: ['geometry', 'formatted_address'],
      };
      
      service.findPlaceFromQuery(request, (results, status) => {
        if (status === 'OK' && results && results[0] && results[0].geometry) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng(),
            formattedAddress: results[0].formatted_address || address,
          });
        } else {
          // Fallback to Geocoder API
          tryGeocoderAPI(address, resolve, reject);
        }
      });
    } else {
      // Fallback to Geocoder API
      tryGeocoderAPI(address, resolve, reject);
    }
  });
}

/**
 * Try using Geocoder API as fallback
 */
function tryGeocoderAPI(address, resolve, reject) {
  try {
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
          formattedAddress: results[0].formatted_address,
        });
      } else if (status === 'REQUEST_DENIED') {
        // If Geocoding API is not authorized, try to parse coordinates from input
        const coords = parseCoordinates(address);
        if (coords) {
          resolve({
            lat: coords.lat,
            lng: coords.lng,
            formattedAddress: address,
          });
        } else {
          reject(new Error('Geocoding API is not authorized. Please enable Geocoding API in Google Cloud Console or use coordinates format (lat,lng).'));
        }
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  } catch (error) {
    reject(new Error(`Geocoding error: ${error.message}`));
  }
}

/**
 * Reverse geocode coordinates to address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Formatted address
 */
export async function reverseGeocode(lat, lng) {
  await loadGoogleMapsAPI();
  
  return new Promise((resolve, reject) => {
    const geocoder = new window.google.maps.Geocoder();
    
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results[0]) {
        resolve(results[0].formatted_address);
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });
}

/**
 * Get user's current location using GPS
 * @returns {Promise<{lat: number, lng: number}>}
 */
export function getCurrentLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get distance and travel time using Google Distance Matrix API
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @param {string} mode - Travel mode: 'driving', 'walking', 'bicycling', 'transit'
 * @returns {Promise<{distance: {text: string, value: number}, duration: {text: string, value: number}}>}
 */
export async function getDistanceAndTime(originLat, originLng, destLat, destLng, mode = 'driving') {
  await loadGoogleMapsAPI();
  
  return new Promise((resolve, reject) => {
    const service = new window.google.maps.DistanceMatrixService();
    
    service.getDistanceMatrix(
      {
        origins: [{ lat: originLat, lng: originLng }],
        destinations: [{ lat: destLat, lng: destLng }],
        travelMode: window.google.maps.TravelMode[mode.toUpperCase()],
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK' && response.rows[0] && response.rows[0].elements[0]) {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK') {
            resolve({
              distance: element.distance,
              duration: element.duration,
            });
          } else {
            reject(new Error(`Distance calculation failed: ${element.status}`));
          }
        } else {
          reject(new Error(`Distance Matrix API error: ${status}`));
        }
      }
    );
  });
}

/**
 * Parse coordinates from string (e.g., "40.7128,-74.0060" or "40.7128, -74.0060")
 * @param {string} coordString - Coordinate string
 * @returns {{lat: number, lng: number} | null}
 */
export function parseCoordinates(coordString) {
  if (!coordString || typeof coordString !== 'string') {
    return null;
  }

  const parts = coordString.split(',').map(s => s.trim());
  if (parts.length !== 2) {
    return null;
  }

  const lat = parseFloat(parts[0]);
  const lng = parseFloat(parts[1]);

  if (isNaN(lat) || isNaN(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return { lat, lng };
}

/**
 * Sort listings by distance from a given location
 * @param {Array} listings - Array of listings
 * @param {number} originLat - Origin latitude
 * @param {number} originLng - Origin longitude
 * @returns {Array} Sorted listings with distance property
 */
export function sortListingsByDistance(listings, originLat, originLng) {
  return listings
    .map((listing) => {
      const coords = listing.location?.coordinates;
      if (!coords || coords.lat === undefined || coords.lng === undefined) {
        return { ...listing, distance: Infinity };
      }

      const distance = calculateDistance(
        originLat,
        originLng,
        coords.lat,
        coords.lng
      );

      return { ...listing, distance };
    })
    .sort((a, b) => a.distance - b.distance);
}

