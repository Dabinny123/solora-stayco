// Main App Component for Solora StayCo — with code splitting
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Chatbot from './components/Chatbot';

// Eagerly loaded (public / critical path)
import Home from './pages/Home';
import SignUp from './pages/auth/SignUp';
import SignIn from './pages/auth/SignIn';
import VerifyEmail from './pages/auth/VerifyEmail';
import Explore from './pages/guest/Explore';

// Lazy-loaded — Guest pages
const GuestDashboard = lazy(() => import('./pages/guest/Dashboard'));
const ListingDetail = lazy(() => import('./pages/guest/ListingDetail'));
const Wishlist = lazy(() => import('./pages/guest/Wishlist'));
const Booking = lazy(() => import('./pages/guest/Booking'));
const BookingConfirmation = lazy(() => import('./pages/guest/BookingConfirmation'));
const GuestBookings = lazy(() => import('./pages/guest/Bookings'));
const AccountSettings = lazy(() => import('./pages/guest/AccountSettings'));
const Wallet = lazy(() => import('./pages/guest/Wallet'));

// Lazy-loaded — Host pages
const HostDashboard = lazy(() => import('./pages/host/Dashboard'));
const CreateListing = lazy(() => import('./pages/host/CreateListing'));
const MyListings = lazy(() => import('./pages/host/MyListings'));
const HostBookings = lazy(() => import('./pages/host/Bookings'));
const HostMessages = lazy(() => import('./pages/host/Messages'));
const HostCalendar = lazy(() => import('./pages/host/Calendar'));
const HostPayments = lazy(() => import('./pages/host/Payments'));
const HostWallet = lazy(() => import('./pages/host/Wallet'));

// Lazy-loaded — Admin pages
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ServiceFee = lazy(() => import('./pages/admin/ServiceFee'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const Users = lazy(() => import('./pages/admin/Users'));
const Reports = lazy(() => import('./pages/admin/Reports'));
const WalletManagement = lazy(() => import('./pages/admin/WalletManagement'));
const Moods = lazy(() => import('./pages/admin/Moods'));

// Lazy-loaded — Other pages
const Policy = lazy(() => import('./pages/Policy'));
const About = lazy(() => import('./pages/About'));
const HowItWorksPage = lazy(() => import('./pages/HowItWorks'));

// Loading fallback with brand logo
function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="text-center">
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-pulse-soft">
          <span className="text-2xl">☀️</span>
        </div>
        <div className="animate-spin rounded-full h-7 w-7 border-2 border-muted border-t-primary mx-auto"></div>
      </div>
    </div>
  );
}

// 404 Not Found page
function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <span className="text-4xl">🌅</span>
        </div>
        <h1 className="font-serif text-4xl font-semibold text-foreground mb-3">Page Not Found</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Looks like this path doesn't lead to a staycation. Let's get you back on track.
        </p>
        <Link
          to="/"
          className="btn btn-primary rounded-xl px-8 py-3 text-base font-semibold inline-flex items-center gap-2 hover:shadow-glow transition-all"
        >
          <span>🏠</span>
          Back to Home
        </Link>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-grow">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/verify-email" element={<VerifyEmail />} />
                
                {/* Guest Routes */}
                <Route
                  path="/guest/dashboard"
                  element={
                    <ProtectedRoute requiredRole="guest">
                      <GuestDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/guest/wishlist"
                  element={
                    <ProtectedRoute requiredRole="guest">
                      <Wishlist />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/guest/wallet"
                  element={
                    <ProtectedRoute requiredRole="guest">
                      <Wallet />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/guest/bookings"
                  element={
                    <ProtectedRoute requiredRole="guest">
                      <GuestBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking/:id"
                  element={
                    <ProtectedRoute requiredRole="guest">
                      <Booking />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/booking/:id/confirmation"
                  element={
                    <ProtectedRoute requiredRole="guest">
                      <BookingConfirmation />
                    </ProtectedRoute>
                  }
                />
                
                {/* Host Routes */}
                <Route
                  path="/host/dashboard"
                  element={
                    <ProtectedRoute requiredRole="host">
                      <HostDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/listings"
                  element={
                    <ProtectedRoute requiredRole="host">
                      <MyListings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/listings/create"
                  element={
                    <ProtectedRoute requiredRole="host">
                      <CreateListing />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/listings/:id/edit"
                  element={
                    <ProtectedRoute requiredRole="host">
                      <CreateListing editMode />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/bookings"
                  element={
                    <ProtectedRoute requiredRole="host">
                      <HostBookings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/messages"
                  element={
                    <ProtectedRoute requiredRole="host">
                      <HostMessages />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/calendar"
                  element={
                    <ProtectedRoute requiredRole="host">
                      <HostCalendar />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/payments"
                  element={
                    <ProtectedRoute requiredRole="host">
                      <HostPayments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/host/wallet"
                  element={
                    <ProtectedRoute requiredRole="host">
                      <HostWallet />
                    </ProtectedRoute>
                  }
                />
                
                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/service-fee"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <ServiceFee />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/payments"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Payments />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Users />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/wallet-management"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <WalletManagement />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Reports />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/moods"
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Moods />
                    </ProtectedRoute>
                  }
                />
                
                {/* Policy Pages */}
                <Route path="/policy/:type" element={<Policy />} />
                
                {/* Public Pages */}
                <Route path="/about" element={<About />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                
                {/* Guest Public Routes */}
                <Route path="/explore" element={<Explore />} />
                <Route path="/listing/:id" element={<ListingDetail />} />
                
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <AccountSettings />
                    </ProtectedRoute>
                  }
                />
                
                {/* 404 Not Found */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </main>
          <Footer />
          <Chatbot />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
