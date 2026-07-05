// Reviews Service for Solora StayCo
import { 
    createDocument, 
    updateDocument, 
    getDocument, 
    getDocuments 
} from '../firebase/firestoreService';
import { updateListing } from './listingsService';

const COLLECTION_NAME = 'reviews';

/**
 * Create a new review
 * @param {Object} reviewData - Review data
 * @returns {Promise<string>} Review ID
 */
export async function createReview(reviewData) {
    const data = {
        ...reviewData,
        status: 'published',
        helpful: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    
    const reviewId = await createDocument(COLLECTION_NAME, data);
    
    // Update listing rating if it's a listing review
    if (reviewData.listingId) {
        await updateListingRating(reviewData.listingId);
    }
    
    return reviewId;
}

/**
 * Update a review
 * @param {string} reviewId - Review ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateReview(reviewId, updates) {
    const review = await getReview(reviewId);
    await updateDocument(COLLECTION_NAME, reviewId, {
        ...updates,
        updatedAt: new Date().toISOString(),
    });
    
    // Update listing rating if listing changed
    if (review?.listingId) {
        await updateListingRating(review.listingId);
    }
}

/**
 * Get a review by ID
 * @param {string} reviewId - Review ID
 * @returns {Promise<Object|null>} Review data
 */
export async function getReview(reviewId) {
    return await getDocument(COLLECTION_NAME, reviewId);
}

/**
 * Get reviews for a listing
 * @param {string} listingId - Listing ID
 * @param {number} limitCount - Maximum number of results
 * @returns {Promise<Array>} Array of reviews
 */
export async function getListingReviews(listingId, limitCount = 50) {
    const filters = [
        { field: 'listingId', operator: '==', value: listingId },
        { field: 'status', operator: '==', value: 'published' }
    ];
    return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc', limitCount);
}

/**
 * Get reviews by user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of reviews
 */
export async function getReviewsByUser(userId) {
    const filters = [{ field: 'userId', operator: '==', value: userId }];
    return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc');
}

/**
 * Get reviews for a user (reviews about the user)
 * @param {string} targetUserId - Target user ID
 * @returns {Promise<Array>} Array of reviews
 */
export async function getReviewsForUser(targetUserId) {
    const filters = [{ field: 'targetUserId', operator: '==', value: targetUserId }];
    return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc');
}

/**
 * Get best reviews (highest ratings)
 * @param {string} listingId - Optional listing ID
 * @param {number} limitCount - Maximum number of results
 * @returns {Promise<Array>} Array of reviews
 */
export async function getBestReviews(listingId = null, limitCount = 10) {
    const filters = [{ field: 'rating', operator: '>=', value: 4 }];
    if (listingId) {
        filters.push({ field: 'listingId', operator: '==', value: listingId });
    }
    return await getDocuments(COLLECTION_NAME, filters, 'rating', 'desc', limitCount);
}

/**
 * Get lowest reviews (lowest ratings)
 * @param {string} listingId - Optional listing ID
 * @param {number} limitCount - Maximum number of results
 * @returns {Promise<Array>} Array of reviews
 */
export async function getLowestReviews(listingId = null, limitCount = 10) {
    const filters = [{ field: 'rating', operator: '<=', value: 2 }];
    if (listingId) {
        filters.push({ field: 'listingId', operator: '==', value: listingId });
    }
    return await getDocuments(COLLECTION_NAME, filters, 'rating', 'asc', limitCount);
}

/**
 * Update listing rating based on all reviews
 * @param {string} listingId - Listing ID
 * @returns {Promise<void>}
 */
export async function updateListingRating(listingId) {
    const reviews = await getListingReviews(listingId);
    
    if (reviews.length === 0) {
        await updateListing(listingId, { rating: 0, totalReviews: 0 });
        return;
    }
    
    const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
    const averageRating = totalRating / reviews.length;
    
    await updateListing(listingId, {
        rating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: reviews.length,
    });
}

/**
 * Mark review as helpful
 * @param {string} reviewId - Review ID
 * @returns {Promise<void>}
 */
export async function markReviewHelpful(reviewId) {
    const review = await getReview(reviewId);
    if (review) {
        await updateReview(reviewId, { helpful: (review.helpful || 0) + 1 });
    }
}

