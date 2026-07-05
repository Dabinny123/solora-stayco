// Moods Service for Solora StayCo
import {
  createDocument,
  updateDocument,
  deleteDocument,
  getDocument,
  getDocuments,
} from '../firebase/firestoreService.js';
import { DEFAULT_MOOD_CATEGORIES } from '../utils/defaultMoods.js';

const COLLECTION_NAME = 'moods';

/**
 * Create a new mood definition
 * @param {Object} moodData
 * @returns {Promise<string>} Mood ID
 */
export async function createMood(moodData) {
  const data = {
    ...moodData,
    isActive: moodData.isActive ?? true,
    sortOrder: moodData.sortOrder ?? 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return await createDocument(COLLECTION_NAME, data);
}

/**
 * Update an existing mood
 * @param {string} moodId
 * @param {Object} updates
 */
export async function updateMood(moodId, updates) {
  return await updateDocument(COLLECTION_NAME, moodId, {
    ...updates,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Delete a mood
 * @param {string} moodId
 */
export async function deleteMood(moodId) {
  return await deleteDocument(COLLECTION_NAME, moodId);
}

/**
 * Get a mood by ID
 * @param {string} moodId
 * @returns {Promise<Object|null>}
 */
export async function getMood(moodId) {
  return await getDocument(COLLECTION_NAME, moodId);
}

/**
 * Get all moods (optionally include inactive)
 * @param {boolean} includeInactive
 * @returns {Promise<Array>}
 */
export async function getAllMoods(includeInactive = false) {
  const filters = includeInactive ? [] : [{ field: 'isActive', operator: '==', value: true }];
  return await getDocuments(COLLECTION_NAME, filters, 'sortOrder', 'asc');
}

/**
 * Get moods by IDs
 * @param {Array<string>} moodIds
 * @returns {Promise<Array>}
 */
export async function getMoodsByIds(moodIds = []) {
  if (!moodIds.length) return [];
  const results = await Promise.all(moodIds.map((id) => getMood(id)));
  return results.filter(Boolean);
}

/**
 * Seed default mood categories into Firestore (admin only).
 * Skips moods that already exist.
 * @returns {Promise<{ created: number, skipped: number }>}
 */
export async function seedDefaultMoods() {
  let created = 0;
  let skipped = 0;
  for (const mood of DEFAULT_MOOD_CATEGORIES) {
    const existing = await getMood(mood.id);
    if (existing) {
      skipped += 1;
      continue;
    }
    await createDocument(COLLECTION_NAME, {
      name: mood.name,
      description: mood.description,
      isActive: true,
      sortOrder: DEFAULT_MOOD_CATEGORIES.indexOf(mood),
      ambienceTags: [],
      lighting: [],
      colorPalettes: [],
    }, mood.id);
    created += 1;
  }
  return { created, skipped };
}

