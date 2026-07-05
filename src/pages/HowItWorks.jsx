// How It Works Page - Detailed explanation of mood-based booking
import React from 'react';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: '01',
    icon: '❤️',
    title: 'Select Your Mood',
    description: "Tell us how you're feeling or how you want to feel. Choose from carefully curated mood categories that reflect different emotional states and needs.",
    details: [
      'Relaxed – For unwinding and de-stressing',
      'Romantic – For couples and special moments',
      'Adventurous – For thrill-seekers and explorers',
      'Need Peace – For escaping stress and chaos',
      'Creative – For artists and dreamers',
      'Family Time – For bonding with loved ones',
      'Self-Care – For wellness and healing',
      'Solo Recharge – For personal reflection',
    ],
  },
  {
    number: '02',
    icon: '🔍',
    title: 'Browse Matched Staycations',
    description: 'Our intelligent matching system analyzes each property\'s ambiance, activities, location type, and amenities to recommend staycations that align with your emotional needs.',
    details: [
      'Filtered by noise level and atmosphere',
      'Matched to your preferred activities',
      'Location type consideration (beach, city, nature)',
      'Lighting and ambiance matching',
    ],
  },
  {
    number: '03',
    icon: '📅',
    title: 'Book Your Escape',
    description: 'Select your dates, number of guests, and complete your reservation. Our seamless booking process gets you from mood selection to confirmation in minutes.',
    details: [
      'Instant booking available',
      'Flexible cancellation options',
      'Secure payment processing',
      'Direct communication with hosts',
    ],
  },
  {
    number: '04',
    icon: '⭐',
    title: 'Experience & Review',
    description: 'Enjoy your mood-matched staycation and share your experience. Your mood-based review helps others find their perfect emotional escape.',
    details: [
      'Rate the overall experience',
      'Share how well it matched your mood',
      'Help future travelers decide',
      'Build your travel profile',
    ],
  },
];

function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="pt-4">
        {/* Hero */}
        <section className="section-padding text-center relative overflow-hidden">
          {/* Subtle decorative background */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          </div>
          <div className="container-custom relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-6">
              <span>📖</span>
              Simple & Transparent
            </div>
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-6 leading-tight">
              How Solora StayCo
              <br />
              <span className="gradient-text">Works</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
              We've reimagined staycation booking by putting your emotional well-being first.
              Here's how our mood-based matching system helps you find the perfect escape.
            </p>
            <Link
              to="/explore"
              className="btn btn-primary inline-flex items-center gap-2 text-lg px-8 py-3.5 rounded-xl shadow-medium"
            >
              Start Exploring
              <span>→</span>
            </Link>
          </div>
        </section>

        {/* Steps */}
        <section className="section-padding">
          <div className="container-custom">
            <div className="space-y-20 lg:space-y-28">
              {steps.map((step, index) => (
                <div
                  key={index}
                  className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center`}
                >
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-3xl shrink-0">
                        {step.icon}
                      </div>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-widest text-primary">Step {step.number}</span>
                        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground">
                          {step.title}
                        </h2>
                      </div>
                    </div>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-primary mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-foreground/80">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="aspect-square rounded-3xl bg-gradient-to-br from-primary/8 via-accent/8 to-secondary/8 border border-border/50 flex items-center justify-center text-8xl shadow-soft relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5" aria-hidden />
                      <span className="relative z-10 drop-shadow-sm">{step.icon}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="section-padding bg-foreground text-background relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none" aria-hidden>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
          </div>
          <div className="container-custom text-center relative z-10">
            <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">
              Ready to find your emotional escape?
            </h2>
            <p className="text-background/70 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
              Start your mood-based staycation journey today and discover places that truly understand how you feel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/explore"
                className="btn bg-primary text-primary-foreground hover:opacity-90 inline-flex items-center justify-center gap-2 text-lg px-8 py-3.5 rounded-xl shadow-medium"
              >
                Find Your Perfect Stay
                <span>→</span>
              </Link>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 text-lg px-8 py-3.5 rounded-xl font-medium border border-background/30 text-background hover:bg-background/10 transition-colors"
              >
                Become a Host
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default HowItWorksPage;
