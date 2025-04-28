import sharp from 'sharp';
import { v4 as uuidv4 } from 'uuid';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

/**
 * Convert an image file to WebP format and optimize it
 * @param {File} file - The original image file
 * @param {Object} options - Conversion options
 * @param {number} options.quality - WebP quality (1-100)
 * @param {number} options.maxWidth - Maximum width to resize to
 * @returns {Promise<Blob>} - The converted WebP image as a Blob
 */
export const convertToWebP = async (file, options = {}) => {
  const { quality = 80, maxWidth = 1200 } = options;
  
  try {
    // Read the file as an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Process the image with sharp
    const processedImageBuffer = await sharp(buffer)
      .resize({ width: maxWidth, withoutEnlargement: true }) // Resize if larger than maxWidth
      .webp({ quality }) // Convert to WebP with specified quality
      .toBuffer();
    
    // Convert the buffer back to a Blob
    const blob = new Blob([processedImageBuffer], { type: 'image/webp' });
    
    // Create a new File object with .webp extension
    const webpFile = new File([blob], `${file.name.split('.')[0]}.webp`, { type: 'image/webp' });
    
    return webpFile;
  } catch (error) {
    console.error('Error converting image to WebP:', error);
    // Return the original file if conversion fails
    return file;
  }
};

/**
 * Upload an image to Firebase Storage, converting it to WebP first
 * @param {File} file - The original image file
 * @param {string} path - The storage path to upload to
 * @param {Object} options - Conversion options
 * @returns {Promise<string>} - The download URL of the uploaded WebP image
 */
export const uploadWebPImage = async (file, path = 'images', options = {}) => {
  try {
    // Skip WebP conversion for non-image files or already WebP files
    const isImage = file.type.startsWith('image/');
    const isWebP = file.type === 'image/webp';
    
    let fileToUpload = file;
    
    // Only convert images that aren't already WebP
    if (isImage && !isWebP) {
      fileToUpload = await convertToWebP(file, options);
    }
    
    // Generate a unique filename
    const uniqueId = uuidv4();
    const fileName = `${uniqueId}_${fileToUpload.name}`;
    
    // Get a reference to the storage location
    const storage = getStorage();
    const storageRef = ref(storage, `${path}/${fileName}`);
    
    // Upload the file
    const snapshot = await uploadBytes(storageRef, fileToUpload);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading WebP image:', error);
    throw error;
  }
};

/**
 * Upload multiple images to Firebase Storage, converting them to WebP first
 * @param {File[]} files - Array of image files
 * @param {string} path - The storage path to upload to
 * @param {Object} options - Conversion options
 * @returns {Promise<string[]>} - Array of download URLs
 */
export const uploadMultipleWebPImages = async (files, path = 'images', options = {}) => {
  try {
    const uploadPromises = files.map(file => uploadWebPImage(file, path, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading multiple WebP images:', error);
    throw error;
  }
};
