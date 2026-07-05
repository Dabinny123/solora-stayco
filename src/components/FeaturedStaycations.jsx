// FeaturedStaycations - Hand-picked staycations from Firestore
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getFeaturedListings, getActiveListings } from '../services/listingsService';
import ListingCard from './ListingCard';

function FeaturedStaycations() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getFeaturedListings(8)
      .then((data) => {
        if (cancelled) return;
        if (data && data.length > 0) {
          setListings(data);
          setLoading(false);
          return;
        }
        return getActiveListings({}, 8);
      })
      .then((fallback) => {
        if (cancelled) return;
        if (fallback && fallback.length > 0) {
          setListings(fallback);
        }
      })
      .catch(() => {
        if (!cancelled) getActiveListings({}, 8).then((d) => setListings(d || []));
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const featured = listings.slice(0, 4);

  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
              Featured Escapes
            </h2>
            <p className="text-muted-foreground">
              Hand-picked staycations loved by our mood-matched travelers
            </p>
          </div>
          <Link
            to="/explore"
            className="btn btn-outline inline-flex items-center gap-2 group"
          >
            View All
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="card h-80 animate-pulse bg-muted/50" />
            ))}
          </div>
        ) : featured.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featured.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-12">
            No featured listings yet. Check back soon!
          </p>
        )}
      </div>
    </section>
  );
}

export default FeaturedStaycations;
