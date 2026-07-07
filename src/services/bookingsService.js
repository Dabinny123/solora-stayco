// Bookings Service for Solora StayCo
import { 
    createDocument, 
    updateDocument, 
    getDocument, 
    getDocuments 
} from '../firebase/firestoreService';

const COLLECTION_NAME = 'bookings';

/**
 * Create a new booking
 * @param {Object} bookingData - Booking data
 * @returns {Promise<string>} Booking ID
 */
export async function createBooking(bookingData) {
    const data = {
        ...bookingData,
        status: bookingData.status || 'pending',
        paymentStatus: bookingData.paymentStatus || 'pending',
        createdAt: new Date().toISOString(),
    };
    
    return await createDocument(COLLECTION_NAME, data);
}

/**
 * Update a booking
 * @param {string} bookingId - Booking ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateBooking(bookingId, updates) {
    return await updateDocument(COLLECTION_NAME, bookingId, updates);
}

/**
 * Get a booking by ID
 * @param {string} bookingId - Booking ID
 * @returns {Promise<Object|null>} Booking data
 */
export async function getBooking(bookingId) {
    return await getDocument(COLLECTION_NAME, bookingId);
}

/**
 * Get bookings by guest
 * @param {string} guestId - Guest user ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} Array of bookings
 */
export async function getBookingsByGuest(guestId, status = null) {
    try {
        const filters = [{ field: 'guestId', operator: '==', value: guestId }];
        if (status) {
            filters.push({ field: 'status', operator: '==', value: status });
        }
        return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc');
    } catch (error) {
        // If index is building, fall back to client-side filtering
        if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('building')) {
            console.warn('Index building, using fallback query with client-side filtering');
            try {
                // Query only the current guest without orderBy to avoid composite index requirements
                // and to stay compatible with Firestore security rules.
                let filtered = await getDocuments(COLLECTION_NAME, [
                    { field: 'guestId', operator: '==', value: guestId }
                ], null, null, 1000);
                
                if (status) {
                    filtered = filtered.filter(booking => booking.status === status);
                }
                
                // Sort by createdAt desc
                filtered.sort((a, b) => {
                    const dateA = new Date(a.createdAt || 0);
                    const dateB = new Date(b.createdAt || 0);
                    return dateB - dateA;
                });
                
                return filtered;
            } catch (fallbackError) {
                console.error('Fallback query also failed:', fallbackError);
                throw error; // Throw original error
            }
        }
        throw error;
    }
}

/**
 * Get bookings by host
 * @param {string} hostId - Host user ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} Array of bookings
 */
export async function getBookingsByHost(hostId, status = null) {
    try {
        const filters = [{ field: 'hostId', operator: '==', value: hostId }];
        if (status) {
            filters.push({ field: 'status', operator: '==', value: status });
        }
        return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc');
    } catch (error) {
        if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('building')) {
            console.warn('Host booking index unavailable, using host-only fallback query');
            let filtered = await getDocuments(COLLECTION_NAME, [
                { field: 'hostId', operator: '==', value: hostId }
            ], null, null, 1000);

            if (status) {
                filtered = filtered.filter(booking => booking.status === status);
            }

            filtered.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });

            return filtered;
        }
        throw error;
    }
}

/**
 * Get bookings for a listing
 * @param {string} listingId - Listing ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} Array of bookings
 */
export async function getBookingsByListing(listingId, status = null) {
    const filters = [{ field: 'listingId', operator: '==', value: listingId }];
    if (status) {
        filters.push({ field: 'status', operator: '==', value: status });
    }
    return await getDocuments(COLLECTION_NAME, filters, 'checkIn', 'asc');
}

/**
 * Get upcoming bookings for host (today and future)
 * @param {string} hostId - Host user ID
 * @returns {Promise<Array>} Array of bookings
 */
export async function getUpcomingBookings(hostId) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const filters = [
            { field: 'hostId', operator: '==', value: hostId },
            { field: 'status', operator: '==', value: 'confirmed' },
            { field: 'checkIn', operator: '>=', value: today.toISOString() }
        ];
        
        return await getDocuments(COLLECTION_NAME, filters, 'checkIn', 'asc');
    } catch (error) {
        if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('building')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const bookings = await getBookingsByHost(hostId, 'confirmed');
            return bookings
                .filter(booking => new Date(booking.checkIn) >= today)
                .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
        }
        throw error;
    }
}

/**
 * Get today's check-ins for host
 * @param {string} hostId - Host user ID
 * @returns {Promise<Array>} Array of bookings
 */
export async function getTodayCheckIns(hostId) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const filters = [
            { field: 'hostId', operator: '==', value: hostId },
            { field: 'status', operator: '==', value: 'confirmed' },
            { field: 'checkIn', operator: '>=', value: today.toISOString() },
            { field: 'checkIn', operator: '<', value: tomorrow.toISOString() }
        ];
        
        return await getDocuments(COLLECTION_NAME, filters, 'checkIn', 'asc');
    } catch (error) {
        if (error.code === 'failed-precondition' || error.message?.includes('index') || error.message?.includes('building')) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const bookings = await getBookingsByHost(hostId, 'confirmed');
            return bookings
                .filter(booking => {
                    const checkIn = new Date(booking.checkIn);
                    return checkIn >= today && checkIn < tomorrow;
                })
                .sort((a, b) => new Date(a.checkIn) - new Date(b.checkIn));
        }
        throw error;
    }
}

/**
 * Confirm a booking
 * @param {string} bookingId - Booking ID
 * @returns {Promise<void>}
 */
export async function confirmBooking(bookingId) {
    await updateBooking(bookingId, {
        status: 'confirmed',
        confirmedAt: new Date().toISOString(),
    });
}

/**
 * Cancel a booking
 * @param {string} bookingId - Booking ID
 * @param {string} reason - Cancellation reason
 * @param {string} cancelledBy - 'guest' or 'host'
 * @returns {Promise<void>}
 */
export async function cancelBooking(bookingId, reason, cancelledBy) {
    await updateBooking(bookingId, {
        status: 'cancelled',
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: new Date().toISOString(),
    });
}

/**
 * Complete a booking (after checkout)
 * @param {string} bookingId - Booking ID
 * @returns {Promise<void>}
 */
export async function completeBooking(bookingId) {
    await updateBooking(bookingId, {
        status: 'completed',
        completedAt: new Date().toISOString(),
    });
}

