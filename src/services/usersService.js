// Users Service for Solora StayCo
import { 
    updateDocument, 
    getDocument, 
    getDocuments 
} from '../firebase/firestoreService';

const COLLECTION_NAME = 'users';

/**
 * Get user data
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User data
 */
export async function getUser(userId) {
    return await getDocument(COLLECTION_NAME, userId);
}

/**
 * Update user data
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateUser(userId, updates) {
    return await updateDocument(COLLECTION_NAME, userId, updates);
}

/**
 * Add listing to user's saved listings
 * @param {string} userId - User ID
 * @param {string} listingId - Listing ID
 * @returns {Promise<void>}
 */
export async function addToSavedListings(userId, listingId) {
    const user = await getUser(userId);
    if (user) {
        const savedListings = user.preferences?.savedListings || [];
        if (!savedListings.includes(listingId)) {
            savedListings.push(listingId);
            await updateUser(userId, {
                'preferences.savedListings': savedListings,
            });
        }
    }
}

/**
 * Remove listing from user's saved listings
 * @param {string} userId - User ID
 * @param {string} listingId - Listing ID
 * @returns {Promise<void>}
 */
export async function removeFromSavedListings(userId, listingId) {
    const user = await getUser(userId);
    if (user) {
        const savedListings = (user.preferences?.savedListings || []).filter(
            id => id !== listingId
        );
        await updateUser(userId, {
            'preferences.savedListings': savedListings,
        });
    }
}

/**
 * Get user's saved listings
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of listing IDs
 */
export async function getSavedListings(userId) {
    const user = await getUser(userId);
    return user?.preferences?.savedListings || [];
}

/**
 * Update user preferences
 * @param {string} userId - User ID
 * @param {Object} preferences - Preferences object
 * @returns {Promise<void>}
 */
export async function updateUserPreferences(userId, preferences) {
    await updateUser(userId, {
        preferences: {
            ...preferences,
        },
    });
}

/**
 * Update host info
 * @param {string} userId - User ID
 * @param {Object} hostInfo - Host info object
 * @returns {Promise<void>}
 */
export async function updateHostInfo(userId, hostInfo) {
    await updateUser(userId, {
        hostInfo: {
            ...hostInfo,
        },
    });
}

/**
 * Add points to user
 * @param {string} userId - User ID
 * @param {number} points - Points to add
 * @returns {Promise<void>}
 */
export async function addUserPoints(userId, points) {
    const user = await getUser(userId);
    if (user) {
        await updateUser(userId, {
            points: (user.points || 0) + points,
        });
    }
}

/**
 * Update mood preferences based on user interaction
 * @param {string} userId
 * @param {string} moodId
 */
export async function updateUserMoodPreferences(userId, moodId) {
    if (!moodId) return;
    const user = await getUser(userId);
    if (!user) return;

    const moodPrefs = user.moodPreferences || {
        favoriteMoods: [],
        ambienceTags: [],
        lastMoodSelected: null,
    };

    const favoriteMoods = Array.from(new Set([moodId, ...(moodPrefs.favoriteMoods || [])])).slice(0, 6);

    await updateUser(userId, {
        moodPreferences: {
            ...moodPrefs,
            favoriteMoods,
            lastMoodSelected: moodId,
        },
    });
}

/**
 * Get all users (admin function)
 * @param {string} role - Optional role filter
 * @param {number} limitCount - Maximum number of results
 * @returns {Promise<Array>} Array of users
 */
export async function getAllUsers(role = null, limitCount = 100) {
    const filters = [];
    if (role) {
        filters.push({ field: 'role', operator: '==', value: role });
    }
    return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc', limitCount);
}

