import React from 'react';
import Head from 'next/head';
import TailwindCarousel from '../components/TailwindCarousel';

export default function TailwindTest() {
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
        <title>Tailwind Carousel Test</title>
      </Head>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-litterpic-green mb-6">Tailwind Carousel Test</h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Modern Image Carousel</h2>
          <div className="max-w-3xl mx-auto">
            <TailwindCarousel images={images} />
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <ul className="list-disc pl-5 space-y-2">
            <li>Swipe gestures for navigation</li>
            <li>Dot indicators with current position</li>
            <li>Temporary swipe hint for new users</li>
            <li>Smooth transitions between images</li>
            <li>Fully responsive design</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
