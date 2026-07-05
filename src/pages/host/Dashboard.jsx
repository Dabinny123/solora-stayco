// Host Dashboard Page
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { getListingsByHost } from '../../services/listingsService';
import { getTodayCheckIns, getUpcomingBookings } from '../../services/bookingsService';
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

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
      loadNotifications();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load listings
      const listings = await getListingsByHost(currentUser.uid, 'active');
      
      // Load bookings
      const todayCheckIns = await getTodayCheckIns(currentUser.uid);
      const upcomingBookings = await getUpcomingBookings(currentUser.uid);
      
      // Load unread messages
      const unreadMessages = await getUnreadMessageCount(currentUser.uid);
      
      // Calculate revenue (this month)
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);
      
      const allBookings = [...todayCheckIns, ...upcomingBookings];
      const thisMonthRevenue = allBookings
        .filter(booking => {
          const bookingDate = new Date(booking.createdAt);
          return bookingDate >= thisMonth && booking.status === 'confirmed';
        })
        .reduce((sum, booking) => sum + (booking.totalAmount || 0), 0);

      setStats({
        todayCheckIns: todayCheckIns.length,
        upcomingBookings: upcomingBookings.length,
        activeListings: listings.length,
        revenue: thisMonthRevenue,
        unreadMessages,
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      // If it's an index error, the index is still building - this is expected
      if (err.message && err.message.includes('index')) {
        console.log('Index is building, data will load once index is ready');
        // Set empty stats instead of showing error
        setStats({
          todayCheckIns: 0,
          upcomingBookings: 0,
          activeListings: 0,
          revenue: 0,
          unreadMessages: 0,
        });
      }
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
        <Link to="/host/bookings" className="card hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Recent Bookings</h2>
            <span className="text-primary text-sm">View all →</span>
          </div>
          <p className="text-muted-foreground">View and manage your bookings</p>
        </Link>
        <Link to="/host/messages" className="card hover:shadow-lg transition-shadow relative">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-display font-semibold">Messages</h2>
            {stats.unreadMessages > 0 && (
              <span className="px-2 py-1 bg-primary text-white text-xs rounded-full">
                {stats.unreadMessages} new
              </span>
            )}
            <span className="text-primary text-sm">View all →</span>
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

