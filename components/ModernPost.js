import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import ModernCarousel from './ModernCarousel';
import NotificationSender from "../utils/notifictionSender";

function ModernPost({ post, currentUser }) {
  const [isFollowing, setIsFollowing] = useState(false);
  const currentUserUid = currentUser ? currentUser.uid : null;
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState('');
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [ambassadorDate, setAmbassadorDate] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const firestore = getFirestore();

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        if (post.user && post.user.uid) {
          const userDocRef = doc(firestore, 'users', post.user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setUserName(userData.displayName || 'Anonymous');
            setUserPhoto(userData.photoURL || '/images/profile-placeholder.png');
            setIsAmbassador(userData.isAmbassador || false);
            setAmbassadorDate(userData.ambassadorDate || null);
          }
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
      }
    };

    fetchUserInfo();

    // Check if the current user is following the post's user
    const checkFollowStatus = async () => {
      if (currentUserUid && post.user && post.user.uid && currentUserUid !== post.user.uid) {
        const docRef = doc(firestore, 'followers', post.user.uid, 'userFollowers', currentUserUid);
        const docSnapshot = await getDoc(docRef);
        setIsFollowing(docSnapshot.exists());
      }
    };

    checkFollowStatus();
  }, [post, currentUserUid, firestore]);

  // Format date for display
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 1) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours < 1) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return diffMinutes < 1 ? 'Just now' : `${diffMinutes}m ago`;
      }
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  };

  // Make links in text clickable
  const makeLinksClickable = (text) => {
    if (!text) return '';
    
    // URL regex pattern
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    
    return text.replace(urlPattern, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
    });
  };

  // Toggle description expansion
  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="modern-post">
      <div className="modern-post-header">
        <div className="modern-post-user">
          <Link href={`/profile/${post.user?.uid}`}>
            <div className="modern-post-avatar">
              <img src={userPhoto} alt={userName} />
              {isAmbassador && (
                <div className="ambassador-badge" title={`LitterPic Ambassador since ${new Date(ambassadorDate).toLocaleDateString()}`}>
                  <i className="material-icons">public</i>
                </div>
              )}
            </div>
          </Link>
          
          <div className="modern-post-user-info">
            <Link href={`/profile/${post.user?.uid}`}>
              <h3 className="modern-post-username">{userName}</h3>
            </Link>
            
            <div className="modern-post-meta">
              {post.location && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="modern-post-location"
                >
                  <i className="material-icons">place</i>
                  <span>{post.location}</span>
                </a>
              )}
              <span className="modern-post-time">{formatDate(post.dateCreated)}</span>
            </div>
          </div>
        </div>
        
        {currentUserUid && post.user?.uid !== currentUserUid && (
          <button
            onClick={async () => {
              if (isFollowing) {
                await NotificationSender.handleUnfollow(currentUser, post.user.uid);
                setIsFollowing(false);
              } else {
                await NotificationSender.handleFollow(currentUser, post.user.uid);
                setIsFollowing(true);
              }
            }}
            className={`modern-follow-button ${isFollowing ? 'following' : ''}`}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </button>
        )}
      </div>
      
      <div className="modern-post-carousel">
        <ModernCarousel images={post.photos || []} />
      </div>
      
      {post.litterWeight > 0 && (
        <div className="modern-post-achievement">
          <i className="material-icons">eco</i>
          <span>
            Collected <strong>{post.litterWeight}</strong> {post.litterWeight === 1 ? 'pound' : 'pounds'} of litter!
          </span>
        </div>
      )}
      
      <div className={`modern-post-description ${isExpanded ? 'expanded' : ''}`}>
        <div 
          dangerouslySetInnerHTML={{ 
            __html: post.description ? makeLinksClickable(post.description) : 'No description available' 
          }}
        />
        
        {post.description && post.description.length > 150 && (
          <button className="modern-post-expand" onClick={toggleExpand}>
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
      
      <div className="modern-post-actions">
        <button className="modern-post-action">
          <i className="material-icons">favorite_border</i>
          <span>{post.likes || 0}</span>
        </button>
        <button className="modern-post-action">
          <i className="material-icons">chat_bubble_outline</i>
          <span>{post.numComments || 0}</span>
        </button>
        <button className="modern-post-action">
          <i className="material-icons">share</i>
        </button>
      </div>
    </div>
  );
}

export default ModernPost;
