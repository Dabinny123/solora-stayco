// Payment Review Page for Solora StayCo
import React, { useState, useEffect } from 'react';
import { getAllPayments, completePayment, failPayment, refundPayment } from '../../services/paymentsService';
import { getBooking } from '../../services/bookingsService';
import { getUser } from '../../services/usersService';

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'processing', 'completed', 'failed', 'refunded'

  useEffect(() => {
    loadPayments();
  }, [filter]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      let allPayments = await getAllPayments(null, 100);

      // Apply filter
      if (filter !== 'all') {
        allPayments = allPayments.filter(p => p.status === filter);
      }

      // Load related data
      const paymentsWithData = await Promise.all(
        allPayments.map(async (payment) => {
          const [booking, user] = await Promise.all([
            getBooking(payment.bookingId),
            getUser(payment.userId),
          ]);
          return { ...payment, booking, user };
        })
      );

      setPayments(paymentsWithData);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (paymentId, transactionId) => {
    try {
      await completePayment(paymentId, transactionId || 'manual-confirmation');
      loadPayments();
    } catch (err) {
      console.error('Error completing payment:', err);
      alert('Failed to complete payment');
    }
  };

  const handleFail = async (paymentId, reason) => {
    if (!window.confirm('Are you sure you want to mark this payment as failed?')) {
      return;
    }

    try {
      await failPayment(paymentId, reason || 'Failed by admin');
      loadPayments();
    } catch (err) {
      console.error('Error failing payment:', err);
      alert('Failed to update payment');
    }
  };

  const handleRefund = async (paymentId, refundAmount, reason) => {
    if (!window.confirm('Are you sure you want to process a refund?')) {
      return;
    }

    try {
      await refundPayment(paymentId, refundAmount, reason || 'Refunded by admin');
      loadPayments();
    } catch (err) {
      console.error('Error processing refund:', err);
      alert('Failed to process refund');
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">
        Payment Review & Management
      </h1>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-border">
        {['all', 'pending', 'processing', 'completed', 'failed', 'refunded'].map((status) => (
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
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-semibold text-lg">
                          Payment #{payment.id.slice(0, 8)}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          payment.status === 'completed' ? 'bg-green-100 text-green-800' :
                          payment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          payment.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          payment.status === 'failed' ? 'bg-red-100 text-red-800' :
                          payment.status === 'refunded' ? 'bg-muted text-foreground' :
                          'bg-muted text-foreground'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                        <div>
                          <p className="font-medium text-foreground">User</p>
                          <p>{payment.user?.displayName || payment.userId}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Booking</p>
                          <p>{payment.bookingId.slice(0, 8)}...</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Method</p>
                          <p className="capitalize">{payment.method}</p>
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Date</p>
                          <p>{formatDate(payment.createdAt)}</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <p className="text-lg font-bold text-foreground">
                          {formatPrice(payment.totalAmount)}
                        </p>
                        {payment.refundAmount > 0 && (
                          <p className="text-sm text-red-600">
                            Refunded: {formatPrice(payment.refundAmount)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  {payment.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleComplete(payment.id)}
                        className="btn btn-primary text-sm px-4 py-2"
                      >
                        Confirm Payment
                      </button>
                      <button
                        onClick={() => handleFail(payment.id)}
                        className="btn btn-outline text-sm px-4 py-2"
                      >
                        Mark as Failed
                      </button>
                    </>
                  )}
                  {payment.status === 'completed' && (
                    <button
                      onClick={() => {
                        const amount = prompt('Enter refund amount:', payment.totalAmount);
                        if (amount) {
                          handleRefund(payment.id, parseFloat(amount));
                        }
                      }}
                      className="btn btn-outline text-sm px-4 py-2 text-red-600 border-red-300"
                    >
                      Process Refund
                    </button>
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

export default Payments;

