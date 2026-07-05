// Default mood categories - used for seeding Firestore and fallbacks
import { getMoodStyle } from './moodStyles';

export const DEFAULT_MOOD_CATEGORIES = [
  { id: 'relaxed', name: 'Relaxed', description: 'Unwind and let go of daily stress in peaceful surroundings' },
  { id: 'romantic', name: 'Romantic', description: 'Create magical moments with your special someone' },
  { id: 'adventurous', name: 'Adventurous', description: 'Explore new experiences and thrilling activities' },
  { id: 'stressed', name: 'Need Peace', description: 'Find tranquility and mental clarity away from chaos' },
  { id: 'creative', name: 'Creative', description: 'Spark inspiration in artistically stimulating spaces' },
  { id: 'family', name: 'Family Time', description: 'Bond with loved ones in family-friendly environments' },
  { id: 'healing', name: 'Self-Care', description: 'Nurture your body and soul with wellness retreats' },
  { id: 'solo', name: 'Solo Recharge', description: 'Reconnect with yourself in personal sanctuary spaces' },
];

// Enrich with icons from moodStyles
export function getDefaultMoodsWithIcons() {
  return DEFAULT_MOOD_CATEGORIES.map((m) => {
    const style = getMoodStyle(m.id);
    return { ...m, icon: style.icon };
  });
}
