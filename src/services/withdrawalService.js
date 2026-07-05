// Withdrawal Request Service for Solora StayCo
// Handles host withdrawal requests and admin approval

import { 
    createDocument, 
    updateDocument, 
    getDocument, 
    getDocuments 
} from '../firebase/firestoreService';
import { getUser, updateUser } from './usersService';
import { deductFunds } from './walletService';
import { createPayPalPayout } from './paypalPayoutsService';

const COLLECTION_NAME = 'withdrawal_requests';

/**
 * Create a withdrawal request from host
 * @param {string} hostId - Host user ID
 * @param {number} amount - Amount to withdraw
 * @param {string} currency - Currency code (default: USD)
 * @returns {Promise<string>} Withdrawal request ID
 */
export async function createWithdrawalRequest(hostId, amount, currency = 'USD') {
    try {
        // Validate host has sufficient balance
        const host = await getUser(hostId);
        const currentBalance = host?.walletBalance || 0;
        
        if (currentBalance < amount) {
            throw new Error('Insufficient wallet balance');
        }
        
        if (amount <= 0) {
            throw new Error('Withdrawal amount must be greater than 0');
        }
        
        // Check if host has PayPal account connected
        if (!host?.paypalAccount?.isConnected || !host?.paypalAccount?.email) {
            throw new Error('PayPal account not connected. Please connect your PayPal account first.');
        }
        
        // Create withdrawal request
        const requestId = await createDocument(COLLECTION_NAME, {
            hostId,
            hostPayPalEmail: host.paypalAccount.email,
            amount,
            currency,
            status: 'pending', // 'pending', 'approved', 'processing', 'completed', 'rejected', 'failed'
            requestedAt: new Date().toISOString(),
            walletBalanceBefore: currentBalance,
        });
        
        console.log(`✅ Withdrawal request created: ${requestId} for host ${hostId} ($${amount})`);
        return requestId;
    } catch (error) {
        console.error('Error creating withdrawal request:', error);
        throw error;
    }
}

/**
 * Get withdrawal requests for a host
 * @param {string} hostId - Host user ID
 * @param {number} limit - Maximum number of requests
 * @returns {Promise<Array>} Array of withdrawal requests
 */
export async function getHostWithdrawalRequests(hostId, limit = 50) {
    try {
        const filters = [{ field: 'hostId', operator: '==', value: hostId }];
        return await getDocuments(COLLECTION_NAME, filters, 'requestedAt', 'desc', limit);
    } catch (error) {
        console.error('Error getting host withdrawal requests:', error);
        return [];
    }
}

/**
 * Get all withdrawal requests (admin only)
 * @param {string} status - Filter by status (optional)
 * @param {number} limit - Maximum number of requests
 * @returns {Promise<Array>} Array of withdrawal requests
 */
export async function getAllWithdrawalRequests(status = null, limit = 100) {
    try {
        const filters = [];
        if (status) {
            filters.push({ field: 'status', operator: '==', value: status });
        }
        return await getDocuments(COLLECTION_NAME, filters, 'requestedAt', 'desc', limit);
    } catch (error) {
        console.error('Error getting all withdrawal requests:', error);
        return [];
    }
}

/**
 * Approve withdrawal request and process payout
 * @param {string} requestId - Withdrawal request ID
 * @param {string} adminId - Admin user ID who approved
 * @returns {Promise<Object>} Payout result
 */
export async function approveWithdrawalRequest(requestId, adminId) {
    try {
        // Get withdrawal request
        const request = await getDocument(COLLECTION_NAME, requestId);
        if (!request) {
            throw new Error('Withdrawal request not found');
        }
        
        if (request.status !== 'pending') {
            throw new Error(`Withdrawal request is already ${request.status}`);
        }
        
        // Verify host still has sufficient balance
        const host = await getUser(request.hostId);
        const currentBalance = host?.walletBalance || 0;
        
        if (currentBalance < request.amount) {
            throw new Error('Host no longer has sufficient balance');
        }
        
        // Deduct from host wallet
        await deductFunds(
            request.hostId,
            request.amount,
            `Withdrawal request ${requestId}`,
            requestId
        );
        
        // Update request status to processing
        await updateDocument(COLLECTION_NAME, requestId, {
            status: 'processing',
            approvedAt: new Date().toISOString(),
            approvedBy: adminId,
        });
        
        // Process PayPal payout
        try {
            const payoutResult = await createPayPalPayout({
                hostPayPalEmail: request.hostPayPalEmail,
                amount: request.amount,
                currency: request.currency || 'USD',
                bookingId: null, // Withdrawal, not from booking
                paymentId: requestId,
                hostId: request.hostId,
            });
            
            // Update request with payout details
            await updateDocument(COLLECTION_NAME, requestId, {
                status: 'completed',
                payout_batch_id: payoutResult.payout_batch_id,
                batch_status: payoutResult.batch_status,
                completedAt: new Date().toISOString(),
            });
            
            console.log(`✅ Withdrawal approved and processed: ${requestId} -> ${payoutResult.payout_batch_id}`);
            
            return {
                success: true,
                requestId,
                payout_batch_id: payoutResult.payout_batch_id,
                batch_status: payoutResult.batch_status,
            };
        } catch (payoutError) {
            // Payout failed - refund wallet and mark as failed
            console.error('Payout failed, refunding wallet:', payoutError);
            
            // Refund wallet
            const { addFunds } = await import('./walletService');
            await addFunds(request.hostId, request.amount, 'refund');
            
            // Update request status
            await updateDocument(COLLECTION_NAME, requestId, {
                status: 'failed',
                error: payoutError.message,
                failedAt: new Date().toISOString(),
            });
            
            throw new Error(`Payout failed: ${payoutError.message}`);
        }
    } catch (error) {
        console.error('Error approving withdrawal request:', error);
        throw error;
    }
}

/**
 * Reject withdrawal request
 * @param {string} requestId - Withdrawal request ID
 * @param {string} adminId - Admin user ID who rejected
 * @param {string} reason - Rejection reason
 * @returns {Promise<void>}
 */
export async function rejectWithdrawalRequest(requestId, adminId, reason) {
    try {
        const request = await getDocument(COLLECTION_NAME, requestId);
        if (!request) {
            throw new Error('Withdrawal request not found');
        }
        
        if (request.status !== 'pending') {
            throw new Error(`Withdrawal request is already ${request.status}`);
        }
        
        await updateDocument(COLLECTION_NAME, requestId, {
            status: 'rejected',
            rejectedAt: new Date().toISOString(),
            rejectedBy: adminId,
            rejectionReason: reason,
        });
        
        console.log(`✅ Withdrawal request rejected: ${requestId}`);
    } catch (error) {
        console.error('Error rejecting withdrawal request:', error);
        throw error;
    }
}

