import React, {useEffect, useRef, useState} from 'react';
import {fetchPosts, getUsersWhoLikedPost, toggleLike} from '../components/utils';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
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
    const router = useRouter();
    const {postId} = router.query;  // Get the postId from the URL
    const dropdownRef = useRef(null);
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
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

    // 5 minute cache
    const ALL_POSTS_CACHE_EXPIRATION_MS = 86400000;
    const MY_POSTS_CACHE_EXPIRATION_MS = 86400000;
    const SEARCH_USERS_CACHE_EXPIRATION_MS = 86400000;
    const getAllPostsCacheKey = (page, version) => `all_posts_cache_page_${page}_v${version}`;
    const getMyPostsCacheKey = (page, userId, version) => `my_posts_cache_page_${userId}_${page}_v${version}`;

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
        // Real-time listener for posts
        const postsQuery = collection(getFirestore(), 'userPosts');
        const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
            if (!snapshot.metadata.hasPendingWrites) {
                // Data has been updated, invalidate the cache
                setPostsVersion(prevVersion => prevVersion + 1);
                localStorage.clear(); // Clear all local storage.
                setPosts([]); // Clear local posts state.
                fetchAndSetPosts(1);
            }
        });

        return () => unsubscribe();
    }, []);

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
                console.error("Error fetching users:", error);
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

    useEffect(() => {
        if (!loadingUser) {
            fetchAndSetPosts(1);
        }
    }, [loadingUser]);

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
                    return userSnap.data();
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
    }, []);

    const handleToggleLike = async (postId) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const postIndex = posts.findIndex((post) => post.id === postId);
            const postToUpdate = posts[postIndex];

            if (!postToUpdate) {
                console.error('Post not found for the given postId:', postId);
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
            console.error('Error toggling like:', error);
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
                console.error('Error adding comment:', error);
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
                console.error("Error fetching user document for ID:", userId, error);
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
            } else {

            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [postId, posts]);

    const fetchAndSetPosts = async (page, userId = null) => {
        setIsLoading(true);

        const isMyPosts = userId != null;
        const cacheKey = isMyPosts ? getMyPostsCacheKey(page, userId, postsVersion) : getAllPostsCacheKey(page, postsVersion);
        const cachedData = localStorage.getItem(cacheKey);
        const postsPerPage = 6;

        // Current time
        const now = new Date().getTime();

        if (cachedData) {
            const { posts: cachedPosts, timestamp } = JSON.parse(cachedData);
            const cacheExpiration = isMyPosts ? MY_POSTS_CACHE_EXPIRATION_MS : ALL_POSTS_CACHE_EXPIRATION_MS;

            // Check if cache is not older than expiration
            if (now - timestamp < cacheExpiration) {
                setPosts(prevPosts => [...prevPosts, ...cachedPosts]);
                setIsLoading(false);
                return;
            }
        }

        try {
            let fetchedPosts = [];

            for await (const post of fetchPosts(page, postsPerPage, userId)) {
                // Validate the structure of the post and post.user before proceeding
                if (!post || !post.user || !post.id) {
                    console.error("Post, Post User, or Post ID is missing:", post);
                    continue; // Skip invalid posts
                }

                // Safeguard access to post.user._key?.path?.segments?.[6] for "all users" scenario
                const userKeyPathSegments = post.user._key?.path?.segments;
                const userIdFromPost = Array.isArray(userKeyPathSegments) && userKeyPathSegments.length > 6
                    ? userKeyPathSegments[6]
                    : post.user.uid || null;  // If _key doesn't exist, fallback to direct post.user.uid

                if (!userIdFromPost) {
                    console.error("User ID from post is missing:", post);
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
                        console.error(`User data missing for userId: ${userIdFromPost}`);
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

            // Append all fetched posts to the state at once
            setPosts(prevPosts => [...prevPosts, ...fetchedPosts]);

            // Cache the fetched posts with a timestamp
            const postsToCache = {
                posts: fetchedPosts, timestamp: now
            };
            localStorage.setItem(cacheKey, JSON.stringify(postsToCache));

            setHasMorePosts(fetchedPosts.length > 0);
        } catch (error) {
            console.error('Error fetching posts:', error);
        } finally {
            setIsLoading(false);
        }

        setPage(page);
    };

    useEffect(() => {
        let isCancelled = false;

        const fetchAndSetPostComments = async () => {
            const cachedPostComments = localStorage.getItem('postComments');
            if (cachedPostComments) {
                setPostComments(JSON.parse(cachedPostComments));
            }

            const db = getFirestore();
            const fetchedPostComments = {};
            const commenterUserIds = new Set();

            for (const post of posts) {
                const q = query(collection(db, 'storyComments'), where('postAssociation', '==', doc(db, 'userPosts', post.id)), orderBy('timePosted'));
                const querySnapshot = await getDocs(q);

                fetchedPostComments[post.id] = querySnapshot.docs.map(doc => {
                    const commentUser = doc.data().commentUser;
                    if (commentUser && commentUser._key && commentUser._key.path && commentUser._key.path.segments) {
                        const userIdFromComment = commentUser._key.path.segments[6];
                        commenterUserIds.add(userIdFromComment);
                    }

                    return {
                        ...doc.data(), id: doc.id
                    };
                });
            }

            const postUserIds = posts.map(post => post.userId).filter(Boolean);
            await fetchAndSetUsers([...new Set([...postUserIds, ...commenterUserIds])]);

            if (!isCancelled) {
                setPostComments(prevComments => ({...prevComments, ...fetchedPostComments}));
            }

            // Recalculate likes after fetching comments
            const updatedPosts = posts.map(post => {
                const currentUserLiked = user && Array.isArray(post.likes)
                    ? post.likes.some(like => like.path === doc(db, 'users', user.uid).path)
                    : false;

                return {
                    ...post,
                    currentUserLiked,
                };
            });

            if (!isCancelled) {
                setPosts(updatedPosts);
            }
        };

        fetchAndSetPostComments();

        return () => {
            isCancelled = true;
        };
    }, [posts, user]);


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
            console.error('Error deleting post:', error);
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
                <meta name="description"
                      content="Join LitterPic in making the world cleaner and safer. Explore inspiring litter collection photos and stories."/>
                <meta name="robots" content="index, follow"/>
                <link rel="icon" href="/favicon.ico"/>
                <link rel="canonical" href="https://litterpic.org/stories"/>

                <meta property="og:title" content="LitterPic - Inspiring Stories"/>
                <meta property="og:description"
                      content="Join LitterPic in making the world cleaner and safer. Explore inspiring litter collection photos and stories."/>
                <meta property="og:image" content="https://litterpic.org/images/litter_pic_logo.png"/>
                <meta property="og:url" content="https://litterpic.org/stories"/>
                <meta property="og:type" content="website"/>

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
                <img src="/images/user_posts_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <div className="stories-top-bar">
                        <h1 className="heading-text">User Stories</h1>
                        <Link href="/createpost">
                            <button className="create-post-button">Post Your Story</button>
                        </Link>
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
                            onClick={() => handleToggleLike(post.id)}
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
                            className={`material-icons ${numComments > 0 ? 'filled-comment' : 'empty-comment'}`}
                            onClick={() => setOpenCommentInput(openCommentInput !== post.id ? post.id : null)}
                        >
                            mode_comment
                        </i>

                        <span className="comment-count">{numComments}</span>

                    </span>
                                        </div>
                                        <div className="story-comment-input">
                                            {openCommentInput === post.id && (
                                                <>
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
                                                                            <img
                                                                                src={commentUser.photo_url}
                                                                                alt={commentUser.display_name}
                                                                                onError={(e) =>
                                                                                    (e.target.src =
                                                                                        'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg')
                                                                                }
                                                                            />
                                                                            <div className="comment-text">
                                        <span className="comment-user">
                                            {commentUser.display_name}
                                        </span>
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
                                                    <textarea
                                                        className="comment-text-input"
                                                        ref={openCommentInput === post.id ? commentInputRef : null}
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
                                    onClick={() => fetchAndSetPosts(page + 1, null)}
                                >
                                    See More Stories
                                </button>
                            )}
                            {isLoading && <div>Loading more stories...</div>}
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
