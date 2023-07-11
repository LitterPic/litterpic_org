import React, {useEffect, useState} from 'react';
import Post from '../components/post';
import {fetchPosts} from '../components/utils';
import Link from 'next/link';
import Masonry from 'react-masonry-css';

function Stories() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [page, setPage] = useState(1);
    const [renderedPostIds, setRenderedPostIds] = useState([]);

    useEffect(() => {
        const fetchAndSetPosts = async () => {
            setIsLoading(true);
            try {
                const fetchedPosts = await fetchPosts(page, 4);
                console.log('Fetched Posts:', fetchedPosts); // Log the fetched posts
                if (fetchedPosts.length === 0) {
                    setHasMorePosts(false);
                } else {
                    const uniquePosts = filterUniquePosts(fetchedPosts);
                    setPosts((prevPosts) => [...prevPosts, ...uniquePosts]);
                    setPage((prevPage) => prevPage + 1); // Increment the page number
                }
            } catch (error) {
                console.error('Error fetching posts:', error); // Log the error, if any
            }
            setIsLoading(false);
        };

        fetchAndSetPosts();
    }, [page, renderedPostIds]); // Include renderedPostIds in the dependency array

    const filterUniquePosts = (newPosts) => {
        const newPostIds = newPosts.map((post) => post.id);
        console.log('New Post IDs:', newPostIds); // Log the new post IDs
        const uniquePosts = newPosts.filter((post) => !renderedPostIds.includes(post.id));
        console.log('Unique Posts:', uniquePosts); // Log the unique posts
        setRenderedPostIds((prevIds) => [...prevIds, ...newPostIds]);
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
            setPosts((prevPosts) => [...prevPosts, ...uniquePosts]);
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
                        impact they have
                        made. Join our volunteer community today and contribute your own unique story to the collection!
                    </div>

                    <div className="story-posts">
                        <Masonry
                            breakpointCols={{default: 2, 700: 1}}
                            className="post-grid"
                            columnClassName="post-grid-column"
                        >
                            {posts.map((post) => (
                                <div key={post.id}
                                     className="post">
                                    <Post post={post}/>
                                </div>
                            ))}
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
