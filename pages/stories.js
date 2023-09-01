import React, {useEffect, useRef, useState} from 'react';
import Post from '../components/post';
import {fetchPosts, getUsersWhoLikedPost, toggleLike} from '../components/utils';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faComment as farComment, faHeart as farHeart} from '@fortawesome/free-regular-svg-icons';
import {faComment, faEllipsisV, faHeart} from '@fortawesome/free-solid-svg-icons';
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


function Stories() {
    const CACHE_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

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

    // Separate useEffect for auth state changes
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
            setLoadingUser(false);
        });

        return () => unsubscribe();
    }, []);

    // UseEffect for posts fetching
    useEffect(() => {
        if (!loadingUser) { // User's authentication state has been determined
            if (user) {
                // User is logged in, fetch posts with user's UID
                fetchAndSetPosts(user.uid);
            } else {
                // User is not logged in, fetch posts without user's UID
                fetchAndSetPosts();
            }
        }
    }, [user, loadingUser]);

    const handleToggleLike = async (postId) => {
        // User is not logged in
        if (!user) {
            router.push('/login');
            return;
        }

        try {
            // Find the post with the given postId in the posts array
            const postIndex = posts.findIndex((post) => post.id === postId);
            const postToUpdate = posts[postIndex];

            const didLike = await toggleLike(postToUpdate, posts);

            // update the local state
            let updatedPosts = [...posts];
            if (didLike) {
                if (!Array.isArray(updatedPosts[postIndex].likeIds)) {
                    updatedPosts[postIndex].likeIds = []; // Initialize likeIds if it doesn't exist
                }
                updatedPosts[postIndex].likeIds.push(user.uid);
                updatedPosts[postIndex].likes += 1;
                updatedPosts[postIndex].currentUserLiked = true;
            } else {
                updatedPosts[postIndex].likeIds = updatedPosts[postIndex].likeIds.filter(id => id !== user.uid);
                updatedPosts[postIndex].likes -= 1;
                updatedPosts[postIndex].currentUserLiked = false;
            }

            setPosts(updatedPosts);
        } catch (error) {
            console.error('Error toggling like:', error);
        }
    };

    const handleCommentChange = (event, postId) => {
        setComments({
            ...comments,
            [postId]: event.target.value,
        });
    };

    const handleSubmit = (postId) => {
        submitComment(postId);
    };

    const submitComment = async (postId) => {
        // User is not logged in
        if (!user) {
            router.push('/login');
            return;
        }

        if (comments[postId].trim() === '') {
            return;
        }

        // Get the comment from the state
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
                // Update the numComments field in the userPosts document
                const postRef = doc(db, 'userPosts', postId);
                await updateDoc(postRef, {
                    numComments: increment(1)
                });

                // Update the local state for numComments
                const postIndex = posts.findIndex((post) => post.id === postId);
                const updatedPosts = [...posts];
                updatedPosts[postIndex].numComments = (updatedPosts[postIndex].numComments || 0) + 1;
                setPosts(updatedPosts);

                // Update the local state for postComments
                const updatedPostComments = {...postComments};
                updatedPostComments[postId] = [
                    ...(updatedPostComments[postId] || []),
                    {
                        comment,
                        commentUser: {name: user.displayName},  // Assuming user.displayName exists
                        postAssociation: postId,
                        timePosted: new Date(),  // This will be the local time, not the server time
                    },
                ];
                setPostComments(updatedPostComments);

                setComments({...comments, [postId]: ''});  // Clear the comment field
                setOpenCommentInput(null);  // Close the comment input
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
        userIds = userIds.filter(Boolean); // Ensure no undefined or null values

        // Load cached users (if available)
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

        // Update state with latest users data
        setUsers(prevUsers => ({...prevUsers, ...usersData}));

        // Update cache with latest users data
        localStorage.setItem('users', JSON.stringify(usersData));
    };

    const fetchAndSetPosts = async () => {
        setIsLoading(true);
        try {
            let fetchedPosts;

            // Check for cached posts for the current page
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

                // Cache the fetched posts for the current page with timestamp
                localStorage.setItem(
                    `posts_page_${page}`,
                    JSON.stringify({posts: fetchedPosts, timestamp: Date.now()})
                );
            }

            if (fetchedPosts.length === 0) {
                setHasMorePosts(false);
            } else {
                const uniquePosts = filterUniquePosts(fetchedPosts);

                // Collect the user IDs related to the fetched posts
                const userIds = uniquePosts.map(post => {
                    return post.user && post.user._key && post.user._key.path && post.user._key.path.segments ? post.user._key.path.segments[6] : null;
                }).filter(Boolean);

                // Fetch and set the users related to the fetched posts
                await fetchAndSetUsers(userIds);

                // Fetch and store the liked user UIDs for each post
                const likedUsersPromises = uniquePosts.map((post) =>
                    getUsersWhoLikedPost(post.id)
                );
                const likedUsersLists = await Promise.all(likedUsersPromises);

                // Update the posts state by adding likedUsers for each post
                const updatedPosts = uniquePosts.map((post, index) => {
                    const currentUserLiked = user ? likedUsersLists[index].includes(user.uid) : false;
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
            // Load cached post comments (if available)
            const cachedPostComments = localStorage.getItem('postComments');
            if (cachedPostComments) {
                setPostComments(JSON.parse(cachedPostComments));
            }

            const db = getFirestore();
            const fetchedPostComments = {};
            const commenterUserIds = new Set();  // To store user IDs from comments

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
                        id: doc.id  // Include the document ID
                    };
                });
            }

            // Fetch and set users from comments (and combine with post users)
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
            // Reference to the post document
            const postRef = doc(db, 'userPosts', postId);

            // Reference to the totalWeight document
            const statsRef = doc(db, 'stats', 'totalWeight');

            // Run a transaction to delete the post and update the total weight
            await runTransaction(db, async (transaction) => {
                // Retrieve the post document to get the litterWeight
                const postDoc = await transaction.get(postRef);
                const postLitterWeight = postDoc.data().litterWeight;
                const postUserId = postDoc.data().postUser.id; // Extracting userId from post

                // Retrieve the current total weight
                const statsDoc = await transaction.get(statsRef);
                const currentTotalWeight = statsDoc.data().totalWeight;

                // Reference to user document
                const userRef = doc(db, 'users', postUserId);
                const userDoc = await transaction.get(userRef);
                const currentUserTotalWeight = userDoc.data().totalWeight || 0;

                // Delete the post
                transaction.delete(postRef);

                // Decrement the total weight by the litterWeight of the deleted post
                transaction.update(statsRef, {totalWeight: currentTotalWeight - postLitterWeight});

                // Update the user's totalWeight
                transaction.update(userRef, {totalWeight: currentUserTotalWeight - postLitterWeight});
            });

            // Invalidate the cache for the current page containing the deleted post
            localStorage.removeItem(`posts_page_1`);
            localStorage.removeItem('totalWeight');

            // Update the local state to reflect the deleted post
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
                            breakpointCols={{default: 2, 700: 1}}
                            className="post-grid"
                            columnClassName="post-grid-column"
                        >
                            {posts.map((post) => {
                                const likes = post.likes !== undefined ? post.likes : 0;
                                const {numComments} = post;

                                // Check if the current user's UID exists in the likedUsers array for this post
                                const currentUserLiked = post.currentUserLiked;

                                return (
                                    <div key={post.id} className="post">
                                        <div className="post-header">
                                            <FontAwesomeIcon icon={faEllipsisV}
                                                             className="meatball-menu"
                                                             onClick={() => {
                                                                 setOpenMenuId(openMenuId !== post.id ? post.id : null);
                                                                 setOpenCommentInput(null);
                                                             }}
                                            />
                                        </div>
                                        <div className={`post-dropdown-menu ${openMenuId === post.id ? 'show' : ''}`}
                                             ref={openMenuId === post.id ? dropdownRef : null}>
                                            <ul className="meatball-post-menu">

                                                <li
                                                    onClick={() => {
                                                        if (user && post.user && user.uid === post.user.uid) {
                                                            deletePost(post.id);
                                                        }
                                                    }}
                                                    className={
                                                        user && post.user && user.uid === post.user.uid ? '' : 'grayed-out'
                                                    }
                                                >
                                                    Delete Post
                                                </li>
                                            </ul>
                                        </div>
                                        <Post post={post}/>
                                        <div className="likes-comments">
                                            <span className="likes-comments-likes-field">
                                                <FontAwesomeIcon
                                                    icon={currentUserLiked ? faHeart : farHeart}
                                                    onClick={() => handleToggleLike(post.id)}
                                                    className={currentUserLiked ? 'filled-heart' : 'empty-heart'}
                                                />
                                                <span className="like-count">{likes}</span>
                                            </span>
                                            <span className="likes-comments-comment-field">
                                                <FontAwesomeIcon
                                                    icon={numComments > 0 ? faComment : farComment}
                                                    className={numComments > 0 ? 'filled-comment' : 'empty-comment'}
                                                    onClick={() => setOpenCommentInput(openCommentInput !== post.id ? post.id : null)}
                                                />
                                                <span className="comment-count">{numComments}</span>
                                            </span>
                                        </div>
                                        <div className="story-comment-input">
                                            {openCommentInput === post.id && (
                                                <>
                                                    {postComments[post.id] && postComments[post.id].map((commentData) => {
                                                        const commentUserId = commentData?.commentUser?._key?.path?.segments?.[6] || null;
                                                        const commentUser = users?.[commentUserId] || {};
                                                        const commentTime = commentData.timePosted && typeof commentData.timePosted.toDate === 'function' ? commentData.timePosted.toDate() : null;
                                                        return (
                                                            <div key={commentData.id} className="comment">
                                                                {commentUser && (
                                                                    <>
                                                                        <img src={commentUser.photo_url}
                                                                             alt={commentUser.display_name}/>
                                                                        <div className="comment-text">
                                                                            <span
                                                                                className="comment-user">{commentUser.display_name}</span>
                                                                            {commentTime && commentTime instanceof Date && (
                                                                                <span className="comment-time">
                                                                                    {
                                                                                        commentTime &&
                                                                                        commentTime.toLocaleString('en-US', {
                                                                                            year: 'numeric',
                                                                                            month: '2-digit',
                                                                                            day: '2-digit',
                                                                                            hour: '2-digit',
                                                                                            minute: '2-digit'
                                                                                        })
                                                                                    }
                                                                                </span>
                                                                            )}
                                                                            <div
                                                                                className="comment-text-content">{commentData.comment}</div>
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
                                                        onClick={() => handleSubmit(post.id)}
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
                            
                            {!isLoading && hasMorePosts && (
                                <button className="custom-file-button" onClick={fetchAndSetPosts}>View More
                                    Posts</button> // Add the Load More button here
                            )}


                            {isLoading && <div>Loading more posts...</div>}

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
    );
}

export default Stories;
