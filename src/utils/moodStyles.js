// Shared mood styles for icons and gradients
export const MOOD_STYLES = {
  relaxed: { icon: '🧘', gradient: 'from-emerald-400 to-teal-500' },
  romantic: { icon: '💕', gradient: 'from-pink-400 to-rose-500' },
  adventurous: { icon: '🏔️', gradient: 'from-orange-400 to-amber-500' },
  stressed: { icon: '🌊', gradient: 'from-blue-400 to-cyan-500' },
  creative: { icon: '🎨', gradient: 'from-purple-400 to-violet-500' },
  family: { icon: '👨‍👩‍👧‍👦', gradient: 'from-yellow-400 to-orange-400' },
  healing: { icon: '🌸', gradient: 'from-teal-400 to-emerald-500' },
  solo: { icon: '🌙', gradient: 'from-indigo-400 to-purple-500' },
};

export function getMoodStyle(moodId) {
  return MOOD_STYLES[moodId] || { icon: '✨', gradient: 'from-primary to-accent' };
}
