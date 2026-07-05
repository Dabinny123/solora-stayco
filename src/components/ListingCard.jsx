// Listing Card - Explore page design with Featured tag, mood pill, heart
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMoodStyle } from '../utils/moodStyles';

function ListingCard({ listing, moods = [], isFavorite, onFavoriteClick }) {
  const [localFavorite, setLocalFavorite] = useState(isFavorite);

  const primaryMoodId = listing.moodTags?.[0];
  const primaryMood = moods.find((m) => (m.id || m.docId) === primaryMoodId);
  const primaryMoodName = primaryMood?.name || primaryMoodId;
  const moodStyle = primaryMoodId ? getMoodStyle(primaryMoodId) : null;

  const formatPrice = (price) => {
    const curr = listing?.currency || 'PHP';
    if (curr === 'PHP' || curr === '₱') {
      return `₱${Number(price).toLocaleString()}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr || 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (onFavoriteClick) {
      onFavoriteClick(listing.id);
    } else {
      setLocalFavorite((f) => !f);
    }
  };

  const isFav = onFavoriteClick ? isFavorite : localFavorite;
  const showFeatured = listing.rating >= 4 || listing.totalReviews >= 10;

  const imgSrc = listing.featuredPhoto || listing.photos?.[0];

  if (!listing || !listing.id) return null;

  return (
    <Link to={`/listing/${listing.id}`} className="block group">
      <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-soft hover:shadow-medium transition-all duration-200 h-full">
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={listing.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground bg-muted"><svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>';
              }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* Featured tag */}
          {showFeatured && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              Featured
            </div>
          )}

          {/* Favorite heart */}
          <button
            onClick={handleFavorite}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-colors shadow-soft"
            aria-label="Save"
          >
            <svg
              className={`w-5 h-5 transition-colors ${isFav ? 'fill-secondary text-secondary' : 'text-muted-foreground'}`}
              fill={isFav ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {/* Mood tag */}
          {moodStyle && (
            <div
              className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-gradient-to-r ${moodStyle.gradient} text-white text-xs font-medium flex items-center gap-1.5`}
            >
              <span>{moodStyle.icon}</span>
              <span>{primaryMoodName || primaryMoodId}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">
              {listing.location?.city}, {listing.location?.state || listing.location?.country}
            </span>
          </div>

          <h3 className="font-serif text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {listing.title}
          </h3>

          {listing.description && (
            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
              {listing.description}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            {listing.maxGuests > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {listing.maxGuests} guests
              </span>
            )}
            {(listing.bedrooms ?? listing.beds) > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {listing.bedrooms ?? listing.beds} bed
              </span>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            {listing.rating > 0 && (
              <span className="flex items-center gap-1 text-foreground font-medium">
                <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                {listing.rating.toFixed(1)}
                <span className="text-muted-foreground font-normal text-sm">({listing.totalReviews || 0})</span>
              </span>
            )}
            <div className="text-right">
              <span className="font-serif text-lg font-semibold text-foreground">
                {formatPrice(listing.basePrice)}
              </span>
              <span className="text-muted-foreground text-sm ml-1">/ night</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default ListingCard;
