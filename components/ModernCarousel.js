import React, { useState, useEffect, useRef } from 'react';
import { useSwipeable } from 'react-swipeable';

/**
 * Modern, immersive carousel component with swipe gestures and progress indicators
 * @param {Object} props - Component props
 * @param {Array} props.images - Array of image URLs
 * @returns {JSX.Element} - Carousel component
 */
const ModernCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeDistance, setSwipeDistance] = useState(0);
  const carouselRef = useRef(null);
  
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
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  // Go to previous image
  const goToPrev = () => {
    if (images.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
  };

  // Auto-rotate carousel
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      goToNext();
    }, 7000); // Change image every 7 seconds
    
    return () => clearInterval(interval);
  }, [images.length]);

  // Preload adjacent images
  useEffect(() => {
    if (images.length <= 1) return;
    
    const nextIndex = (currentIndex + 1) % images.length;
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    
    const preloadImage = (src) => {
      if (isVideo(src)) return;
      const img = new Image();
      img.src = src;
    };
    
    preloadImage(images[nextIndex]);
    preloadImage(images[prevIndex]);
  }, [currentIndex, images]);

  // Handle mouse/touch interactions for dragging
  const handleTouchStart = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    setTouchStartX(clientX);
    setIsSwiping(true);
    setSwipeDistance(0);
  };

  const handleTouchMove = (e) => {
    if (!isSwiping) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const distance = clientX - touchStartX;
    setSwipeDistance(distance);
  };

  const handleTouchEnd = () => {
    if (!isSwiping) return;
    
    if (swipeDistance > 100) {
      goToPrev();
    } else if (swipeDistance < -100) {
      goToNext();
    }
    
    setIsSwiping(false);
    setSwipeDistance(0);
  };

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return <div className="modern-carousel-placeholder">No images available</div>;
  }

  return (
    <div 
      className="modern-carousel" 
      ref={carouselRef}
      {...handlers}
      onMouseDown={handleTouchStart}
      onMouseMove={handleTouchMove}
      onMouseUp={handleTouchEnd}
      onMouseLeave={handleTouchEnd}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="modern-carousel-track" style={{
        transform: isSwiping ? `translateX(${swipeDistance}px)` : 'none',
        transition: isSwiping ? 'none' : 'transform 0.5s ease'
      }}>
        {images.map((image, index) => (
          <div 
            key={index} 
            className={`modern-carousel-slide ${index === currentIndex ? 'active' : ''}`}
            style={{
              opacity: index === currentIndex ? 1 : 0,
              zIndex: index === currentIndex ? 2 : 1
            }}
          >
            {isVideo(image) ? (
              <video controls autoPlay muted loop className="modern-carousel-media">
                <source src={image} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img 
                src={image} 
                alt={`Slide ${index + 1}`} 
                className="modern-carousel-media"
                loading={index === currentIndex ? "eager" : "lazy"}
              />
            )}
          </div>
        ))}
      </div>
      
      {/* Progress indicators */}
      {images.length > 1 && (
        <div className="modern-carousel-indicators">
          {images.map((_, index) => (
            <button
              key={index}
              className={`modern-carousel-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Swipe hint overlay (only shown on first load) */}
      {images.length > 1 && (
        <div className="modern-carousel-swipe-hint">
          <span>Swipe to navigate</span>
        </div>
      )}
    </div>
  );
};

export default ModernCarousel;
