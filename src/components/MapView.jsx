// MapView Component for Solora StayCo
import React, { useEffect, useRef, useState } from 'react';
import { loadGoogleMapsAPI, getDistanceAndTime } from '../services/googleMapsService';

function MapView({ listings, center, onListingClick, selectedListing, searchLocation, onRouteRequest }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null);

  useEffect(() => {
    initializeMap();
    return () => {
      // Cleanup markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];
      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }
    };
  }, []);

  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current) {
      updateMarkers();
    }
  }, [listings, mapLoaded]);

  useEffect(() => {
    if (mapLoaded && mapInstanceRef.current && center) {
      mapInstanceRef.current.setCenter(new window.google.maps.LatLng(center.lat, center.lng));
      if (center.zoom) {
        mapInstanceRef.current.setZoom(center.zoom);
      }
    }
  }, [center, mapLoaded]);

  useEffect(() => {
    if (mapLoaded && selectedListing && mapInstanceRef.current) {
      const coords = selectedListing.location?.coordinates;
      if (coords && coords.lat && coords.lng) {
        mapInstanceRef.current.setCenter(new window.google.maps.LatLng(coords.lat, coords.lng));
        mapInstanceRef.current.setZoom(15);
      }
    }
  }, [selectedListing, mapLoaded]);

  useEffect(() => {
    if (mapLoaded && searchLocation && onRouteRequest && selectedListing) {
      handleRouteRequest(searchLocation, selectedListing);
    }
  }, [searchLocation, selectedListing, mapLoaded, onRouteRequest]);

  const initializeMap = async () => {
    try {
      await loadGoogleMapsAPI();
      
      if (!mapRef.current) return;

      const defaultCenter = center || { lat: 40.7128, lng: -74.0060 }; // Default to NYC

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: defaultCenter,
        zoom: center?.zoom || 10,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }],
          },
        ],
      });

      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        map: mapInstanceRef.current,
        suppressMarkers: false,
      });

      setMapLoaded(true);
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  };

  const updateMarkers = () => {
    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    if (!mapInstanceRef.current || !listings) return;

    listings.forEach((listing) => {
      const coords = listing.location?.coordinates;
      if (!coords || coords.lat === undefined || coords.lng === undefined) {
        return;
      }

      const marker = new window.google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map: mapInstanceRef.current,
        title: listing.title,
        icon: {
          url: selectedListing?.id === listing.id 
            ? 'http://maps.google.com/mapfiles/ms/icons/red-dot.png'
            : 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
          scaledSize: new window.google.maps.Size(32, 32),
        },
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${listing.title || 'Untitled'}</h3>
            <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${listing.location?.address || 'No address'}</p>
            <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #2563eb;">
              $${listing.basePrice || 0}/night
            </p>
            ${listing.distance !== undefined ? `
              <p style="margin: 0; font-size: 11px; color: #666;">
                ${listing.distance.toFixed(2)} km away
              </p>
            ` : ''}
            ${listing.travelTime ? `
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #666;">
                ${listing.travelTime}
              </p>
            ` : ''}
          </div>
        `,
      });

      marker.addListener('click', () => {
        if (onListingClick) {
          onListingClick(listing);
        }
        infoWindow.open(mapInstanceRef.current, marker);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers
    if (markersRef.current.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getPosition());
      });
      mapInstanceRef.current.fitBounds(bounds);
    }
  };

  const handleRouteRequest = async (origin, destination) => {
    if (!directionsServiceRef.current || !directionsRendererRef.current) return;

    const destCoords = destination.location?.coordinates;
    if (!destCoords || !destCoords.lat || !destCoords.lng) return;

    const originCoords = origin.lat && origin.lng 
      ? origin 
      : { lat: origin.lat || 0, lng: origin.lng || 0 };

    try {
      // Get distance and time
      const routeData = await getDistanceAndTime(
        originCoords.lat,
        originCoords.lng,
        destCoords.lat,
        destCoords.lng,
        'driving'
      );

      setRouteInfo({
        distance: routeData.distance.text,
        duration: routeData.duration.text,
        distanceValue: routeData.distance.value,
        durationValue: routeData.duration.value,
      });

      // Display route on map
      directionsServiceRef.current.route(
        {
          origin: { lat: originCoords.lat, lng: originCoords.lng },
          destination: { lat: destCoords.lat, lng: destCoords.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === 'OK') {
            directionsRendererRef.current.setDirections(result);
          } else {
            console.error('Directions request failed:', status);
          }
        }
      );

      if (onRouteRequest) {
        onRouteRequest({
          listing: destination,
          distance: routeData.distance.text,
          duration: routeData.duration.text,
          distanceValue: routeData.distance.value,
          durationValue: routeData.duration.value,
        });
      }
    } catch (error) {
      console.error('Error getting route:', error);
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full min-h-[500px] rounded-lg" />
      {routeInfo && selectedListing && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg z-10 max-w-xs">
          <h4 className="font-semibold text-foreground mb-2">Route to {selectedListing.title}</h4>
          <div className="space-y-1 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium">Distance:</span> {routeInfo.distance}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium">Travel Time:</span> {routeInfo.duration}
            </p>
          </div>
          <button
            onClick={() => {
              directionsRendererRef.current.setDirections({ routes: [] });
              setRouteInfo(null);
            }}
            className="mt-2 text-xs text-primary hover:text-primary"
          >
            Clear Route
          </button>
        </div>
      )}
    </div>
  );
}

export default MapView;

