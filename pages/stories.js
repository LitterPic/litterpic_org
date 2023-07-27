import React, {useEffect, useState} from 'react';
import Post from '../components/post';
import {fetchPosts, toggleLike} from '../components/utils';
import Link from 'next/link';
import Masonry from 'react-masonry-css';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faComment as farComment} from '@fortawesome/free-regular-svg-icons';
import {faHeart as farHeart} from '@fortawesome/free-regular-svg-icons';
import {faHeart} from '@fortawesome/free-solid-svg-icons';
import {faComment} from '@fortawesome/free-solid-svg-icons';
import {getAuth} from 'firebase/auth';
import {getUsersWhoLikedPost} from '../components/utils';
import {doc} from "firebase/firestore";
import {useRouter} from 'next/router';

function Stories() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [page, setPage] = useState(1);
    const [user, setUser] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);

    const router = useRouter();

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
                                                />
                                                <span className="comment-count">{numComments}</span>
                                            </span>
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
