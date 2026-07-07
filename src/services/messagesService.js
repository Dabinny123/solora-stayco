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
    try {
        const filters = [{ field: 'conversationId', operator: '==', value: conversationId }];
        return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'asc', limitCount);
    } catch (error) {
        if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('building')) {
            console.warn('Conversation message index unavailable, using conversation-only fallback query');
            const messages = await getDocuments(
                COLLECTION_NAME,
                [{ field: 'conversationId', operator: '==', value: conversationId }],
                null,
                null,
                limitCount
            );
            return messages.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        }
        throw error;
    }
}

/**
 * Get conversations for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of conversation summaries
 */
export async function getUserConversations(userId) {
    const loadMessages = async (field) => {
        try {
            return await getDocuments(
                COLLECTION_NAME,
                [{ field, operator: '==', value: userId }],
                'createdAt',
                'desc'
            );
        } catch (error) {
            if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('building')) {
                console.warn(`${field} message index unavailable, using unordered fallback query`);
                const messages = await getDocuments(
                    COLLECTION_NAME,
                    [{ field, operator: '==', value: userId }],
                    null,
                    null,
                    1000
                );
                return messages.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
            }
            throw error;
        }
    };

    // Get all messages where user is sender or receiver
    const [sentMessages, receivedMessages] = await Promise.all([
        loadMessages('senderId'),
        loadMessages('receiverId'),
    ]);
    
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
    try {
        const filters = [
            { field: 'receiverId', operator: '==', value: userId },
            { field: 'read', operator: '==', value: false }
        ];
        const messages = await getDocuments(COLLECTION_NAME, filters);
        return messages.length;
    } catch (error) {
        if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('building')) {
            console.warn('Unread message index unavailable, using receiver-only fallback query');
            const messages = await getDocuments(
                COLLECTION_NAME,
                [{ field: 'receiverId', operator: '==', value: userId }]
            );
            return messages.filter((message) => message.read === false).length;
        }
        throw error;
    }
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

