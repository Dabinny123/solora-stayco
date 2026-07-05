# Google Maps Integration Setup

## Overview
The Solora StayCo platform now includes Google Maps integration for location-based search, distance calculation, and route visualization.

## Features
- **Map View**: Interactive map showing all listings with markers
- **Location Search**: Search by address, coordinates, or use GPS
- **Distance Calculation**: Shows distance in kilometers from search location
- **Travel Time**: Displays estimated driving time to each listing
- **Route Visualization**: Click on a listing to see the route from your search location
- **Nearest Stays**: Automatically sorts listings by distance when a location is set

## API Key Configuration

### Option 1: Environment Variable (Recommended)
Add your Google Maps API key to your `.env` file:

```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDKV_Tnv2V8bI4Dznq8VoBIck9aZZG4Y2Q
```

### Option 2: Hardcoded Fallback
The service includes a fallback to the provided API key if the environment variable is not set.

## Required Google Maps APIs

Make sure the following APIs are enabled in your Google Cloud Console:

1. **Maps JavaScript API** - For displaying the map (REQUIRED)
2. **Places API (New)** - For address autocomplete using PlaceAutocompleteElement (REQUIRED for autocomplete features)
3. **Geocoding API** - For converting addresses to coordinates (RECOMMENDED, but Places API can be used as fallback)
4. **Distance Matrix API** - For calculating distance and travel time (REQUIRED for distance features)
5. **Directions API** - For displaying routes (REQUIRED for route visualization)

## ⚠️ Important: Billing Must Be Enabled

**Google Maps APIs now require billing to be enabled** on your Google Cloud Project, even for the free tier. 

- Enable billing at: https://console.cloud.google.com/project/_/billing/enable
- You'll get $200 in free credits monthly (covers most small to medium usage)
- The system will show a helpful message if billing is not enabled
- Manual address entry still works even without billing enabled

## API Migration (March 2025)

The system now uses the **new `PlaceAutocompleteElement`** (web component) instead of the deprecated `Autocomplete` class:
- ✅ Uses `google.maps.places.PlaceAutocompleteElement` (recommended)
- ✅ Falls back to legacy `Autocomplete` if new API is unavailable
- ✅ Provides manual input fallback if APIs fail

**Note**: If Geocoding API is not authorized, the system will:
- Use Places API as a fallback for geocoding
- Still allow coordinate-based searches (e.g., "40.7128,-74.0060")
- Show a helpful error message if both fail

## Usage

### For Users

1. **Search by Location**:
   - Enter an address or coordinates (e.g., `40.7128,-74.0060`) in the "Find Nearest Stays" section
   - Click "Search Location" or press Enter
   - Listings will be sorted by distance from that location

2. **Use GPS**:
   - Click the "Use GPS" button
   - Allow location permissions in your browser
   - The map will center on your location and show nearest stays

3. **View on Map**:
   - Toggle between "Grid" and "Map" view
   - Click on any listing marker to see details
   - Click "View Route" to see directions from your search location

4. **Distance & Travel Time**:
   - Distance is shown in kilometers
   - Travel time is displayed for the first 10 nearest listings
   - Both are calculated using Google's Distance Matrix API

### For Developers

#### Using the Google Maps Service

```javascript
import {
  loadGoogleMapsAPI,
  geocodeAddress,
  getCurrentLocation,
  getDistanceAndTime,
  sortListingsByDistance,
} from '../services/googleMapsService';

// Load the API
await loadGoogleMapsAPI();

// Geocode an address
const coords = await geocodeAddress('New York, NY');
// Returns: { lat: 40.7128, lng: -74.0060, formattedAddress: '...' }

// Get user's GPS location
const location = await getCurrentLocation();
// Returns: { lat: ..., lng: ... }

// Get distance and travel time
const route = await getDistanceAndTime(
  originLat, originLng,
  destLat, destLng,
  'driving' // or 'walking', 'bicycling', 'transit'
);
// Returns: { distance: { text: '5.2 km', value: 5200 }, duration: { text: '12 mins', value: 720 } }

// Sort listings by distance
const sorted = sortListingsByDistance(listings, centerLat, centerLng);
```

#### Using the MapView Component

```javascript
import MapView from '../components/MapView';

<MapView
  listings={listings}
  center={{ lat: 40.7128, lng: -74.0060, zoom: 12 }}
  onListingClick={(listing) => console.log(listing)}
  selectedListing={selectedListing}
  searchLocation={searchLocation}
  onRouteRequest={(routeData) => console.log(routeData)}
/>
```

## Content Security Policy

The CSP in `index.html` has been updated to allow:
- `https://maps.googleapis.com` - Maps API
- `https://*.googleapis.com` - All Google APIs
- `https://www.gstatic.com` - Google static resources

## Troubleshooting

### Map Not Loading
- Check that the Google Maps JavaScript API is enabled
- Verify your API key is correct
- Check browser console for errors
- Ensure CSP allows Google Maps domains

### Location Search Not Working
- Verify Places API is enabled (required for autocomplete)
- If Geocoding API is not authorized, the system will use Places API as fallback
- Try using coordinates format: `lat,lng`
- Check browser console for specific error messages

### Autocomplete Not Showing
- **Most Common**: Enable billing on your Google Cloud Project (required even for free tier)
- Ensure Places API (New) is enabled in Google Cloud Console
- Verify your API key has Places API permissions
- Check browser console for specific error messages
- The system will show a warning message if billing is not enabled
- Manual address entry still works as a fallback

### Distance/Travel Time Not Showing
- Verify Distance Matrix API is enabled
- Check API quotas in Google Cloud Console
- Only the first 10 listings show travel time (for performance)

### GPS Not Working
- Ensure browser location permissions are granted
- Check that HTTPS is being used (required for geolocation)
- Try a different browser if issues persist

## API Quotas & Limits

- **Geocoding API**: 40,000 requests/day (free tier)
- **Distance Matrix API**: 40,000 elements/day (free tier)
- **Directions API**: 40,000 requests/day (free tier)

For production, consider:
- Implementing caching for frequently searched locations
- Batching distance calculations
- Using client-side distance calculation for initial sorting (Haversine formula)

## Features Implemented

✅ **Address Autocomplete** - Available in:
   - Host listing creation form (address field)
   - Explore page location search
   - Auto-fills city, state, country, and coordinates when address is selected

✅ **Map View** - Interactive map with listing markers
✅ **Distance Calculation** - Shows distance in kilometers
✅ **Travel Time** - Displays estimated driving time
✅ **Route Visualization** - Click listing to see route
✅ **GPS Location** - Use current location for search

## Future Enhancements

- [ ] Multiple travel modes (walking, transit, cycling)
- [ ] Radius filter (show only listings within X km)
- [ ] Cluster markers for better performance with many listings
- [ ] Street View integration
- [ ] Custom map styles
- [ ] Save favorite search locations

