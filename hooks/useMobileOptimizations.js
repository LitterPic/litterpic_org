import { useEffect } from 'react';

/**
 * Custom hook to apply mobile-specific optimizations
 * This version is minimal and doesn't interfere with normal link behavior
 */
export default function useMobileOptimizations() {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;

    // Fix for 300ms tap delay on mobile devices
    document.addEventListener('touchstart', function() {}, {passive: true});

    // No cleanup needed for this simple optimization
    return () => {};
  }, []);
}
