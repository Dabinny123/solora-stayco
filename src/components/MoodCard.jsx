// MoodCard - Links to explore with mood filter
import React from 'react';
import { Link } from 'react-router-dom';
import { getMoodStyle } from '../utils/moodStyles';

function MoodCard({ mood }) {
  const id = mood.id || mood.docId;
  const style = getMoodStyle(id);
  const icon = mood.icon || style.icon;
  const gradient = mood.gradient || style.gradient;

  return (
    <Link to={`/explore?mood=${id}`}>
      <div
        className={`mood-card bg-gradient-to-br ${gradient} text-white p-6 group`}
      >
        <div className="relative z-10">
          <span className="text-4xl block mb-3 group-hover:scale-110 transition-transform duration-300">
            {icon}
          </span>
          <h3 className="font-serif text-xl font-semibold mb-2">
            {mood.name}
          </h3>
          <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
            {mood.description || 'Find staycations that match this mood'}
          </p>
        </div>
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" aria-hidden />
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" aria-hidden />
      </div>
    </Link>
  );
}

export default MoodCard;
