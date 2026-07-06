// Listing Card - Explore page design with safer public-facing fallbacks
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { getMoodStyle } from '../utils/moodStyles';

const FALLBACK_STAYS = {
  relaxed: {
    title: 'Calm Coastal Hideaway',
    description: 'A soft, sunlit stay made for slow mornings, quiet corners, and easy recharging.',
    image: '/mood-relaxed.jpg',
  },
  romantic: {
    title: 'Sunset Suite for Two',
    description: 'An intimate escape with warm views, cozy textures, and space to reconnect.',
    image: '/mood-romantic.jpg',
  },
  adventurous: {
    title: 'Island Adventure Villa',
    description: 'A scenic base for thrill seekers, explorers, and spontaneous weekend plans.',
    image: '/mood-adventurous.jpg',
  },
  creative: {
    title: 'Creative Seaside Studio',
    description: 'A bright retreat for journaling, planning, making, and finding fresh ideas.',
    image: '/mood-creative.jpg',
  },
  family: {
    title: 'Family Poolside Stay',
    description: 'A welcoming stay with room for shared meals, laughter, and easy family time.',
    image: '/mood-family.jpg',
  },
  needPeace: {
    title: 'Quiet Garden Retreat',
    description: 'A peaceful hideaway for guests who want silence, softness, and breathing room.',
    image: '/mood-peace.jpg',
  },
  selfCare: {
    title: 'Self-Care Wellness Nook',
    description: 'A restorative stay for restful nights, gentle routines, and unhurried comfort.',
    image: '/mood-selfcare.jpg',
  },
  soloRecharge: {
    title: 'Solo Recharge Cabin',
    description: 'A private escape designed for reflection, reset days, and independent travel.',
    image: '/mood-solo.jpg',
  },
  default: {
    title: 'Curated Mood Stay',
    description: 'A thoughtfully prepared staycation matched to the feeling you want from your trip.',
    image: '/hero-staycation.jpg',
  },
};

function looksLikeTestText(value) {
  const text = String(value || '').trim().toLowerCase();
  if (!text || text.length < 4) return true;
  if (/(asdf|asdasd|aaaa|test|sample|lorem|dummy)/i.test(text)) return true;

  const letters = text.replace(/[^a-z]/g, '');
  return letters.length >= 8 && new Set(letters).size <= 4;
}

function ListingCard({ listing, moods = [], isFavorite, onFavoriteClick }) {
  const [localFavorite, setLocalFavorite] = useState(isFavorite);
  const [imageFailed, setImageFailed] = useState(false);

  if (!listing || !listing.id) return null;

  const primaryMoodId = listing.moodTags?.[0];
  const primaryMood = moods.find((m) => (m.id || m.docId) === primaryMoodId);
  const primaryMoodName = primaryMood?.name || primaryMoodId;
  const moodStyle = primaryMoodId ? getMoodStyle(primaryMoodId) : null;
  const fallback = FALLBACK_STAYS[primaryMoodId] || FALLBACK_STAYS.default;
  const titleLooksTemporary = looksLikeTestText(listing.title);
  const descriptionLooksTemporary = looksLikeTestText(listing.description);
  const displayTitle = titleLooksTemporary ? fallback.title : listing.title;
  const displayDescription = descriptionLooksTemporary ? fallback.description : listing.description;
  const displayCity = listing.location?.city || 'Mood-matched destination';
  const displayRegion = listing.location?.state || listing.location?.country || 'Solora StayCo';
  const displayGuests = Number(listing.maxGuests) > 0 ? Number(listing.maxGuests) : 2;
  const displayBeds = Number(listing.bedrooms ?? listing.beds) > 0 ? Number(listing.bedrooms ?? listing.beds) : 1;
  const displayPrice = Number(listing.basePrice) > 0 ? Number(listing.basePrice) : 3500;
  const rawImage = listing.featuredPhoto || listing.photos?.[0];
  const imgSrc = imageFailed || titleLooksTemporary ? fallback.image : rawImage || fallback.image;

  const formatPrice = (price) => {
    const curr = listing?.currency || 'PHP';
    if (curr === 'PHP' || curr === '\u20b1') {
      return `\u20b1${Number(price).toLocaleString()}`;
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

  return (
    <Link to={`/listing/${listing.id}`} className="block group">
      <div className="bg-card rounded-2xl overflow-hidden border border-border shadow-soft hover:shadow-medium transition-all duration-200 h-full">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={imgSrc}
            alt={displayTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageFailed(true)}
          />

          {showFeatured && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
              Featured
            </div>
          )}

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

          {moodStyle && (
            <div
              className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-full bg-gradient-to-r ${moodStyle.gradient} text-white text-xs font-medium flex items-center gap-1.5`}
            >
              <span>{moodStyle.icon}</span>
              <span>{primaryMoodName || primaryMoodId}</span>
            </div>
          )}
        </div>

        <div className="p-4">
          <div className="flex items-center gap-1 text-muted-foreground text-sm mb-1">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="line-clamp-1">
              {displayCity}, {displayRegion}
            </span>
          </div>

          <h3 className="font-serif text-lg font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">
            {displayTitle}
          </h3>

          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {displayDescription}
          </p>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {displayGuests} guests
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {displayBeds} bed{displayBeds === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-border">
            {listing.rating > 0 ? (
              <span className="flex items-center gap-1 text-foreground font-medium">
                <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                {listing.rating.toFixed(1)}
                <span className="text-muted-foreground font-normal text-sm">({listing.totalReviews || 0})</span>
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">New stay</span>
            )}
            <div className="text-right">
              <span className="font-serif text-lg font-semibold text-foreground">
                {formatPrice(displayPrice)}
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
