import React from 'react';

/**
 * Skeleton loading component for posts
 * @returns {JSX.Element} - Skeleton UI for a post
 */
const PostSkeleton = () => {
  return (
    <div className="post-skeleton">
      <div className="post-skeleton-header">
        <div className="post-skeleton-avatar"></div>
        <div className="post-skeleton-user-info">
          <div className="post-skeleton-username"></div>
          <div className="post-skeleton-meta"></div>
        </div>
      </div>
      
      <div className="post-skeleton-image"></div>
      
      <div className="post-skeleton-actions">
        <div className="post-skeleton-action"></div>
        <div className="post-skeleton-action"></div>
        <div className="post-skeleton-action"></div>
      </div>
      
      <div className="post-skeleton-content">
        <div className="post-skeleton-line"></div>
        <div className="post-skeleton-line"></div>
        <div className="post-skeleton-line short"></div>
      </div>
    </div>
  );
};

export default PostSkeleton;
