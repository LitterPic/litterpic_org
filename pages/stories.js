import React, {useEffect, useRef, useState} from 'react';
import Post from '../components/post';
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
    query,
    runTransaction,
    serverTimestamp,
    updateDoc,
    where
} from 'firebase/firestore';
import {db} from "../lib/firebase";
import {capitalizeFirstWordOfSentences} from "../utils/textUtils";
import Head from "next/head";
import LikePopup from "../components/LikePopup";


function Stories() {
    const CACHE_EXPIRATION_TIME = 5 * 60 * 1000;

    const router = useRouter();
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
    const [masonryKey, setMasonryKey] = useState(Date.now().toString());
    const debounceTimers = {};

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

        // Set the state to hide the popup and clear the hovered post and liked users
        setLikePopupVisible(false);
        setHoveredPostId(null);
        setLikedUsers([]);
    };

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setOpenMenuId(null);
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

    useEffect(() => {
        if (!loadingUser) {
            if (user) {
                fetchAndSetPosts(user.uid);
            } else {
                fetchAndSetPosts();
            }
        }
    }, [user, loadingUser]);

    const handleToggleLike = async (postId) => {
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            const postIndex = posts.findIndex((post) => post.id === postId);
            const postToUpdate = posts[postIndex];

            const didLike = await toggleLike(postToUpdate, posts);

            let updatedPosts = [...posts];

            const db = getFirestore();
            const userDocRef = doc(db, 'users', user.uid);

            if (didLike) {
                if (!Array.isArray(updatedPosts[postIndex].likeIds)) {
                    updatedPosts[postIndex].likeIds = [];
                }

                updatedPosts[postIndex].likeIds.push(userDocRef);

                updatedPosts[postIndex].likes += 1;
                updatedPosts[postIndex].currentUserLiked = true;
            } else {
                updatedPosts[postIndex].likeIds = updatedPosts[postIndex].likeIds.filter(ref => ref.path !== userDocRef.path);
                updatedPosts[postIndex].likes -= 1;
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
            ...comments,
            [postId]: capitalizedText,
        });
    };

    const handleSubmit = (postId) => {
        submitComment(postId);
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
                await addDoc(collection(db, 'storyComments'), {
                    comment,
                    commentUser: doc(db, 'users', user.uid),
                    postAssociation: doc(db, 'userPosts', postId),
                    timePosted: serverTimestamp(),
                });
                const postRef = doc(db, 'userPosts', postId);
                await updateDoc(postRef, {
                    numComments: increment(1)
                });

                const postIndex = posts.findIndex((post) => post.id === postId);
                const updatedPosts = [...posts];
                updatedPosts[postIndex].numComments = (updatedPosts[postIndex].numComments || 0) + 1;
                setPosts(updatedPosts);

                const updatedPostComments = {...postComments};
                updatedPostComments[postId] = [
                    ...(updatedPostComments[postId] || []),
                    {
                        comment,
                        commentUser: {name: user.displayName},
                        postAssociation: postId,
                        timePosted: new Date(),
                    },
                ];
                setPostComments(updatedPostComments);

                setComments({...comments, [postId]: ''});
                setOpenCommentInput(null);
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                commentInputRef.current &&
                !commentInputRef.current.contains(event.target) &&
                (!dropdownRef.current || !dropdownRef.current.contains(event.target)) &&
                (!submitButtonRef.current || !submitButtonRef.current.contains(event.target))
            ) {
                setOpenCommentInput(null);
            }
        };

        document.addEventListener('mouseup', handleClickOutside);
        return () => {
            document.removeEventListener('mouseup', handleClickOutside);
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

        setUsers(prevUsers => ({...prevUsers, ...usersData}));

        localStorage.setItem('users', JSON.stringify(usersData));
    };

    const fetchAndSetPosts = async () => {
        setIsLoading(true);
        try {
            let fetchedPosts;

            const cachedData = localStorage.getItem(`posts_page_${page}`);
            if (cachedData) {
                const {posts, timestamp} = JSON.parse(cachedData);
                const isCacheValid = Date.now() - timestamp < CACHE_EXPIRATION_TIME;
                if (isCacheValid) {
                    fetchedPosts = posts;
                }
            }

            if (!fetchedPosts) {
                fetchedPosts = await fetchPosts(page, 6);

                localStorage.setItem(
                    `posts_page_${page}`,
                    JSON.stringify({posts: fetchedPosts, timestamp: Date.now()})
                );
            }

            if (fetchedPosts.length === 0) {
                setHasMorePosts(false);
            } else {
                const uniquePosts = filterUniquePosts(fetchedPosts);

                const userIds = uniquePosts.map(post => {
                    return post.user && post.user._key && post.user._key.path && post.user._key.path.segments ? post.user._key.path.segments[6] : null;
                }).filter(Boolean);

                await fetchAndSetUsers(userIds);

                const likedUsersPromises = uniquePosts.map((post) =>
                    getUsersWhoLikedPost(post.id)
                );
                const likedUsersLists = await Promise.all(likedUsersPromises);

                const updatedPosts = uniquePosts.map((post, index) => {
                    // Ensure likedUsersLists[index] is an array before using .includes
                    const currentUserLiked = user && Array.isArray(likedUsersLists[index])
                        ? likedUsersLists[index].includes(user.uid)
                        : false;

                    return {
                        ...post,
                        likedUsers: likedUsersLists[index] || [],
                        currentUserLiked: currentUserLiked,
                    };
                });


                setPosts((prevPosts) => [...prevPosts, ...updatedPosts]);
                setPage((prevPage) => prevPage + 1);
            }
        } catch (error) {
            console.error('Error fetching posts:', error);
        }
        setIsLoading(false);
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
                        ...doc.data(),
                        id: doc.id
                    };
                });
            }

            const postUserIds = posts.map(post => post.userId).filter(Boolean);
            await fetchAndSetUsers([...new Set([...postUserIds, ...commenterUserIds])]);

            if (!isCancelled) {
                setPostComments(prevComments => ({...prevComments, ...fetchedPostComments}));
            }
        };

        fetchAndSetPostComments();

        return () => {
            isCancelled = true;
        };
    }, [posts]);


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

    const filterUniquePosts = (newPosts) => {
        const uniquePosts = [];
        const uniquePostIds = new Set();

        newPosts.forEach((post) => {
            if (!uniquePostIds.has(post.id)) {
                uniquePostIds.add(post.id);
                uniquePosts.push(post);
            }
        });

        return uniquePosts;
    };

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
                        Explore the inspiring posts shared by our volunteers on our website, showcasing the positive
                        impact they
                        have made. Join our volunteer community today and contribute your own unique story to the
                        collection!
                    </div>

                    <div className="story-posts">
                        <Masonry
                            key={masonryKey}
                            breakpointCols={{default: 2, 700: 1}}
                            className="post-grid"
                            columnClassName="post-grid-column"
                        >
                            {posts.map((post, index) => {
                                const likes = post.likes !== undefined ? post.likes : 0;
                                const {numComments} = post;
                                const currentUserLiked = post.currentUserLiked;
                                const postMasonryKey = `${index}_${post.id}_post`;

                                return (
                                    <div key={postMasonryKey} className="post">
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
                                        <div
                                            className={`post-dropdown-menu ${
                                                openMenuId === post.id ? 'show' : ''
                                            }`}
                                            ref={openMenuId === post.id ? dropdownRef : null}
                                        >
                                            <ul className="meatball-post-menu">
                                                <li
                                                    onClick={() => {
                                                        if (
                                                            user &&
                                                            post.user &&
                                                            user.uid === post.user.uid
                                                        ) {
                                                            deletePost(post.id);
                                                        }
                                                    }}
                                                    className={
                                                        user &&
                                                        post.user &&
                                                        user.uid === post.user.uid
                                                            ? ''
                                                            : 'grayed-out'
                                                    }
                                                >
                                                    Delete Post
                                                </li>
                                            </ul>
                                        </div>
                                        <Post post={post}/>
                                        <div className="likes-comments">
                    <span
                        className="likes-comments-likes-field"
                        onMouseEnter={() => handleLikeHover(post)}
                        onMouseLeave={() => handleLeaveHover(post)}
                    >
                        <i
                            className={`material-icons ${
                                currentUserLiked
                                    ? 'filled-heart'
                                    : 'empty-heart'
                            }`}
                            onClick={() => handleToggleLike(post.id)}
                        >
                            {currentUserLiked
                                ? 'favorite'
                                : 'favorite_border'}
                        </i>

                        <span className="like-count">{likes}</span>

                        {likePopupVisible &&
                            hoveredPostId === `${post.id}_post` && (<LikePopup likedUsers={likedUsers}/>)
                        }
                    </span>
                                            <span className="likes-comments-comment-field">
                        <i
                            className={`material-icons ${
                                numComments > 0
                                    ? 'filled-comment'
                                    : 'empty-comment'
                            }`}
                            onClick={() =>
                                setOpenCommentInput(
                                    openCommentInput !== post.id
                                        ? post.id
                                        : null
                                )
                            }
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
                                                                commentData?.commentUser?._key?.path?.segments?.[6] ||
                                                                null;
                                                            const commentUser =
                                                                users?.[commentUserId] || {};
                                                            const commentTime =
                                                                commentData.timePosted &&
                                                                typeof commentData.timePosted.toDate ===
                                                                'function'
                                                                    ? commentData.timePosted.toDate()
                                                                    : null;
                                                            return (
                                                                <div
                                                                    key={commentData.id}
                                                                    className="comment"
                                                                >
                                                                    {commentUser && (
                                                                        <>
                                                                            <img
                                                                                src={commentUser.photo_url}
                                                                                alt={
                                                                                    commentUser.display_name
                                                                                }
                                                                            />
                                                                            <div className="comment-text">
                                                        <span className="comment-user">
                                                            {
                                                                commentUser.display_name
                                                            }
                                                        </span>
                                                                                {commentTime &&
                                                                                    commentTime instanceof
                                                                                    Date && (
                                                                                        <span className="comment-time">
                                                                    {commentTime &&
                                                                        commentTime.toLocaleString(
                                                                            'en-US',
                                                                            {
                                                                                year:
                                                                                    'numeric',
                                                                                month:
                                                                                    '2-digit',
                                                                                day:
                                                                                    '2-digit',
                                                                                hour:
                                                                                    '2-digit',
                                                                                minute:
                                                                                    '2-digit',
                                                                            }
                                                                        )}
                                                                </span>
                                                                                    )}
                                                                                <div className="comment-text-content">
                                                                                    {commentData.comment}
                                                                                </div>
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    <textarea
                                                        className="comment-text-input"
                                                        ref={
                                                            openCommentInput === post.id
                                                                ? commentInputRef
                                                                : null
                                                        }
                                                        value={comments[post.id] || ''}
                                                        onChange={(event) =>
                                                            handleCommentChange(event, post.id)
                                                        }
                                                        placeholder="Add a comment..."
                                                    />
                                                    <button
                                                        className="comment-submit-button"
                                                        ref={submitButtonRef}
                                                        onClick={() => handleSubmit(post.id)}
                                                        disabled={
                                                            !comments[post.id] ||
                                                            comments[post.id].trim().length < 1
                                                        }
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

                            {!isLoading && hasMorePosts && (
                                <button className="custom-file-button" onClick={fetchAndSetPosts}>See More
                                    Stories</button>
                            )}


                            {isLoading && <div>Loading more stories...</div>}

                            {
                                !isLoading && showBackToTop && (
                                    <button
                                        className="back-to-top-button"
                                        onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
                                    >
                                        Back to Top
                                    </button>
                                )
                            }
                        </div>

                    </div>

                </div>
            </div>
        </div>
    )
        ;
}

export default Stories;
