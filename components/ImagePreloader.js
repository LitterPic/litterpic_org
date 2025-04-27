import { useEffect } from 'react';

/**
 * Component to preload images in the background
 * @param {Object} props - Component props
 * @param {Array} props.imagePaths - Array of image paths to preload
 * @returns {null} - This component doesn't render anything
 */
const ImagePreloader = ({ imagePaths = [] }) => {
  useEffect(() => {
    // Skip if no images to preload
    if (!imagePaths.length) return;
    
    // Function to preload a single image
    const preloadImage = (src) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.src = src;
        img.onload = resolve;
        img.onerror = reject;
      });
    };
    
    // Preload all images in parallel
    const preloadAllImages = async () => {
      try {
        await Promise.all(imagePaths.map(path => preloadImage(path)));
        console.log('All images preloaded successfully');
      } catch (error) {
        console.error('Error preloading images:', error);
      }
    };
    
    // Use requestIdleCallback if available, otherwise use setTimeout
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => preloadAllImages(), { timeout: 2000 });
      } else {
        setTimeout(preloadAllImages, 300);
      }
    }
  }, [imagePaths]);
  
  // This component doesn't render anything
  return null;
};

export default ImagePreloader;
