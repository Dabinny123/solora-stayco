// Search and Filters Component for Solora StayCo
import React, { useState } from 'react';
import PlacesAutocomplete from './PlacesAutocomplete';

function SearchFilters({ onSearch, onFilterChange, filters, onLocationSearch, onUseGPS, locationLoading, searchLocation, compact }) {
  const [localFilters, setLocalFilters] = useState({
    search: filters?.search || '',
    category: filters?.category || '',
    city: filters?.city || '',
    minPrice: filters?.minPrice || '',
    maxPrice: filters?.maxPrice || '',
    guests: filters?.guests || '',
    checkIn: filters?.checkIn || '',
    checkOut: filters?.checkOut || '',
  });
  const [locationInput, setLocationInput] = useState('');

  const handleChange = (field, value) => {
    const newFilters = { ...localFilters, [field]: value };
    setLocalFilters(newFilters);
    if (onFilterChange) {
      onFilterChange(newFilters);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch) {
      onSearch(localFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      city: '',
      minPrice: '',
      maxPrice: '',
      guests: '',
      checkIn: '',
      checkOut: '',
    };
    setLocalFilters(clearedFilters);
    if (onFilterChange) {
      onFilterChange(clearedFilters);
    }
  };

  return (
    <div className={compact ? '' : 'bg-card border-b border-border sticky top-16 z-40'}>
      <div className={compact ? 'space-y-4' : 'container-custom py-6'}>
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by location, title, or description..."
                className="input"
                value={localFilters.search}
                onChange={(e) => handleChange('search', e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary px-8">
              Search
            </button>
          </div>

          {/* Location Search for Nearest Stays */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <label className="block text-sm font-semibold text-primary">
                Find Nearest Stays
              </label>
            </div>
            <p className="text-xs text-primary/80 mb-3">
              Enter an address, coordinates (lat,lng), or use GPS to find stays near you
            </p>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <PlacesAutocomplete
                  value={locationInput}
                  onChange={setLocationInput}
                  onPlaceSelect={(place) => {
                    if (place.coordinates && onLocationSearch) {
                      // Use the selected place coordinates directly
                      onLocationSearch(`${place.coordinates.lat},${place.coordinates.lng}`);
                    }
                  }}
                  placeholder="Start typing an address or enter coordinates (e.g., 40.7128,-74.0060)"
                  types={['geocode', 'establishment']}
                  className="input w-full"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (locationInput.trim() && onLocationSearch) {
                    onLocationSearch(locationInput);
                  }
                }}
                disabled={locationLoading || !locationInput.trim()}
                className="btn btn-primary whitespace-nowrap"
              >
                {locationLoading ? 'Searching...' : 'Search Location'}
              </button>
              <button
                type="button"
                onClick={onUseGPS}
                disabled={locationLoading}
                className="btn btn-outline whitespace-nowrap"
                title="Use your current GPS location"
              >
                <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use GPS
              </button>
              {searchLocation && (
                <button
                  type="button"
                  onClick={() => {
                    setLocationInput('');
                    onLocationSearch && onLocationSearch('');
                  }}
                  className="btn btn-outline text-red-600 border-red-300 whitespace-nowrap"
                >
                  Clear
                </button>
              )}
            </div>
            {searchLocation && (
              <div className="mt-2 text-xs text-primary bg-card px-3 py-2 rounded-lg border border-primary/20">
                <span className="font-medium">Searching near:</span> {searchLocation.lat.toFixed(4)}, {searchLocation.lng.toFixed(4)}
              </div>
            )}
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category
              </label>
              <select
                className="input"
                value={localFilters.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="Home">Home</option>
                <option value="Experience">Experience</option>
                <option value="Service">Service</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Where (City)
              </label>
              <input
                type="text"
                placeholder="City"
                className="input"
                value={localFilters.city}
                onChange={(e) => handleChange('city', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Check-in
              </label>
              <input
                type="date"
                className="input"
                value={localFilters.checkIn}
                onChange={(e) => handleChange('checkIn', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Check-out
              </label>
              <input
                type="date"
                className="input"
                value={localFilters.checkOut}
                onChange={(e) => handleChange('checkOut', e.target.value)}
                min={localFilters.checkIn || new Date().toISOString().split('T')[0]}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Who (Guests)
              </label>
              <input
                type="number"
                placeholder="Number of guests"
                className="input"
                min="1"
                value={localFilters.guests}
                onChange={(e) => handleChange('guests', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Min Price
              </label>
              <input
                type="number"
                placeholder="Min"
                className="input"
                value={localFilters.minPrice}
                onChange={(e) => handleChange('minPrice', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Max Price
              </label>
              <input
                type="number"
                placeholder="Max"
                className="input"
                value={localFilters.maxPrice}
                onChange={(e) => handleChange('maxPrice', e.target.value)}
              />
            </div>
          </div>

          {/* Clear Filters */}
          {(localFilters.category || localFilters.city || localFilters.minPrice || 
            localFilters.maxPrice || localFilters.guests || localFilters.checkIn || localFilters.checkOut) && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-primary hover:text-primary/90"
            >
              Clear filters
            </button>
          )}
        </form>
      </div>
    </div>
  );
}

export default SearchFilters;

