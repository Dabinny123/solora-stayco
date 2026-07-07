// Sign Up Page for Solora StayCo — Brand-aligned design
import React, { useState } from 'react';
import { signUp, signOutUser } from '../../auth/authService';
import { Link } from 'react-router-dom';

function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    role: 'guest',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUp(formData.email, formData.password, formData.displayName, formData.role);
      setSuccess('Account created successfully! You can now sign in. You will be asked to verify your email when you make your first booking.');
      setFormData({ email: '', password: '', confirmPassword: '', displayName: '', role: 'guest' });
      await signOutUser();
    } catch (error) {
      setError(error.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left — Decorative Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src="/hero-staycation.jpg"
          alt="Beautiful staycation"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-accent/60 via-primary/40 to-secondary/40" />
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
              Start your journey today
            </h2>
            <p className="text-white/80 text-lg leading-relaxed">
              Whether you're a traveler seeking emotional escapes or a host with a space to share — your story begins here.
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
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Join Solora StayCo and start your journey
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

            {success && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-foreground text-sm">
                <svg className="w-5 h-5 text-primary shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{success}</span>
              </div>
            )}

            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-foreground mb-1.5">
                Full Name
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                required
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                placeholder="John Doe"
                value={formData.displayName}
                onChange={handleChange}
              />
            </div>

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
              <p className="mt-1.5 text-xs text-muted-foreground">
                We'll send a verification link to this email after sign-up.
              </p>
            </div>

            {/* Role Selection — Visual Cards */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                I want to
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'guest' })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.role === 'guest'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 bg-card'
                  }`}
                >
                  <span className="text-2xl mb-2 block">🏖️</span>
                  <span className="text-sm font-semibold text-foreground block">Book Stays</span>
                  <span className="text-xs text-muted-foreground">Find & book accommodations</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'host' })}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    formData.role === 'host'
                      ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                      : 'border-border hover:border-primary/40 bg-card'
                  }`}
                >
                  <span className="text-2xl mb-2 block">🏡</span>
                  <span className="text-sm font-semibold text-foreground block">List Property</span>
                  <span className="text-xs text-muted-foreground">Share your space as a host</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                  Password
                </label>
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
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-1.5">
                  Confirm
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-colors"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
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
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link to="/signin" className="font-semibold text-primary hover:text-primary/80 transition-colors">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SignUp;
