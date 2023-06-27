import React, {useEffect, useState, useRef} from 'react';
import Post from '../components/post';
import {fetchPosts} from '../components/utils';
import Link from 'next/link';

function Stories() {
    const [posts, setPosts] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasMorePosts, setHasMorePosts] = useState(true);
    const [page, setPage] = useState(1);
    const [renderedPostIds, setRenderedPostIds] = useState([]);
    const observer = useRef();


    useEffect(() => {
        const fetchAndSetPosts = async () => {
            setIsLoading(true);
            const fetchedPosts = await fetchPosts(page, 4);
            if (fetchedPosts.length === 0) {
                setHasMorePosts(false);
            } else {
                const uniquePosts = filterUniquePosts(fetchedPosts);
                setPosts((prevPosts) => [...prevPosts, ...uniquePosts]);
            }
            setIsLoading(false);
        };

        fetchAndSetPosts();
    }, [page]);

    useEffect(() => {
        const handleObserver = (entries) => {
            const target = entries[0];
            if (target.isIntersecting && hasMorePosts && !isLoading) {
                fetchMorePosts();
            }
        };

        observer.current = new IntersectionObserver(handleObserver);
        if (observer.current && !isLoading) {
            const targetNode = document.getElementById('end-of-posts');
            if (targetNode) {
                observer.current.observe(targetNode);
            }
        }

        return () => {
            if (observer.current) {
                observer.current.disconnect();
            }
        };
    }, [hasMorePosts, isLoading]);

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

    const filterUniquePosts = (newPosts) => {
        const uniquePosts = newPosts.filter((post) => !renderedPostIds.includes(post.id));
        setRenderedPostIds((prevIds) => [...prevIds, ...uniquePosts.map((post) => post.id)]);
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
                        <Link className="create-post-button" href="/createpost">
                            <button>Create Post</button>
                        </Link>
                    </div>

                    <div>
                        <div className="story-posts">
                            <div className="post-grid">
                                {posts.map((post, index) => (
                                    <Post key={post.id} post={post}/>
                                ))}
                            </div>
                            {!isLoading && hasMorePosts && (
                                <div id="end-of-posts" style={{marginTop: '20px'}}></div>
                            )}
                        </div>
                        {isLoading && <div>Loading more posts...</div>}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Stories;
