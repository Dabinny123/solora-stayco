// Guest Dashboard Page — Brand-designed
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMoodRecommendations } from '../../services/recommendationService';
import ListingCard from '../../components/ListingCard';
import NotificationsPanel from '../../components/NotificationsPanel';
import { getNotifications, markAllNotificationsRead } from '../../services/notificationsService';

function GuestDashboard() {
  const { userData, currentUser } = useAuth();
  const [recommendations, setRecommendations] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(true);

  useEffect(() => {
    async function loadRecommendations() {
      if (!currentUser) return;
      try {
        setLoadingRecommendations(true);
        const recs = await getMoodRecommendations(currentUser.uid, { limit: 4 });
        setRecommendations(recs);
      } catch (err) {
        console.error('Error loading recommendations:', err);
      } finally {
        setLoadingRecommendations(false);
      }
    }
    loadRecommendations();
  }, [currentUser]);

  useEffect(() => {
    async function loadNotifications() {
      if (!currentUser) return;
      try {
        setLoadingNotifications(true);
        const items = await getNotifications(currentUser.uid, { includeRead: false, limit: 5 });
        setNotifications(items);
      } catch (err) {
        console.error('Error loading notifications:', err);
        if (err.message && err.message.includes('index')) {
          setNotifications([]);
        }
      } finally {
        setLoadingNotifications(false);
      }
    }
    loadNotifications();
  }, [currentUser]);

  const handleMarkAllRead = async () => {
    if (!currentUser) return;
    await markAllNotificationsRead(currentUser.uid);
    const refreshed = await getNotifications(currentUser.uid, { includeRead: false, limit: 5 });
    setNotifications(refreshed);
  };

  // Time-aware greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const quickActions = [
    {
      to: '/guest/bookings',
      icon: '📋',
      label: 'My Bookings',
      description: 'View and manage your reservations',
      color: 'from-primary/10 to-accent/10',
      borderColor: 'border-primary/20',
    },
    {
      to: '/guest/wishlist',
      icon: '💖',
      label: 'Wishlist',
      description: 'Your saved accommodations',
      color: 'from-secondary/10 to-pink-100/50',
      borderColor: 'border-secondary/20',
    },
    {
      to: '/guest/wallet',
      icon: '💰',
      label: 'E-Wallet',
      description: 'Manage your wallet balance',
      color: 'from-amber-100/50 to-yellow-100/50',
      borderColor: 'border-amber-200/50',
    },
    {
      to: '/explore',
      icon: '🌍',
      label: 'Explore',
      description: 'Discover new mood-matched stays',
      color: 'from-accent/10 to-blue-100/50',
      borderColor: 'border-accent/20',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5 border-b border-border">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/5 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />
        
        <div className="container-custom relative z-10 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <p className="text-muted-foreground text-sm font-medium mb-1">{getGreeting()}</p>
              <h1 className="font-serif text-3xl md:text-4xl font-semibold text-foreground mb-2">
                {userData?.displayName || 'Guest'} 👋
              </h1>
              <p className="text-muted-foreground max-w-md">
                Ready for your next emotional escape? Explore mood-matched staycations just for you.
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                to="/explore"
                className="btn btn-primary rounded-xl px-6 py-3 text-sm font-semibold inline-flex items-center gap-2 hover:shadow-glow transition-all"
              >
                <span>🔍</span>
                Find a Staycation
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 space-y-8">
        {/* Quick Action Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className={`group relative overflow-hidden rounded-2xl border ${action.borderColor} bg-gradient-to-br ${action.color} p-5 transition-all hover:shadow-medium hover:-translate-y-1`}
            >
              <span className="text-3xl mb-3 block">{action.icon}</span>
              <h3 className="text-base font-semibold text-foreground mb-1">{action.label}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{action.description}</p>
              <div className="mt-3 text-primary text-sm font-medium group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                Open
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Recommendations */}
        <div className="glass-card p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl font-semibold text-foreground mb-1">Recommended for you</h2>
              <p className="text-muted-foreground text-sm">Based on your mood selections and stay history</p>
            </div>
            <Link to="/explore" className="text-primary font-medium text-sm hover:text-primary/80 transition-colors inline-flex items-center gap-1">
              See all
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {loadingRecommendations ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[4/5]" />
              ))}
            </div>
          ) : recommendations.length === 0 ? (
            <div className="text-center py-12">
              <span className="text-4xl mb-4 block">🎯</span>
              <p className="text-foreground font-medium mb-2">No recommendations yet</p>
              <p className="text-muted-foreground text-sm mb-4">
                Start by selecting a mood and exploring stay vibes. We'll tailor recommendations for you.
              </p>
              <Link to="/explore" className="btn btn-primary rounded-xl px-6 py-2.5 text-sm">
                Start exploring
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recommendations.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>

        {/* Notifications */}
        <NotificationsPanel
          title="Notifications"
          notifications={notifications}
          loading={loadingNotifications}
          onMarkAllRead={handleMarkAllRead}
        />
      </div>
    </div>
  );
}

export default GuestDashboard;
