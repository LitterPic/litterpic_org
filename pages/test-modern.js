import React from 'react';
import Head from 'next/head';
import ModernCarousel from '../components/ModernCarousel';

export default function TestModern() {
  // Sample images for testing
  const images = [
    '/images/plastic-garbage-near-metallic-bin-park.jpg',
    '/images/young-activist-taking-action.jpg',
    '/images/lucas-van-oort-mhtPKJrG_EU-unsplash.jpg',
    '/images/closeup-plastic-bottle-male-hand-cleaning-up-nature.jpg'
  ];

  return (
    <div>
      <Head>
        <title>Modern UI Test</title>
      </Head>
      
      <div className="page">
        <div className="content">
          <h1 className="heading-text">Modern UI Test</h1>
          
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h2>Modern Carousel Test</h2>
            <div style={{ marginBottom: '40px' }}>
              <ModernCarousel images={images} />
            </div>
            
            <div className="modern-post" style={{ marginBottom: '40px' }}>
              <div className="modern-post-header">
                <div className="modern-post-user">
                  <div className="modern-post-avatar">
                    <img src="/images/Alek.webp" alt="User" />
                  </div>
                  <div className="modern-post-user-info">
                    <h3 className="modern-post-username">Test User</h3>
                    <div className="modern-post-meta">
                      <span className="modern-post-location">
                        <i className="material-icons">place</i>
                        <span>Test Location</span>
                      </span>
                      <span className="modern-post-time">2 hours ago</span>
                    </div>
                  </div>
                </div>
                <button className="modern-follow-button">Follow</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
