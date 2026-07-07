// Host Dashboard Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getListingsByHost } from '../../services/listingsService';
import { getBookingsByHost, getTodayCheckIns, getUpcomingBookings } from '../../services/bookingsService';
import { getUnreadMessageCount } from '../../services/messagesService';
import { getNotifications, markAllNotificationsRead } from '../../services/notificationsService';
import NotificationsPanel from '../../components/NotificationsPanel';

function HostDashboard() {
  const { userData, currentUser } = useAuth();
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    upcomingBookings: 0,
    activeListings: 0,
    revenue: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
      loadNotifications();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [
        listings,
        allBookings,
        todayCheckIns,
        upcomingBookings,
        unreadMessages,
      ] = await Promise.all([
        getListingsByHost(currentUser.uid, 'active'),
        getBookingsByHost(currentUser.uid),
        getTodayCheckIns(currentUser.uid),
        getUpcomingBookings(currentUser.uid),
        getUnreadMessageCount(currentUser.uid),
      ]);
      
      // Calculate revenue (this month)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const thisMonthRevenue = allBookings
        .filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          const revenueStatus = ['confirmed', 'completed'].includes(booking.status);
          const paidStatus = ['paid', 'partial'].includes(booking.paymentStatus);
          return bookingDate >= thisMonth && revenueStatus && paidStatus;
        })
        .reduce((sum, booking) => {
          const hostEarnings = (booking.totalAmount || 0) - (booking.serviceFee || 0);
          return sum + Math.max(hostEarnings, 0);
        }, 0);

      const latestBookings = [...allBookings]
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 5);

      setStats({
        todayCheckIns: todayCheckIns.length,
        upcomingBookings: upcomingBookings.length,
        activeListings: listings.length,
        revenue: thisMonthRevenue,
        unreadMessages,
      });
      setRecentBookings(latestBookings);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setStats({
        todayCheckIns: 0,
        upcomingBookings: 0,
        activeListings: 0,
        revenue: 0,
        unreadMessages: 0,
      });
      setRecentBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!currentUser) return;
    try {
      setLoadingNotifications(true);
      const items = await getNotifications(currentUser.uid, { includeRead: false, limit: 5 });
      setNotifications(items);
    } catch (err) {
      console.error('Error loading notifications:', err);
      // If it's an index error, the index is still building - this is expected
      if (err.message && err.message.includes('index')) {
        console.log('Index is building, notifications will load once index is ready');
        setNotifications([]);
      }
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.uid);
    await loadNotifications();
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
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getPaymentLabel = (booking) => {
    const method = booking.paymentMethod || booking.payment?.method || 'payment';
    const label = method === 'paypal'
      ? 'PayPal'
      : method === 'e-wallet'
      ? 'E-wallet'
      : method.charAt(0).toUpperCase() + method.slice(1);
    return `${label} - ${booking.paymentStatus || 'pending'}`;
  };

  return (
    <div className="container-custom py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold text-foreground">
          Host Dashboard
        </h1>
        <Link to="/host/listings/create" className="btn btn-primary">
          Create New Listing
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Link to="/host/bookings" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">Today</h3>
          <p className="text-3xl font-bold text-primary">
            {loading ? '...' : stats.todayCheckIns}
          </p>
          <p className="text-muted-foreground text-sm">Check-ins</p>
        </Link>
        <Link to="/host/bookings" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">Upcoming</h3>
          <p className="text-3xl font-bold text-primary">
            {loading ? '...' : stats.upcomingBookings}
          </p>
          <p className="text-muted-foreground text-sm">Bookings</p>
        </Link>
        <Link to="/host/listings" className="card hover:shadow-lg transition-shadow">
          <h3 className="text-lg font-semibold mb-2">Listings</h3>
          <p className="text-3xl font-bold text-primary">
            {loading ? '...' : stats.activeListings}
          </p>
          <p className="text-muted-foreground text-sm">Active</p>
        </Link>
        <div className="card">
          <h3 className="text-lg font-semibold mb-2">Revenue</h3>
          <p className="text-3xl font-bold text-primary">
            {loading ? '...' : formatPrice(stats.revenue)}
          </p>
          <p className="text-muted-foreground text-sm">This month</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Recent Bookings</h2>
            <Link to="/host/bookings" className="text-primary text-sm">View all &rarr;</Link>
          </div>
          {loading ? (
            <p className="text-muted-foreground">Loading bookings...</p>
          ) : recentBookings.length === 0 ? (
            <p className="text-muted-foreground">No bookings yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking) => (
                <Link
                  key={booking.id}
                  to="/host/bookings"
                  className="block rounded-md border border-border p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {booking.guestDetails?.name || 'Guest'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(booking.checkIn)} - {formatDate(booking.checkOut)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getPaymentLabel(booking)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        {formatPrice(Math.max((booking.totalAmount || 0) - (booking.serviceFee || 0), 0))}
                      </p>
                      <span className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-muted text-foreground'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
        <Link to="/host/messages" className="card hover:shadow-lg transition-shadow relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Messages</h2>
            {stats.unreadMessages > 0 && (
              <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">
                {stats.unreadMessages} new
              </span>
            )}
            <span className="text-primary text-sm">View all &rarr;</span>
          </div>
          <p className="text-muted-foreground">
            {stats.unreadMessages > 0 
              ? `${stats.unreadMessages} unread message${stats.unreadMessages > 1 ? 's' : ''}`
              : 'No new messages'}
          </p>
        </Link>
      </div>

      <div className="card">
        <h2 className="text-xl font-display font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link to="/host/listings/create" className="btn btn-primary">
            Create Listing
          </Link>
          <Link to="/host/listings" className="btn btn-outline">
            Manage Listings
          </Link>
          <Link to="/host/bookings" className="btn btn-outline">
            View Bookings
          </Link>
          <Link to="/host/calendar" className="btn btn-outline">
            Calendar
          </Link>
          <Link to="/host/messages" className="btn btn-outline">
            Messages
          </Link>
          <Link to="/host/payments" className="btn btn-outline">
            Payments
          </Link>
          <Link to="/host/wallet" className="btn btn-outline">
            Wallet
          </Link>
        </div>
      </div>

      <NotificationsPanel
        title="Notifications"
        notifications={notifications}
        loading={loadingNotifications}
        onMarkAllRead={handleMarkAllRead}
      />
    </div>
  );
}

export default HostDashboard;

