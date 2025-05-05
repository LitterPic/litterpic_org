import React, { useState, useEffect, useRef } from 'react';

/**
 * A simple, reliable carousel component that works on all devices
 */
const SimpleCarousel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const autoPlayRef = useRef();

  // Detect if it's a video
  const isVideo = (url) => /\.(mp4|webm)(\?|$)/i.test(url);

  // Go to next slide
  const nextSlide = () => {
    if (!images || images.length === 0) return;
    setCurrentIndex(prevIndex => (prevIndex + 1) % images.length);
  };

  // Go to previous slide
  const prevSlide = () => {
    if (!images || images.length === 0) return;
    setCurrentIndex(prevIndex => (prevIndex - 1 + images.length) % images.length);
  };

  // Handle touch start
  const handleTouchStart = (e) => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    setTouchStart(e.targetTouches[0].clientX);
  };

  // Handle touch move
  const handleTouchMove = (e) => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    setTouchEnd(e.targetTouches[0].clientX);
  };

  // Handle touch end
  const handleTouchEnd = () => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Use a fixed threshold that works well on all devices
    const swipeThreshold = 50;

    if (touchStart - touchEnd > swipeThreshold) {
      // Swipe left, go to next slide
      nextSlide();
    }

    if (touchStart - touchEnd < -swipeThreshold) {
      // Swipe right, go to previous slide
      prevSlide();
    }
  };

  // Set up auto-play
  useEffect(() => {
    autoPlayRef.current = nextSlide;
  });

  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    const play = () => {
      autoPlayRef.current();
    };

    const interval = setInterval(play, 5000);
    return () => clearInterval(interval);
  }, []);

  // If no images, return empty div
  if (!images || images.length === 0) {
    return <div className="simple-carousel-container"></div>;
  }

  return (
    <div
      className="simple-carousel-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="simple-carousel-inner">
        {images.map((image, index) => (
          <div
            key={index}
            className={`simple-carousel-slide ${index === currentIndex ? 'active' : ''}`}
          >
            {isVideo(image) ? (
              <video controls autoPlay muted loop className="simple-carousel-media">
                <source src={image} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={image}
                alt={`Slide ${index + 1}`}
                className="simple-carousel-media"
              />
            )}
          </div>
        ))}
      </div>

      {/* Navigation buttons */}
      <button
        className="simple-carousel-button prev"
        onClick={prevSlide}
        aria-label="Previous slide"
      >
        &lt;
      </button>
      <button
        className="simple-carousel-button next"
        onClick={nextSlide}
        aria-label="Next slide"
      >
        &gt;
      </button>

      {/* Dots indicator */}
      <div className="simple-carousel-dots">
        {images.map((_, index) => (
          <button
            key={index}
            className={`simple-carousel-dot ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
};

export default SimpleCarousel;
