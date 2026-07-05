// Points & Rewards Service for Solora StayCo
import { updateUser, getUser, addUserPoints } from './usersService';

/**
 * Award points for booking completion
 * @param {string} userId - User ID
 * @param {number} bookingAmount - Booking amount
 * @returns {Promise<void>}
 */
export async function awardBookingPoints(userId, bookingAmount) {
    // Award 1 point per $10 spent
    const points = Math.floor(bookingAmount / 10);
    if (points > 0) {
        await addUserPoints(userId, points);
    }
}

/**
 * Award points for review submission
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function awardReviewPoints(userId) {
    // Award 10 points for submitting a review
    await addUserPoints(userId, 10);
}

/**
 * Award points for first booking
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export async function awardFirstBookingPoints(userId) {
    const user = await getUser(userId);
    const bookingHistory = user?.preferences?.bookingHistory || [];
    
    // Award 50 bonus points for first booking
    if (bookingHistory.length === 1) {
        await addUserPoints(userId, 50);
    }
}

/**
 * Get user points and rewards
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Points and rewards data
 */
export async function getUserRewards(userId) {
    const user = await getUser(userId);
    return {
        points: user?.points || 0,
        rewards: user?.rewards || [],
    };
}

/**
 * Redeem points for discount
 * @param {string} userId - User ID
 * @param {number} pointsToRedeem - Points to redeem
 * @returns {Promise<number>} Discount amount (in dollars)
 */
export async function redeemPoints(userId, pointsToRedeem) {
    const user = await getUser(userId);
    const currentPoints = user?.points || 0;
    
    if (currentPoints < pointsToRedeem) {
        throw new Error('Insufficient points');
    }
    
    // 100 points = $1 discount
    const discountAmount = pointsToRedeem / 100;
    
    // Deduct points
    await updateUser(userId, {
        points: currentPoints - pointsToRedeem,
    });
    
    return discountAmount;
}

