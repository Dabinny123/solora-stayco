// Sign In Page for Solora StayCo — Brand-aligned design
import React, { useState, useEffect } from 'react';
import { signIn, resetPassword, getCurrentUserData, getCurrentUser } from '../../auth/authService';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function SignIn() {
  const navigate = useNavigate();
  const { userData, isAuthenticated, currentUser } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(formData.email, formData.password);
    } catch (error) {
      setError(error.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!formData.email) {
      setError('Please enter your email address first');
      return;
    }
    try {
      await resetPassword(formData.email);
      setResetEmailSent(true);
      setError('');
    } catch (error) {
      setError(error.message || 'Failed to send reset email');
    }
  };

  const redirectByRole = (role) => {
    const normalized = typeof role === 'string' ? role.trim().toLowerCase() : 'guest';
    if (normalized === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (normalized === 'host') navigate('/host/dashboard', { replace: true });
    else navigate('/guest/dashboard', { replace: true });
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    const timeout = setTimeout(async () => {
      const authUser = currentUser || getCurrentUser();
      if (authUser) {
        try {
          const freshData = await getCurrentUserData(authUser.uid);
          redirectByRole(freshData?.role || userData?.role || 'guest');
        } catch {
          redirectByRole(userData?.role || 'guest');
        }
      } else if (userData) {
        redirectByRole(userData.role || 'guest');
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [isAuthenticated, userData, currentUser, navigate]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/hero-staycation.jpg"
          alt="Beautiful staycation"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/70 via-primary/40 to-accent/50" />
        <div className="relative z-10 flex flex-col justify-end p-12 text-white">
          <div className="max-w-md">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl">☀️</span>
              </div>
              <span className="font-serif text-2xl font-semibold">
                Solora StayCo
              </span>
            </div>
            <h2 className="font-serif text-3xl font-semibold mb-3 leading-tight">
              Your emotional escape awaits
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Discover mood-matched staycations designed for how you feel. Book with emotion, leave with memories.
            </p>
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-xl">☀️</span>
            </div>
            <span className="font-serif text-xl font-semibold text-foreground">
              Solora <span className="text-primary">StayCo</span>
            </span>
          </div>

          <div className="mb-8">
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-2">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Sign in to continue your journey
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-foreground text-sm">
                <svg className="w-5 h-5 text-destructive shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {resetEmailSent && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-sm">
                <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Password reset email sent! Check your inbox.</span>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-foreground">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn btn-primary py-3.5 text-base rounded-xl font-semibold disabled:opacity-50 transition-all hover:shadow-glow"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : 'Sign In'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Create one
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignIn;
