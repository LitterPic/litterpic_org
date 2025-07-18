import React, { createContext, useContext, useState, useEffect } from 'react';

// Create the context
const StoriesContext = createContext();

// Custom hook to use the stories context
export const useStoriesContext = () => useContext(StoriesContext);

// Provider component
export const StoriesProvider = ({ children }) => {
  const [cachedStories, setCachedStories] = useState([]);
  const [hasLoadedFromCache, setHasLoadedFromCache] = useState(false);
  const [lastCacheTime, setLastCacheTime] = useState(null);

  // Load cached stories from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // First check if we have stories in sessionStorage (highest priority)
        const sessionData = sessionStorage.getItem('cachedStories');
        if (sessionData) {
          const { stories, timestamp } = JSON.parse(sessionData);
          if (stories && stories.length > 0) {
            setCachedStories(stories);
            setLastCacheTime(timestamp);
            setHasLoadedFromCache(true);
            return;
          }
        }

        // Then check for cached stories in localStorage
        const cacheKeys = Object.keys(localStorage).filter(key =>
          key.startsWith('all_posts_cache_page_1_')
        );

        if (cacheKeys.length > 0) {
          // Sort by most recent cache
          cacheKeys.sort((a, b) => {
            const dataA = JSON.parse(localStorage.getItem(a));
            const dataB = JSON.parse(localStorage.getItem(b));
            return dataB.timestamp - dataA.timestamp;
          });

          // Get the most recent cache
          const mostRecentKey = cacheKeys[0];
          const cachedData = JSON.parse(localStorage.getItem(mostRecentKey));

          if (cachedData && cachedData.posts && cachedData.posts.length > 0) {
            setCachedStories(cachedData.posts);
            setLastCacheTime(cachedData.timestamp);
            setHasLoadedFromCache(true);

            // Also store in sessionStorage for faster access
            sessionStorage.setItem('cachedStories', JSON.stringify({
              stories: cachedData.posts,
              timestamp: cachedData.timestamp
            }));
          }
        }
      } catch (error) {
        console.error('Error loading cached stories:', error);
      }
    }
  }, []);

  // Function to update the cached stories
  const updateCachedStories = (stories, timestamp = Date.now()) => {
    // If stories is empty, clear the cache instead of updating
    if (!stories || stories.length === 0) {
      clearCache();
      return;
    }

    setCachedStories(stories);
    setLastCacheTime(timestamp);
    setHasLoadedFromCache(true);

    // Also store in sessionStorage for persistence across page navigations
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('cachedStories', JSON.stringify({
          stories,
          timestamp
        }));
      } catch (error) {
        // Silent error handling
      }
    }
  };

  // Function to clear the cache
  const clearCache = () => {
    setCachedStories([]);
    setHasLoadedFromCache(false);
    setLastCacheTime(null);

    // Also clear sessionStorage
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('cachedStories');
      } catch (error) {
        // Silent error handling
      }
    }
  };

  // Function to force refresh cache
  const forceRefresh = () => {
    console.log('Force refreshing stories cache');
    clearCache();

    // Clear all related localStorage items
    if (typeof window !== 'undefined') {
      Object.keys(localStorage).forEach(key => {
        if (key.includes('all_posts_') || key.includes('stories_prefetch')) {
          localStorage.removeItem(key);
        }
      });
    }
  };

  // The context value
  const contextValue = {
    cachedStories,
    hasLoadedFromCache,
    lastCacheTime,
    updateCachedStories,
    clearCache,
    forceRefresh
  };

  return (
    <StoriesContext.Provider value={contextValue}>
      {children}
    </StoriesContext.Provider>
  );
};
