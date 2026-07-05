// Host Payments Received Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getBookingsByHost } from '../../services/bookingsService';
import { getPayment } from '../../services/paymentsService';

function HostPayments() {
  const { currentUser } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'completed', 'pending', 'refunded'

  useEffect(() => {
    if (currentUser) {
      loadPayments();
    }
  }, [currentUser, filter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const bookings = await getBookingsByHost(currentUser.uid);
      
      // Get payments for each booking
      const paymentsData = await Promise.all(
        bookings
          .filter(booking => booking.paymentId)
          .map(async (booking) => {
            try {
              const payment = await getPayment(booking.paymentId);
              return {
                ...payment,
                booking,
              };
            } catch (err) {
              return null;
            }
          })
      );

      const validPayments = paymentsData.filter(p => p !== null);
      
      let filtered = validPayments;
      if (filter !== 'all') {
        filtered = validPayments.filter(p => p.status === filter);
      }

      // Sort by date (newest first)
      filtered.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      setPayments(filtered);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
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

  const calculateHostEarnings = (payment) => {
    // Host receives total amount minus service fee
    const serviceFee = payment.fees?.serviceFee || 0;
    return payment.totalAmount - serviceFee;
  };

  const totalEarnings = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + calculateHostEarnings(p), 0);

  return (
    <div className="container-custom py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground">Payments Received</h1>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Earnings</p>
          <p className="text-2xl font-bold text-primary">{formatPrice(totalEarnings)}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {['all', 'completed', 'pending', 'refunded'].map((status) => (
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
          <p className="mt-4 text-muted-foreground">Loading payments...</p>
        </div>
      ) : payments.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No payments found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="card">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    {payment.booking?.listing?.featuredPhoto && (
                      <img
                        src={payment.booking.listing.featuredPhoto}
                        alt={payment.booking.listing.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-foreground mb-1">
                        {payment.booking?.listing?.title || 'Listing'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Booking ID: {payment.bookingId?.substring(0, 8)}...
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Payment Date: {formatDate(payment.createdAt)}</span>
                        {payment.completedAt && (
                          <span>Completed: {formatDate(payment.completedAt)}</span>
                        )}
                        <span>Method: {payment.method}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Total Amount</p>
                    <p className="text-xl font-bold text-foreground">
                      {formatPrice(payment.totalAmount)}
                    </p>
                    {payment.fees?.serviceFee > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Service Fee: -{formatPrice(payment.fees.serviceFee)}
                      </p>
                    )}
                    <p className="text-sm text-primary font-semibold mt-2">
                      Your Earnings: {formatPrice(calculateHostEarnings(payment))}
                    </p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                      payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      payment.status === 'refunded' ? 'bg-red-100 text-red-800' :
                      'bg-muted text-foreground'
                    }`}>
                      {payment.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HostPayments;

