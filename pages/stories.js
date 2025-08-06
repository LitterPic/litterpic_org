import React, {useEffect, useRef, useState} from 'react';
import {fetchPosts, getUsersWhoLikedPost, toggleLike} from '../components/utils';
import Link from 'next/link';
import { getAllPostsCacheKey, getMyPostsCacheKey } from '../utils/prefetchStories';
import PostSkeleton from '../components/PostSkeleton';
import Masonry from 'react-masonry-css';
import { useStoriesContext } from '../contexts/StoriesContext';
import useMobileOptimizations from '../hooks/useMobileOptimizations';
import {getAuth} from 'firebase/auth';
import {useRouter} from 'next/router';
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    increment,
    orderBy,
    onSnapshot,
    query,
    runTransaction,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import {auth, db} from "../lib/firebase";
import {capitalizeFirstWordOfSentences} from "../utils/textUtils";
import Head from "next/head";
import LikePopup from "../components/LikePopup";
import Post from "../components/post";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Script from "next/script";
import NotificationSender from "../utils/notifictionSender";
import DOMPurify from 'dompurify';
import parseUrls from '../utils/parseUrls';

function Stories() {
    // Apply mobile optimizations
    useMobileOptimizations();

    const router = useRouter();
    const {postId} = router.query;  // Get the postId from the URL
    const dropdownRef = useRef(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false); // Start with loading false to prevent flicker
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [page, setPage] = useState(1);
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState({});
    const [loadingUser, setLoadingUser] = useState(true);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [comments, setComments] = useState({});
    const [openCommentInput, setOpenCommentInput] = useState(null);
    const [postComments, setPostComments] = useState({});
    const commentInputRef = useRef();
    const submitButtonRef = useRef(null);
    const [showBackToTop, setShowBackToTop] = useState(false);
    const [likePopupVisible, setLikePopupVisible] = useState(false);
    const [likedUsers, setLikedUsers] = useState([]);
    const [hoveredPostId, setHoveredPostId] = useState(null);
    const [showMyPosts, setShowMyPosts] = useState(false);
    const [searchUsers, setSearchUsers] = useState([]);
    const [isLoadingSearchUsers, setIsLoadingSearchUsers] = useState(true);
    const [selectedUser, setSelectedUser] = useState("");
    const debounceTimers = {};
    const [showOptions, setShowOptions] = useState(false);
    const [postsVersion, setPostsVersion] = useState(0);
    const [hasScrolledToPost, setHasScrolledToPost] = useState(false);

    // Cache expiration times - more reasonable for user experience
    const ALL_POSTS_CACHE_EXPIRATION_MS = 300000; // 5 minutes for all posts
    const MY_POSTS_CACHE_EXPIRATION_MS = 600000; // 10 minutes for my posts
    const SEARCH_USERS_CACHE_EXPIRATION_MS = 3600000; // 1 hour for users
    const INSTANT_CACHE_EXPIRATION_MS = 60000; // 1 minute for instant loading
    const getAllPostsCacheKey = (page, version) => `all_posts_cache_page_${page}_v${version}`;
    const getMyPostsCacheKey = (page, userId, version) => `my_posts_cache_page_${userId}_${page}_v${version}`;

    // Function to clear all cache layers
    const clearAllCaches = () => {

        // Clear localStorage cache
        Object.keys(localStorage).forEach(key => {
            if (key.includes('all_posts_') || key.includes('my_posts_') ||
                key.includes('stories_prefetch') || key === 'users') {
                localStorage.removeItem(key);
            }
        });

        // Clear sessionStorage cache
        if (typeof window !== 'undefined') {
            try {
                sessionStorage.removeItem('cachedStories');
            } catch (error) {
                // Silent error handling
            }
        }

        // Clear context cache
        if (typeof forceRefresh === 'function') {
            forceRefresh();
        }
    };

    const fetchUserRefsFromPosts = async () => {
        const postUserRefs = new Set();
        const querySnapshot = await getDocs(collection(getFirestore(), 'userPosts'));

        querySnapshot.forEach((doc) => {
            const postData = doc.data();
            if (postData.postUser && postData.postUser.path) {
                postUserRefs.add(postData.postUser.path);
            }
        });

        return Array.from(postUserRefs);
    };

    const fetchUsersDetails = async (userRefs) => {
        const users = [];
        for (const refPath of userRefs) {
            const userRef = doc(getFirestore(), refPath);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                users.push({id: userSnap.id, ...userSnap.data()});
            }
        }

        // Sort users alphabetically by name
        users.sort((a, b) => a.display_name.localeCompare(b.display_name));

        return users;
    };

    useEffect(() => {
        // Real-time listener for posts - but be smarter about cache invalidation
        const postsQuery = collection(getFirestore(), 'userPosts');
        let lastUpdateTime = Date.now();

        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            // Check if this is a real change (not just initial load or pending writes)
            if (!snapshot.metadata.fromCache && !snapshot.metadata.hasPendingWrites) {
                const now = Date.now();
                const timeSinceLastUpdate = now - lastUpdateTime;

                // Only invalidate cache if enough time has passed (prevent rapid invalidations)
                if (timeSinceLastUpdate > 5000) { // 5 seconds minimum between cache invalidations
                    
                    // Instead of immediately clearing cache, just increment version
                    setPostsVersion(prevVersion => {
                        const newVersion = prevVersion + 1;
                        return newVersion;
                    });

                    // Only clear cache if user is actively viewing the page
                    if (document.visibilityState === 'visible') {
                        clearAllCaches();

                        // Only refresh if we're currently showing all posts (not filtered)
                        if (!showMyPosts && !selectedUser) {
                            setPosts([]); // Clear local posts state
                            setPage(1); // Reset to first page
                            fetchAndSetPosts(1);
                        }
                    } else {

                    }

                    lastUpdateTime = now;
                } else {

                }
            }
        });

        return () => unsubscribe();
    }, [showMyPosts, selectedUser]); // Removed posts.length dependency

    useEffect(() => {
        const cacheKey = 'users_cache';
        const now = new Date().getTime();

        const fetchUsers = async () => {
            const cachedData = localStorage.getItem(cacheKey);
            if (cachedData) {
                const {users, timestamp} = JSON.parse(cachedData);
                if (now - timestamp < SEARCH_USERS_CACHE_EXPIRATION_MS) {
                    setSearchUsers(users);
                    setIsLoadingSearchUsers(false);
                    return;
                }
            }

            try {
                setIsLoadingSearchUsers(true); // Start loading
                const userRefs = await fetchUserRefsFromPosts();
                const userDetails = await fetchUsersDetails(userRefs);
                setSearchUsers(userDetails);
                setIsLoadingSearchUsers(false);
                localStorage.setItem(cacheKey, JSON.stringify({users: userDetails, timestamp: now}));
            } catch (error) {
                setIsLoadingSearchUsers(true);
            }
        };

        fetchUsers();
    }, []);


    const handleMyPostsButton = () => {
        setSelectedUser("");
        setShowMyPosts(true);
        setPosts([]);
        setPage(1);

        fetchAndSetPosts(1, user.uid);
    };

    const handleShowAllPostsButton = () => {
        setSelectedUser("");
        setShowMyPosts(false);
        setPosts([]);
        setPage(1);

        fetchAndSetPosts(1);
    }

    const handleUserSelect = async (userId) => {
        setSelectedUser(userId);
        setShowMyPosts(false);
        setPosts([]);
        setPage(1);
        await fetchAndSetPosts(1, userId);
    };

    // Get the stories context
    const { cachedStories, hasLoadedFromCache, lastCacheTime, updateCachedStories, forceRefresh } = useStoriesContext();

    // Function to recalculate like status for posts
    const recalculateLikeStatus = (postsToUpdate) => {
        if (!user || !postsToUpdate || postsToUpdate.length === 0) {
            return postsToUpdate;
        }

        return postsToUpdate.map(post => {
            // Check multiple sources for like status
            let currentUserLiked = false;

            // Method 1: Check likedUsers array (most reliable)
            if (post.likedUsers && Array.isArray(post.likedUsers)) {
                currentUserLiked = post.likedUsers.includes(user.uid);
            }

            // Method 2: Check likes array with Firestore references (fallback)
            if (!currentUserLiked && post.likes && Array.isArray(post.likes)) {
                currentUserLiked = post.likes.some(like => {
                    // Handle Firestore document references
                    if (like && like.path) {
                        return like.path.includes(user.uid);
                    }
                    // Handle direct UID strings
                    return like === user.uid;
                });
            }


            return {
                ...post,
                currentUserLiked
            };
        });
    };

    // Immediately set posts if we have cached stories (no waiting for useEffect)
    if (hasLoadedFromCache && cachedStories.length > 0 && posts.length === 0) {
        // Set posts immediately, like status will be recalculated when user becomes available
        setPosts(cachedStories);
    }

    // Preload the banner image
    useEffect(() => {
        // Preload the banner image
        const preloadBannerImage = () => {
            const img = new Image();
            img.src = '/images/user_posts_banner.webp';
        };

        preloadBannerImage();
    }, []);

    useEffect(() => {
        if (!loadingUser) {
            // First check if we have stories in the global context
            if (hasLoadedFromCache && cachedStories.length > 0) {
                const cacheAge = (Date.now() - lastCacheTime) / 1000;

                // Always use cached stories for instant loading, regardless of age
                // We'll fetch fresh data in background if needed
                const updatedCachedStories = recalculateLikeStatus(cachedStories);
                setPosts(updatedCachedStories);
                setPage(1);
                setHasMorePosts(cachedStories.length >= 6); // 6 is postsPerPage
                setIsLoading(false);

                // If cache is older than instant cache time, fetch fresh data in background
                if (cacheAge > INSTANT_CACHE_EXPIRATION_MS / 1000) {
                    setTimeout(() => {
                        fetchAndSetPosts(1);
                    }, 100); // Small delay to let UI render first
                }
                return;
            }

            // Check if prefetching was completed
            const prefetchComplete = localStorage.getItem('stories_prefetch_complete');
            const prefetchTimestamp = localStorage.getItem('stories_prefetch_timestamp');
            if (prefetchComplete === 'true' && prefetchTimestamp) {
                const prefetchAge = (Date.now() - parseInt(prefetchTimestamp)) / 1000;
            } else {
            }

            // Check if we have cached data before showing loading state
            const cacheKey = getAllPostsCacheKey(1, postsVersion);
            let cachedData = localStorage.getItem(cacheKey);

            // If no cache for current version, try to find the most recent cache
            if (!cachedData) {
                const allCacheKeys = Object.keys(localStorage).filter(key =>
                    key.startsWith('all_posts_cache_page_1_')
                );

                if (allCacheKeys.length > 0) {
                    // Sort by version number (highest first)
                    allCacheKeys.sort((a, b) => {
                        const versionA = parseInt(a.split('_v')[1]) || 0;
                        const versionB = parseInt(b.split('_v')[1]) || 0;
                        return versionB - versionA;
                    });

                    // Use the most recent cache
                    cachedData = localStorage.getItem(allCacheKeys[0]);
                }
            }

            if (cachedData) {
                try {
                    const { posts: cachedPosts, timestamp } = JSON.parse(cachedData);
                    const now = new Date().getTime();
                    const cacheAge = (now - timestamp) / 1000;

                    // Recalculate like status for cached posts
                    const updatedCachedPosts = recalculateLikeStatus(cachedPosts);
                    setPosts(updatedCachedPosts);

                    // Also update the global context with recalculated posts
                    updateCachedStories(updatedCachedPosts, timestamp);
                    setPage(1);
                    setHasMorePosts(cachedPosts.length >= 6); // 6 is postsPerPage
                    setIsLoading(false);

                    // If cache is older than instant cache time, fetch fresh data in background
                    if (now - timestamp > INSTANT_CACHE_EXPIRATION_MS) {
                        setTimeout(() => {
                            fetchAndSetPosts(1);
                        }, 100); // Small delay to let UI render first
                    }
                    return;
                } catch (error) {
                    // Silent error handling
                }
            } else {
            }

            // If no valid cache, fetch posts normally
            fetchAndSetPosts(1);
        }
    }, [loadingUser, cachedStories, hasLoadedFromCache, lastCacheTime, updateCachedStories]);

    useEffect(() => {
        const handleScroll = () => {
            if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 50) {
                setShowBackToTop(true);
            } else {
                setShowBackToTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    // Use useEffect to update likedUsers once the data is fetched
    useEffect(() => {
        setLikedUsers(likedUsers);
    }, [likedUsers]);

    const handleLikeHover = async (post) => {
        const postKey = post.id;

        if (debounceTimers[postKey]) {
            clearTimeout(debounceTimers[postKey]);
        }

        debounceTimers[postKey] = setTimeout(async () => {
            const likedUserIds = await getUsersWhoLikedPost(post.id);

            const likedUsersPromises = likedUserIds.map(async (uid) => {
                const userRef = doc(getFirestore(), 'users', uid);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    return {
                        uid: uid, // Include the uid in the returned data
                        ...userSnap.data()
                    };
                } else {
                    return null;
                }
            });

            const likedUsers = await Promise.all(likedUsersPromises);

            // Generate a unique identifier for the hovered post
            const postIdentifier = `${post.id}_post`;

            // Set hovered post identifier in state immediately
            setHoveredPostId(postIdentifier);
            setLikePopupVisible(true);
            setLikedUsers(likedUsers);

            // Clear the timer in the map after execution
            delete debounceTimers[postKey];
        }, 500);
    };


    const handleLeaveHover = (post) => {
        const postKey = post.id;

        // Clear the debounce timer for this specific post
        if (debounceTimers[postKey]) {
            clearTimeout(debounceTimers[postKey]);
            delete debounceTimers[postKey];
        }

        setLikePopupVisible(false);
        setHoveredPostId(null);
        setLikedUsers([]);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setOpenMenuId(null);
            setShowOptions(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleRouteChange = () => {
            setOpenMenuId(null);
        };

        router.events.on('routeChangeStart', handleRouteChange);
        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        };
    }, []);

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoadingUser(false);
        });

        return () => unsubscribe();
    }, [hasLoadedFromCache, cachedStories]);

    // Recalculate like status when user changes OR when user becomes available
    useEffect(() => {
        if (user && posts.length > 0) {
            const updatedPosts = recalculateLikeStatus(posts);
            setPosts(updatedPosts);
        } else if (!user && posts.length > 0) {
        }
    }, [user, posts.length]); // Trigger when user changes OR when posts are first loaded

    const handleToggleLike = async (postId) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const postIndex = posts.findIndex((post) => post.id === postId);
            const postToUpdate = posts[postIndex];

            if (!postToUpdate) {
                return;
            }

            const didLike = await toggleLike(postToUpdate, posts);

            let updatedPosts = [...posts];

            if (didLike) {
                if (!Array.isArray(updatedPosts[postIndex].likes)) {
                    updatedPosts[postIndex].likes = [];
                }
                updatedPosts[postIndex].likes.push(doc(db, 'users', user.uid));
                updatedPosts[postIndex].currentUserLiked = true;
            } else {
                updatedPosts[postIndex].likes = updatedPosts[postIndex].likes.filter(like => like.path !== doc(db, 'users', user.uid).path);
                updatedPosts[postIndex].currentUserLiked = false;
            }

            setPosts(updatedPosts);
        } catch (error) {
            // Silent error handling
        }
    };


    const handleCommentChange = (event, postId) => {
        const capitalizedText = capitalizeFirstWordOfSentences(event.target.value);
        setComments({
            ...comments, [postId]: capitalizedText,
        });
    };
    const submitComment = async (postId) => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (comments[postId].trim() === '') {
            return;
        }

        const comment = comments[postId];
        if (comment) {
            const db = getFirestore();
            try {
                // Add the comment to the database
                await addDoc(collection(db, 'storyComments'), {
                    comment,
                    commentUser: doc(db, 'users', user.uid),
                    postAssociation: doc(db, 'userPosts', postId),
                    timePosted: serverTimestamp(),
                });

                // Update the number of comments on the post
                const postRef = doc(db, 'userPosts', postId);
                await updateDoc(postRef, {
                    numComments: increment(1)
                });

                const postIndex = posts.findIndex((post) => post.id === postId);
                const updatedPosts = [...posts];
                updatedPosts[postIndex].numComments = (updatedPosts[postIndex].numComments || 0) + 1;
                setPosts(updatedPosts);

                const updatedPostComments = {...postComments};
                updatedPostComments[postId] = [...(updatedPostComments[postId] || []), {
                    comment,
                    commentUser: {name: user.displayName},
                    postAssociation: postId,
                    timePosted: new Date(),
                }];
                setPostComments(updatedPostComments);

                setComments({...comments, [postId]: ''});

                // Create and send notification to the post author
                const postToUpdate = updatedPosts[postIndex];
                const postAuthorId = postToUpdate.user.uid;
                await NotificationSender.createCommentNotification(postId, postAuthorId, user, comment);
                await NotificationSender.createCommentNotificationForOthers(postId, user, comment, postAuthorId);

            } catch (error) {
                // Silent error handling
            }
        }
    };

    function isDescendant(parent, child) {
        let node = child;
        while (node !== null) {
            if (node === parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                commentInputRef.current &&
                !isDescendant(commentInputRef.current, event.target) &&
                submitButtonRef.current &&
                !isDescendant(submitButtonRef.current, event.target) &&
                dropdownRef.current &&
                !isDescendant(dropdownRef.current, event.target)
            ) {
                setOpenCommentInput(null);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);


    useEffect(() => {
        const handleRouteChange = () => {
            setOpenCommentInput(null);
        };

        router.events.on('routeChangeStart', handleRouteChange);
        return () => {
            router.events.off('routeChangeStart', handleRouteChange);
        };
    }, []);

    const fetchAndSetUsers = async (userIds) => {
        userIds = userIds.filter(Boolean);

        const cachedUsers = localStorage.getItem('users');
        if (cachedUsers) {
            setUsers(JSON.parse(cachedUsers));
        }

        const db = getFirestore();
        const usersData = {};

        for (const userId of userIds) {
            try {
                const userDoc = await getDoc(doc(db, 'users', userId));

                if (userDoc.exists()) {
                    usersData[userId] = userDoc.data();
                }
            } catch (error) {
                // Silent error handling
            }
        }

        setUsers((prevUsers) => ({...prevUsers, ...usersData}))
        localStorage.setItem('users', JSON.stringify(usersData));
    };

    useEffect(() => {
        if (!postId) {
            return;
        }

        if (posts.length === 0) {
            return;
        }

        // Only scroll if we haven't already scrolled to this post
        if (hasScrolledToPost) {
            return;
        }

        const normalizedPostId = postId.split('/').pop();
        const timeoutId = setTimeout(() => {
            const element = document.getElementById(normalizedPostId);
            if (element) {
                const offsetPosition = element.getBoundingClientRect().top + window.pageYOffset;
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
                element.classList.add('highlight-notif');
                setTimeout(() => element.classList.remove('highlight-notif'), 3000);
                setOpenCommentInput(normalizedPostId);

                // Mark that we've scrolled to this post
                setHasScrolledToPost(true);

                // Clear the postId from URL after scrolling to prevent future issues
                setTimeout(() => {
                    const url = new URL(window.location);
                    url.searchParams.delete('postId');
                    window.history.replaceState({}, '', url);
                }, 1000);
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [postId, posts.length, hasScrolledToPost]); // Only depend on posts.length, not posts content

    // Reset scroll tracking when postId changes (new notification)
    useEffect(() => {
        setHasScrolledToPost(false);
    }, [postId]);

    // Helper function to filter out duplicate posts by ID
    const removeDuplicatePosts = (posts) => {
        const seen = new Set();
        return posts.filter(post => {
            if (seen.has(post.id)) {
                return false;
            }
            seen.add(post.id);
            return true;
        });
    };

    // Separate function specifically for loading more stories
    const loadMoreStories = async () => {
        const nextPage = page + 1;

        setIsLoading(true);

        try {
            // Store current posts before fetching more
            const currentPosts = [...posts];

            // Fetch the next page of posts
            let newPosts = [];
            const postsPerPage = 6;

            for await (const post of fetchPosts(nextPage, postsPerPage, null)) {
                // Skip invalid posts
                if (!post || !post.user || !post.id) {
                    continue;
                }

                // Process user data and likes similar to fetchAndSetPosts
                const userKeyPathSegments = post.user._key?.path?.segments;
                const userIdFromPost = Array.isArray(userKeyPathSegments) && userKeyPathSegments.length > 6
                    ? userKeyPathSegments[6]
                    : post.user.uid || null;

                if (!userIdFromPost) {
                    continue;
                }

                // Ensure user data is fetched
                await fetchAndSetUsers([userIdFromPost]);

                // Handle likes
                const likedUserIds = await getUsersWhoLikedPost(post.id);
                const currentUserLiked = user && Array.isArray(likedUserIds)
                    ? likedUserIds.includes(user.uid)
                    : false;

                // Create updated post
                const updatedPost = {
                    ...post,
                    user: {
                        uid: userIdFromPost,
                        ...users[userIdFromPost],
                    },
                    likedUsers: likedUserIds,
                    currentUserLiked,
                };

                newPosts.push(updatedPost);
            }


            // Combine with existing posts and remove duplicates
            const combinedPosts = removeDuplicatePosts([...currentPosts, ...newPosts]);

            // Update state with recalculated like status
            setPosts(recalculateLikeStatus(combinedPosts));
            setPage(nextPage);
            setHasMorePosts(newPosts.length >= postsPerPage);

            // Cache the new posts
            const now = new Date().getTime();
            const cacheKey = getAllPostsCacheKey(nextPage, postsVersion);
            const postsToCache = {
                posts: newPosts,
                timestamp: now
            };
            localStorage.setItem(cacheKey, JSON.stringify(postsToCache));

        } catch (error) {
            // Silent error handling
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAndSetPosts = async (page, userId = null) => {
        // If we already have posts and this is page 1, don't show loading indicator
        const showLoadingIndicator = !(posts.length > 0 && page === 1);

        if (showLoadingIndicator) {
            setIsLoading(true);
        }


        const isMyPosts = userId != null;
        const cacheKey = isMyPosts ? getMyPostsCacheKey(page, userId, postsVersion) : getAllPostsCacheKey(page, postsVersion);

        // First check sessionStorage (fastest)
        if (page === 1 && !isMyPosts && typeof window !== 'undefined') {
            const sessionData = sessionStorage.getItem('cachedStories');
            if (sessionData) {
                try {
                    const { stories, timestamp } = JSON.parse(sessionData);
                    if (stories && stories.length > 0) {
                        const now = new Date().getTime();
                        const cacheAge = (now - timestamp) / 1000;

                        // Only append if we're loading a new page, otherwise replace
                        setPosts(prevPosts => {
                            if (page > 1) {
                                // Combine previous and new posts, then remove duplicates
                                const combinedPosts = removeDuplicatePosts([...prevPosts, ...stories]);
                                return recalculateLikeStatus(combinedPosts);
                            } else {
                                return recalculateLikeStatus(stories);
                            }
                        });
                        setPage(page);
                        setHasMorePosts(stories.length >= 6); // 6 is postsPerPage
                        setIsLoading(false);

                        // If cache is older than instant cache time, fetch fresh data in background
                        if (cacheAge > INSTANT_CACHE_EXPIRATION_MS / 1000) {
                            setTimeout(() => {
                                fetchAndSetPosts(1);
                            }, 100); // Small delay to let UI render first
                        }
                        return;
                    }
                } catch (error) {
                    // Silent error handling
                }
            }
        }

        // Then check localStorage
        let cachedData = localStorage.getItem(cacheKey);
        const postsPerPage = 6;

        // If no cache for current version, try to find a recent cache for page 1
        if (!cachedData && page === 1 && !isMyPosts) {
            const allCacheKeys = Object.keys(localStorage).filter(key =>
                key.startsWith('all_posts_cache_page_1_')
            );

            if (allCacheKeys.length > 0) {
                // Sort by timestamp (most recent first)
                const cacheOptions = allCacheKeys.map(key => {
                    try {
                        const data = JSON.parse(localStorage.getItem(key));
                        return { key, timestamp: data.timestamp, data };
                    } catch (error) {
                        return null;
                    }
                }).filter(Boolean);

                cacheOptions.sort((a, b) => b.timestamp - a.timestamp);

                if (cacheOptions.length > 0) {
                    cachedData = JSON.stringify(cacheOptions[0].data);
                }
            }
        }

        // Current time
        const now = new Date().getTime();

        if (cachedData) {
            const { posts: cachedPosts, timestamp } = JSON.parse(cachedData);
            const cacheExpiration = isMyPosts ? MY_POSTS_CACHE_EXPIRATION_MS : ALL_POSTS_CACHE_EXPIRATION_MS;
            const cacheAge = (now - timestamp) / 1000;

            // Check if cache is not older than expiration
            if (now - timestamp < cacheExpiration) {
                // Preload images from cached posts for instant display
                cachedPosts.forEach(post => {
                    post.photos.forEach(url => {
                        const img = new Image();
                        img.src = url;
                    });
                });

                setPosts(prevPosts => {
                    // Only append if we're loading a new page, otherwise replace
                    if (page > 1) {
                        // Combine previous and new posts, then remove duplicates
                        const combinedPosts = removeDuplicatePosts([...prevPosts, ...cachedPosts]);
                        return recalculateLikeStatus(combinedPosts);
                    } else {
                        return recalculateLikeStatus(cachedPosts);
                    }
                });

                // Also update sessionStorage for faster access next time
                if (page === 1 && !isMyPosts && typeof window !== 'undefined') {
                    try {
                        sessionStorage.setItem('cachedStories', JSON.stringify({
                            stories: cachedPosts,
                            timestamp
                        }));
                    } catch (error) {
                        // Silent error handling
                    }
                }

                setIsLoading(false);
                setPage(page);
                setHasMorePosts(cachedPosts.length >= postsPerPage);
                return;
            } else {
            }
        } else {
        }

        try {
            let fetchedPosts = [];

            for await (const post of fetchPosts(page, postsPerPage, userId)) {
                // Validate the structure of the post and post.user before proceeding
                if (!post || !post.user || !post.id) {
                    continue; // Skip invalid posts
                }

                // Safeguard access to post.user._key?.path?.segments?.[6] for "all users" scenario
                const userKeyPathSegments = post.user._key?.path?.segments;
                const userIdFromPost = Array.isArray(userKeyPathSegments) && userKeyPathSegments.length > 6
                    ? userKeyPathSegments[6]
                    : post.user.uid || null;  // If _key doesn't exist, fallback to direct post.user.uid

                if (!userIdFromPost) {
                    continue; // Skip posts with invalid user structure
                }

                // Ensure user data is fetched and set
                await fetchAndSetUsers([userIdFromPost]);

                // Handle likes for this post
                const likedUserIds = await getUsersWhoLikedPost(post.id);

                // Recalculate currentUserLiked here
                const currentUserLiked = user && Array.isArray(likedUserIds)
                    ? likedUserIds.includes(user.uid)
                    : false;

                // Fetch user data if not already fetched
                if (!users[userIdFromPost]) {
                    const userDocRef = doc(getFirestore(), 'users', userIdFromPost);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        setUsers(prevUsers => ({...prevUsers, [userIdFromPost]: userDoc.data()}));
                    } else {
                        continue; // Skip posts where user data can't be fetched
                    }
                }

                const postUserData = users[userIdFromPost] || {}; // Fallback if no user data found

                // Update the post with user and like information
                const updatedPost = {
                    ...post,
                    user: {
                        uid: userIdFromPost,
                        ...postUserData,
                    },
                    likedUsers: likedUserIds,
                    currentUserLiked, // Use the recalculated value
                };

                fetchedPosts.push(updatedPost);
            }

            // Update posts state based on page number
            setPosts(prevPosts => {
                // Only append if we're loading a new page, otherwise replace
                if (page > 1) {
                    // Combine previous and new posts, then remove duplicates
                    const combinedPosts = removeDuplicatePosts([...prevPosts, ...fetchedPosts]);
                    return recalculateLikeStatus(combinedPosts);
                } else {
                    return recalculateLikeStatus(fetchedPosts);
                }
            });

            // Preload images for better user experience
            fetchedPosts.forEach(post => {
                post.photos.forEach(url => {
                    const img = new Image();
                    img.src = url;
                });
            });

            // Cache the fetched posts with a timestamp
            const postsToCache = {
                posts: fetchedPosts, timestamp: now
            };
            localStorage.setItem(cacheKey, JSON.stringify(postsToCache));

            // Also update the global context and sessionStorage
            updateCachedStories(fetchedPosts, now);

            // Directly update sessionStorage for even faster access next time
            if (page === 1 && !isMyPosts && typeof window !== 'undefined') {
                try {
                    sessionStorage.setItem('cachedStories', JSON.stringify({
                        stories: fetchedPosts,
                        timestamp: now
                    }));
                } catch (error) {
                    // Silent error handling
                }
            }

            setHasMorePosts(fetchedPosts.length > 0);
        } catch (error) {
            // Silent error handling
        } finally {
            setIsLoading(false);
        }

        // Update the page number
        if (page > 1) {
            setPage(page);
        }
    };

    useEffect(() => {
        let isCancelled = false;

        const fetchAndSetPostComments = async () => {
            // Only fetch comments if we have posts
            if (!posts || posts.length === 0) {
                return;
            }

            const cachedPostComments = localStorage.getItem('postComments');
            if (cachedPostComments) {
                try {
                    setPostComments(JSON.parse(cachedPostComments));
                } catch (error) {
                    // Silent error handling
                }
            }

            const db = getFirestore();
            const fetchedPostComments = {};
            const commenterUserIds = new Set();

            for (const post of posts) {
                try {
                    const q = query(
                        collection(db, 'storyComments'),
                        where('postAssociation', '==', doc(db, 'userPosts', post.id)),
                        orderBy('timePosted')
                    );
                    const querySnapshot = await getDocs(q);

                    fetchedPostComments[post.id] = querySnapshot.docs.map(docSnap => {
                        const commentData = docSnap.data();
                        const commentUser = commentData.commentUser;

                        if (commentUser && commentUser._key && commentUser._key.path && commentUser._key.path.segments) {
                            const userIdFromComment = commentUser._key.path.segments[6];
                            commenterUserIds.add(userIdFromComment);
                        }

                        return {
                            ...commentData,
                            id: docSnap.id
                        };
                    });
                } catch (error) {
                    fetchedPostComments[post.id] = [];
                }
            }

            // Fetch user data for commenters
            const postUserIds = posts.map(post => post.userId).filter(Boolean);
            await fetchAndSetUsers([...new Set([...postUserIds, ...commenterUserIds])]);

            if (!isCancelled) {
                setPostComments(prevComments => ({...prevComments, ...fetchedPostComments}));

                // Cache the comments
                try {
                    localStorage.setItem('postComments', JSON.stringify(fetchedPostComments));
                } catch (error) {
                    // Silent error handling
                }
            }
        };

        // Add a small delay to ensure posts are fully loaded
        const timeoutId = setTimeout(() => {
            fetchAndSetPostComments();
        }, 100);

        return () => {
            isCancelled = true;
            clearTimeout(timeoutId);
        };
    }, [posts.length]); // Only depend on posts.length, not posts content or user


    const deletePost = async (postId) => {
        try {
            const postRef = doc(db, 'userPosts', postId);

            const statsRef = doc(db, 'stats', 'totalWeight');

            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                const postLitterWeight = postDoc.data().litterWeight;
                const postUserId = postDoc.data().postUser.id;

                const statsDoc = await transaction.get(statsRef);
                const currentTotalWeight = statsDoc.data().totalWeight;

                const userRef = doc(db, 'users', postUserId);
                const userDoc = await transaction.get(userRef);
                const currentUserTotalWeight = userDoc.data().totalWeight || 0;

                transaction.delete(postRef);

                transaction.update(statsRef, {totalWeight: currentTotalWeight - postLitterWeight});

                transaction.update(userRef, {totalWeight: currentUserTotalWeight - postLitterWeight});
            });

            localStorage.removeItem(`posts_page_1`);
            localStorage.removeItem('totalWeight');

            setPosts(prevPosts => prevPosts.filter(post => post.id !== postId));

        } catch (error) {
            // Silent error handling
        }
    };

    const handleReportClick = (postId, optionValue) => {
        reportPost(postId, optionValue);

        setShowOptions(false);
        setOpenMenuId(null);
    };

    const reportPost = async (postId, userConcern) => {
        try {
            const postRef = doc(db, 'userPosts', postId);

            const postDoc = await runTransaction(db, async (transaction) => {
                const postSnapshot = await transaction.get(postRef);
                if (!postSnapshot.exists()) {
                    throw "Post does not exist!";
                }
                return postSnapshot.data();
            });

            if (!postDoc) {
                console.error("Failed to get post data");
                return;
            }

            const postUserId = postDoc.postUser.id;
            const userRef = doc(db, 'users', postUserId);
            const userDoc = await runTransaction(db, async (transaction) => {
                const userSnapshot = await transaction.get(userRef);
                if (!userSnapshot.exists()) {
                    throw "User does not exist!";
                }
                return userSnapshot.data();
            });

            const timestamp = postDoc.timePosted;
            const date = new Date(timestamp.seconds * 1000);

            const formattedDate = `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;

            const reportInappropriatePostTemplateId = "d-95a2eee11b234269a6d05c06a4c334fa";
            const reporterEmail = user ? auth.currentUser.email : 'anonymous user';
            const reportInappropriatePostTemplateData = {
                postID: postId,
                postDate: formattedDate,
                postDescription: postDoc.postDescription,
                userConcern: userConcern,
                reporter: reporterEmail,
                userWhoPosted: userDoc.email,
            };

            await fetch("/api/sendEmail", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: 'contact@litterpic.org',
                    templateId: reportInappropriatePostTemplateId,
                    templateData: reportInappropriatePostTemplateData,
                }),
            });

            // Show toast message
            toast.success("Thank you for reporting this post. We will investigate and take appropriate action.", {
                position: "top-center",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } catch (error) {
            console.error("Error in reportPost function:", error);
        }
    };

    const reportOptions = [
        {value: 'Spam or misleading', label: 'Spam or misleading'},
        {value: 'Harassment or bullying', label: 'Harassment or bullying'},
        {value: 'Inappropriate content', label: 'Inappropriate content'},
    ];

    return (
        <div>
            <Head>
                <title>LitterPic Inspiring Stories</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
                <meta name="description"
                      content="Join LitterPic in making the world cleaner and safer. Explore inspiring litter collection photos and stories."/>
                <meta name="robots" content="index, follow"/>
                <link rel="icon" href="/favicon.ico"/>
                <link rel="canonical" href="https://litterpic.org/stories"/>
                <link rel="preconnect" href="https://litterpic.org" />

                <meta property="og:title" content="LitterPic - Inspiring Stories"/>
                <meta property="og:description"
                      content="Join LitterPic in making the world cleaner and safer. Explore inspiring litter collection photos and stories."/>
                <meta property="og:image" content="https://litterpic.org/images/litter_pic_logo.png"/>
                <meta property="og:url" content="https://litterpic.org/stories"/>
                <meta property="og:type" content="website"/>

                {/* Preload critical resources */}
                <link rel="preload" href="/images/user_posts_banner.webp" as="image" />

                {/* Mobile optimization scripts */}
                <script dangerouslySetInnerHTML={{
                    __html: `
                        // Fix for 300ms tap delay on mobile devices
                        document.addEventListener('touchstart', function() {}, {passive: true});
                    `
                }} />

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content="LitterPic - Inspiring Litter Collection"/>
                <meta name="twitter:description"
                      content="Join LitterPic in making the world cleaner and safer. Explore inspiring litter collection photos and stories, and get involved in community cleanups."/>
                <meta name="twitter:image" content="https://litterpic.org/images/litter_pic_logo.png"/>
                <meta name="twitter:url" content="https://litterpic.org/stories"/>

                <meta name="keywords"
                      content="litter, litterpicking, litter collection, community cleanups, environmental conservation, inspiring stories"/>
                <meta name="author" content="LitterPic Inc."/>
            </Head>

            {/* Google Analytics Scripts */}
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-3VZE7E59CL"
                strategy="afterInteractive"
            />
            <Script
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-3VZE7E59CL');
                    `,
                }}
            />

            <div className="banner">
                <img
                    src="/images/user_posts_banner.webp"
                    alt="Banner Image"
                    loading="eager"
                    fetchpriority="high"
                    style={{ display: 'block', width: '100%' }}
                />
            </div>

            <div className="page">
                <div className="content">
                    <div className="stories-top-bar">
                        <h1 className="heading-text">User Stories</h1>
                        <div className="stories-top-buttons">
                            <Link href="/createpost">
                                <button className="create-post-button">Post Your Story</button>
                            </Link>
                            {process.env.NODE_ENV === 'development' && (
                                <button
                                    className="refresh-cache-button"
                                    onClick={() => {
                                        clearAllCaches();
                                        setPosts([]);
                                        setPage(1);
                                        fetchAndSetPosts(1);
                                    }}
                                    title="Refresh Cache (Dev Only)"
                                >
                                    🔄
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="stories-about-us">
                        Discover the heartwarming and inspiring stories shared by our dedicated volunteers. Each post is
                        a testament to the incredible impact they have made in cleaning our planet, one piece of litter
                        at a time. These stories aren't just about cleaning up; they're about hope, community, and the
                        power of collective action. By joining our volunteer community, you’re not just picking up
                        trash; you’re becoming a part of a global movement that cherishes our Earth and works tirelessly
                        to preserve its beauty for future generations. Your story is unique and valuable – share it with
                        us and inspire others! Together, we can make a significant difference and create a cleaner,
                        greener, and more sustainable world. Join LitterPic today and let your journey of positive
                        change begin!
                    </div>

                    <div className="search-and-filter">
                        <img className="search-and-filter-image"
                             src="/images/litter_on_road.jpeg"
                             alt="Banner Image"/>

                        <div className="search-and-filter-input-button-container">
                            <div className="search-and-filter-button-container">
                                <button
                                    className="show-all-posts-button"
                                    onClick={handleShowAllPostsButton}>All Posts
                                </button>
                                <button
                                    className="show-my-posts-button"
                                    disabled={!user}
                                    onClick={handleMyPostsButton}>My Posts
                                </button>

                                <select className="post-search-input" value={selectedUser}
                                        onChange={(e) => handleUserSelect(e.target.value)}
                                        disabled={isLoadingSearchUsers}>
                                    <option value="">Search Posts by User</option>
                                    {searchUsers.map(user => (
                                        <option key={user.id} value={user.id}>{user.display_name}</option>))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="story-posts">
                        {isLoading && posts.length === 0 && (
                            <Masonry
                                breakpointCols={{default: 2, 700: 1}}
                                className="post-grid"
                                columnClassName="post-grid-column"
                            >
                                {[...Array(6)].map((_, index) => (
                                    <PostSkeleton key={`skeleton-${index}`} />
                                ))}
                            </Masonry>
                        )}

                        <Masonry
                            key='all'
                            breakpointCols={{default: 2, 700: 1}}
                            className="post-grid"
                            columnClassName="post-grid-column"
                        >
                            {posts.map((post, index) => {
                                const {numComments} = post;
                                const postMasonryKey = `${index}_${post.id}_post`;

                                return (
                                    <div key={postMasonryKey} id={post.id} className="post">
                                        <div className="post-header">
                                            <i
                                                className="fa fa-ellipsis-v meatball-menu"
                                                aria-hidden="true"
                                                onClick={() => {
                                                    setOpenMenuId(openMenuId !== post.id ? post.id : null);
                                                    setOpenCommentInput(null);
                                                }}
                                            ></i>
                                        </div>
                                        <ToastContainer/>
                                        <div
                                            className={`post-dropdown-menu ${openMenuId === post.id ? 'show' : ''}`}
                                            ref={openMenuId === post.id ? dropdownRef : null}
                                        >
                                            {showOptions ? (
                                                <ul className="meatball-post-menu">
                                                    {reportOptions.map((option) => (
                                                        <li key={option.value}
                                                            onClick={() => {
                                                                handleReportClick(post.id, option.value);
                                                                // Hide report options after selection
                                                                setShowOptions(false);
                                                                setOpenMenuId(null); // Close the dropdown menu
                                                            }}>
                                                            {option.label}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <ul className="meatball-post-menu">
                                                    <li
                                                        onClick={() => {
                                                            if (user && post.user && user.uid === post.user.uid) {
                                                                deletePost(post.id);
                                                                setOpenMenuId(null); // Optionally close the dropdown menu
                                                            }
                                                        }}
                                                        className={user && post.user && user.uid === post.user.uid ? '' : 'grayed-out'}
                                                    >
                                                        Delete Post
                                                    </li>
                                                    <li onClick={() => {
                                                        setShowOptions(true); // Show report options
                                                        // Do not close the menu here; let the user select a report reason
                                                    }}>Report Post
                                                    </li>
                                                </ul>
                                            )}
                                        </div>


                                        <Post post={post} currentUser={user} auth={auth}/>
                                        <div className="likes-comments">

                    <span className="likes-comments-likes-field" onMouseEnter={() => handleLikeHover(post)}
                          onMouseLeave={() => handleLeaveHover(post)}>

                        <i
                            className={`material-icons ${post.currentUserLiked ? 'filled-heart' : 'empty-heart'}`}
                            onClick={() => {
                                handleToggleLike(post.id);
                            }}
                        >
                            {post.currentUserLiked ? 'favorite' : 'favorite_border'}
                        </i>

                        <span className="like-count">
                            {post.likes ? post.likes.length : 0}
                        </span>

                            {likePopupVisible && hoveredPostId === `${post.id}_post` && (
                                <LikePopup likedUsers={likedUsers}/>)}
                    </span>

                                            <span className="likes-comments-comment-field">
                        <i
                            className="material-icons empty-comment"
                            onClick={() => setOpenCommentInput(openCommentInput !== post.id ? post.id : null)}
                        >
                            chat_bubble_outline
                        </i>

                        <span className="comment-count">{numComments}</span>

                    </span>
                                        </div>
                                        <div className="story-comment-input">
                                            {/* Always show existing comments */}
                                            {postComments[post.id] &&
                                                postComments[post.id].map((commentData) => {
                                                            const commentUserId =
                                                                commentData?.commentUser?._key?.path?.segments?.[6] || null;
                                                            const commentUser = users?.[commentUserId] || {};
                                                            const commentTime =
                                                                commentData.timePosted &&
                                                                typeof commentData.timePosted.toDate === 'function'
                                                                    ? commentData.timePosted.toDate()
                                                                    : null;

                                                            // Convert comment text with URLs to clickable links
                                                            const sanitizedCommentHTML = DOMPurify.sanitize(parseUrls(commentData.comment));

                                                            return (
                                                                <div key={commentData.id} className="comment">
                                                                    {commentUser && (
                                                                        <>
                                                                            <Link href={`/profile/${commentUserId}`}>
                                                                                <img
                                                                                    src={commentUser.photo_url}
                                                                                    alt={commentUser.display_name}
                                                                                    className="comment-user-avatar clickable"
                                                                                    onError={(e) =>
                                                                                        (e.target.src =
                                                                                            'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg')
                                                                                    }
                                                                                />
                                                                            </Link>
                                                                            <div className="comment-text">
                                                                                <Link href={`/profile/${commentUserId}`} className="comment-user clickable">
                                                                                    {commentUser.display_name}
                                                                                </Link>
                                                                                {commentTime && commentTime instanceof Date && (
                                                                                    <span className="comment-time">
                                                {commentTime.toLocaleString('en-US', {
                                                    year: 'numeric',
                                                    month: '2-digit',
                                                    day: '2-digit',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                                                                )}
                                                                                {/* Render the comment text with sanitized HTML */}
                                                                                <div
                                                                                    className="comment-text-content"
                                                                                    dangerouslySetInnerHTML={{
                                                                                        __html: sanitizedCommentHTML,
                                                                                    }}
                                                                                />
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}

                                            {/* Only show comment input when opened */}
                                            {openCommentInput === post.id && (
                                                <>
                                                    <textarea
                                                        className="comment-text-input"
                                                        ref={commentInputRef}
                                                        value={comments[post.id] || ''}
                                                        onChange={(event) => handleCommentChange(event, post.id)}
                                                        placeholder="Add a comment..."
                                                    />
                                                    <button
                                                        className="comment-submit-button"
                                                        ref={submitButtonRef}
                                                        onClick={() => submitComment(post.id)}
                                                        disabled={!comments[post.id] || comments[post.id].trim().length < 1}
                                                    >
                                                        Submit
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </Masonry>

                        <div className="button-container">
                            {!isLoading && hasMorePosts && !showMyPosts && selectedUser === "" && (
                                <button
                                    className="custom-file-button"
                                    onClick={loadMoreStories}
                                >
                                    See More Stories
                                </button>
                            )}
                            {isLoading && posts.length > 0 && (
                                <div className="loading-spinner-container">
                                    <div className="loading-spinner"></div>
                                    <p>Loading more stories...</p>
                                </div>
                            )}
                            {!isLoading && showBackToTop && (
                                <button
                                    className="back-to-top-button"
                                    onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                                >
                                    Back to Top
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Stories;
