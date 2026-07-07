// Listing Detail Page - Solara design matching reference
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getListing, incrementListingViews } from '../../services/listingsService';
import { getListingReviews } from '../../services/reviewsService';
import { useAuth } from '../../contexts/AuthContext';
import { addToSavedListings, removeFromSavedListings, getSavedListings } from '../../services/usersService';
import { getMoodsByIds } from '../../services/moodsService';
import { getUser } from '../../services/usersService';
import VerificationModal from '../../components/VerificationModal';

// Amenity icon mapping
const AMENITY_ICONS = {
  wifi: '📶',
  kitchen: '🍳',
  garden: '🌿',
  meditation: '🧘',
  fireplace: '🔥',
  'mountain view': '⛰️',
  pool: '🏊',
  parking: '🚗',
  ac: '❄️',
  tv: '📺',
  default: '✓',
};

function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isEmailVerified } = useAuth();
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [host, setHost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [moodNames, setMoodNames] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    loadListing();
  }, [id]);

  useEffect(() => {
    if (currentUser && listing) checkFavoriteStatus();
  }, [currentUser, listing]);

  const loadListing = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!id) {
        setError('Invalid listing ID');
        setLoading(false);
        return;
      }

      const listingData = await getListing(id);
      if (!listingData) {
        setError('Listing not found');
        setLoading(false);
        return;
      }

      setListing(listingData);

      if (listingData.hostId) {
        try {
          const hostData = await getUser(listingData.hostId);
          setHost(hostData);
        } catch (e) {
          console.warn('Failed to load host:', e);
        }
      }

      if (listingData.moodTags?.length > 0) {
        try {
          const moods = await getMoodsByIds(listingData.moodTags);
          setMoodNames(moods || []);
        } catch (e) {
          setMoodNames([]);
        }
      }

      try {
        await incrementListingViews(id);
      } catch (e) {}
      try {
        const rev = await getListingReviews(id);
        setReviews(rev || []);
      } catch (e) {
        setReviews([]);
      }
    } catch (err) {
      setError(`Failed to load listing: ${err.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  const checkFavoriteStatus = async () => {
    try {
      const saved = await getSavedListings(currentUser.uid);
      setIsFavorite(saved.includes(id));
    } catch (e) {}
  };

  const handleToggleFavorite = () => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    if (isFavorite) {
      removeFromSavedListings(currentUser.uid, id).then(() => setIsFavorite(false));
    } else {
      addToSavedListings(currentUser.uid, id).then(() => setIsFavorite(true));
    }
  };

  const handleBookNow = () => {
    if (!currentUser) {
      navigate('/signin');
      return;
    }
    // Block unverified users — show verification modal
    if (!isEmailVerified) {
      setShowVerifyModal(true);
      return;
    }
    const params = new URLSearchParams({
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      guests: guests.toString(),
    });
    navigate(`/booking/${id}?${params.toString()}`);
  };

  const handleVerified = () => {
    setShowVerifyModal(false);
    // Proceed to booking after verification
    const params = new URLSearchParams({
      checkIn: checkIn || '',
      checkOut: checkOut || '',
      guests: guests.toString(),
    });
    navigate(`/booking/${id}?${params.toString()}`);
  };

  const formatPrice = (price) => {
    const curr = listing?.currency || 'PHP';
    if (curr === 'PHP' || curr === '₱') {
      return `₱${Number(price).toLocaleString()}`;
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: curr,
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getAmenityIcon = (name) => {
    const key = String(name || '').toLowerCase().replace(/\s+/g, ' ');
    for (const [k, icon] of Object.entries(AMENITY_ICONS)) {
      if (key.includes(k)) return icon;
    }
    return AMENITY_ICONS.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Listing Not Found</h2>
          <p className="text-muted-foreground mb-6">{error || 'The listing does not exist.'}</p>
          <Link to="/explore" className="btn btn-primary">
            Back to Explore
          </Link>
        </div>
      </div>
    );
  }

  const photos = listing.photos
    ? (Array.isArray(listing.photos) ? listing.photos : [listing.photos])
    : listing.featuredPhoto ? [listing.featuredPhoto] : [];
  const validPhotos = photos.filter((p) => p && p.trim());
  const primaryMood = moodNames[0] || { name: 'Relaxed' };
  const locationStr = [listing.location?.city, listing.location?.state || listing.location?.country]
    .filter(Boolean)
    .join(', ');
  const hostYears = host?.hostInfo?.totalListings ? '2 years hosting' : 'New host';
  const isSuperhost = host?.hostInfo?.rating >= 4.5 && (host?.hostInfo?.totalBookings || 0) >= 10;

  return (
    <div className="min-h-screen bg-background">
      <div className="container-custom py-6 sm:py-8">
        {/* Back link */}
        <Link
          to="/explore"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to explore
        </Link>

        <div className="flex flex-col lg:flex-row lg:items-start gap-8 lg:gap-12">
          {/* Left column - Place details */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Image gallery - all photos clickable to open lightbox */}
            {validPhotos.length > 0 ? (
              <>
                <div className="grid grid-cols-4 gap-2 h-[400px] sm:h-[480px]">
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(0)}
                    className="col-span-4 sm:col-span-2 row-span-2 rounded-xl overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <img
                      src={validPhotos[0]}
                      alt={listing.title}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                      }}
                    />
                  </button>
                  {validPhotos.slice(1, 3).map((photo, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLightboxIndex(i + 1)}
                      className="col-span-2 sm:col-span-1 rounded-xl overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <img
                        src={photo}
                        alt={`${listing.title} ${i + 2}`}
                        className="w-full h-full object-cover cursor-pointer hover:opacity-95 transition-opacity"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=Image';
                        }}
                      />
                    </button>
                  ))}
                </div>
                {/* Show remaining photos as small clickable thumbnails if more than 3 */}
                {validPhotos.length > 3 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {validPhotos.slice(3).map((photo, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setLightboxIndex(3 + i)}
                        className="w-20 h-20 rounded-lg overflow-hidden shrink-0 focus:outline-none focus:ring-2 focus:ring-primary/50"
                      >
                        <img
                          src={photo}
                          alt={`${listing.title} ${4 + i}`}
                          className="w-full h-full object-cover hover:opacity-90 transition-opacity"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80?text=Image';
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
                {/* Lightbox modal */}
                {lightboxIndex !== null && (
                  <div
                    className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                    onClick={() => setLightboxIndex(null)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setLightboxIndex(null);
                      if (e.key === 'ArrowLeft') setLightboxIndex((prev) => (prev <= 0 ? validPhotos.length - 1 : prev - 1));
                      if (e.key === 'ArrowRight') setLightboxIndex((prev) => (prev >= validPhotos.length - 1 ? 0 : prev + 1));
                    }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Photo gallery"
                    tabIndex={0}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(null);
                      }}
                      className="absolute top-4 right-4 text-white/90 hover:text-white p-2 rounded-full hover:bg-white/10 z-10"
                      aria-label="Close"
                    >
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    {validPhotos.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex((prev) => (prev <= 0 ? validPhotos.length - 1 : prev - 1));
                          }}
                          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white p-2 rounded-full hover:bg-white/10 z-10"
                          aria-label="Previous photo"
                        >
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setLightboxIndex((prev) => (prev >= validPhotos.length - 1 ? 0 : prev + 1));
                          }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/90 hover:text-white p-2 rounded-full hover:bg-white/10 z-10"
                          aria-label="Next photo"
                        >
                          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                    <div
                      className="max-w-5xl max-h-[90vh] w-full flex items-center justify-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <img
                        src={validPhotos[lightboxIndex]}
                        alt={`${listing.title} - Photo ${lightboxIndex + 1}`}
                        className="max-w-full max-h-[90vh] object-contain rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/1200x800?text=Image+Not+Available';
                        }}
                      />
                    </div>
                    <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/80 text-sm">
                      {lightboxIndex + 1} / {validPhotos.length}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="h-80 rounded-xl bg-muted flex items-center justify-center">
                <span className="text-muted-foreground">No photos</span>
              </div>
            )}

            {/* Mood tag */}
            {primaryMood && (
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <span>✨</span>
                Perfect for {primaryMood.name}
              </div>
            )}

            {/* Title, rating, location */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">
                {listing.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                {listing.rating > 0 && (
                  <span className="flex items-center gap-1 text-foreground">
                    <svg className="w-5 h-5 text-amber-500 fill-amber-500" viewBox="0 0 20 20">
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                    <span className="font-medium">{listing.rating.toFixed(1)}</span>
                    <span className="text-sm">({listing.totalReviews || 0} reviews)</span>
                  </span>
                )}
                {locationStr && (
                  <span className="flex items-center gap-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {locationStr}
                  </span>
                )}
              </div>
            </div>

            {/* Key features */}
            <div className="flex flex-wrap gap-6 py-4 border-y border-border">
              {listing.maxGuests > 0 && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {listing.maxGuests} guests
                </span>
              )}
              {(listing.bedrooms ?? listing.beds) > 0 && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  {listing.bedrooms ?? listing.beds} bedrooms
                </span>
              )}
              {listing.bathrooms > 0 && (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                  </svg>
                  {listing.bathrooms} bathrooms
                </span>
              )}
            </div>

            {/* Host */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden bg-muted shrink-0">
                {host?.profilePhoto ? (
                  <img src={host.profilePhoto} alt={host.displayName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground font-semibold text-lg">
                    {(host?.displayName || 'H')[0].toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <p className="font-semibold text-foreground">Hosted by {host?.displayName || 'Host'}</p>
                <p className="text-sm text-muted-foreground">
                  {isSuperhost ? 'Superhost' : 'Host'} · {hostYears}
                </p>
              </div>
            </div>

            {/* About this place */}
            <div>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">About this place</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                {listing.description || 'No description available.'}
              </p>
            </div>

            {/* Ambiance & Atmosphere */}
            {(listing.lighting || listing.ambienceTags?.length > 0) && (
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Ambiance & Atmosphere</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {listing.lighting && (
                    <div className="rounded-xl bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground mb-1">Lighting</p>
                      <p className="font-medium text-foreground capitalize">{listing.lighting}</p>
                    </div>
                  )}
                  <div className="rounded-xl bg-muted/50 p-4">
                    <p className="text-sm text-muted-foreground mb-1">Noise Level</p>
                    <p className="font-medium text-foreground">Quiet</p>
                  </div>
                  {locationStr && (
                    <div className="rounded-xl bg-muted/50 p-4">
                      <p className="text-sm text-muted-foreground mb-1">Location</p>
                      <p className="font-medium text-foreground">Nature</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* What this place offers */}
            {listing.amenities && listing.amenities.length > 0 && (
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">What this place offers</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {listing.amenities.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 rounded-xl bg-muted/50 px-4 py-3"
                    >
                      <span className="text-xl">{getAmenityIcon(a)}</span>
                      <span className="text-foreground font-medium">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities nearby */}
            {(listing.ambienceTags?.length > 0 || moodNames.length > 0) && (
              <div>
                <h2 className="font-serif text-2xl font-semibold text-foreground mb-4">Activities nearby</h2>
                <div className="flex flex-wrap gap-2">
                  {[
                    ...(listing.ambienceTags || []),
                    ...moodNames.map((m) => m.name),
                  ]
                    .filter(Boolean)
                    .slice(0, 6)
                    .map((tag, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 rounded-full bg-muted/50 text-foreground text-sm font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Right column - Booking widget (floats on right) */}
          <div className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-24">
            <div className="bg-card rounded-2xl shadow-soft border border-border p-6">
              <div className="flex justify-end gap-2 mb-4">
                <button
                  onClick={handleToggleFavorite}
                  className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Save"
                >
                  <svg
                    className="w-5 h-5"
                    fill={isFavorite ? 'currentColor' : 'none'}
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('Link copied!');
                  }}
                  className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors"
                  aria-label="Share"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <span className="text-2xl font-bold text-foreground">{formatPrice(listing.basePrice)}</span>
                <span className="text-muted-foreground ml-1">/ night</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Check-in</label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Check-out</label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    min={checkIn || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-foreground text-sm"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Guests <span className="text-muted-foreground font-normal">Max {listing.maxGuests || 4}</span>
                </label>
                <div className="flex items-center gap-3 rounded-xl border border-border p-2">
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="w-10 h-10 rounded-lg border border-border text-muted-foreground hover:bg-muted flex items-center justify-center font-medium"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-medium">{guests}</span>
                  <button
                    type="button"
                    onClick={() => setGuests((g) => Math.min(listing.maxGuests || 10, g + 1))}
                    className="w-10 h-10 rounded-lg border border-border text-muted-foreground hover:bg-muted flex items-center justify-center font-medium"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleBookNow}
                className="w-full btn btn-primary py-3.5 rounded-xl text-base font-medium"
              >
                {currentUser ? 'Select dates' : 'Sign in to continue'}
              </button>
              <p className="text-center text-sm text-muted-foreground mt-4">You won't be charged yet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Email Verification Modal */}
      <VerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
        onVerified={handleVerified}
      />
    </div>
  );
}

export default ListingDetail;
