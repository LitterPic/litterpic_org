import { fetchPosts, getUsersWhoLikedPost } from '../components/utils';
import { doc, getDoc, getFirestore } from 'firebase/firestore';

// Cache keys and expiration times (matching those in stories.js)
export const ALL_POSTS_CACHE_EXPIRATION_MS = 5 * 60 * 1000; // 5 minutes
export const MY_POSTS_CACHE_EXPIRATION_MS = 10 * 60 * 1000; // 10 minutes

export const getAllPostsCacheKey = (page, version) => `all_posts_${page}_v${version}`;
export const getMyPostsCacheKey = (page, userId, version) => `my_posts_${page}_${userId}_v${version}`;

/**
 * Prefetch stories data and store in localStorage
 * @param {number} postsVersion - Current version of posts
 * @param {Object} currentUser - Current user object (optional)
 * @returns {Promise<void>}
 */
export const prefetchStories = async (postsVersion = 0, currentUser = null) => {
  // Add a flag to localStorage to indicate prefetching is in progress
  const prefetchingKey = 'stories_prefetching';

  // Check if prefetching is already in progress
  if (localStorage.getItem(prefetchingKey) === 'true') {
    console.log('Stories prefetching already in progress');
    return;
  }

  // Set the prefetching flag
  localStorage.setItem(prefetchingKey, 'true');
  try {
    console.log('Prefetching stories data...');
    const postsPerPage = 6; // Match the value in stories.js
    const page = 1;
    const cacheKey = getAllPostsCacheKey(page, postsVersion);

    // Check if we already have a recent cache
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      const { timestamp } = JSON.parse(cachedData);
      const now = new Date().getTime();

      // If cache is still fresh, don't prefetch again
      if (now - timestamp < ALL_POSTS_CACHE_EXPIRATION_MS / 2) {
        console.log('Using existing prefetched stories data');
        return;
      }
    }

    // Fetch posts
    let fetchedPosts = [];
    const db = getFirestore();
    const users = {};

    for await (const post of fetchPosts(page, postsPerPage)) {
      // Skip invalid posts
      if (!post || !post.user || !post.id) {
        continue;
      }

      // Get user ID from post
      const userKeyPathSegments = post.user._key?.path?.segments;
      const userIdFromPost = Array.isArray(userKeyPathSegments) && userKeyPathSegments.length > 6
        ? userKeyPathSegments[6]
        : post.user.uid || null;

      if (!userIdFromPost) {
        continue;
      }

      // Fetch user data if needed
      if (!users[userIdFromPost]) {
        const userDocRef = doc(db, 'users', userIdFromPost);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          users[userIdFromPost] = userDoc.data();
        } else {
          continue;
        }
      }

      // Get liked users
      const likedUserIds = await getUsersWhoLikedPost(post.id);

      // Check if current user liked the post
      const currentUserLiked = currentUser && Array.isArray(likedUserIds)
        ? likedUserIds.includes(currentUser.uid)
        : false;

      // Create updated post with user data
      const updatedPost = {
        ...post,
        user: {
          uid: userIdFromPost,
          ...users[userIdFromPost],
        },
        likedUsers: likedUserIds,
        currentUserLiked,
      };

      fetchedPosts.push(updatedPost);
    }

    // Cache the fetched posts
    const now = new Date().getTime();
    const postsToCache = {
      posts: fetchedPosts,
      timestamp: now
    };

    localStorage.setItem(cacheKey, JSON.stringify(postsToCache));
    console.log(`Prefetched ${fetchedPosts.length} stories successfully`);

    // Also cache the users data
    localStorage.setItem('users', JSON.stringify(users));

  } catch (error) {
    console.error('Error prefetching stories:', error);
  } finally {
    // Clear the prefetching flag
    localStorage.removeItem(prefetchingKey);
  }
};
