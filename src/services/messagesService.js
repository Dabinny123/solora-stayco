// Messages Service for Solora StayCo
import { 
    createDocument, 
    updateDocument, 
    getDocument, 
    getDocuments 
} from '../firebase/firestoreService';

const COLLECTION_NAME = 'messages';

/**
 * Generate conversation ID from two user IDs
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {string} Conversation ID
 */
function generateConversationId(userId1, userId2) {
    return [userId1, userId2].sort().join('_');
}

/**
 * Create a new message
 * @param {Object} messageData - Message data
 * @returns {Promise<string>} Message ID
 */
export async function createMessage(messageData) {
    const conversationId = messageData.conversationId || 
        generateConversationId(messageData.senderId, messageData.receiverId);
    
    const data = {
        ...messageData,
        conversationId,
        read: false,
        createdAt: new Date().toISOString(),
    };
    
    return await createDocument(COLLECTION_NAME, data);
}

/**
 * Mark message as read
 * @param {string} messageId - Message ID
 * @returns {Promise<void>}
 */
export async function markMessageAsRead(messageId) {
    await updateDocument(COLLECTION_NAME, messageId, {
        read: true,
        readAt: new Date().toISOString(),
    });
}

/**
 * Get a message by ID
 * @param {string} messageId - Message ID
 * @returns {Promise<Object|null>} Message data
 */
export async function getMessage(messageId) {
    return await getDocument(COLLECTION_NAME, messageId);
}

/**
 * Get messages in a conversation
 * @param {string} conversationId - Conversation ID
 * @param {number} limitCount - Maximum number of results
 * @returns {Promise<Array>} Array of messages
 */
export async function getConversationMessages(conversationId, limitCount = 100) {
    const filters = [{ field: 'conversationId', operator: '==', value: conversationId }];
    return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'asc', limitCount);
}

/**
 * Get conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of conversation summaries
 */
export async function getUserConversations(userId) {
    // Get all messages where user is sender or receiver
    const sentMessages = await getDocuments(
        COLLECTION_NAME,
        [{ field: 'senderId', operator: '==', value: userId }],
        'createdAt',
        'desc'
    );
    
    const receivedMessages = await getDocuments(
        COLLECTION_NAME,
        [{ field: 'receiverId', operator: '==', value: userId }],
        'createdAt',
        'desc'
    );
    
    // Group by conversation ID and get latest message
    const conversationsMap = new Map();
    
    [...sentMessages, ...receivedMessages].forEach(message => {
        const convId = message.conversationId;
        if (!conversationsMap.has(convId) || 
            new Date(message.createdAt) > new Date(conversationsMap.get(convId).createdAt)) {
            conversationsMap.set(convId, message);
        }
    });
    
    return Array.from(conversationsMap.values());
}

/**
 * Get unread message count for a user
 * @param {string} userId - User ID
 * @returns {Promise<number>} Unread message count
 */
export async function getUnreadMessageCount(userId) {
    const filters = [
        { field: 'receiverId', operator: '==', value: userId },
        { field: 'read', operator: '==', value: false }
    ];
    const messages = await getDocuments(COLLECTION_NAME, filters);
    return messages.length;
}

/**
 * Mark all messages in a conversation as read
 * @param {string} conversationId - Conversation ID
 * @param {string} userId - User ID (receiver)
 * @returns {Promise<void>}
 */
export async function markConversationAsRead(conversationId, userId) {
    const messages = await getConversationMessages(conversationId);
    const unreadMessages = messages.filter(
        msg => msg.receiverId === userId && !msg.read
    );
    
    for (const message of unreadMessages) {
        await markMessageAsRead(message.id);
    }
}

