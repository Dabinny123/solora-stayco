// Wishlist Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getSavedListings } from '../../services/usersService';
import { getListing } from '../../services/listingsService';
import ListingCard from '../../components/ListingCard';

function Wishlist() {
  const { currentUser } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (currentUser) {
      loadWishlist();
    }
  }, [currentUser]);

  const loadWishlist = async () => {
    try {
      setLoading(true);
      setError(null);

      const savedListingIds = await getSavedListings(currentUser.uid);
      
      // Fetch full listing data for each saved listing ID
      const listingPromises = savedListingIds.map(id => getListing(id));
      const listingResults = await Promise.all(listingPromises);
      
      // Filter out null results (deleted listings)
      const validListings = listingResults.filter(listing => listing !== null);
      
      setListings(validListings);
    } catch (err) {
      console.error('Error loading wishlist:', err);
      setError('Failed to load wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view your wishlist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">My Wishlist</h1>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading wishlist...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg inline-block">
            {error}
          </div>
        </div>
      ) : listings.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-muted-foreground/70 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-foreground mb-2">Your wishlist is empty</h3>
          <p className="text-muted-foreground mb-6">Start exploring and save your favorite listings!</p>
          <a href="/explore" className="btn btn-primary">
            Explore Listings
          </a>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground mb-6">
            {listings.length} {listings.length === 1 ? 'listing' : 'listings'} saved
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Wishlist;

