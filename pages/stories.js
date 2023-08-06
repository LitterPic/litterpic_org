import React, {useEffect, useState, useRef} from 'react';
import Post from '../components/post';
import {fetchPosts, toggleLike} from '../components/utils';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faComment as farComment} from '@fortawesome/free-regular-svg-icons';
import {faHeart as farHeart} from '@fortawesome/free-regular-svg-icons';
import {faHeart} from '@fortawesome/free-solid-svg-icons';
import {faComment} from '@fortawesome/free-solid-svg-icons';
import {faEllipsisV, faEllipsisH} from '@fortawesome/free-solid-svg-icons';
import {getAuth} from 'firebase/auth';
import {getUsersWhoLikedPost} from '../components/utils';
import {useRouter} from 'next/router';
import {deletePost as deletePostFromDB} from '../components/utils';
import {
    getFirestore,
    doc,
    addDoc,
    serverTimestamp,
    collection,
    updateDoc,
    increment,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';


function Stories() {
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
        if (loadingUser) {
            return;
        }

        const fetchAndSetPosts = async () => {
            setIsLoading(true);
            try {
                const fetchedPosts = await fetchPosts(page, 4);
                if (fetchedPosts.length === 0) {
                    setHasMorePosts(false);
                } else {
                    const uniquePosts = filterUniquePosts(fetchedPosts);

                    // Fetch and store the liked user UIDs for each post
                    const likedUsersPromises = uniquePosts.map((post) =>
                        getUsersWhoLikedPost(post.id)
                    );
                    const likedUsersLists = await Promise.all(likedUsersPromises);

                    // Update the posts state by adding likedUsers for each post
                    const updatedPosts = uniquePosts.map((post, index) => ({
                        ...post,
                        likedUsers: likedUsersLists[index] || [], // Store the liked user UIDs in each post
                        currentUserLiked: user ? likedUsersLists[index].includes(user.uid) : false,
                    }));

                    setPosts((prevPosts) => [...prevPosts, ...updatedPosts]);
                    setPage((prevPage) => prevPage + 1);
                }
            } catch (error) {
                console.error('Error fetching posts:', error);
            }
            setIsLoading(false);
        };

        fetchAndSetPosts();
    }, [page, user, loadingUser]);

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
                updatedPosts[postIndex].likeIds.push(user.uid);
                updatedPosts[postIndex].likes += 1;  // increment like count
                updatedPosts[postIndex].currentUserLiked = true;
            } else {
                updatedPosts[postIndex].likeIds = postToUpdate.likeIds.filter(id => id !== user.uid);
                updatedPosts[postIndex].likes -= 1;  // decrement like count
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

    useEffect(() => {
        const fetchAndSetUsers = async () => {
            const db = getFirestore();
            const usersCollection = collection(db, 'users');
            const usersSnapshot = await getDocs(usersCollection);
            const usersData = {};
            usersSnapshot.docs.forEach(doc => {
                usersData[doc.id] = doc.data();
            });
            setUsers(usersData);
            console.log("Fetched users:", JSON.stringify(usersData, null, 2));
        };

        fetchAndSetUsers();
    }, []);

    useEffect(() => {
        const fetchAndSetPostComments = async () => {
            const db = getFirestore();
            const fetchedPostComments = {};

            for (const post of posts) {
                const q = query(collection(db, 'storyComments'), where('postAssociation', '==', doc(db, 'userPosts', post.id)), orderBy('timePosted'));
                const querySnapshot = await getDocs(q);
                fetchedPostComments[post.id] = querySnapshot.docs.map(doc => doc.data());
            }

            setPostComments(fetchedPostComments);
            console.log("Fetched post comments:", JSON.stringify(fetchedPostComments, null, 2));
        };

        fetchAndSetPostComments();
    }, [posts]);


    const deletePost = async (postId) => {
        try {
            await deletePostFromDB(postId);  // Delete the post from Firestore
            setPosts(posts.filter(post => post.id !== postId));  // Update the local state
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

    const fetchMorePosts = async () => {
        setIsLoading(true);
        const nextPage = page + 1;
        const fetchedPosts = await fetchPosts(nextPage, 4);
        if (fetchedPosts.length === 0) {
            setHasMorePosts(false);
        } else {
            const uniquePosts = filterUniquePosts(fetchedPosts);
            setPosts((prevPosts) => [...prevPosts, ...uniquePosts]); // Merge previous posts with new ones
            setPage(nextPage);
        }
        setIsLoading(false);
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
                                const currentUserLiked = user ? post.likedUsers.includes(user.uid) : false;

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
                                                    icon={post.currentUserLiked ? faHeart : farHeart}
                                                    onClick={() => handleToggleLike(post.id)}
                                                    className={post.currentUserLiked ? 'filled-heart' : 'empty-heart'}
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
                                                    {postComments[post.id] && postComments[post.id].map((commentData, index) => {
                                                        const commentUserId = commentData.commentUser._key.path.segments[6];
                                                        const commentUser = users[commentUserId];
                                                        const commentTime = commentData.timePosted.toDate();
                                                        return (
                                                            <div key={index} className="comment">
                                                                {commentUser && (
                                                                    <>
                                                                        <img src={commentUser.photo_url}
                                                                             alt={commentUser.display_name}/>
                                                                        <div className="comment-text">
                                                                            <span
                                                                                className="comment-user">{commentUser.display_name}</span>
                                                                            <span className="comment-time">
                                                                                {commentTime.toLocaleTimeString(undefined, {
                                                                                    hour: '2-digit',
                                                                                    minute: '2-digit'
                                                                                })}
                                                                            </span>
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
                                                        <button className="comment-submit-button" ref={submitButtonRef}
                                                                onClick={() => submitComment(post.id)}>Submit
                                                        </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </Masonry>
                        {!isLoading && hasMorePosts && <div id="end-of-posts"></div>}
                    </div>
                    {isLoading && <div>Loading more posts...</div>}
                </div>
            </div>
        </div>
    );
}

export default Stories;
