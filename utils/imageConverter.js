/**
 * Convert an image file to WebP format using the browser's Canvas API
 * @param {File} file - The original image file
 * @param {Object} options - Conversion options
 * @param {number} options.quality - WebP quality (0-1)
 * @param {number} options.maxWidth - Maximum width to resize to
 * @returns {Promise<File>} - The converted WebP image as a File
 */
export const convertToWebP = (file, options = {}) => {
  const { quality = 0.8, maxWidth = 1600 } = options;

  return new Promise((resolve, reject) => {
    // Skip non-image files or already WebP files
    if (!file.type.startsWith('image/') || file.type === 'image/webp') {
      resolve(file);
      return;
    }

    // Create image element
    const img = new Image();
    img.onload = () => {
      // Create canvas
      const canvas = document.createElement('canvas');

      // Calculate dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }

      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to WebP
      canvas.toBlob((blob) => {
        if (!blob) {
          console.error('Canvas to Blob conversion failed');
          resolve(file); // Return original file if conversion fails
          return;
        }

        // Create new File object with WebP extension
        const webpFile = new File(
          [blob],
          `${file.name.split('.')[0]}.webp`,
          { type: 'image/webp' }
        );

        resolve(webpFile);
      }, 'image/webp', quality);
    };

    img.onerror = (error) => {
      console.error('Failed to load image:', error);
      resolve(file); // Return original file if loading fails
    };

    // Load image from file
    img.src = URL.createObjectURL(file);
  });
};
