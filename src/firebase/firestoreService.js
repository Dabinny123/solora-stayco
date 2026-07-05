// Firestore Service for Solora StayCo
import { 
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit,
    addDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from './firebaseConfig.js';

/**
 * Generic function to get a document by ID
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<Object|null>} Document data or null
 */
export async function getDocument(collectionName, docId) {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
    } catch (error) {
        console.error(`Error getting document from ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Generic function to get all documents from a collection
 * @param {string} collectionName - Collection name
 * @param {Array} filters - Array of filter objects [{field, operator, value}]
 * @param {string} orderByField - Field to order by
 * @param {string} orderDirection - 'asc' or 'desc'
 * @param {number} limitCount - Maximum number of documents
 * @returns {Promise<Array>} Array of documents
 */
export async function getDocuments(collectionName, filters = [], orderByField = null, orderDirection = 'asc', limitCount = null) {
    try {
        let q = collection(db, collectionName);
        
        // Apply filters
        filters.forEach(filter => {
            q = query(q, where(filter.field, filter.operator, filter.value));
        });
        
        // Apply ordering
        if (orderByField) {
            q = query(q, orderBy(orderByField, orderDirection));
        }
        
        // Apply limit
        if (limitCount) {
            q = query(q, limit(limitCount));
        }
        
        const querySnapshot = await getDocs(q);
        const documents = [];
        
        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });
        
        return documents;
    } catch (error) {
        console.error(`Error getting documents from ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Create a new document
 * @param {string} collectionName - Collection name
 * @param {Object} data - Document data
 * @param {string} docId - Optional document ID (if not provided, auto-generated)
 * @returns {Promise<string>} Document ID
 */
export async function createDocument(collectionName, data, docId = null) {
    try {
        const dataWithTimestamp = {
            ...data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        if (docId) {
            await setDoc(doc(db, collectionName, docId), dataWithTimestamp);
            return docId;
        } else {
            const docRef = await addDoc(collection(db, collectionName), dataWithTimestamp);
            return docRef.id;
        }
    } catch (error) {
        console.error(`Error creating document in ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Update a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @param {Object} data - Data to update
 * @returns {Promise<void>}
 */
export async function updateDocument(collectionName, docId, data) {
    try {
        const docRef = doc(db, collectionName, docId);
        const dataWithTimestamp = {
            ...data,
            updatedAt: serverTimestamp()
        };
        await updateDoc(docRef, dataWithTimestamp);
    } catch (error) {
        console.error(`Error updating document in ${collectionName}:`, error);
        throw error;
    }
}

/**
 * Delete a document
 * @param {string} collectionName - Collection name
 * @param {string} docId - Document ID
 * @returns {Promise<void>}
 */
export async function deleteDocument(collectionName, docId) {
    try {
        await deleteDoc(doc(db, collectionName, docId));
    } catch (error) {
        console.error(`Error deleting document from ${collectionName}:`, error);
        throw error;
    }
}

// Collection-specific helper functions

/**
 * Get user by ID
 */
export async function getUser(userId) {
    return await getDocument('users', userId);
}

/**
 * Get listing by ID
 */
export async function getListing(listingId) {
    return await getDocument('listings', listingId);
}

/**
 * Get all listings with optional filters
 */
export async function getListings(filters = [], orderByField = 'createdAt', orderDirection = 'desc') {
    return await getDocuments('listings', filters, orderByField, orderDirection);
}

/**
 * Get booking by ID
 */
export async function getBooking(bookingId) {
    return await getDocument('bookings', bookingId);
}

/**
 * Get bookings for a user (guest or host)
 */
export async function getUserBookings(userId, userType = 'guest') {
    const field = userType === 'guest' ? 'guestId' : 'hostId';
    return await getDocuments('bookings', [{ field, operator: '==', value: userId }], 'createdAt', 'desc');
}

/**
 * Get reviews for a listing
 */
export async function getListingReviews(listingId) {
    return await getDocuments('reviews', [
        { field: 'listingId', operator: '==', value: listingId }
    ], 'createdAt', 'desc');
}

