// Email Verification Service for Solora StayCo
// Client-side service that coordinates code-based verification via Firestore and a Vercel email API.
import { auth, db } from '../firebase/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Send a 6-digit verification code to the user's email.
 * Generates the code client-side, saves it to Firestore, and calls the
 * Vercel Serverless Function to dispatch the branded HTML email.
 *
 * @param {string} email - User's email address
 * @param {string} [displayName] - User's display name (for email personalisation)
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendVerificationCode(email, displayName = '') {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No signed-in user found. Please sign in again to verify.');
  }

  try {
    // Rate-limiting check: one email per 60 seconds
    const codeDocRef = doc(db, 'verification_codes', currentUser.uid);
    const existingDoc = await getDoc(codeDocRef);

    if (existingDoc.exists()) {
      const data = existingDoc.data();
      const lastSent = data.sentAt ? new Date(data.sentAt) : new Date(0);
      const secondsSinceLastSent = (Date.now() - lastSent.getTime()) / 1000;
      if (secondsSinceLastSent < 60) {
        const waitSeconds = Math.ceil(60 - secondsSinceLastSent);
        throw new Error(`Please wait ${waitSeconds} seconds before requesting a new code.`);
      }
    }

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes TTL

    // Store the code verification state in Firestore (allowed under doc owner rules)
    await setDoc(codeDocRef, {
      code,
      email,
      sentAt: new Date().toISOString(),
      expiresAt,
      verified: false,
      attempts: 0,
    });

    // Invoke Vercel Serverless API to deliver the email
    const response = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, code, displayName }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to dispatch verification email via API.');
    }

    console.log(`✅ Verification code email dispatched to ${email}`);
    return { success: true, message: 'Verification code sent' };
  } catch (error) {
    console.error('Error in sendVerificationCode:', error);
    throw error;
  }
}

/**
 * Verify a 6-digit code the user entered.
 * Compares the entered code directly with Firestore, checking attempt counts and expiry.
 *
 * @param {string} code - The 6-digit code entered by the user
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function verifyCode(code) {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('No signed-in user found. Please sign in again.');
  }

  try {
    const codeDocRef = doc(db, 'verification_codes', currentUser.uid);
    const codeDoc = await getDoc(codeDocRef);

    if (!codeDoc.exists()) {
      throw new Error('No verification code found. Please request a new one.');
    }

    const codeData = codeDoc.data();

    // Check maximum attempts (max 5)
    if ((codeData.attempts || 0) >= 5) {
      throw new Error('Too many attempts. Please request a new verification code.');
    }

    // Increment attempts
    const newAttempts = (codeData.attempts || 0) + 1;
    await updateDoc(codeDocRef, { attempts: newAttempts });

    // Check code expiry
    const expiresAt = new Date(codeData.expiresAt);
    if (Date.now() > expiresAt.getTime()) {
      throw new Error('This code has expired. Please request a new one.');
    }

    // Validate entered code
    if (codeData.code !== code.trim()) {
      const remaining = 5 - newAttempts;
      throw new Error(
        `Incorrect code. ${remaining > 0 ? `${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` : 'Please request a new code.'}`
      );
    }

    // Code matches — mark as verified in codes collection
    await updateDoc(codeDocRef, { verified: true });

    // Mark user emailVerified as true in Firestore user record
    const userDocRef = doc(db, 'users', currentUser.uid);
    await updateDoc(userDocRef, {
      emailVerified: true,
      emailVerifiedAt: new Date().toISOString(),
    });

    console.log(`✅ Email verified successfully for user ${currentUser.uid}`);
    return { success: true, message: 'Email verified successfully' };
  } catch (error) {
    console.error('Error in verifyCode:', error);
    throw error;
  }
}

/**
 * Check whether a user's email is verified.
 * Uses the Firestore `emailVerified` field on the user document
 * OR falls back to Firebase Auth's `emailVerified` for backward compatibility.
 *
 * @param {Object} userData - Firestore user data
 * @param {Object} [currentUser] - Firebase Auth user (optional, for backward compat)
 * @returns {boolean}
 */
export function isEmailVerified(userData, currentUser = null) {
  // Check Firestore field first (our code-based system)
  if (userData?.emailVerified === true) return true;
  // Backward compat: check Firebase Auth (link-based verification)
  if (currentUser?.emailVerified === true) return true;
  return false;
}
