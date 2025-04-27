import React, { useState, useEffect } from 'react';
import { fetchPosts } from '../components/utils';
import Link from 'next/link';
import { getAuth } from 'firebase/auth';
import { useRouter } from 'next/router';
import Head from "next/head";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ModernPost from '../components/ModernPost';

function ModernStories() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [page, setPage] = useState(1);
  const [user, setUser] = useState(null);
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [postsVersion, setPostsVersion] = useState(0);

  // Listen for auth state changes
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  // Fetch posts on initial load
  useEffect(() => {
    const loadInitialPosts = async () => {
      try {
        setIsLoading(true);
        const { posts, hasMore } = await fetchPosts(1, null, postsVersion);
        setPosts(posts);
        setHasMorePosts(hasMore);
      } catch (error) {
        console.error('Error fetching posts:', error);
        toast.error('Failed to load stories. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialPosts();
  }, [postsVersion]);

  // Function to fetch more posts
  const fetchMorePosts = async () => {
    if (isLoading || !hasMorePosts) return;

    try {
      setIsLoading(true);
      const { posts: newPosts, hasMore } = await fetchPosts(page + 1, selectedUser, postsVersion);
      setPosts(prevPosts => [...prevPosts, ...newPosts]);
      setPage(prevPage => prevPage + 1);
      setHasMorePosts(hasMore);
    } catch (error) {
      console.error('Error fetching more posts:', error);
      toast.error('Failed to load more stories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter posts by user
  const handleShowMyPosts = () => {
    if (!user) {
      toast.info('Please sign in to view your posts');
      return;
    }

    setShowMyPosts(true);
    setSelectedUser(user.uid);
    setPosts([]);
    setPage(1);
    setHasMorePosts(true);
    
    // This will trigger the useEffect to fetch posts
    setPostsVersion(prev => prev + 1);
  };

  // Show all posts
  const handleShowAllPosts = () => {
    setShowMyPosts(false);
    setSelectedUser('');
    setPosts([]);
    setPage(1);
    setHasMorePosts(true);
    
    // This will trigger the useEffect to fetch posts
    setPostsVersion(prev => prev + 1);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter posts by search term
  const filteredPosts = posts.filter(post => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in description
    if (post.description && post.description.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in location
    if (post.location && post.location.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    // Search in username (if available)
    if (post.user && post.user.displayName && 
        post.user.displayName.toLowerCase().includes(searchLower)) {
      return true;
    }
    
    return false;
  });

  // Render loading skeletons
  const renderSkeletons = () => {
    return Array(3).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="modern-post-skeleton">
        <div className="skeleton-header">
          <div className="skeleton-avatar"></div>
          <div className="skeleton-info">
            <div className="skeleton-line"></div>
            <div className="skeleton-line"></div>
          </div>
        </div>
        <div className="skeleton-image"></div>
        <div className="skeleton-content">
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
          <div className="skeleton-line"></div>
        </div>
      </div>
    ));
  };

  return (
    <div>
      <Head>
        <title>LitterPic Inspiring Stories</title>
        <meta 
          name="description"
          content="Join LitterPic in making the world cleaner and safer. Explore inspiring litter collection photos and stories."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://litterpic.org/stories" />

        <meta property="og:title" content="LitterPic - Inspiring Stories" />
        <meta 
          property="og:description"
          content="Join LitterPic in making the world cleaner and safer. Explore inspiring litter collection photos and stories."
        />
        <meta property="og:image" content="https://litterpic.org/images/litter_pic_logo.png" />
        <meta property="og:url" content="https://litterpic.org/stories" />
        <meta property="og:type" content="website" />
      </Head>

      <ToastContainer position="bottom-center" autoClose={3000} />

      <div className="modern-stories-container">
        <div className="modern-stories-header">
          <h1>User Stories</h1>
          <Link href="/createpost">
            <button className="modern-create-post-button">
              <i className="material-icons">add_photo_alternate</i>
              Post Your Story
            </button>
          </Link>
        </div>

        <div className="modern-stories-intro">
          <p>
            Discover the heartwarming and inspiring stories shared by our dedicated volunteers. 
            Each post is a testament to the incredible impact they have made in cleaning our planet, 
            one piece of litter at a time. These stories aren't just about cleaning up; they're about 
            hope, community, and the power of collective action.
          </p>
        </div>

        <div className="modern-stories-filters">
          <div className="modern-search-input">
            <i className="material-icons">search</i>
            <input 
              type="text" 
              placeholder="Search stories..." 
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          
          <button 
            className={`modern-filter-button ${!showMyPosts ? 'active' : ''}`}
            onClick={handleShowAllPosts}
          >
            <i className="material-icons">public</i>
            All Stories
          </button>
          
          <button 
            className={`modern-filter-button ${showMyPosts ? 'active' : ''}`}
            onClick={handleShowMyPosts}
          >
            <i className="material-icons">person</i>
            My Stories
          </button>
        </div>

        <div className="modern-posts-grid">
          {isLoading && posts.length === 0 ? (
            renderSkeletons()
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map(post => (
              <ModernPost 
                key={post.id} 
                post={post} 
                currentUser={user}
              />
            ))
          ) : (
            <div className="no-posts-message">
              <p>No stories found. {showMyPosts ? 'Share your first story!' : 'Try a different search.'}</p>
              {showMyPosts && (
                <Link href="/createpost">
                  <button className="modern-create-post-button">
                    <i className="material-icons">add_photo_alternate</i>
                    Create Post
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>

        <div className="modern-load-more">
          {hasMorePosts && filteredPosts.length > 0 && (
            <button 
              onClick={fetchMorePosts}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : 'Load More Stories'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ModernStories;
