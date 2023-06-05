import {useEffect, useState} from 'react';
import Post from '../components/post';
import {fetchPosts} from '../components/utils';

function Stories() {
    const [posts, setPosts] = useState([]);

    useEffect(() => {
        const fetchAndSetPosts = async () => {
            const fetchedPosts = await fetchPosts();
            setPosts(fetchedPosts);
        };

        fetchAndSetPosts();
    }, []);

    return (
        <div className="post-grid">
            {posts.map((post) => (
                <Post key={post.id} post={post}/>
            ))}
        </div>
    );
}

export default Stories;
