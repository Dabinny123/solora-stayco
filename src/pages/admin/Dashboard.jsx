// Admin Dashboard Page
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getActiveListings } from '../../services/listingsService';
import { getAllPayments } from '../../services/paymentsService';
import { getAllUsers } from '../../services/usersService';
import { getBestReviews, getLowestReviews } from '../../services/reviewsService';
import { getDocuments } from '../../firebase/firestoreService';

function AdminDashboard() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeListings: 0,
    totalUsers: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });
  const [bestReviews, setBestReviews] = useState([]);
  const [lowestReviews, setLowestReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load all data in parallel with error handling for each
      const results = await Promise.allSettled([
        getActiveListings({}, 1000).catch(err => {
          console.warn('Error loading listings:', err);
          return [];
        }),
        getAllUsers(null, 1000).catch(err => {
          console.warn('Error loading users:', err);
          return [];
        }),
        getAllPayments(null, 1000).catch(err => {
          console.warn('Error loading payments:', err);
          return [];
        }),
        getDocuments('bookings', [], 'createdAt', 'desc', 1000).catch(err => {
          console.warn('Error loading bookings:', err);
          return [];
        }),
        getBestReviews(null, 5).catch(err => {
          console.warn('Error loading best reviews:', err);
          return [];
        }),
        getLowestReviews(null, 5).catch(err => {
          console.warn('Error loading lowest reviews:', err);
          return [];
        }),
      ]);

      const listings = results[0].status === 'fulfilled' ? results[0].value : [];
      const users = results[1].status === 'fulfilled' ? results[1].value : [];
      const payments = results[2].status === 'fulfilled' ? results[2].value : [];
      const bookings = results[3].status === 'fulfilled' ? results[3].value : [];
      const best = results[4].status === 'fulfilled' ? results[4].value : [];
      const lowest = results[5].status === 'fulfilled' ? results[5].value : [];

      // Calculate stats
      const totalRevenue = payments
        .filter(p => p && p.status === 'completed')
        .reduce((sum, p) => sum + (parseFloat(p.totalAmount) || 0), 0);

      const adminCommission = payments
        .filter(p => p && p.status === 'completed' && p.commission)
        .reduce((sum, p) => sum + (parseFloat(p.commission.adminCommission) || 0), 0);

      const pendingPayments = payments.filter(p => p && (p.status === 'pending' || p.status === 'processing')).length;

      setStats({
        totalBookings: bookings.length || 0,
        activeListings: listings.length || 0,
        totalUsers: users.length || 0,
        totalRevenue: totalRevenue || 0,
        pendingPayments: pendingPayments || 0,
        adminCommission: adminCommission || 0,
      });

      setBestReviews(best || []);
      setLowestReviews(lowest || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="container-custom py-8">
        <h1 className="text-3xl font-display font-bold text-foreground mb-6">
          Admin Dashboard
        </h1>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold text-foreground mb-6">
        Admin Dashboard
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          <p className="font-semibold">Error loading dashboard</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadDashboardData}
            className="mt-2 text-sm underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Link to="/admin/users" className="card hover:shadow-lg transition-shadow text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">User Management</h3>
          <span className="text-primary font-semibold">Manage Users →</span>
        </Link>
        <Link to="/admin/payments" className="card hover:shadow-lg transition-shadow text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Payment Review</h3>
          <span className="text-primary font-semibold">Review Payments →</span>
        </Link>
        <Link to="/admin/service-fee" className="card hover:shadow-lg transition-shadow text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Service Fee</h3>
          <span className="text-primary font-semibold">Configure →</span>
        </Link>
        <Link to="/admin/reports" className="card hover:shadow-lg transition-shadow text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Reports</h3>
          <span className="text-primary font-semibold">Generate →</span>
        </Link>
        <Link to="/admin/moods" className="card hover:shadow-lg transition-shadow text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Mood Library</h3>
          <span className="text-primary font-semibold">Curate Moods →</span>
        </Link>
        <Link to="/admin/wallet-management" className="card hover:shadow-lg transition-shadow text-center">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Wallet Management</h3>
          <span className="text-primary font-semibold">Manage Wallets →</span>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-8">
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Bookings</h3>
          <p className="text-3xl font-bold text-primary">
            {stats.totalBookings}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Active Listings</h3>
          <p className="text-3xl font-bold text-primary">
            {stats.activeListings}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Users</h3>
          <p className="text-3xl font-bold text-primary">
            {stats.totalUsers}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Total Revenue</h3>
          <p className="text-3xl font-bold text-primary">
            {formatPrice(stats.totalRevenue)}
          </p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Admin Commission</h3>
          <p className="text-3xl font-bold text-green-600">
            {formatPrice(stats.adminCommission || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">From service fees</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Pending Payments</h3>
          <p className="text-3xl font-bold text-yellow-600">
            {stats.pendingPayments}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Best Reviews</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : bestReviews && bestReviews.length > 0 ? (
            <div className="space-y-3">
              {bestReviews.map((review) => (
                <div key={review.id || review.createdAt} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium">Rating: {review.rating || 'N/A'}/5</span>
                    <span className="text-sm text-muted-foreground">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{review.comment || 'No comment'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No reviews yet.</p>
          )}
        </div>
        <div className="card">
          <h2 className="text-xl font-display font-semibold mb-4">Lowest Reviews</h2>
          {loading ? (
            <p className="text-muted-foreground">Loading...</p>
          ) : lowestReviews && lowestReviews.length > 0 ? (
            <div className="space-y-3">
              {lowestReviews.map((review) => (
                <div key={review.id || review.createdAt} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-red-600">Rating: {review.rating || 'N/A'}/5</span>
                    <span className="text-sm text-muted-foreground">
                      {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{review.comment || 'No comment'}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No reviews yet.</p>
          )}
        </div>
      </div>

      {/* Empty State Message */}
      {!loading && stats.totalBookings === 0 && stats.activeListings === 0 && stats.totalUsers === 0 && (
        <div className="card bg-blue-50 border border-blue-200">
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to Admin Dashboard</h3>
            <p className="text-muted-foreground mb-4">
              Your platform is new. As users create listings and bookings, statistics will appear here.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/admin/users" className="btn btn-outline">
                View Users
              </Link>
              <Link to="/admin/service-fee" className="btn btn-primary">
                Configure Service Fee
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;


