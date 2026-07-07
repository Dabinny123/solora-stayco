import { createDocument, getDocuments } from '../firebase/firestoreService';

const COLLECTION_NAME = 'transaction_logs';

export const TRANSACTION_EVENTS = {
  BOOKING_CREATED: 'booking_created',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  BOOKING_CANCELLED: 'booking_cancelled',
  WALLET_CREDITED: 'wallet_credited',
  WITHDRAWAL_REQUESTED: 'withdrawal_requested',
  WITHDRAWAL_APPROVED: 'withdrawal_approved',
  WITHDRAWAL_REJECTED: 'withdrawal_rejected',
  WITHDRAWAL_COMPLETED: 'withdrawal_completed',
};

export async function createTransactionLog({
  type,
  userId,
  actorId,
  bookingId = null,
  paymentId = null,
  withdrawalId = null,
  externalTransactionId = null,
  amount = 0,
  currency = 'USD',
  paymentMethod = null,
  status = 'completed',
  description = '',
  metadata = {},
}) {
  return await createDocument(COLLECTION_NAME, {
    type,
    userId,
    actorId: actorId || userId,
    bookingId,
    paymentId,
    withdrawalId,
    externalTransactionId,
    amount,
    currency,
    paymentMethod,
    status,
    description,
    metadata,
    timestamp: new Date().toISOString(),
  });
}

export async function getTransactionLogs(filters = [], limitCount = 100) {
  return await getDocuments(COLLECTION_NAME, filters, 'timestamp', 'desc', limitCount);
}
