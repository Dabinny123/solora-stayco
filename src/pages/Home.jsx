// Home Page - Matching reference design exactly
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getHomeStats } from '../services/homeStatsService';
import MoodSelector from '../components/MoodSelector';
import FeaturedStaycations from '../components/FeaturedStaycations';
import HowItWorks from '../components/HowItWorks';

function Home() {
  const [stats, setStats] = useState({ uniqueStays: 0, moodCount: 0, completedBookings: 0 });
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState('');
  const [guests, setGuests] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [mood, setMood] = useState('');
  const navigate = useNavigate();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    let cancelled = false;
    getHomeStats()
      .then((data) => { if (!cancelled) setStats(data || { uniqueStays: 0, moodCount: 0, completedBookings: 0 }); })
      .catch((err) => { if (!cancelled) console.error('Home stats:', err); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) {
      params.set('destination', destination);
      params.set('search', destination);
    }
    if (checkIn) params.set('checkIn', checkIn);
    if (checkOut) params.set('checkOut', checkOut);
    if (guests) params.set('guests', guests);
    if (mood) params.set('mood', mood);
    navigate(`/explore?${params.toString()}`);
  };

  const moods = [
    { value: 'relaxed', label: 'Relaxed' },
    { value: 'romantic', label: 'Romantic' },
    { value: 'adventurous', label: 'Adventurous' },
    { value: 'needPeace', label: 'Need Peace' },
    { value: 'creative', label: 'Creative' },
    { value: 'family', label: 'Family Fun' },
    { value: 'selfCare', label: 'Self-Care' },
    { value: 'soloRecharge', label: 'Solo Recharge' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">

      {/* ── Hero: ~50vh image, left-aligned text overlay ── */}
      <section className="relative overflow-hidden" style={{ height: '420px' }}>
        {/* Full-width background image */}
        <img
          src="/hero-staycation.jpg"
          alt="Serene staycation"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* White left-side overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/50 to-transparent" />

        {/* Text content — left side only */}
        <div className="relative h-full w-full px-6 sm:px-10 lg:px-16 flex items-center">
          <div className="max-w-[560px]">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background/90 text-foreground text-sm font-medium shadow-sm border border-border mb-6">
              <span>✨</span>
              Mood-Based Booking Platform
            </div>

            {/* Heading */}
            <h1 className="font-serif font-bold text-foreground mb-4" style={{ fontSize: '64px', lineHeight: '1.05' }}>
              Find Your Perfect
              <br />
              <span className="text-primary">Emotional Escape</span>
            </h1>

            {/* Sub */}
            <p className="text-base text-foreground/75 mb-7 leading-relaxed max-w-[420px]">
              Solora StayCo matches you with staycations based on how you feel —
              not just where you want to go. Book with emotion, leave with
              unforgettable memories.
            </p>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                to="/explore"
                className="btn btn-primary inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-md"
              >
                <span className="w-2 h-2 rounded-full bg-blue-300 inline-block"></span>
                Find Your Staycation
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-background/85 border border-border text-foreground hover:bg-background transition-colors"
              >
                How It Works →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Search Bar (sits below hero, slightly overlapping) ── */}
      <div className="container-custom px-4 sm:px-6 lg:px-8 -mt-4 relative z-20 mb-0">
        <form
          onSubmit={handleSearch}
          className="bg-card rounded-2xl shadow-large border border-border flex flex-col md:flex-row items-stretch md:items-center divide-y md:divide-y-0 md:divide-x divide-border"
        >
          {/* Where to */}
          <div className="flex items-center gap-3 px-5 py-2.5 flex-1">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-foreground">Where to?</div>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={destination}
                  onChange={e => setDestination(e.target.value)}
                  placeholder="Search destination"
                  className="w-full text-xs text-gray-400 bg-transparent focus:outline-none placeholder:text-gray-400 mt-0.5"
                />
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Check In – Check Out */}
          <div className="flex items-center gap-3 px-5 py-2.5 flex-1 md:flex-[1.35]">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex-1">
              <div className="text-xs font-semibold text-foreground">Check In – Check Out</div>
              <div className="grid grid-cols-2 gap-2 mt-0.5">
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => {
                    const nextCheckIn = e.target.value;
                    setCheckIn(nextCheckIn);
                    if (checkOut && nextCheckIn && checkOut <= nextCheckIn) {
                      setCheckOut('');
                    }
                  }}
                  min={today}
                  aria-label="Check-in date"
                  className="min-w-0 text-[11px] text-gray-500 bg-transparent focus:outline-none"
                />
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  min={checkIn || today}
                  aria-label="Check-out date"
                  className="min-w-0 text-[11px] text-gray-500 bg-transparent focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Guests */}
          <div className="flex items-center gap-3 px-5 py-2.5 flex-1">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div className="flex-1">
              <div className="text-xs font-semibold text-foreground">Guests</div>
              <input
                type="number"
                min="1"
                max="16"
                value={guests}
                onChange={e => setGuests(e.target.value)}
                placeholder="Add guests"
                className="w-full text-xs text-gray-400 bg-transparent focus:outline-none placeholder:text-gray-400 mt-0.5"
              />
            </div>
          </div>

          {/* Mood */}
          <div className="flex items-center gap-3 px-5 py-2.5 flex-1">
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <div className="flex-1">
              <div className="text-xs font-semibold text-foreground">Mood</div>
              <div className="flex items-center gap-1">
                <select
                  value={mood}
                  onChange={e => setMood(e.target.value)}
                  className="w-full text-xs text-gray-400 bg-transparent focus:outline-none appearance-none cursor-pointer mt-0.5"
                >
                  <option value="">How are you feeling?</option>
                  {moods.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Search button */}
          <div className="px-4 py-3 flex items-center justify-center">
            <button
              type="submit"
              className="w-11 h-11 bg-primary text-white rounded-full flex items-center justify-center hover:opacity-90 hover:scale-105 transition-all shadow-md shrink-0"
              aria-label="Search"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* ── Sections ── */}
      <MoodSelector />
      <FeaturedStaycations />
      <HowItWorks />
    </div>
  );
}

export default Home;
