// Home page stats – reflects database counts
import { getDocument, getDocuments } from '../firebase/firestoreService';
import { getActiveListings } from './listingsService';
import { getAllMoods } from './moodsService';

/**
 * Get stats for the home page hero (unique stays, mood count, completed bookings).
 * Uses settings/homeStats for completedBookings (public read) to avoid permission errors
 * when unauthenticated. Bookings collection requires auth + guest/host/admin.
 * @returns {Promise<{ uniqueStays: number, moodCount: number, completedBookings: number }>}
 */
export async function getHomeStats() {
  const [listings, moods, homeStatsDoc] = await Promise.all([
    getActiveListings({}, 2000).catch(() => []),
    getAllMoods().catch(() => []),
    getDocument('settings', 'homeStats').catch(() => null),
  ]);

  // When no moods in Firestore, we use 8 default categories in the UI
  const moodCount = moods.length > 0 ? moods.length : 8;

  // Use settings/homeStats.completedBookingsCount (public); create doc in Firebase Console if needed
  const completedBookings = homeStatsDoc?.completedBookingsCount ?? 0;

  return {
    uniqueStays: listings.length,
    moodCount,
    completedBookings,
  };
}
