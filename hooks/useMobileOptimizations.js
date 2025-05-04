import { useEffect } from 'react';

/**
 * Custom hook to apply mobile-specific optimizations
 */
export default function useMobileOptimizations() {
  useEffect(() => {
    // Only run on client-side
    if (typeof window === 'undefined') return;
    
    // Check if we're on a mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Fix for iOS Safari 300ms tap delay
      const style = document.createElement('style');
      style.innerHTML = `
        * {
          touch-action: manipulation;
        }
        
        a, button, .post-user-name, .meatball-menu, .material-icons {
          cursor: pointer !important;
          -webkit-tap-highlight-color: transparent !important;
        }
      `;
      document.head.appendChild(style);
      
      // Fix for links not working on mobile
      const enhanceTouchTargets = () => {
        // Find all interactive elements
        const interactiveElements = document.querySelectorAll(
          'a, button, .post-user-name, .meatball-menu, .material-icons, .likes-comments-likes-field, .likes-comments-comment-field'
        );
        
        // Add click handlers to ensure they work on mobile
        interactiveElements.forEach(element => {
          // Skip elements that already have our handler
          if (element.dataset.mobileOptimized) return;
          
          // Mark as optimized
          element.dataset.mobileOptimized = 'true';
          
          // Add a small delay to the click event to ensure it works on mobile
          const originalClick = element.onclick;
          element.onclick = (e) => {
            // If it's a link, prevent default and navigate manually after a small delay
            if (element.tagName === 'A' && element.href) {
              e.preventDefault();
              setTimeout(() => {
                window.location.href = element.href;
              }, 10);
              return;
            }
            
            // Otherwise, call the original click handler
            if (originalClick) {
              originalClick.call(element, e);
            }
          };
        });
      };
      
      // Run once on mount
      enhanceTouchTargets();
      
      // Also run when DOM changes
      const observer = new MutationObserver(enhanceTouchTargets);
      observer.observe(document.body, { 
        childList: true, 
        subtree: true 
      });
      
      // Cleanup
      return () => {
        observer.disconnect();
        document.head.removeChild(style);
      };
    }
  }, []);
}
