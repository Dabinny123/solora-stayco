import React from 'react';
import { useNavigate, Link } from 'react-router-dom';

const moods = [
  {
    id: 'relaxed',
    label: 'Relaxed',
    description: 'Unwind and recharge',
    image: '/mood-relaxed.jpg',
    effectClass: 'mood-orb--relaxed',
    iconBg: 'bg-teal-50',
    iconColor: 'text-teal-600',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    ),
  },
  {
    id: 'romantic',
    label: 'Romantic',
    description: 'Intimate escapes for two',
    image: '/mood-romantic.jpg',
    effectClass: 'mood-orb--romantic',
    iconBg: 'bg-rose-50',
    iconColor: 'text-rose-500',
    icon: (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z" />
      </svg>
    ),
  },
  {
    id: 'adventurous',
    label: 'Adventurous',
    description: 'For thrill seekers and explorers',
    image: '/mood-adventurous.jpg',
    effectClass: 'mood-orb--adventurous',
    iconBg: 'bg-amber-50',
    iconColor: 'text-amber-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    id: 'family',
    label: 'Family Fun',
    description: 'Memorable stays for everyone',
    image: '/mood-family.jpg',
    effectClass: 'mood-orb--family',
    iconBg: 'bg-purple-50',
    iconColor: 'text-purple-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    id: 'needPeace',
    label: 'Need Peace',
    description: 'Quiet and serene escapes',
    image: '/mood-peace.jpg',
    effectClass: 'mood-orb--needPeace',
    iconBg: 'bg-sky-50',
    iconColor: 'text-sky-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
      </svg>
    ),
  },
  {
    id: 'creative',
    label: 'Creative',
    description: 'Inspire your imagination',
    image: '/mood-creative.jpg',
    effectClass: 'mood-orb--creative',
    iconBg: 'bg-orange-50',
    iconColor: 'text-orange-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m1.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    id: 'selfCare',
    label: 'Self-Care',
    description: 'Rejuvenate mind & body',
    image: '/mood-selfcare.jpg',
    effectClass: 'mood-orb--selfCare',
    iconBg: 'bg-pink-50',
    iconColor: 'text-pink-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
  },
  {
    id: 'soloRecharge',
    label: 'Solo Recharge',
    description: 'Just you and your thoughts',
    image: '/mood-solo.jpg',
    effectClass: 'mood-orb--soloRecharge',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-500',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

function MoodCard({ mood, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`group mood-particle-card ${mood.effectClass} rounded-2xl border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-row h-[120px] text-left w-full`}
    >
      <div className="flex flex-col justify-center px-4 py-3 flex-1 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${mood.iconBg} ${mood.iconColor}`}>
          {mood.icon}
        </div>
        <h3 className="font-bold text-foreground text-sm leading-tight">{mood.label}</h3>
        <p className="text-muted-foreground text-xs mt-1 leading-snug line-clamp-2">{mood.description}</p>
      </div>

      <div className="mood-particle-image-wrap relative w-[110px] shrink-0 overflow-hidden">
        <img
          src={mood.image}
          alt={mood.label}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
    </button>
  );
}

function MoodSelector() {
  const navigate = useNavigate();

  return (
    <section className="py-8 bg-muted/30">
      <div className="container-custom">
        <div className="text-center mb-6">
          <p className="text-primary text-xs font-bold uppercase tracking-[0.2em] mb-3">
            Travel Your Mood
          </p>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-foreground mb-2">
            How do you feel today?
          </h2>
          <p className="text-muted-foreground text-base max-w-lg mx-auto">
            Your mood shapes your perfect staycation. Choose how you feel, and we'll do the rest.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
          {moods.slice(0, 4).map((mood) => (
            <MoodCard
              key={mood.id}
              mood={mood}
              onClick={() => navigate(`/explore?mood=${mood.id}`)}
            />
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {moods.slice(4).map((mood) => (
            <MoodCard
              key={mood.id}
              mood={mood}
              onClick={() => navigate(`/explore?mood=${mood.id}`)}
            />
          ))}
        </div>

        <div className="flex justify-center mt-6">
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full border-2 border-primary text-primary font-semibold text-sm hover:bg-primary hover:text-white transition-all duration-200"
          >
            Explore All Moods →
          </Link>
        </div>
      </div>
    </section>
  );
}

export default MoodSelector;
