// Booking Confirmation Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getBooking } from '../../services/bookingsService';
import { getListing } from '../../services/listingsService';

function BookingConfirmation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBooking();
  }, [id]);

  const loadBooking = async () => {
    try {
      const bookingData = await getBooking(id);
      if (!bookingData) {
        navigate('/guest/dashboard');
        return;
      }
      setBooking(bookingData);

      const listingData = await getListing(bookingData.listingId);
      setListing(listingData);
    } catch (err) {
      console.error('Error loading booking:', err);
      navigate('/guest/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: booking?.currency || 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="container-custom py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!booking || !listing) {
    return null;
  }

  // Check if payment was via PayPal
  const isPayPalPayment = booking.paymentMethod === 'paypal';

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-custom max-w-2xl">
        {/* Success Message Banner */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg p-6 mb-8 shadow-lg">
          <div className="flex items-center justify-center gap-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-display font-bold mb-2">
                Payment Successful! 🎉
              </h1>
              <p className="text-lg opacity-95">
                {isPayPalPayment 
                  ? 'Your PayPal payment has been processed successfully and your booking is confirmed!'
                  : 'Your payment has been processed successfully and your booking is confirmed!'}
              </p>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-display font-bold text-foreground mb-2">
            Booking Confirmed!
          </h2>
          <p className="text-muted-foreground">
            Your reservation has been confirmed. {booking.guestDetails?.email && (
              <>We've sent a confirmation email to <strong>{booking.guestDetails.email}</strong></>
            )}
          </p>
          {isPayPalPayment && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              <span className="text-sm font-medium text-blue-800">Paid via PayPal</span>
            </div>
          )}
        </div>

        <div className="card mb-6">
          <h2 className="text-xl font-display font-semibold mb-4">Booking Details</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Booking ID</p>
              <p className="font-semibold">{booking.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Property</p>
              <p className="font-semibold">{listing.title}</p>
              <p className="text-sm text-muted-foreground">
                {listing.location?.address}, {listing.location?.city}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Check-in</p>
                <p className="font-semibold">{formatDate(booking.checkIn)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Check-out</p>
                <p className="font-semibold">{formatDate(booking.checkOut)}</p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Guests</p>
              <p className="font-semibold">{booking.numberOfGuests} {booking.numberOfGuests === 1 ? 'guest' : 'guests'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="font-semibold text-xl text-green-600">{formatPrice(booking.totalAmount)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Payment Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                booking.paymentStatus === 'paid' 
                  ? 'bg-green-100 text-green-800'
                  : booking.paymentStatus === 'partial'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-muted text-foreground'
              }`}>
                {booking.paymentStatus === 'paid' ? '✓ Paid' : booking.paymentStatus === 'partial' ? 'Partial Payment' : booking.paymentStatus?.charAt(0).toUpperCase() + booking.paymentStatus?.slice(1)}
              </span>
            </div>
            {booking.paymentMethod && (
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-semibold capitalize">{booking.paymentMethod === 'paypal' ? 'PayPal' : booking.paymentMethod}</p>
              </div>
            )}
            <div>
              <p className="text-sm text-muted-foreground">Booking Status</p>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                booking.status === 'confirmed' 
                  ? 'bg-green-100 text-green-800'
                  : booking.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-muted text-foreground'
              }`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Link to="/guest/bookings" className="btn btn-primary">
            View My Bookings
          </Link>
          <Link to="/explore" className="btn btn-outline">
            Explore More
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;

