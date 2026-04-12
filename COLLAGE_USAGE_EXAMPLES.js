it/**
 * Example usage of the collage generator
 * These examples show how to use the collage generation feature
 */

// ============================================================================
// Example 1: Generate a collage from selected files
// ============================================================================

import { generateCollage, blobToFile } from '../utils/collageGenerator';

async function handleFileSelection(files) {
  try {
    // Generate collage (returns null if only 1 image)
    const collageBlob = await generateCollage(files);

    if (collageBlob) {
      // Convert blob to file for uploading
      const collageFile = blobToFile(collageBlob, 'collage.png');
      console.log('Collage generated:', collageFile);
      // Now you can upload this file to Firebase Storage
    } else {
      console.log('Only 1 image - no collage needed');
    }
  } catch (error) {
    console.error('Error generating collage:', error);
  }
}

// ============================================================================
// Example 2: Custom collage size
// ============================================================================

async function generateCustomSizeCollage(files) {
  try {
    const collageBlob = await generateCollage(files, {
      collageWidth: 1000,
      collageHeight: 1000
    });

    if (collageBlob) {
      console.log('Custom collage size created:', collageBlob.size, 'bytes');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// ============================================================================
// Example 3: Full upload flow with collage (as implemented in createpost.js)
// ============================================================================

async function uploadPostWithCollage(postImages, postDocRef) {
  // Generate collage if 2+ images
  let collageFile = null;
  if (postImages.length >= 2) {
    try {
      console.log(`Generating collage for post with ${postImages.length} images`);
      const collageBlob = await generateCollage(postImages);
      if (collageBlob) {
        collageFile = blobToFile(collageBlob, `collage_${Date.now()}.png`);
        console.log('Collage generated successfully');
      }
    } catch (error) {
      console.error('Failed to generate collage:', error);
      // Continue with normal upload even if collage fails
    }
  }

  // Prepare upload queue with collage first
  const imagesToUpload = collageFile ? [collageFile, ...postImages] : postImages;

  // Upload all images (collage as first photo)
  for (const file of imagesToUpload) {
    await uploadImageToFirebase(file, postDocRef);
  }
}

// ============================================================================
// Example 4: Display collage preview before upload
// ============================================================================

async function previewCollage(event) {
  const files = event.target.files;

  try {
    const collageBlob = await generateCollage(files);

    if (collageBlob) {
      // Display collage preview
      const collageUrl = URL.createObjectURL(collageBlob);
      const preview = document.getElementById('collage-preview');
      preview.src = collageUrl;
      preview.style.display = 'block';

      // Remember to clean up the object URL when done
      // URL.revokeObjectURL(collageUrl);
    }
  } catch (error) {
    console.error('Error previewing collage:', error);
  }
}

// ============================================================================
// Example 5: Error handling patterns
// ============================================================================

async function robustCollageGeneration(files) {
  if (!files || files.length === 0) {
    console.warn('No files provided');
    return null;
  }

  if (files.length === 1) {
    console.log('Single image - skipping collage');
    return null;
  }

  try {
    const collageBlob = await generateCollage(files, {
      collageWidth: 800,
      collageHeight: 800
    });

    if (!collageBlob) {
      console.warn('Collage generation returned null');
      return null;
    }

    // Validate blob
    if (collageBlob.size === 0) {
      throw new Error('Generated collage is empty');
    }

    console.log(`Collage created: ${collageBlob.size} bytes, ${collageBlob.type}`);
    return collageBlob;

  } catch (error) {
    console.error('Collage generation failed:', error.message);

    // Log detailed error info for debugging
    console.error('Full error:', error);

    // Return null to signal failure (upload will continue without collage)
    return null;
  }
}

// ============================================================================
// Example 6: React Component Integration
// ============================================================================

import React, { useState } from 'react';

function PostUploadWithCollage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [collagePreview, setCollagePreview] = useState(null);
  const [isGeneratingCollage, setIsGeneratingCollage] = useState(false);

  const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(files);

    // Generate and preview collage if multiple images
    if (files.length >= 2) {
      setIsGeneratingCollage(true);
      try {
        const collageBlob = await generateCollage(files);
        if (collageBlob) {
          const url = URL.createObjectURL(collageBlob);
          setCollagePreview(url);
        }
      } catch (error) {
        console.error('Error generating collage preview:', error);
      } finally {
        setIsGeneratingCollage(false);
      }
    }
  };

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={handleFileSelect}
        accept="image/*"
      />

      {isGeneratingCollage && <p>Generating preview...</p>}

      {collagePreview && (
        <div>
          <h3>Collage Preview:</h3>
          <img src={collagePreview} alt="Collage preview" style={{ maxWidth: '400px' }} />
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div>
          <h3>Selected Images:</h3>
          <ul>
            {selectedFiles.map((file, i) => (
              <li key={i}>{file.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default PostUploadWithCollage;

// ============================================================================
// Export all examples for reference
// ============================================================================

export {
  handleFileSelection,
  generateCustomSizeCollage,
  uploadPostWithCollage,
  previewCollage,
  robustCollageGeneration,
  PostUploadWithCollage
};

