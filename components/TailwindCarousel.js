import React, { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';

/**
 * Modern carousel component built with Tailwind CSS
 * @param {Object} props - Component props
 * @param {Array} props.images - Array of image URLs
 * @param {Function} props.onImageChange - Optional callback when image changes
 */
const TailwindCarousel = ({ images, onImageChange }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showSwipeHint, setShowSwipeHint] = useState(true);

  // Detect if it's a video
  const isVideo = (url) => /\.(mp4|webm)(\?|$)/i.test(url);

  // Handle swipe gestures
  const handlers = useSwipeable({
    onSwipedLeft: () => goToNext(),
    onSwipedRight: () => goToPrev(),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true
  });

  // Go to next image
  const goToNext = () => {
    if (images.length <= 1) return;
    const newIndex = (currentIndex + 1) % images.length;
    setCurrentIndex(newIndex);
    if (onImageChange) onImageChange(newIndex);
  };

  // Go to previous image
  const goToPrev = () => {
    if (images.length <= 1) return;
    const newIndex = (currentIndex - 1 + images.length) % images.length;
    setCurrentIndex(newIndex);
    if (onImageChange) onImageChange(newIndex);
  };

  // Hide swipe hint after a few seconds
  useEffect(() => {
    if (images.length > 1 && showSwipeHint) {
      const timer = setTimeout(() => {
        setShowSwipeHint(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [images.length, showSwipeHint]);

  // Set loaded state when component mounts
  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 flex items-center justify-center rounded-lg">
        <p className="text-gray-500">No images available</p>
      </div>
    );
  }

  return (
    <div 
      className="relative w-full overflow-hidden bg-gray-100 rounded-lg"
      style={{ paddingBottom: '75%' }} // 4:3 aspect ratio
      {...handlers}
    >
      {/* Image container */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div 
            key={index}
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {isVideo(image) ? (
              <video 
                className="max-h-full max-w-full object-contain"
                controls 
                autoPlay 
                muted 
                loop
              >
                <source src={image} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img 
                src={image} 
                alt={`Slide ${index + 1}`} 
                className="max-h-full max-w-full object-contain"
                loading={index === currentIndex || index === (currentIndex + 1) % images.length || index === (currentIndex - 1 + images.length) % images.length ? "eager" : "lazy"}
              />
            )}
          </div>
        ))}
      </div>

      {/* Swipe hint overlay */}
      {images.length > 1 && showSwipeHint && isLoaded && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-60 text-white px-4 py-2 rounded-full z-30 animate-fadeOut pointer-events-none">
          <span className="text-sm font-medium">← Swipe to navigate →</span>
        </div>
      )}

      {/* Dot indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center bg-black bg-opacity-40 px-3 py-1.5 rounded-full z-20">
          <span className="text-white text-xs font-medium mr-2">{currentIndex + 1}/{images.length}</span>
          <div className="flex space-x-1.5">
            {images.map((_, index) => (
              <button
                key={index}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-white scale-110' 
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                onClick={() => {
                  setCurrentIndex(index);
                  if (onImageChange) onImageChange(index);
                }}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TailwindCarousel;
