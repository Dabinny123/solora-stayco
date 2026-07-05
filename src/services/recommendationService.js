// Recommendation Service for Solora StayCo
import { getUser } from './usersService';
import { getActiveListings } from './listingsService';
import { getAllMoods } from './moodsService';

/**
 * Get recommended listings based on user's mood preferences
 * @param {string} userId
 * @param {Object} options
 * @returns {Promise<Array>}
 */
export async function getMoodRecommendations(userId, { limit = 8 } = {}) {
  const user = await getUser(userId);
  const moodPreferences = user?.moodPreferences || {};
  const favoriteMoods = moodPreferences.favoriteMoods || [];
  const lastMood = moodPreferences.lastMoodSelected;

  let moodPriorityList = [];

  if (lastMood) {
    moodPriorityList.push(lastMood);
  }
  moodPriorityList = [...moodPriorityList, ...favoriteMoods];

  if (moodPriorityList.length === 0) {
    const moods = await getAllMoods();
    moodPriorityList = moods.map((mood) => mood.id);
  }

  const recommendations = [];
  const seenListingIds = new Set();

  for (const moodId of moodPriorityList) {
    if (!moodId) continue;
    const listings = await getActiveListings({ moodId }, limit);
    for (const listing of listings) {
      if (!seenListingIds.has(listing.id)) {
        recommendations.push(listing);
        seenListingIds.add(listing.id);
      }
      if (recommendations.length >= limit) break;
    }
    if (recommendations.length >= limit) break;
  }

  return recommendations;
}

