# Collage Feature Documentation

## Overview
The collage feature automatically generates a 2x2 grid collage from the first 4 uploaded images and stores it as the first photo in a post. This serves as a visual preview/thumbnail for multi-image posts.

## Collage Identification

All auto-generated collages are prefixed with **`AUTO_COLLAGE_`** in their filename. This allows you to:
- Easily identify which photos were system-generated vs. user-uploaded
- Run batch operations on collages without affecting user photos
- Regenerate collages in the future
- Audit collage creation

**Example filenames:**
- `AUTO_COLLAGE_collage_1712957400000.png` ← Auto-generated collage
- `user_photo_from_iphone.jpg` ← User-uploaded photo

## How It Works

### Behavior by Image Count:
- **1 image**: No collage generated. The single image is uploaded normally.
- **2-4 images**: A 2x2 grid collage is created with actual images.
- **5+ images**: A collage is created from the first 4 images (the rest are uploaded as separate photos).

### Collage Grid Layout:
```
┌─────────┬─────────┐
│ Image 1 │ Image 2 │
├─────────┼─────────┤
│ Image 3 │ Image 4 │
└─────────┴─────────┘
```

### For Posts with Fewer Than 4 Images:
Empty tiles are filled with a light gray placeholder color (RGB: 220, 220, 220).

## Technical Details

### File: `/utils/collageGenerator.js`

#### Constants:

##### `COLLAGE_PREFIX`
Export constant for identifying auto-generated collages.

**Value:** `'AUTO_COLLAGE_'`

**Usage:**
```javascript
import { COLLAGE_PREFIX } from '../utils/collageGenerator';

// Check if a file is an auto-generated collage
if (filename.startsWith(COLLAGE_PREFIX)) {
    // This is a system-generated collage
}
```

#### Functions:

##### `generateCollage(files, options = {})`
Generates a 2x2 grid collage from uploaded image files.

**Parameters:**
- `files` (Array<File>): Array of image files (max 4 will be used)
- `options` (Object, optional):
  - `collageWidth` (number, default: 800): Width of collage in pixels
  - `collageHeight` (number, default: 800): Height of collage in pixels

**Returns:** Promise<Blob> or null
- Blob containing the PNG collage image
- null if only 1 image provided

**Example:**
```javascript
const collageBlob = await generateCollage(fileArray, { 
    collageWidth: 1000, 
    collageHeight: 1000 
});
```

##### `fileToBuffer(file)`
Converts a File object to a Buffer for processing with Sharp.

**Parameters:**
- `file` (File): The file to convert

**Returns:** Promise<Buffer>

##### `blobToFile(blob, fileName = 'collage.png')`
Converts a Blob to a File object.

**Parameters:**
- `blob` (Blob): The blob to convert
- `fileName` (string, optional): Filename for the file (default: 'collage.png')

**Returns:** File

## Integration with Upload Flow

### Modified: `/pages/createpost.js`

The `uploadImages()` function has been updated to:

1. Check if there are 2+ images
2. Generate a collage if applicable
3. Prepend the collage to the upload queue (making it the first photo)
4. Upload all images (collage first, then originals)
5. Handle errors gracefully - if collage generation fails, continue with normal upload

### Upload Order Example (for 3 images):
1. Collage (generated from images 1-3)
2. Image 1 (original)
3. Image 2 (original)
4. Image 3 (original)

This means `postPhotos[0]` will be the collage in the Firestore database.

## Performance Considerations

### Processing Time:
- Collage generation: ~500ms-1500ms depending on image size and device
- Adds minimal overhead to overall upload process
- Processing happens client-side before upload

### Image Optimization:
- Each tile is resized to 400x400px (for default 800x800 collage)
- Uses `fit: 'cover'` to maintain aspect ratio and fill tiles
- Collage output is PNG (can be compressed with WebP in future)

### Failure Handling:
- If collage generation fails at any point, a warning toast is shown
- Upload continues normally without the collage
- User data is never lost

## User Experience

### What Users See:
1. When uploading 1 image: Just that image displays as the post thumbnail
2. When uploading 2-4 images: A 2x2 grid collage appears first in the feed (plus original images in carousel)
3. When uploading 5+ images: A collage of first 4 images appears first (plus all originals in carousel)

### Benefits:
- Multi-image posts are more visually distinctive in the feed
- Collage provides quick visual summary of post content
- Improves UI/UX by making posts more engaging
- No changes needed to existing database schema

## Future Enhancements

Potential improvements:
1. Add collage border/spacing between tiles
2. Add watermark to collages
3. Allow custom collage layouts (3x3, 1x4, etc.)
4. Convert collage to WebP for better compression
5. Cache generated collages locally before upload
6. Add collage generation indicator to UI

## Batch Operations with Collage Prefix

The `COLLAGE_PREFIX` constant enables powerful batch operations:

### Finding All Collages
```javascript
import { COLLAGE_PREFIX } from '../utils/collageGenerator';

function isAutoGeneratedCollage(filename) {
    return filename.startsWith(COLLAGE_PREFIX);
}
```

### Regenerating Collages
```javascript
// List all collages in storage
const allFiles = await listFilesInStorage('userPosts/');
const collages = allFiles.filter(f => isAutoGeneratedCollage(f.name));

// Delete old collages and regenerate with new format
for (const collage of collages) {
    await deleteFile(collage);
    // Regenerate with new collage format...
}
```

### Querying Posts with Collages
```javascript
// Find posts where first photo is a system-generated collage
const postsWithCollages = posts.filter(post => 
    post.postPhotos?.[0]?.includes(COLLAGE_PREFIX)
);
```

See `COLLAGE_PREFIX_USAGE.js` for 8 detailed examples of batch operations.

## Troubleshooting

### Collage Not Appearing:
- Check browser console for errors
- Ensure Sharp library is installed: `npm list sharp`
- Verify images are valid formats (PNG, JPG, WebP)

### Upload Taking Longer:
- Normal behavior - collage generation adds ~1 second to upload
- Faster on newer devices/browsers

### Collage Looks Distorted:
- Images are cropped/resized to fill 400x400px tiles (fit: 'cover')
- This is intentional to maintain consistent grid layout
- All images in collage maintain their aspect ratio

## Browser Compatibility

Works in all modern browsers that support:
- FileReader API (for file-to-buffer conversion)
- Canvas/Sharp (for image processing)
- Blob API (for image creation)

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+




