// Explore Page - "Explore All Staycations" design with mood pills
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getActiveListings, getFeaturedListings } from '../../services/listingsService';
import ListingCard from '../../components/ListingCard';
import SearchFilters from '../../components/SearchFilters';
import { getAllMoods } from '../../services/moodsService';
import MapView from '../../components/MapView';
import { getMoodStyle } from '../../utils/moodStyles';
import { getDefaultMoodsWithIcons } from '../../utils/defaultMoods';
import {
  getCurrentLocation,
  geocodeAddress,
  parseCoordinates,
  sortListingsByDistance,
  getDistanceAndTime,
} from '../../services/googleMapsService';
import { useAuth } from '../../contexts/AuthContext';
import { addToSavedListings, removeFromSavedListings, getSavedListings } from '../../services/usersService';

function ListingSkeleton() {
  return (
    <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-soft animate-pulse">
      <div className="aspect-[4/3] bg-muted" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-2/3 rounded bg-muted" />
        <div className="h-5 w-4/5 rounded bg-muted" />
        <div className="h-3 w-full rounded bg-muted" />
        <div className="h-3 w-3/4 rounded bg-muted" />
        <div className="flex justify-between pt-3 border-t border-border">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-5 w-24 rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function Explore() {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(() => ({
    search: searchParams.get('search') || searchParams.get('destination') || '',
    guests: searchParams.get('guests') || '',
    checkIn: searchParams.get('checkIn') || '',
    checkOut: searchParams.get('checkOut') || '',
  }));
  const [viewMode, setViewMode] = useState('all');
  const [moods, setMoods] = useState([]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [displayMode, setDisplayMode] = useState('grid');
  const [searchLocation, setSearchLocation] = useState(null);
  const [selectedListing, setSelectedListing] = useState(null);
  const [mapCenter, setMapCenter] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set());

  useEffect(() => {
    loadListings();
  }, [filters, viewMode]);

  useEffect(() => {
    getAllMoods()
      .then((data) => {
        if (data && data.length > 0) {
          setMoods(data.map((m) => ({ ...m, id: m.id || m.docId })));
        } else {
          setMoods(getDefaultMoodsWithIcons());
        }
      })
      .catch(() => setMoods(getDefaultMoodsWithIcons()));
  }, []);

  // Sync mood from URL ?mood=xxx
  useEffect(() => {
    const moodId = searchParams.get('mood');
    if (moodId && moods.length > 0) {
      const mood = moods.find((m) => (m.id || m.docId) === moodId);
      if (mood) setSelectedMood(mood);
    }
  }, [searchParams.get('mood'), moods]);

  useEffect(() => {
    if (currentUser) {
      getSavedListings(currentUser.uid)
        .then((ids) => setSavedIds(new Set(ids)))
        .catch(() => {});
    } else {
      setSavedIds(new Set());
    }
  }, [currentUser]);

  const loadListings = async () => {
    try {
      setLoading(true);
      setError(null);

      let results = [];
      if (viewMode === 'featured') {
        results = await getFeaturedListings(20);
      } else {
        const filterParams = {
          category: filters.category || undefined,
          city: filters.city || undefined,
          minPrice: filters.minPrice ? parseInt(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? parseInt(filters.maxPrice) : undefined,
          moodId: filters.moodId || selectedMood?.id || selectedMood?.docId || undefined,
        };

        if (filters.search) {
          results = await getActiveListings(filterParams, 100);
          const searchTerm = filters.search.toLowerCase();
          results = results.filter(
            (l) =>
              l.title?.toLowerCase().includes(searchTerm) ||
              l.description?.toLowerCase().includes(searchTerm) ||
              l.location?.city?.toLowerCase().includes(searchTerm) ||
              l.location?.address?.toLowerCase().includes(searchTerm)
          );
        } else {
          results = await getActiveListings(filterParams, 50);
        }

        if (filters.guests) {
          const guestCount = parseInt(filters.guests);
          results = results.filter((l) => l.maxGuests >= guestCount);
        }

        if (filters.checkIn && filters.checkOut) {
          const checkIn = new Date(filters.checkIn);
          const checkOut = new Date(filters.checkOut);
          results = results.filter((l) => {
            if (!l.calendar?.bookedDates) return true;
            return !l.calendar.bookedDates.some((r) => {
              const start = new Date(r.start);
              const end = new Date(r.end);
              return checkIn <= end && checkOut >= start;
            });
          });
        }
      }

      if (searchLocation?.lat && searchLocation?.lng) {
        results = sortListingsByDistance(results, searchLocation.lat, searchLocation.lng);
        const withTravel = await Promise.all(
          results.slice(0, 10).map(async (l) => {
            const coords = l.location?.coordinates;
            if (coords?.lat && coords?.lng) {
              try {
                const route = await getDistanceAndTime(
                  searchLocation.lat,
                  searchLocation.lng,
                  coords.lat,
                  coords.lng,
                  'driving'
                );
                return { ...l, travelTime: route.duration.text, travelDistance: route.distance.text };
              } catch {
                return l;
              }
            }
            return l;
          })
        );
        results = [...withTravel, ...results.slice(10)];
      }

      setListings(results);
    } catch (err) {
      console.error(err);
      setError('Failed to load listings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (searchFilters) => {
    setFilters((prev) => ({ ...prev, ...searchFilters }));
  };

  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  const handleMoodSelect = (mood) => {
    setSelectedMood(mood);
    if (mood?.id) localStorage.setItem('solora:selectedMood', mood.id);
    else localStorage.removeItem('solora:selectedMood');
    setFilters((prev) => ({ ...prev, moodId: mood ? mood.id : undefined }));
  };

  const handleLocationSearch = async (input) => {
    if (!input?.trim()) {
      setSearchLocation(null);
      setMapCenter(null);
      return;
    }
    setLocationLoading(true);
    try {
      const coords = parseCoordinates(input);
      if (coords) {
        setSearchLocation(coords);
        setMapCenter({ ...coords, zoom: 12 });
        return;
      }
      const geocoded = await geocodeAddress(input);
      setSearchLocation({ lat: geocoded.lat, lng: geocoded.lng });
      setMapCenter({ lat: geocoded.lat, lng: geocoded.lng, zoom: 12 });
    } catch {
      alert('Could not find that location. Try a different address or coordinates.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleUseGPS = async () => {
    setLocationLoading(true);
    try {
      const loc = await getCurrentLocation();
      setSearchLocation(loc);
      setMapCenter({ ...loc, zoom: 12 });
    } catch {
      alert('Could not get your location. Enable permissions or enter an address.');
    } finally {
      setLocationLoading(false);
    }
  };

  const handleFavoriteToggle = async (listingId) => {
    if (!currentUser) return;
    try {
      if (savedIds.has(listingId)) {
        await removeFromSavedListings(currentUser.uid, listingId);
        setSavedIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      } else {
        await addToSavedListings(currentUser.uid, listingId);
        setSavedIds((prev) => new Set([...prev, listingId]));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleListingClick = (listing) => {
    setSelectedListing(listing);
    const coords = listing.location?.coordinates;
    if (coords?.lat && coords?.lng) {
      setMapCenter({ lat: coords.lat, lng: coords.lng, zoom: 15 });
    }
  };

  const handleRouteRequest = (routeData) => {
    setListings((prev) =>
      prev.map((l) =>
        l.id === routeData.listing.id
          ? { ...l, travelTime: routeData.duration, travelDistance: routeData.distance }
          : l
      )
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header section */}
      <div className="container-custom pt-8 pb-6">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
          Explore All Staycations
        </h1>
        <p className="text-muted-foreground text-lg">
          Discover mood-matched staycations for every feeling
        </p>
      </div>

      {/* Mood pills + Filters */}
      <div className="border-y border-border bg-card/50">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {moods.map((mood) => {
                const id = mood.id || mood.docId;
                const style = getMoodStyle(id);
                const isActive = selectedMood?.id === id || selectedMood?.docId === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleMoodSelect(isActive ? null : mood)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted/60 text-foreground hover:bg-muted'
                    }`}
                  >
                    <span>{mood.icon || style.icon}</span>
                    {mood.name}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => setShowFilters((s) => !s)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium shrink-0 border transition-colors ${
                showFilters ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-muted'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 pt-4 border-t border-border">
              <SearchFilters
                onSearch={handleSearch}
                onFilterChange={handleFilterChange}
                filters={filters}
                onLocationSearch={handleLocationSearch}
                onUseGPS={handleUseGPS}
                locationLoading={locationLoading}
                searchLocation={searchLocation}
                compact
              />
            </div>
          )}
        </div>
      </div>

      {/* Results bar */}
      <div className="container-custom py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <p className="text-muted-foreground">
            {loading
              ? 'Finding staycations for you'
              : `Showing ${listings.length} staycation${listings.length !== 1 ? 's' : ''}`}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                viewMode === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewMode('featured')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                viewMode === 'featured' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
              }`}
            >
              Featured
            </button>
            <div className="flex rounded-xl overflow-hidden border border-border">
              <button
                onClick={() => setDisplayMode('grid')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  displayMode === 'grid' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setDisplayMode('map')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  displayMode === 'map' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                Map
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Listings */}
      <div className="container-custom pb-12">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
              <ListingSkeleton key={item} />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="bg-destructive/10 border border-destructive/30 text-destructive px-6 py-4 rounded-xl inline-block">
              {error}
            </div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="w-16 h-16 text-muted-foreground mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="text-xl font-semibold text-foreground mb-2">No listings found</h3>
            <p className="text-muted-foreground">Try adjusting your search or filters</p>
          </div>
        ) : displayMode === 'map' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="rounded-2xl overflow-hidden border border-border" style={{ height: '600px' }}>
                <MapView
                  listings={listings}
                  center={mapCenter}
                  onListingClick={handleListingClick}
                  selectedListing={selectedListing}
                  searchLocation={searchLocation}
                  onRouteRequest={handleRouteRequest}
                />
              </div>
            </div>
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {listings.map((listing) => (
                <div
                  key={listing.id}
                  onClick={() => handleListingClick(listing)}
                  className={`rounded-xl border p-4 cursor-pointer transition-all ${
                    selectedListing?.id === listing.id ? 'ring-2 ring-primary border-primary' : 'border-border hover:shadow-soft'
                  }`}
                >
                  <div className="flex gap-4">
                    {(listing.featuredPhoto || listing.photos?.[0]) && (
                      <img
                        src={listing.featuredPhoto || listing.photos[0]}
                        alt={listing.title}
                        className="w-24 h-24 object-cover rounded-lg shrink-0"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground truncate">{listing.title}</h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {listing.location?.city}, {listing.location?.state || listing.location?.country}
                      </p>
                      <p className="text-primary font-semibold mt-1">
                        ₱{Number(listing.basePrice || 0).toLocaleString()}/night
                      </p>
                      {listing.travelTime && (
                        <p className="text-xs text-muted-foreground">{listing.travelTime} drive</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <div key={listing.id}>
                <ListingCard
                  listing={listing}
                  moods={moods}
                  isFavorite={savedIds.has(listing.id)}
                  onFavoriteClick={currentUser ? handleFavoriteToggle : undefined}
                />
                {listing.travelTime && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    {listing.travelDistance} · {listing.travelTime} drive
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default Explore;
