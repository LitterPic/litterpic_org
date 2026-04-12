/**
 * Generates a 2x2 grid collage from the first 4 images
 * Used as the thumbnail/preview for multi-photo posts
 * Uses Canvas API for browser-compatible image processing
 */

// Prefix to identify auto-generated collage images
export const COLLAGE_PREFIX = 'AUTO_COLLAGE_';

/**
 * Loads an image from a File and returns an HTMLImageElement
 * @param {File} file - The image file to load
 * @returns {Promise<HTMLImageElement>} The loaded image element
 */
const loadImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
};

/**
 * Generates a dynamic collage from 2-4 images using Canvas API
 * - 2 images: side-by-side (1x2)
 * - 3 images: larger left + 2 stacked right (2x2 with 1 empty, better composition)
 * - 4 images: 2x2 grid
 * @param {Array<File>} files - Array of image files (2-4)
 * @param {Object} options - Configuration options
 * @param {number} options.collageWidth - Width of the collage (default: 800)
 * @param {number} options.collageHeight - Height of the collage (default: 800)
 * @returns {Promise<Blob>} The collage image as a Blob
 */
export const generateCollage = async (files, options = {}) => {
    const { collageWidth = 800, collageHeight = 800 } = options;

    // Only process up to 4 images
    const imagesToProcess = files.slice(0, 4);
    const imageCount = imagesToProcess.length;

    // If there's only 1 image, return null (no collage needed)
    if (imageCount === 1) {
        return null;
    }

    try {
        // Load all images
        const images = await Promise.all(
            imagesToProcess.map(file => loadImage(file))
        );

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = collageWidth;
        canvas.height = collageHeight;
        const ctx = canvas.getContext('2d');

        // Fill background with white
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, collageWidth, collageHeight);

        // Define positions based on image count
        let positions = [];

        if (imageCount === 2) {
            // Side-by-side layout
            const tileWidth = collageWidth / 2;
            positions = [
                { x: 0, y: 0, w: tileWidth, h: collageHeight },
                { x: tileWidth, y: 0, w: tileWidth, h: collageHeight }
            ];
        } else if (imageCount === 3) {
            // Better 3-image layout: larger on left, 2 stacked on right
            const leftWidth = collageWidth * 0.6;
            const rightWidth = collageWidth * 0.4;
            const halfHeight = collageHeight / 2;
            positions = [
                { x: 0, y: 0, w: leftWidth, h: collageHeight },           // Large left
                { x: leftWidth, y: 0, w: rightWidth, h: halfHeight },     // Top-right
                { x: leftWidth, y: halfHeight, w: rightWidth, h: halfHeight } // Bottom-right
            ];
        } else {
            // 4 images: standard 2x2 grid
            const tileWidth = collageWidth / 2;
            const tileHeight = collageHeight / 2;
            positions = [
                { x: 0, y: 0, w: tileWidth, h: tileHeight },              // Top-left
                { x: tileWidth, y: 0, w: tileWidth, h: tileHeight },      // Top-right
                { x: 0, y: tileHeight, w: tileWidth, h: tileHeight },     // Bottom-left
                { x: tileWidth, y: tileHeight, w: tileWidth, h: tileHeight } // Bottom-right
            ];
        }

        // Draw images in tiles
        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const { x, y, w, h } = positions[i];

            // Calculate dimensions to maintain aspect ratio
            const imgAspect = img.width / img.height;
            const tileAspect = w / h;
            let drawWidth, drawHeight, sourceX = 0, sourceY = 0;

            if (imgAspect > tileAspect) {
                // Image is wider, crop sides
                drawHeight = img.height;
                drawWidth = img.height * tileAspect;
                sourceX = (img.width - drawWidth) / 2;
            } else {
                // Image is taller, crop top/bottom
                drawWidth = img.width;
                drawHeight = img.width / tileAspect;
                sourceY = (img.height - drawHeight) / 2;
            }

            ctx.drawImage(img, sourceX, sourceY, drawWidth, drawHeight, x, y, w, h);
        }

        // Convert canvas to blob
        return new Promise((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                },
                'image/png',
                0.95
            );
        });
    } catch (error) {
        console.error('Error generating collage:', error);
        throw new Error('Failed to generate collage');
    }
};

/**
 * Converts a Blob to a File object for a collage
 * Automatically adds the COLLAGE_PREFIX to the filename
 * @param {Blob} blob - The blob to convert
 * @param {string} fileName - The filename for the file (prefix will be added automatically)
 * @returns {File} The blob as a File object with collage prefix
 */
export const blobToFile = (blob, fileName = 'collage.png') => {
    // Add prefix to filename if not already present
    const prefixedFileName = fileName.startsWith(COLLAGE_PREFIX)
        ? fileName
        : `${COLLAGE_PREFIX}${fileName}`;
    return new File([blob], prefixedFileName, { type: blob.type });
};




