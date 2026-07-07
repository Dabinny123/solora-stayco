// Payments Service for Solora StayCo
import { 
    createDocument, 
    updateDocument, 
    getDocument, 
    getDocuments 
} from '../firebase/firestoreService';

const COLLECTION_NAME = 'payments';

/**
 * Create a new payment
 * @param {Object} paymentData - Payment data
 * @returns {Promise<string>} Payment ID
 */
export async function createPayment(paymentData) {
    const data = {
        ...paymentData,
        status: paymentData.status || 'pending',
        refundAmount: 0,
        createdAt: new Date().toISOString(),
    };
    
    return await createDocument(COLLECTION_NAME, data);
}

/**
 * Update a payment
 * @param {string} paymentId - Payment ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updatePayment(paymentId, updates) {
    return await updateDocument(COLLECTION_NAME, paymentId, updates);
}

/**
 * Get a payment by ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object|null>} Payment data
 */
export async function getPayment(paymentId) {
    return await getDocument(COLLECTION_NAME, paymentId);
}

/**
 * Get payments by user
 * @param {string} userId - User ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} Array of payments
 */
export async function getPaymentsByUser(userId, status = null) {
    const filters = [{ field: 'userId', operator: '==', value: userId }];
    if (status) {
        filters.push({ field: 'status', operator: '==', value: status });
    }
    return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc');
}

/**
 * Get payment by booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object|null>} Payment data
 */
export async function getPaymentByBooking(bookingId) {
    const payments = await getDocuments(
        COLLECTION_NAME,
        [{ field: 'bookingId', operator: '==', value: bookingId }],
        'createdAt',
        'desc',
        1
    );
    return payments.length > 0 ? payments[0] : null;
}

/**
 * Get payment by external transaction ID.
 * @param {string} transactionId - PayPal capture ID, wallet ID, or other external transaction ID
 * @returns {Promise<Object|null>} Payment data
 */
export async function getPaymentByTransactionId(transactionId) {
    if (!transactionId) return null;
    const payments = await getDocuments(
        COLLECTION_NAME,
        [{ field: 'transactionId', operator: '==', value: transactionId }],
        null,
        null,
        1
    );
    return payments.length > 0 ? payments[0] : null;
}

/**
 * Get payment by PayPal order ID.
 * @param {string} paypalOrderId - PayPal order ID
 * @returns {Promise<Object|null>} Payment data
 */
export async function getPaymentByPayPalOrderId(paypalOrderId) {
    if (!paypalOrderId) return null;
    const payments = await getDocuments(
        COLLECTION_NAME,
        [{ field: 'paypalOrderId', operator: '==', value: paypalOrderId }],
        null,
        null,
        1
    );
    return payments.length > 0 ? payments[0] : null;
}

/**
 * Complete a payment
 * @param {string} paymentId - Payment ID
 * @param {string} transactionId - External transaction ID
 * @returns {Promise<void>}
 */
export async function completePayment(paymentId, transactionId) {
    await updatePayment(paymentId, {
        status: 'completed',
        transactionId,
        completedAt: new Date().toISOString(),
        processedAt: new Date().toISOString(),
    });
}

/**
 * Process a payment (mark as processing)
 * @param {string} paymentId - Payment ID
 * @returns {Promise<void>}
 */
export async function processPayment(paymentId) {
    await updatePayment(paymentId, {
        status: 'processing',
        processedAt: new Date().toISOString(),
    });
}

/**
 * Fail a payment
 * @param {string} paymentId - Payment ID
 * @param {string} reason - Failure reason
 * @returns {Promise<void>}
 */
export async function failPayment(paymentId, reason) {
    await updatePayment(paymentId, {
        status: 'failed',
        refundReason: reason,
    });
}

/**
 * Refund a payment
 * @param {string} paymentId - Payment ID
 * @param {number} refundAmount - Amount to refund
 * @param {string} reason - Refund reason
 * @returns {Promise<void>}
 */
export async function refundPayment(paymentId, refundAmount, reason) {
    const payment = await getPayment(paymentId);
    if (payment) {
        await updatePayment(paymentId, {
            status: 'refunded',
            refundAmount,
            refundReason: reason,
            refundedAt: new Date().toISOString(),
        });
    }
}

/**
 * Get all payments (admin function)
 * @param {string} status - Optional status filter
 * @param {number} limitCount - Maximum number of results
 * @returns {Promise<Array>} Array of payments
 */
export async function getAllPayments(status = null, limitCount = 100) {
    const filters = [];
    if (status) {
        filters.push({ field: 'status', operator: '==', value: status });
    }
    return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc', limitCount);
}

