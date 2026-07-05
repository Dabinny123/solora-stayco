// E-Wallet Service for Solora StayCo — with Firestore transactions for data integrity
import { 
    createDocument, 
    updateDocument, 
    getDocument, 
    getDocuments 
} from '../firebase/firestoreService';
import { updateUser, getUser } from './usersService';
import { db } from '../firebase/firebaseConfig';
import { doc, runTransaction, collection, addDoc, serverTimestamp } from 'firebase/firestore';

const COLLECTION_NAME = 'wallet_transactions';

/**
 * Get user wallet balance
 * @param {string} userId - User ID
 * @returns {Promise<number>} Wallet balance
 */
export async function getWalletBalance(userId) {
    try {
        const user = await getUser(userId);
        return user?.walletBalance || 0;
    } catch (error) {
        console.error('Error getting wallet balance:', error);
        return 0;
    }
}

/**
 * Add funds to wallet (atomic transaction)
 * @param {string} userId - User ID
 * @param {number} amount - Amount to add
 * @param {string} method - Payment method
 * @returns {Promise<string>} Transaction ID
 */
export async function addFunds(userId, amount, method = 'card') {
    try {
        const userRef = doc(db, 'users', userId);
        let currentBalance, newBalance;

        // Atomic read-then-write via Firestore transaction
        await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) throw new Error('User not found');

            currentBalance = userSnap.data().walletBalance || 0;
            newBalance = currentBalance + amount;

            transaction.update(userRef, {
                walletBalance: newBalance,
                updatedAt: serverTimestamp(),
            });
        });

        // Create transaction record (outside the transaction to keep it lean)
        const transactionId = await createDocument(COLLECTION_NAME, {
            userId,
            type: 'deposit',
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            method,
            status: 'completed',
            description: `Added ${amount} to wallet`,
            createdAt: new Date().toISOString(),
        });

        return transactionId;
    } catch (error) {
        console.error('Error adding funds:', error);
        throw error;
    }
}

/**
 * Deduct funds from wallet (atomic transaction)
 * @param {string} userId - User ID
 * @param {number} amount - Amount to deduct
 * @param {string} description - Transaction description
 * @param {string} referenceId - Reference ID (e.g., booking ID)
 * @returns {Promise<string>} Transaction ID
 */
export async function deductFunds(userId, amount, description, referenceId = null) {
    try {
        const userRef = doc(db, 'users', userId);
        let currentBalance, newBalance;

        await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) throw new Error('User not found');

            currentBalance = userSnap.data().walletBalance || 0;

            if (currentBalance < amount) {
                throw new Error('Insufficient wallet balance');
            }

            newBalance = currentBalance - amount;

            transaction.update(userRef, {
                walletBalance: newBalance,
                updatedAt: serverTimestamp(),
            });
        });

        // Create transaction record
        const transactionId = await createDocument(COLLECTION_NAME, {
            userId,
            type: 'withdrawal',
            amount: -amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            method: 'e-wallet',
            status: 'completed',
            description,
            referenceId,
            createdAt: new Date().toISOString(),
        });

        return transactionId;
    } catch (error) {
        console.error('Error deducting funds:', error);
        throw error;
    }
}

/**
 * Get wallet transactions
 * @param {string} userId - User ID
 * @param {number} limit - Maximum number of transactions
 * @returns {Promise<Array>} Array of transactions
 */
export async function getWalletTransactions(userId, limit = 50) {
    try {
        const filters = [{ field: 'userId', operator: '==', value: userId }];
        return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc', limit);
    } catch (error) {
        console.error('Error getting wallet transactions:', error);
        return [];
    }
}

/**
 * Process payment with e-wallet
 * @param {string} userId - User ID
 * @param {number} amount - Payment amount
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object>} Payment result
 */
export async function payWithWallet(userId, amount, bookingId) {
    try {
        const balance = await getWalletBalance(userId);
        
        if (balance < amount) {
            return {
                success: false,
                error: 'Insufficient wallet balance',
                requiredAmount: amount - balance,
            };
        }

        // Deduct funds (uses transaction internally)
        await deductFunds(userId, amount, `Payment for booking ${bookingId}`, bookingId);

        return {
            success: true,
            transactionId: null, // Will be set by payment service
        };
    } catch (error) {
        console.error('Error processing wallet payment:', error);
        return {
            success: false,
            error: error.message,
        };
    }
}

/**
 * Credit host wallet with earnings from booking (atomic transaction)
 * @param {string} hostId - Host user ID
 * @param {number} amount - Amount to credit (host earnings)
 * @param {string} bookingId - Booking ID for reference
 * @param {string} paymentId - Payment ID for reference
 * @returns {Promise<string>} Transaction ID
 */
export async function creditHostWallet(hostId, amount, bookingId, paymentId) {
    try {
        if (!hostId || !amount || amount <= 0) {
            throw new Error('Invalid host wallet credit parameters');
        }

        const userRef = doc(db, 'users', hostId);
        let currentBalance, newBalance;

        await runTransaction(db, async (transaction) => {
            const userSnap = await transaction.get(userRef);
            if (!userSnap.exists()) throw new Error('Host user not found');

            currentBalance = userSnap.data().walletBalance || 0;
            newBalance = currentBalance + amount;

            transaction.update(userRef, {
                walletBalance: newBalance,
                updatedAt: serverTimestamp(),
            });
        });

        // Create transaction record
        const transactionId = await createDocument(COLLECTION_NAME, {
            userId: hostId,
            type: 'deposit',
            amount,
            balanceBefore: currentBalance,
            balanceAfter: newBalance,
            method: 'booking_earnings',
            status: 'completed',
            description: `Earnings from booking ${bookingId}`,
            referenceId: bookingId,
            paymentId: paymentId,
            createdAt: new Date().toISOString(),
        });

        console.log(`✅ Credited host wallet: ₱${amount} added to host ${hostId} (balance: ₱${newBalance})`);
        return transactionId;
    } catch (error) {
        console.error('Error crediting host wallet:', error);
        throw error;
    }
}
