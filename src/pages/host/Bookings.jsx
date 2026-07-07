// Host Bookings Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getBookingsByHost, confirmBooking, cancelBooking } from '../../services/bookingsService';
import { getListing } from '../../services/listingsService';
import { getPaymentByBooking } from '../../services/paymentsService';

function HostBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'confirmed', 'completed', 'cancelled'

  useEffect(() => {
    if (currentUser) {
      loadBookings();
    }
  }, [currentUser, filter]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const allBookings = await getBookingsByHost(currentUser.uid);
      
      let filtered = allBookings;
      if (filter !== 'all') {
        filtered = allBookings.filter(booking => booking.status === filter);
      }
      
      // Load related data without hiding the booking if a secondary lookup fails.
      const bookingsWithListings = await Promise.all(
        filtered.map(async (booking) => {
          const [listing, payment] = await Promise.all([
            getListing(booking.listingId).catch((listingError) => {
              console.error('Error loading booking listing:', listingError);
              return null;
            }),
            getPaymentByBooking(booking.id).catch((paymentError) => {
              console.error('Error loading booking payment:', paymentError);
              return null;
            }),
          ]);
          return { ...booking, listing, payment };
        })
      );
      
      setBookings(bookingsWithListings);
    } catch (err) {
      console.error('Error loading bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (bookingId) => {
    try {
      await confirmBooking(bookingId);
      loadBookings();
    } catch (err) {
      console.error('Error confirming booking:', err);
      alert('Failed to confirm booking');
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      await cancelBooking(bookingId, 'Cancelled by host', 'host');
      loadBookings();
    } catch (err) {
      console.error('Error cancelling booking:', err);
      alert('Failed to cancel booking');
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'Not recorded';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getPaymentMethod = (booking) => {
    const method = booking.paymentMethod || booking.payment?.method;
    if (!method) return 'Not recorded';
    if (method === 'paypal') return 'PayPal';
    if (method === 'e-wallet') return 'E-wallet';
    return method.charAt(0).toUpperCase() + method.slice(1);
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">My Bookings</h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map((status) => (
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
          <p className="mt-4 text-muted-foreground">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div key={booking.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {booking.listing?.featuredPhoto && (
                      <img
                        src={booking.listing.featuredPhoto}
                        alt={booking.listing.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {booking.listing?.title || 'Listing'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {booking.guestDetails?.name || 'Guest'} • {booking.guestDetails?.email}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Check-in: {formatDate(booking.checkIn)}</span>
                        <span>Check-out: {formatDate(booking.checkOut)}</span>
                        <span>{booking.numberOfGuests} guests</span>
                        <span>{booking.numberOfNights} nights</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Payment: {getPaymentMethod(booking)}</span>
                        <span>Status: {booking.paymentStatus || booking.payment?.status || 'pending'}</span>
                        <span>Paid: {formatDateTime(booking.paidAt || booking.paymentCompletedAt || booking.payment?.paidAt)}</span>
                        {(booking.paymentTransactionId || booking.payment?.transactionId) && (
                          <span>Txn: {booking.paymentTransactionId || booking.payment.transactionId}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-lg font-bold text-foreground">
                      {formatPrice(booking.totalAmount)}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-muted text-foreground'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  {booking.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleConfirm(booking.id)}
                        className="btn btn-primary text-sm px-4 py-2"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => handleCancel(booking.id)}
                        className="btn btn-outline text-sm px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HostBookings;

