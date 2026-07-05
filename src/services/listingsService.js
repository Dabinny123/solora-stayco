// Listings Service for Solora StayCo
import { 
    createDocument, 
    updateDocument, 
    deleteDocument, 
    getDocument, 
    getDocuments 
} from '../firebase/firestoreService';

const COLLECTION_NAME = 'listings';

/**
 * Create a new listing
 * @param {Object} listingData - Listing data
 * @param {string} hostId - Host user ID
 * @returns {Promise<string>} Listing ID
 */
export async function createListing(listingData, hostId) {
    const data = {
        ...listingData,
        hostId,
        status: listingData.status || 'draft',
        moodTags: listingData.moodTags || [],
        ambienceTags: listingData.ambienceTags || [],
        lighting: listingData.lighting || 'neutral',
        colorPalette: listingData.colorPalette || [],
        aestheticScore: listingData.aestheticScore || 0,
        ambienceDescription: listingData.ambienceDescription || '',
        moodHighlights: listingData.moodHighlights || '',
        rating: 0,
        totalReviews: 0,
        views: 0,
        favorites: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    
    return await createDocument(COLLECTION_NAME, data);
}

/**
 * Update a listing
 * @param {string} listingId - Listing ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<void>}
 */
export async function updateListing(listingId, updates) {
    return await updateDocument(COLLECTION_NAME, listingId, {
        ...updates,
        updatedAt: new Date().toISOString(),
    });
}

/**
 * Delete a listing
 * @param {string} listingId - Listing ID
 * @returns {Promise<void>}
 */
export async function deleteListing(listingId) {
    return await deleteDocument(COLLECTION_NAME, listingId);
}

/**
 * Get a listing by ID
 * @param {string} listingId - Listing ID
 * @returns {Promise<Object|null>} Listing data
 */
export async function getListing(listingId) {
    return await getDocument(COLLECTION_NAME, listingId);
}

/**
 * Get listings by host
 * @param {string} hostId - Host user ID
 * @param {string} status - Optional status filter
 * @returns {Promise<Array>} Array of listings
 */
export async function getListingsByHost(hostId, status = null) {
    try {
        // Try the indexed query first
        const filters = [{ field: 'hostId', operator: '==', value: hostId }];
        if (status) {
            filters.push({ field: 'status', operator: '==', value: status });
        }
        return await getDocuments(COLLECTION_NAME, filters, 'createdAt', 'desc');
    } catch (error) {
        // If index is still building, fallback to client-side filtering
        if (error.message && error.message.includes('index')) {
            console.log('Index building, using fallback query with client-side filtering');
            // Get all listings without ordering (no index needed)
            const allListings = await getDocuments(COLLECTION_NAME, [], null, null, 200);
            
            // Filter client-side
            let filtered = allListings.filter(listing => listing.hostId === hostId);
            
            if (status) {
                filtered = filtered.filter(listing => listing.status === status);
            }
            
            // Sort by createdAt descending (client-side)
            filtered.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
            
            return filtered;
        }
        // Re-throw if it's not an index error
        throw error;
    }
}

/**
 * Get active listings (for public viewing)
 * @param {Object} filters - Additional filters (category, location, etc.)
 * @param {number} limitCount - Maximum number of results
 * @returns {Promise<Array>} Array of listings
 */
export async function getActiveListings(filters = {}, limitCount = 50) {
    try {
        // Try the indexed query first
        const queryFilters = [{ field: 'status', operator: '==', value: 'active' }];
        
        if (filters.category) {
            queryFilters.push({ field: 'category', operator: '==', value: filters.category });
        }
        
        if (filters.city) {
            queryFilters.push({ field: 'location.city', operator: '==', value: filters.city });
        }
        
        if (filters.minPrice) {
            queryFilters.push({ field: 'basePrice', operator: '>=', value: filters.minPrice });
        }
        
        if (filters.maxPrice) {
            queryFilters.push({ field: 'basePrice', operator: '<=', value: filters.maxPrice });
        }

        if (filters.moodId) {
            queryFilters.push({ field: 'moodTags', operator: 'array-contains', value: filters.moodId });
        }

        if (filters.ambienceTag) {
            queryFilters.push({ field: 'ambienceTags', operator: 'array-contains', value: filters.ambienceTag });
        }
        
        return await getDocuments(COLLECTION_NAME, queryFilters, 'createdAt', 'desc', limitCount);
    } catch (error) {
        // If index is still building, fallback to client-side filtering
        if (error.message && error.message.includes('index')) {
            console.log('Index building, using fallback query with client-side filtering');
            // Get all listings without ordering (no index needed)
            const allListings = await getDocuments(COLLECTION_NAME, [], null, null, 200);
            
            // Filter client-side
            let filtered = allListings.filter(listing => listing.status === 'active');
            
            // Apply additional filters
            if (filters.category) {
                filtered = filtered.filter(listing => listing.category === filters.category);
            }
            
            if (filters.city) {
                filtered = filtered.filter(listing => listing.location?.city === filters.city);
            }
            
            if (filters.minPrice) {
                filtered = filtered.filter(listing => listing.basePrice >= filters.minPrice);
            }
            
            if (filters.maxPrice) {
                filtered = filtered.filter(listing => listing.basePrice <= filters.maxPrice);
            }
            
            if (filters.moodId) {
                filtered = filtered.filter(listing => 
                    listing.moodTags && listing.moodTags.includes(filters.moodId)
                );
            }
            
            if (filters.ambienceTag) {
                filtered = filtered.filter(listing => 
                    listing.ambienceTags && listing.ambienceTags.includes(filters.ambienceTag)
                );
            }
            
            // Sort by createdAt descending (client-side)
            filtered.sort((a, b) => {
                const dateA = new Date(a.createdAt || 0);
                const dateB = new Date(b.createdAt || 0);
                return dateB - dateA;
            });
            
            // Limit results
            return filtered.slice(0, limitCount);
        }
        // Re-throw if it's not an index error
        throw error;
    }
}

/**
 * Search listings by location
 * @param {string} city - City name
 * @param {Object} additionalFilters - Additional filters
 * @returns {Promise<Array>} Array of listings
 */
export async function searchListingsByLocation(city, additionalFilters = {}) {
    return await getActiveListings({ ...additionalFilters, city });
}

/**
 * Get featured listings
 * @param {number} limitCount - Maximum number of results
 * @returns {Promise<Array>} Array of listings
 */
export async function getFeaturedListings(limitCount = 10) {
    const filters = [
        { field: 'status', operator: '==', value: 'active' },
        { field: 'rating', operator: '>=', value: 4 }
    ];
    return await getDocuments(COLLECTION_NAME, filters, 'rating', 'desc', limitCount);
}

/**
 * Increment listing views
 * @param {string} listingId - Listing ID
 * @returns {Promise<void>}
 */
export async function incrementListingViews(listingId) {
    const listing = await getListing(listingId);
    if (listing) {
        await updateListing(listingId, { views: (listing.views || 0) + 1 });
    }
}

/**
 * Toggle favorite status (add/remove from favorites)
 * @param {string} listingId - Listing ID
 * @param {boolean} isFavorite - Whether to add or remove
 * @returns {Promise<void>}
 */
export async function toggleListingFavorite(listingId, isFavorite) {
    const listing = await getListing(listingId);
    if (listing) {
        const newFavorites = isFavorite 
            ? (listing.favorites || 0) + 1 
            : Math.max(0, (listing.favorites || 0) - 1);
        await updateListing(listingId, { favorites: newFavorites });
    }
}

