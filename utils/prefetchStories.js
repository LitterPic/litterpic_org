import { fetchPosts, getUsersWhoLikedPost } from '../components/utils';
import { doc, getDoc, getFirestore, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';

// Cache keys and expiration times (matching those in stories.js)
export const ALL_POSTS_CACHE_EXPIRATION_MS = 86400000; // 24 hours (matching stories.js)
export const MY_POSTS_CACHE_EXPIRATION_MS = 86400000; // 24 hours (matching stories.js)

// Use the EXACT same cache key format as in stories.js for compatibility
export const getAllPostsCacheKey = (page, version) => `all_posts_cache_page_${page}_v${version}`;
export const getMyPostsCacheKey = (page, userId, version) => `my_posts_cache_page_${userId}_${page}_v${version}`;

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
    console.log('Prefetching with cache key:', cacheKey);
    const cachedData = localStorage.getItem(cacheKey);
    if (cachedData) {
      console.log('Found existing prefetched data');
      const { timestamp, posts } = JSON.parse(cachedData);
      const now = new Date().getTime();
      const cacheAge = (now - timestamp) / 1000;

      console.log(`Prefetch cache age: ${cacheAge.toFixed(2)} seconds, posts: ${posts?.length || 0}`);

      // If cache is still fresh, return the cached posts
      if (now - timestamp < ALL_POSTS_CACHE_EXPIRATION_MS / 2) {
        console.log('Using existing prefetched stories data');
        return posts;
      } else {
        console.log('Prefetch cache expired, fetching fresh data');
      }
    } else {
      console.log('No prefetched data found, will fetch fresh data');
    }

    // Fetch posts directly from Firestore for better performance
    const db = getFirestore();
    const postsQuery = query(
      collection(db, 'userPosts'),
      orderBy('timePosted', 'desc'),
      limit(postsPerPage)
    );

    const querySnapshot = await getDocs(postsQuery);
    const fetchedPosts = [];
    const users = {};
    const userIds = new Set();

    // First pass: collect all user IDs and process post data
    for (const postDoc of querySnapshot.docs) {
      const postData = postDoc.data();
      const postId = postDoc.id;

      // Extract user ID from the post
      let userIdFromPost = null;
      if (postData.postUser && postData.postUser.path) {
        const pathParts = postData.postUser.path.split('/');
        userIdFromPost = pathParts[pathParts.length - 1];
        userIds.add(userIdFromPost);
      }

      if (!userIdFromPost) continue;

      // Process photos in parallel
      const photos = postData.postPhotos || [];
      const photoPromises = photos.map(async (photoRef) => {
        try {
          return await getDownloadURL(ref(storage, photoRef));
        } catch (error) {
          console.error('Error getting photo URL:', error);
          return "https://ih1.redbubble.net/image.4905811447.8675/flat,750x,075,f-pad,750x1000,f8f8f8.jpg";
        }
      });

      // Create post object with placeholder for user data
      fetchedPosts.push({
        id: postId,
        photos: await Promise.all(photoPromises),
        userId: userIdFromPost,
        dateCreated: postData.timePosted.toDate(),
        location: postData.location,
        description: postData.postDescription,
        litterWeight: postData.litterWeight,
        likes: postData.likes || [],
        numComments: postData.numComments || 0,
      });
    }

    // Second pass: fetch all user data in parallel
    const userPromises = Array.from(userIds).map(async (userId) => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          users[userId] = userDoc.data();
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    });

    await Promise.all(userPromises);

    // Third pass: fetch likes for all posts in parallel
    const likePromises = fetchedPosts.map(async (post) => {
      try {
        const likedUserIds = await getUsersWhoLikedPost(post.id);
        const currentUserLiked = currentUser && Array.isArray(likedUserIds)
          ? likedUserIds.includes(currentUser.uid)
          : false;

        // Update post with user data and likes
        post.user = {
          uid: post.userId,
          ...users[post.userId],
        };
        post.likedUsers = likedUserIds;
        post.currentUserLiked = currentUserLiked;

        // Preload images
        post.photos.forEach(url => {
          const img = new Image();
          img.src = url;
        });
      } catch (error) {
        console.error('Error processing likes for post:', error);
      }
    });

    await Promise.all(likePromises);

    // Cache the fetched posts
    const now = new Date().getTime();
    const postsToCache = {
      posts: fetchedPosts,
      timestamp: now
    };

    localStorage.setItem(cacheKey, JSON.stringify(postsToCache));
    console.log(`Prefetched ${fetchedPosts.length} stories successfully with key: ${cacheKey}`);

    // Also cache the users data
    localStorage.setItem('users', JSON.stringify(users));

    // Set a flag indicating prefetching is complete
    localStorage.setItem('stories_prefetch_complete', 'true');
    localStorage.setItem('stories_prefetch_timestamp', now.toString());

    // Return the prefetched stories so they can be used by the caller
    return fetchedPosts;

  } catch (error) {
    console.error('Error prefetching stories:', error);
  } finally {
    // Clear the prefetching flag
    localStorage.removeItem(prefetchingKey);
  }
};
