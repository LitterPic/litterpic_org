const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Images to optimize
const imagesToOptimize = [
  'plastic-garbage-near-metallic-bin-park.jpg',
  'young-activist-taking-action.jpg',
  'lucas-van-oort-mhtPKJrG_EU-unsplash.jpg',
  'closeup-plastic-bottle-male-hand-cleaning-up-nature.jpg'
];

// Create optimized directory if it doesn't exist
const optimizedDir = path.join(__dirname, '../public/images/optimized');
if (!fs.existsSync(optimizedDir)) {
  fs.mkdirSync(optimizedDir, { recursive: true });
}

// Process each image
async function optimizeImages() {
  for (const imageName of imagesToOptimize) {
    const inputPath = path.join(__dirname, '../public/images', imageName);
    const outputPath = path.join(optimizedDir, imageName.replace('.jpg', '.webp'));
    
    console.log(`Optimizing ${imageName}...`);
    
    try {
      await sharp(inputPath)
        .resize(500) // Resize to 500px width (maintaining aspect ratio)
        .webp({ quality: 80 }) // Convert to WebP with 80% quality
        .toFile(outputPath);
      
      console.log(`Successfully created ${outputPath}`);
    } catch (error) {
      console.error(`Error processing ${imageName}:`, error);
    }
  }
}

optimizeImages().then(() => {
  console.log('Image optimization complete!');
}).catch(err => {
  console.error('Error during optimization:', err);
});
