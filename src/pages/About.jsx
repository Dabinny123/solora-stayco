// About Page for Solora StayCo
import React from 'react';
import { Link } from 'react-router-dom';

const values = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    title: 'Emotion-First',
    description: 'Every decision we make puts your emotional well-being at the center of the experience.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: 'Trust & Safety',
    description: 'Verified hosts, secure payments, and transparent policies you can count on.',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Community',
    description: 'A growing network of travelers and hosts who share a passion for meaningful stays.',
  },
];

const stats = [
  { label: 'Mood Categories', value: '8+' },
  { label: 'Verified Hosts', value: '50+' },
  { label: 'Happy Guests', value: '200+' },
  { label: 'Cities Covered', value: '10+' },
];

function About() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="section-padding text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-accent/5 rounded-full blur-3xl" />
        </div>
        <div className="container-custom relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
            <span>☀️</span>
            About Us
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
            Stays That Match
            <br />
            <span className="gradient-text">How You Feel</span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Solora StayCo reimagines travel by connecting you with staycations based on your emotions — not just destinations.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-6">Our Mission</h2>
            <p className="text-lg text-foreground/80 leading-relaxed mb-4">
              We believe every stay should resonate with your mood and preferences. We've created a platform that goes beyond traditional 
              accommodation booking — connecting guests with unique spaces, curated experiences, and personalized services.
            </p>
            <p className="text-lg text-foreground/80 leading-relaxed">
              Whether you're seeking a cozy retreat, an adventurous escape, or a productive workspace, 
              Solora StayCo helps you find the perfect match based on your current mood and desired ambiance.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">What We Stand For</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">The principles that guide every experience on our platform.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((item, i) => (
              <div key={i} className="card group hover:shadow-medium transition-all duration-300 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-5 group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  {item.icon}
                </div>
                <h3 className="font-serif text-xl font-semibold text-foreground mb-3">{item.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="section-padding bg-foreground text-background">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((stat, i) => (
              <div key={i}>
                <div className="font-serif text-4xl sm:text-5xl font-semibold text-primary mb-2">{stat.value}</div>
                <div className="text-background/60 text-sm font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works (compact) */}
      <section className="section-padding">
        <div className="container-custom max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg">Three simple steps to your perfect staycation.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { n: '1', title: 'Choose Your Mood', desc: 'Select a mood that matches how you\'re feeling or what you want to experience.' },
              { n: '2', title: 'Browse Listings', desc: 'Explore curated listings that match your mood and preferences.' },
              { n: '3', title: 'Book & Enjoy', desc: 'Complete your booking and enjoy your personalized stay experience.' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                  {step.n}
                </div>
                <h3 className="font-serif text-lg font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* For Hosts */}
      <section className="section-padding bg-muted/30">
        <div className="container-custom max-w-4xl">
          <div className="card border-primary/20">
            <div className="flex flex-col md:flex-row md:items-center gap-8">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
                  <span>🏠</span>
                  For Hosts
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mb-4">Share Your Space</h2>
                <p className="text-foreground/80 leading-relaxed mb-6">
                  Share your unique space with travelers who appreciate what makes it special. 
                  Set your own pricing, manage your calendar, and earn income from your property.
                </p>
                <div className="space-y-3 mb-6">
                  {['Easy listing management', 'Secure payment processing', 'Direct guest communication'].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <svg className="w-5 h-5 text-primary shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-foreground/80 text-sm">{item}</span>
                    </div>
                  ))}
                </div>
                <Link to="/signup" className="btn btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl">
                  Become a Host
                  <span>→</span>
                </Link>
              </div>
              <div className="w-full md:w-48 h-48 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center text-6xl shrink-0">
                🏡
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding">
        <div className="container-custom max-w-2xl text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold text-foreground mb-4">Get Started Today</h2>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Have questions or ready to explore? Discover staycations that match your mood.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/explore" className="btn btn-primary inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-lg">
              Explore Listings
              <span>→</span>
            </Link>
            <Link to="/signup" className="btn btn-outline inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-lg">
              Create Account
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
