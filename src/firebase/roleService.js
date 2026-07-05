// Role Management Service for Solora StayCo
import { getCurrentUserData, hasRole } from '../auth/authService.js';
import { updateDocument } from './firestoreService.js';

/**
 * User roles in Solora StayCo
 */
export const ROLES = {
    GUEST: 'guest',
    HOST: 'host',
    ADMIN: 'admin'
};

/**
 * Check if current user has admin role
 * @param {string} uid - User ID
 * @returns {Promise<boolean>}
 */
export async function isAdmin(uid) {
    return await hasRole(uid, ROLES.ADMIN);
}

/**
 * Check if current user has host role
 * @param {string} uid - User ID
 * @returns {Promise<boolean>}
 */
export async function isHost(uid) {
    return await hasRole(uid, ROLES.HOST);
}

/**
 * Check if current user has guest role
 * @param {string} uid - User ID
 * @returns {Promise<boolean>}
 */
export async function isGuest(uid) {
    return await hasRole(uid, ROLES.GUEST);
}

/**
 * Update user role (admin only)
 * @param {string} userId - User ID to update
 * @param {string} newRole - New role ('guest', 'host', 'admin')
 * @returns {Promise<void>}
 */
export async function updateUserRole(userId, newRole) {
    try {
        if (!Object.values(ROLES).includes(newRole)) {
            throw new Error('Invalid role');
        }
        
        await updateDocument('users', userId, { role: newRole });
        console.log(`User ${userId} role updated to ${newRole}`);
    } catch (error) {
        console.error('Error updating user role:', error);
        throw error;
    }
}

/**
 * Check if user can access host features
 * @param {string} uid - User ID
 * @returns {Promise<boolean>}
 */
export async function canAccessHostFeatures(uid) {
    const host = await isHost(uid);
    const admin = await isAdmin(uid);
    return host || admin;
}

/**
 * Check if user can access admin features
 * @param {string} uid - User ID
 * @returns {Promise<boolean>}
 */
export async function canAccessAdminFeatures(uid) {
    return await isAdmin(uid);
}

