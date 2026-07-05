// Authentication Service for Solora StayCo
import { 
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail,
    updatePassword,
    reauthenticateWithCredential,
    EmailAuthProvider
} from 'firebase/auth';
import { auth, db } from '../firebase/firebaseConfig.js';
import { doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * Sign up a new user with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} displayName - User display name
 * @param {string} role - User role ('guest', 'host', or 'admin')
 * @param {string|null} phoneNumber - User phone number (optional)
 * @returns {Promise<Object>} User credential and user data
 */
function getVerificationActionCodeSettings() {
    const fallbackUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/verify-email`
        : 'https://solora-stayco.web.app/verify-email';

    const configuredUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EMAIL_VERIFICATION_REDIRECT)
        ? import.meta.env.VITE_EMAIL_VERIFICATION_REDIRECT
        : null;

    return {
        url: configuredUrl || fallbackUrl,
        handleCodeInApp: false,
    };
}

export async function signUp(email, password, displayName, role = 'guest') {
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update user profile
        await updateProfile(user, {
            displayName: displayName
        });

        // Send email verification
        try {
            await sendEmailVerification(user, getVerificationActionCodeSettings());
        } catch (verificationError) {
            console.error('Error sending verification email:', verificationError);
            throw new Error(
                verificationError?.message ||
                'Account created, but we could not send the verification email. Please try again.'
            );
        }

        // Create user document in Firestore
        const userData = {
            uid: user.uid,
            email: user.email,
            displayName: displayName,
            role: role,
            createdAt: new Date().toISOString(),
            emailVerified: false,
            profilePhoto: null,
            phoneNumber: null,
            walletBalance: 0,
            points: 0,
            preferences: {
                favoriteCategories: [],
                savedListings: [],
                bookingHistory: [],
            },
            hostInfo: role === 'host' ? {
                isVerified: false,
                totalListings: 0,
                totalBookings: 0,
                rating: 0,
                responseRate: 0,
            } : null,
        };

        await setDoc(doc(db, 'users', user.uid), userData);

        console.log('User signed up successfully:', user.uid);
        return { userCredential, userData };
    } catch (error) {
        console.error('Error signing up:', error);
        throw error;
    }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User credential
 */
export async function signIn(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
            try {
                await sendEmailVerification(userCredential.user, getVerificationActionCodeSettings());
            } catch (verificationError) {
                console.error('Error re-sending verification email:', verificationError);
            }
            await signOut(auth);
            const verificationMessage = 'Please verify your email before signing in. We just sent you a fresh verification link.';
            throw new Error(verificationMessage);
        }
        console.log('User signed in successfully:', userCredential.user.uid);
        return userCredential;
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
}

/**
 * Sign out current user
 * @returns {Promise<void>}
 */
export async function signOutUser() {
    try {
        await signOut(auth);
        console.log('User signed out successfully');
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
}

/**
 * Get current authenticated user
 * @returns {Object|null} Current user or null
 */
export function getCurrentUser() {
    return auth.currentUser;
}

/**
 * Get current user data from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<Object|null>} User data or null
 */
export async function getCurrentUserData(uid) {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        if (userDoc.exists()) {
            return userDoc.data();
        }
        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        throw error;
    }
}

/**
 * Listen to authentication state changes
 * @param {Function} callback - Callback function to handle auth state changes
 * @returns {Function} Unsubscribe function
 */
export function onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userData = await getCurrentUserData(user.uid);
            callback({ user, userData });
        } else {
            callback(null);
        }
    });
}

/**
 * Send password reset email (legacy method - uses Firebase's built-in reset)
 * @param {string} email - User email
 * @returns {Promise<void>}
 */
export async function resetPassword(email) {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log('Password reset email sent');
    } catch (error) {
        console.error('Error sending password reset email:', error);
        throw error;
    }
}

/**
 * Check if user has specific role
 * @param {string} uid - User ID
 * @param {string} role - Role to check ('guest', 'host', 'admin')
 * @returns {Promise<boolean>}
 */
export async function hasRole(uid, role) {
    try {
        const userData = await getCurrentUserData(uid);
        return userData && userData.role === role;
    } catch (error) {
        console.error('Error checking role:', error);
        return false;
    }
}

/**
 * Change user password
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
export async function changePassword(currentPassword, newPassword) {
    try {
        const user = auth.currentUser;
        if (!user || !user.email) {
            throw new Error('No authenticated user found');
        }

        // Re-authenticate user with current password
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, newPassword);
        console.log('Password updated successfully');
    } catch (error) {
        console.error('Error changing password:', error);
        if (error.code === 'auth/wrong-password') {
            throw new Error('Current password is incorrect');
        } else if (error.code === 'auth/weak-password') {
            throw new Error('New password is too weak. Please use at least 6 characters.');
        } else if (error.code === 'auth/requires-recent-login') {
            throw new Error('Please sign out and sign back in before changing your password');
        }
        throw error;
    }
}

