// Firebase Storage Service for Solora StayCo
import { 
    ref, 
    uploadBytes, 
    uploadBytesResumable,
    getDownloadURL, 
    deleteObject,
    listAll
} from 'firebase/storage';
import { storage } from './firebaseConfig.js';

/**
 * Upload a file to Firebase Storage
 * @param {File} file - File to upload
 * @param {string} path - Storage path (e.g., 'users/userId/profile.jpg')
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<string>} Download URL
 */
export async function uploadFile(file, path, metadata = {}) {
    try {
        const storageRef = ref(storage, path);
        
        // Add content type if not provided
        const fileMetadata = {
            contentType: file.type || 'image/jpeg',
            ...metadata
        };
        
        const snapshot = await uploadBytes(storageRef, file, fileMetadata);
        const downloadURL = await getDownloadURL(snapshot.ref);
        console.log('File uploaded successfully:', downloadURL);
        return downloadURL;
    } catch (error) {
        console.error('Error uploading file:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Full error:', error);
        
        // Check for network/CORS errors (these might not have error.code)
        const errorString = JSON.stringify(error).toLowerCase();
        const errorMessage = error.message?.toLowerCase() || '';
        
        if (errorMessage.includes('cors') || 
            errorMessage.includes('preflight') || 
            errorMessage.includes('failed to fetch') ||
            errorString.includes('cors') ||
            error.code === 'storage/unknown' ||
            !error.code) {
            // This is likely a CORS error or Storage not enabled
            throw new Error('STORAGE_NOT_ENABLED: Firebase Storage is not enabled. Go to https://console.firebase.google.com/project/solora-stayco/storage and click "Get Started" to enable it.');
        }
        
        // Provide more helpful error messages
        if (error.code === 'storage/unauthorized') {
            throw new Error('Permission denied. Please make sure you are signed in and Storage rules are deployed.');
        } else if (error.code === 'storage/canceled') {
            throw new Error('Upload was canceled.');
        } else if (error.message) {
            throw new Error(error.message);
        }
        throw error;
    }
}

/**
 * Upload a file with progress tracking
 * @param {File} file - File to upload
 * @param {string} path - Storage path
 * @param {Function} onProgress - Progress callback (receives progress percentage)
 * @param {Object} metadata - Optional metadata
 * @returns {Promise<string>} Download URL
 */
export async function uploadFileWithProgress(file, path, onProgress, metadata = {}) {
    try {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file, metadata);
        
        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    if (onProgress) {
                        onProgress(progress);
                    }
                },
                (error) => {
                    console.error('Error uploading file:', error);
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    } catch (error) {
        console.error('Error uploading file with progress:', error);
        throw error;
    }
}

/**
 * Get download URL for a file
 * @param {string} path - Storage path
 * @returns {Promise<string>} Download URL
 */
export async function getFileURL(path) {
    try {
        const storageRef = ref(storage, path);
        const url = await getDownloadURL(storageRef);
        return url;
    } catch (error) {
        console.error('Error getting file URL:', error);
        throw error;
    }
}

/**
 * Delete a file from Firebase Storage
 * @param {string} path - Storage path
 * @returns {Promise<void>}
 */
export async function deleteFile(path) {
    try {
        const storageRef = ref(storage, path);
        await deleteObject(storageRef);
        console.log('File deleted successfully:', path);
    } catch (error) {
        console.error('Error deleting file:', error);
        throw error;
    }
}

/**
 * List all files in a directory
 * @param {string} path - Storage path (directory)
 * @returns {Promise<Array>} Array of file references
 */
export async function listFiles(path) {
    try {
        const storageRef = ref(storage, path);
        const result = await listAll(storageRef);
        return result.items;
    } catch (error) {
        console.error('Error listing files:', error);
        throw error;
    }
}

// Specific helper functions for Solora StayCo

/**
 * Upload user profile photo
 * @param {File} file - Image file
 * @param {string} userId - User ID
 * @returns {Promise<string>} Download URL
 */
export async function uploadProfilePhoto(file, userId) {
    const fileExtension = file.name.split('.').pop();
    const path = `users/${userId}/profile.${fileExtension}`;
    return await uploadFile(file, path, {
        contentType: file.type
    });
}

/**
 * Upload listing photo
 * @param {File} file - Image file
 * @param {string} listingId - Listing ID
 * @param {number} photoIndex - Photo index (for multiple photos)
 * @returns {Promise<string>} Download URL
 */
export async function uploadListingPhoto(file, listingId, photoIndex = 0) {
    const fileExtension = file.name.split('.').pop();
    const path = `listings/${listingId}/photo_${photoIndex}.${fileExtension}`;
    return await uploadFile(file, path, {
        contentType: file.type
    });
}

