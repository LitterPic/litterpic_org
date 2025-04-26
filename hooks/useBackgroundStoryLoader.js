import { useEffect } from 'react';
import { collection, doc, getDoc, getDocs, getFirestore, orderBy, query, limit, where } from 'firebase/firestore';
import { getDownloadURL, ref } from 'firebase/storage';
import { storage } from '../lib/firebase';

// Constants for caching (matching those in stories.js)
const ALL_POSTS_CACHE_EXPIRATION_MS = 86400000; // 24 hours
const POSTS_PER_PAGE = 6;

// Helper function to get cache key (matching the one in stories.js)
const getAllPostsCacheKey = (page, version) => `all_posts_cache_page_${page}_v${version}`;

/**
 * Custom hook to load and cache stories in the background
 * This hook is meant to be used on the index page to preload stories
 * so they're ready when the user navigates to the stories page
 */
export default function useBackgroundStoryLoader() {
  useEffect(() => {
    // Function to fetch and cache posts in the background
    const backgroundFetchAndCachePosts = async () => {
      console.log('Background loading stories...');

      try {
        // Check if we already have cached data
        const postsVersion = localStorage.getItem('postsVersion') || '0';
        const cacheKey = getAllPostsCacheKey(1, postsVersion);
        const cachedData = localStorage.getItem(cacheKey);

        // If we have cached data that's not expired, no need to fetch again
        if (cachedData) {
          const { timestamp } = JSON.parse(cachedData);
          const now = new Date().getTime();

          if (now - timestamp < ALL_POSTS_CACHE_EXPIRATION_MS) {
            console.log('Background loader: Using existing cached stories data');
            return;
          }
        }

        console.log('Background loader: Prefetching stories data...');

        // Fetch posts
        const db = getFirestore();
        const postsQuery = query(
          collection(db, 'userPosts'),
          orderBy('timePosted', 'desc'),
          limit(POSTS_PER_PAGE)
        );

        const querySnapshot = await getDocs(postsQuery);
        const fetchedPosts = [];
        const userIds = new Set();

        // Process each post
        for (const postDoc of querySnapshot.docs) {
          const post = postDoc.data();
          const postId = postDoc.id;

          // Extract user ID from the post
          let userIdFromPost = '';
          if (post.postUser && post.postUser.path) {
            const pathParts = post.postUser.path.split('/');
            userIdFromPost = pathParts[pathParts.length - 1];
            userIds.add(userIdFromPost);
          }

          // Fetch photo URLs
          const photos = post.postPhotos || [];
          const photoUrls = await Promise.all(photos.map(async (photoRef) => {
            try {
              return await getDownloadURL(ref(storage, photoRef));
            } catch {
              return "https://example.com/fallback-image.jpg";
            }
          }));

          // Preload images
          photoUrls.forEach(url => {
            const img = new Image();
            img.src = url;
          });

          // Create post object
          const processedPost = {
            id: postId,
            photos: photoUrls,
            userId: userIdFromPost,
            dateCreated: post.timePosted.toDate(),
            location: post.location,
            description: post.postDescription,
            litterWeight: post.litterWeight,
            likes: post.likes || [],
            numComments: post.numComments || 0,
          };

          fetchedPosts.push(processedPost);
        }

        // Fetch user data for all posts
        const usersData = {};
        for (const userId of userIds) {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              usersData[userId] = userDoc.data();
            }
          } catch (error) {
            console.error("Error fetching user document for ID:", userId, error);
          }
        }

        // Cache users data
        localStorage.setItem('users', JSON.stringify(usersData));

        // Enhance posts with user data
        const enhancedPosts = fetchedPosts.map(post => {
          const userData = usersData[post.userId] || {};
          return {
            ...post,
            user: {
              uid: post.userId,
              ...userData,
            },
          };
        });

        // Cache the fetched posts with a timestamp
        const now = new Date().getTime();
        const postsToCache = {
          posts: enhancedPosts,
          timestamp: now
        };

        // Store the current posts version in localStorage
        localStorage.setItem('postsVersion', postsVersion);
        localStorage.setItem(cacheKey, JSON.stringify(postsToCache));
        console.log('Background loading of stories complete');

      } catch (error) {
        console.error('Error in background loading of stories:', error);
      }
    };

    // Use requestIdleCallback for background loading if available, otherwise use setTimeout
    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(() => backgroundFetchAndCachePosts(), { timeout: 5000 });
      } else {
        setTimeout(backgroundFetchAndCachePosts, 2000); // Fallback with a delay
      }
    }

  }, []);
}
