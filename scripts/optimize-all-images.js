const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Source directory with original images
const sourceDir = path.join(__dirname, '../public/images');
// Target directory for optimized images
const targetDir = path.join(__dirname, '../public/images/optimized');

// Create optimized directory if it doesn't exist
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Get all image files from the source directory
const getImageFiles = (dir) => {
  const files = fs.readdirSync(dir);
  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
  });
};

// Process each image
async function optimizeImages() {
  const imageFiles = getImageFiles(sourceDir);
  console.log(`Found ${imageFiles.length} images to optimize`);
  
  for (const imageName of imageFiles) {
    const inputPath = path.join(sourceDir, imageName);
    const outputPath = path.join(targetDir, imageName.replace(/\.(jpg|jpeg|png|gif)$/i, '.webp'));
    
    // Skip if the file is a directory
    if (fs.statSync(inputPath).isDirectory()) continue;
    
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
