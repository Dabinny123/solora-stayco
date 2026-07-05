// HowItWorks - Booking Made Emotional section (no lucide - emoji icons)
import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: '❤️',
    title: 'Emotional Matching',
    description: 'Our algorithm analyzes your mood and matches you with staycations that align with your emotional needs.',
  },
  {
    icon: '🎯',
    title: 'Curated Experiences',
    description: 'Every property is carefully vetted for ambiance, activities, and atmosphere to ensure the perfect mood match.',
  },
  {
    icon: '✨',
    title: 'Personalized Results',
    description: 'Get recommendations based on your preferences, past bookings, and real-time mood assessments.',
  },
  {
    icon: '💬',
    title: 'Mood Reviews',
    description: 'Read reviews from travelers who booked with similar moods to make more informed decisions.',
  },
];

const steps = [
  { step: '01', title: 'Select Your Mood', desc: "Choose how you're feeling or how you want to feel" },
  { step: '02', title: 'Browse Matches', desc: 'Explore staycations curated for your emotional state' },
  { step: '03', title: 'Book & Experience', desc: 'Reserve your perfect escape and create memories' },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="section-padding bg-foreground text-background relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-accent/10 rounded-full blur-3xl" />
      </div>

      <div className="container-custom relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/10 text-primary text-sm font-semibold mb-6">
            <span>🧠</span>
            How It Works
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-semibold mb-4">
            Booking Made <span className="text-primary">Emotional</span>
          </h2>
          <p className="text-background/70 text-lg max-w-2xl mx-auto leading-relaxed">
            Experience a revolutionary way to find your perfect staycation — one that truly understands how you feel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-background/10 backdrop-blur-sm flex items-center justify-center text-3xl group-hover:bg-primary/30 group-hover:scale-110 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="font-serif text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-background/60 leading-relaxed text-sm">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Process Steps */}
        <div className="mt-20 pt-16 border-t border-background/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((item, index) => (
              <div key={index} className="relative text-center md:text-left">
                <div className="text-5xl font-serif font-bold text-primary/25 mb-3">{item.step}</div>
                <h3 className="font-serif text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-background/60 leading-relaxed text-sm">{item.desc}</p>
                {index < 2 && (
                  <div
                    className="hidden md:block absolute top-6 right-0 w-1/3 h-px bg-gradient-to-r from-primary/30 to-transparent"
                    aria-hidden
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            to="/how-it-works"
            className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300"
          >
            Learn more about how it works
            <span>→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
