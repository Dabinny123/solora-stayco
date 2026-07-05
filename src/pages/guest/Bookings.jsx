// Guest Bookings Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getBookingsByGuest, cancelBooking } from '../../services/bookingsService';
import { getListing } from '../../services/listingsService';
import { createNotification } from '../../services/notificationsService';

function GuestBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'completed', 'cancelled'
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadBookings();
    }
  }, [currentUser, filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const allBookings = await getBookingsByGuest(currentUser.uid);
      
      let filtered = allBookings;
      if (filter !== 'all') {
        filtered = allBookings.filter(booking => booking.status === filter);
      }
      
      // Load listing data for each booking
      const bookingsWithListings = await Promise.all(
        filtered.map(async (booking) => {
          try {
            const listing = await getListing(booking.listingId);
            return { ...booking, listing };
          } catch (err) {
            console.error(`Error loading listing ${booking.listingId}:`, err);
            return { ...booking, listing: null };
          }
        })
      );
      
      setBookings(bookingsWithListings);
    } catch (err) {
      console.error('Error loading bookings:', err);
      // Don't show alert if it's just an index building issue - fallback should handle it
      if (!err.message?.includes('index') && !err.message?.includes('building')) {
        alert('Failed to load bookings. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status, paymentStatus) => {
    const statusMap = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', color: 'bg-green-100 text-green-800' },
      completed: { label: 'Completed', color: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800' },
    };

    const statusInfo = statusMap[status] || { label: status, color: 'bg-muted text-foreground' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
        {paymentStatus === 'partial' && status === 'confirmed' && (
          <span className="ml-1">(Partial Payment)</span>
        )}
      </span>
    );
  };

  const handleBookingClick = (booking) => {
    setSelectedBooking(booking);
    setShowModal(true);
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;
    
    const reason = window.prompt('Please provide a reason for cancellation:');
    if (!reason || reason.trim() === '') {
      return;
    }

    if (!window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      return;
    }

    try {
      setCancelling(true);
      await cancelBooking(selectedBooking.id, reason, 'guest');
      
      // Notify host
      if (selectedBooking.hostId) {
        await createNotification({
          userId: selectedBooking.hostId,
          type: 'booking',
          title: 'Booking cancelled',
          message: `Booking ${selectedBooking.id} has been cancelled by the guest. Reason: ${reason}`,
          metadata: { bookingId: selectedBooking.id },
        });
      }

      // Notify guest
      await createNotification({
        userId: currentUser.uid,
        type: 'booking',
        title: 'Booking cancelled',
        message: `Your booking has been cancelled successfully.`,
        metadata: { bookingId: selectedBooking.id },
      });

      alert('Booking cancelled successfully.');
      setShowModal(false);
      setSelectedBooking(null);
      loadBookings(); // Reload bookings
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getListingImages = (listing) => {
    if (!listing) return [];
    // Check both photos and images fields for compatibility
    return listing.photos || listing.images || [];
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground">My Bookings</h1>
        <Link to="/explore" className="btn btn-primary">
          Book Another Stay
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition-colors capitalize ${
              filter === status
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {bookings.length === 0 ? (
        <div className="card text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground/70"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-foreground">No bookings found</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {filter === 'all'
              ? "You haven't made any bookings yet. Start exploring amazing stays!"
              : `No ${filter} bookings found.`}
          </p>
          {filter !== 'all' && (
            <button
              onClick={() => setFilter('all')}
              className="mt-4 text-primary hover:text-primary font-medium"
            >
              View all bookings
            </button>
          )}
          {bookings.length === 0 && filter === 'all' && (
            <Link to="/explore" className="btn btn-primary mt-4 inline-block">
              Explore Listings
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const listingImages = getListingImages(booking.listing);
            const mainImage = listingImages[0] || booking.listing?.featuredPhoto;
            
            return (
              <div
                key={booking.id}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleBookingClick(booking)}
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Listing Image */}
                  {mainImage && (
                    <div className="md:w-48 flex-shrink-0">
                      <img
                        src={mainImage}
                        alt={booking.listing?.title || 'Listing'}
                        className="w-full h-48 md:h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                        }}
                      />
                    </div>
                  )}
                  {!mainImage && (
                    <div className="md:w-48 flex-shrink-0 bg-muted rounded-lg flex items-center justify-center">
                      <svg className="w-16 h-16 text-muted-foreground/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}

                {/* Booking Details */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="text-xl font-semibold text-foreground">
                        {booking.listing?.title || 'Listing Not Found'}
                      </h3>
                      {booking.listing && (
                        <Link
                          to={`/listing/${booking.listing.id}`}
                          className="text-primary hover:text-primary text-sm"
                        >
                          View listing →
                        </Link>
                      )}
                    </div>
                    {getStatusBadge(booking.status, booking.paymentStatus)}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p className="font-medium">{formatDate(booking.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out</p>
                      <p className="font-medium">{formatDate(booking.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Guests</p>
                      <p className="font-medium">{booking.numberOfGuests} guest{booking.numberOfGuests !== 1 ? 's' : ''}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Nights</p>
                      <p className="font-medium">{booking.numberOfNights} night{booking.numberOfNights !== 1 ? 's' : ''}</p>
                    </div>
                  </div>

                  {booking.guestDetails?.specialRequests && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Special Requests</p>
                      <p className="text-sm text-foreground">{booking.guestDetails.specialRequests}</p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Amount</p>
                        <p className="text-xl font-bold text-foreground">
                          {formatPrice(booking.totalAmount, booking.currency)}
                        </p>
                        {booking.paymentStatus === 'partial' && booking.remainingBalance > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Remaining: {formatPrice(booking.remainingBalance, booking.currency)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Booking Date</p>
                        <p className="text-sm font-medium">
                          {booking.createdAt ? formatDate(booking.createdAt) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* Booking Detail Modal */}
      {showModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-foreground">Booking Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted-foreground/70 hover:text-muted-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Images Gallery */}
              {(() => {
                const listingImages = getListingImages(selectedBooking.listing);
                if (listingImages.length > 0) {
                  return (
                    <div className="mb-6">
                      {listingImages.length === 1 ? (
                        <img
                          src={listingImages[0]}
                          alt={selectedBooking.listing?.title}
                          className="w-full h-96 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                          }}
                        />
                      ) : (
                        <div className="grid grid-cols-4 gap-2 h-96">
                          <div className="col-span-2 row-span-2">
                            <img
                              src={listingImages[0]}
                              alt={selectedBooking.listing?.title}
                              className="w-full h-full object-cover rounded-tl-lg rounded-bl-lg"
                              onError={(e) => {
                                e.target.src = 'https://via.placeholder.com/800x600?text=Image+Not+Available';
                              }}
                            />
                          </div>
                          {listingImages.slice(1, 5).map((photo, index) => (
                            <div key={index} className="overflow-hidden rounded-lg">
                              <img
                                src={photo}
                                alt={`${selectedBooking.listing?.title} ${index + 2}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = 'https://via.placeholder.com/400x300?text=Image+Not+Available';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }
                return null;
              })()}

              {/* Booking Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {selectedBooking.listing?.title || 'Listing Not Found'}
                  </h3>
                  {selectedBooking.listing && (
                    <Link
                      to={`/listing/${selectedBooking.listing.id}`}
                      className="text-primary hover:text-primary text-sm mb-4 inline-block"
                    >
                      View listing details →
                    </Link>
                  )}
                  
                  {selectedBooking.listing?.description && (
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {selectedBooking.listing.description}
                    </p>
                  )}

                  {selectedBooking.listing?.location && (
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">
                        {selectedBooking.listing.location.address}, {selectedBooking.listing.location.city}
                        {selectedBooking.listing.location.state && `, ${selectedBooking.listing.location.state}`}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <div className="mb-4">
                    {getStatusBadge(selectedBooking.status, selectedBooking.paymentStatus)}
                  </div>

                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Check-in</p>
                      <p className="font-medium">{formatDateTime(selectedBooking.checkIn)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Check-out</p>
                      <p className="font-medium">{formatDateTime(selectedBooking.checkOut)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Duration</p>
                      <p className="font-medium">
                        {selectedBooking.numberOfNights} night{selectedBooking.numberOfNights !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Guests</p>
                      <p className="font-medium">
                        {selectedBooking.numberOfGuests} guest{selectedBooking.numberOfGuests !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guest Details */}
              {selectedBooking.guestDetails && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-semibold text-foreground mb-3">Guest Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{selectedBooking.guestDetails.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedBooking.guestDetails.email}</p>
                    </div>
                    {selectedBooking.guestDetails.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedBooking.guestDetails.phone}</p>
                      </div>
                    )}
                  </div>
                  {selectedBooking.guestDetails.specialRequests && (
                    <div className="mt-4">
                      <p className="text-sm text-muted-foreground">Special Requests</p>
                      <p className="text-foreground bg-background p-3 rounded-lg mt-1">
                        {selectedBooking.guestDetails.specialRequests}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Information */}
              <div className="mt-6 pt-6 border-t border-border">
                <h4 className="font-semibold text-foreground mb-3">Payment Information</h4>
                <div className="bg-background p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-muted-foreground">Base Price ({selectedBooking.numberOfNights} nights)</span>
                    <span className="font-medium">
                      {formatPrice(selectedBooking.basePrice * (selectedBooking.numberOfNights || 1), selectedBooking.currency)}
                    </span>
                  </div>
                  {selectedBooking.cleaningFee > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Cleaning Fee</span>
                      <span className="font-medium">
                        {formatPrice(selectedBooking.cleaningFee, selectedBooking.currency)}
                      </span>
                    </div>
                  )}
                  {selectedBooking.serviceFee > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span className="font-medium">
                        {formatPrice(selectedBooking.serviceFee, selectedBooking.currency)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-2 border-t border-border mt-2">
                    <span className="text-lg font-semibold text-foreground">Total Amount</span>
                    <span className="text-xl font-bold text-foreground">
                      {formatPrice(selectedBooking.totalAmount, selectedBooking.currency)}
                    </span>
                  </div>
                  {selectedBooking.paymentStatus === 'partial' && selectedBooking.remainingBalance > 0 && (
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Remaining Balance</span>
                        <span className="text-sm font-semibold text-yellow-600">
                          {formatPrice(selectedBooking.remainingBalance, selectedBooking.currency)}
                        </span>
                      </div>
                    </div>
                  )}
                  <div className="mt-3 pt-3 border-t border-border">
                    <p className="text-sm text-muted-foreground">Payment Status</p>
                    <p className="font-medium capitalize">{selectedBooking.paymentStatus || 'pending'}</p>
                    {selectedBooking.paidAt && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Paid on: {formatDateTime(selectedBooking.paidAt)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Booking Metadata */}
              <div className="mt-6 pt-6 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Booking ID</p>
                    <p className="font-mono text-xs text-foreground">{selectedBooking.id}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Booking Date</p>
                    <p className="font-medium">
                      {selectedBooking.createdAt ? formatDateTime(selectedBooking.createdAt) : 'N/A'}
                    </p>
                  </div>
                  {selectedBooking.confirmedAt && (
                    <div>
                      <p className="text-muted-foreground">Confirmed At</p>
                      <p className="font-medium">{formatDateTime(selectedBooking.confirmedAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              {selectedBooking.status !== 'cancelled' && selectedBooking.status !== 'completed' && (
                <div className="mt-6 pt-6 border-t border-border flex gap-3">
                  <button
                    onClick={handleCancelBooking}
                    disabled={cancelling}
                    className="btn btn-outline text-red-600 border-red-600 hover:bg-red-50 flex-1"
                  >
                    {cancelling ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                  {selectedBooking.listing && (
                    <Link
                      to={`/listing/${selectedBooking.listing.id}`}
                      className="btn btn-primary flex-1 text-center"
                    >
                      View Listing
                    </Link>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GuestBookings;

