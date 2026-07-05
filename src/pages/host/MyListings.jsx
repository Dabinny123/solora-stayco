// My Listings Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getListingsByHost, deleteListing } from '../../services/listingsService';
import ListingCard from '../../components/ListingCard';

function MyListings() {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'draft', 'inactive'

  useEffect(() => {
    if (currentUser) {
      loadListings();
    }
  }, [currentUser, filter]);

  const loadListings = async () => {
    try {
      setLoading(true);
      const allListings = await getListingsByHost(currentUser.uid);
      
      let filtered = allListings;
      if (filter !== 'all') {
        filtered = allListings.filter(listing => listing.status === filter);
      }
      
      setListings(filtered);
    } catch (err) {
      console.error('Error loading listings:', err);
      // The fallback query should handle index errors, so this is a real error
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (listingId) => {
    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return;
    }

    try {
      await deleteListing(listingId);
      loadListings();
    } catch (err) {
      console.error('Error deleting listing:', err);
      alert('Failed to delete listing');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="container-custom py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground">My Listings</h1>
        <Link to="/host/listings/create" className="btn btn-primary">
          Create New Listing
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {['all', 'active', 'draft', 'inactive'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === status
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading listings...</p>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <h3 className="text-xl font-semibold text-foreground mb-2">No listings found</h3>
          <p className="text-muted-foreground mb-6">Create your first listing to get started!</p>
          <Link to="/host/listings/create" className="btn btn-primary">
            Create Listing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing) => (
            <div key={listing.id} className="card relative">
              <Link to={`/listing/${listing.id}`} className="block mb-4">
                {listing.featuredPhoto ? (
                  <img
                    src={listing.featuredPhoto}
                    alt={listing.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted rounded-lg flex items-center justify-center">
                    <svg className="w-12 h-12 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </Link>
              
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <Link to={`/listing/${listing.id}`}>
                    <h3 className="font-semibold text-foreground hover:text-primary">
                      {listing.title}
                    </h3>
                  </Link>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    listing.status === 'active' ? 'bg-green-100 text-green-800' :
                    listing.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-muted text-foreground'
                  }`}>
                    {listing.status}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {listing.location?.city}, {listing.location?.state || listing.location?.country}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="font-bold">{formatPrice(listing.basePrice)}/night</span>
                  {listing.rating > 0 && (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                      <span className="ml-1 text-sm">{listing.rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  <Link
                    to={`/host/listings/${listing.id}/edit`}
                    className="flex-1 btn btn-outline text-sm py-2 text-center"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="flex-1 btn btn-outline text-sm py-2 text-red-600 border-red-300 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default MyListings;

