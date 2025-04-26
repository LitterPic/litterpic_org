import { useState, useEffect } from 'react';

/**
 * Custom hook for an optimized carousel with lazy loading
 * @param {Array} images - Array of image URLs
 * @param {number} autoRotateInterval - Interval in ms for auto-rotation (default: 5000)
 * @returns {Object} - Carousel state and handlers
 */
export default function useOptimizedCarousel(images, autoRotateInterval = 5000) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imagesLoaded, setImagesLoaded] = useState({});
  const [isInitialized, setIsInitialized] = useState(false);

  const isVideo = (url) => /\.(mp4|webm)(\?|$)/i.test(url);

  const handleSwipe = (direction) => {
    if (direction === "left") {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    } else {
      setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
    }
  };

  // Initialize the carousel after component mounts
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  // Set up auto-rotation after initialization
  useEffect(() => {
    if (!isInitialized) return;
    
    const intervalId = setInterval(() => {
      handleSwipe("left");
    }, autoRotateInterval);

    return () => clearInterval(intervalId);
  }, [isInitialized, images.length, autoRotateInterval]);

  // Preload the next image when current index changes
  useEffect(() => {
    if (!isInitialized || images.length === 0) return;
    
    const nextIndex = (currentIndex + 1) % images.length;
    const nextImage = images[nextIndex];
    
    if (!isVideo(nextImage) && !imagesLoaded[nextIndex]) {
      const img = new Image();
      img.src = nextImage;
      img.onload = () => {
        setImagesLoaded(prev => ({
          ...prev,
          [nextIndex]: true
        }));
      };
    }
  }, [currentIndex, images, isInitialized, imagesLoaded]);

  // Determine which images should be rendered (current and adjacent)
  const getShouldRender = (index) => {
    return index === currentIndex || 
           index === (currentIndex + 1) % images.length ||
           index === (currentIndex - 1 + images.length) % images.length;
  };

  // Mark an image as loaded
  const handleImageLoad = (index) => {
    setImagesLoaded(prev => ({
      ...prev,
      [index]: true
    }));
  };

  return {
    currentIndex,
    isInitialized,
    handleSwipe,
    getShouldRender,
    handleImageLoad,
    isVideo
  };
}
