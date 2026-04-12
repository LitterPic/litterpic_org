# Collage Prefix Quick Reference

## 🏷️ The Prefix

All auto-generated collage images are named with this prefix:

```
AUTO_COLLAGE_
```

### Example Filenames

| Type | Filename |
|------|----------|
| **System-Generated Collage** | `AUTO_COLLAGE_collage_1712957400000.png` |
| **User-Uploaded Photo** | `vacation_photo.jpg` |
| **System-Generated Collage** | `AUTO_COLLAGE_collage_1712957401000.png` |
| **User-Uploaded Photo** | `IMG_1234.jpeg` |

## 🔍 How to Use the Prefix

### Check if a file is a collage
```javascript
import { COLLAGE_PREFIX } from '../utils/collageGenerator';

const isCollage = filename.startsWith(COLLAGE_PREFIX);
// true for 'AUTO_COLLAGE_...'
// false for 'user_photo.jpg'
```

### Export the constant for use in other files
```javascript
export { COLLAGE_PREFIX } from '../utils/collageGenerator';
```

### Filter collages from a list
```javascript
const collages = files.filter(f => f.startsWith(COLLAGE_PREFIX));
```

## 🛠️ Common Use Cases

### 1. Delete All Collages
```javascript
const filesToDelete = files.filter(f => f.startsWith(COLLAGE_PREFIX));
for (const file of filesToDelete) {
    await deleteFromStorage(file);
}
```

### 2. Find Posts with Collages
```javascript
const postsWithCollages = posts.filter(post =>
    post.postPhotos?.[0]?.includes(COLLAGE_PREFIX)
);
```

### 3. Count Collages vs User Photos
```javascript
const stats = {
    collages: files.filter(f => f.startsWith(COLLAGE_PREFIX)).length,
    userPhotos: files.filter(f => !f.startsWith(COLLAGE_PREFIX)).length
};
```

### 4. Regenerate Collages
```javascript
// Find all existing collages
const existingCollages = files.filter(f => f.startsWith(COLLAGE_PREFIX));

// For each post with a collage:
// 1. Delete the old collage
// 2. Regenerate with new settings
// 3. Upload the new collage
```

### 5. Firestore Query
```javascript
// Find posts where first photo filename contains the prefix
const query = query(
    collection(db, 'userPosts'),
    where('postPhotos[0]', 'array-contains', COLLAGE_PREFIX)
);
```

## 📊 File Location in Storage

Collages are stored in the same location as user photos:

```
userPosts/
  ├── MMDDYYYY/
  │   └── userId/
  │       ├── AUTO_COLLAGE_collage_1234567890.png  ← System generated
  │       ├── photo_1.webp                          ← User uploaded
  │       ├── AUTO_COLLAGE_collage_1234567891.png  ← System generated
  │       └── photo_2.webp                          ← User uploaded
```

## 🔐 Database Structure

In Firestore, collages appear in the `postPhotos` array:

```javascript
{
    postId: "abc123",
    postPhotos: [
        "https://.../.../AUTO_COLLAGE_collage_1712957400.png",  // [0] = Collage
        "https://.../.../photo_1.webp",                         // [1] = Original
        "https://.../.../photo_2.webp",                         // [2] = Original
        "https://.../.../photo_3.webp"                          // [3] = Original
    ]
}
```

## 🚀 Implementation Details

### In `collageGenerator.js`:
```javascript
export const COLLAGE_PREFIX = 'AUTO_COLLAGE_';

export const blobToFile = (blob, fileName = 'collage.png') => {
    const prefixedFileName = fileName.startsWith(COLLAGE_PREFIX) 
        ? fileName 
        : `${COLLAGE_PREFIX}${fileName}`;
    return new File([blob], prefixedFileName, { type: blob.type });
};
```

### In `createpost.js`:
```javascript
const collageFile = blobToFile(collageBlob, `collage_${Date.now()}.png`);
// Results in: AUTO_COLLAGE_collage_1712957400000.png
```

## 💡 Why This Matters

- **Batch Operations**: Safely delete/regenerate only collages, never user photos
- **Data Auditing**: Track which photos are system-generated
- **Future-Proof**: Easy to identify collages even years later
- **Flexible Processing**: Run custom functions on just collages
- **Mistake Prevention**: Clear visual distinction in file systems/logs

## 📖 For More Info

See `COLLAGE_PREFIX_USAGE.js` for 8 detailed code examples including:
1. Filtering collages
2. Firestore queries
3. Batch deletion
4. Statistics and reporting
5. Validation functions
6. Regeneration workflows

