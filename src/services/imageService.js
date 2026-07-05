// Image Service - Alternative to Firebase Storage
// Converts images to base64 for storage in Firestore

/**
 * Convert a file to base64 string
 * @param {File} file - Image file
 * @returns {Promise<string>} Base64 data URL
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    // Validate file size (max 500KB for base64 to stay under Firestore 1MB limit)
    const maxSize = 500 * 1024; // 500KB
    if (file.size > maxSize) {
      reject(new Error('Image must be under 500KB. Please compress the image first.'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = () => {
      resolve(reader.result); // This is the base64 data URL
    };
    
    reader.onerror = (error) => {
      reject(new Error('Failed to read file: ' + error));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Convert multiple files to base64
 * @param {File[]} files - Array of image files
 * @returns {Promise<string[]>} Array of base64 data URLs
 */
export async function filesToBase64(files) {
  const promises = files.map(file => fileToBase64(file));
  return await Promise.all(promises);
}

/**
 * Compress an image before converting to base64
 * @param {File} file - Image file
 * @param {number} maxWidth - Maximum width (default: 1200)
 * @param {number} quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<string>} Base64 data URL
 */
export function compressAndConvertToBase64(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        // Create canvas and compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64
        const base64 = canvas.toDataURL('image/jpeg', quality);
        resolve(base64);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      
      img.src = e.target.result;
    };
    
    reader.onerror = (error) => {
      reject(new Error('Failed to read file: ' + error));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Upload listing photo using base64 (alternative to Firebase Storage)
 * @param {File} file - Image file
 * @param {string} listingId - Listing ID (optional, for organization)
 * @param {number} photoIndex - Photo index (optional)
 * @returns {Promise<string>} Base64 data URL
 */
export async function uploadListingPhotoBase64(file, listingId = 'temp', photoIndex = 0) {
  try {
    // Compress and convert to base64
    const base64 = await compressAndConvertToBase64(file, 1200, 0.8);
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
}

