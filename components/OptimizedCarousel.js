import React from 'react';
import useOptimizedCarousel from '../hooks/useOptimizedCarousel';

/**
 * Optimized Carousel component with lazy loading
 * @param {Object} props - Component props
 * @param {Array} props.images - Array of image URLs
 * @returns {JSX.Element} - Carousel component
 */
export default function OptimizedCarousel({ images }) {
  // Use our optimized carousel hook
  const {
    currentIndex,
    isInitialized,
    handleSwipe,
    getShouldRender,
    handleImageLoad,
    isVideo
  } = useOptimizedCarousel(images);

  if (!isInitialized || images.length === 0) {
    return <div className="carousel-container loading"></div>;
  }

  return (
    <div className="carousel-container">
      <div className="carousel-slide">
        {images.map((image, index) => {
          // Only render the current image and the adjacent ones
          if (!getShouldRender(index)) return null;
          
          return (
            <div
              key={index}
              className={`carousel-page ${index === currentIndex ? 'active' : ''}`}
            >
              {isVideo(image) ? (
                <video key={index} controls autoPlay muted loop className="carousel-media">
                  <source src={image} type="video/mp4"/>
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img 
                  key={index} 
                  src={image} 
                  alt={`Slide ${index}`} 
                  className="carousel-media"
                  loading="lazy"
                  onLoad={() => handleImageLoad(index)}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="carousel-dots">
        {images.map((_, index) => (
          <span
            key={index}
            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
          />
        ))}
      </div>
      <button className="carousel-button carousel-button-left"
              onClick={() => handleSwipe("right")}>{"<"}</button>
      <button className="carousel-button carousel-button-right"
              onClick={() => handleSwipe("left")}>{">"}</button>
    </div>
  );
}
