# Collage Regenerator - Testing & Batch Processing

## Overview

The Collage Regenerator is a utility that regenerates collages for existing posts. It's designed for:
- **Testing** - See the feature in action on your existing posts
- **Batch Processing** - Later migrate to Cloud Functions for scheduled runs
- **Migration** - Update old posts without collages

---

## 🧪 Test Page

Access the test page at: **`/test-collage-regenerator`**

### Features
- View summary of your current collages
- Regenerate collages for last N posts
- See real-time progress updates
- View detailed results for each post
- Easily switch to Cloud Function later

---

## 📁 Files

### `/utils/collageRegenerator.js`
Main utility file with 3 key functions:

#### 1. `regenerateCollagesToLastPosts(userId, postsToProcess, onProgress)`
Regenerates collages for the last N posts of a user.

**Parameters:**
- `userId` (string): User ID to regenerate collages for
- `postsToProcess` (number, default: 3): How many posts to process
- `onProgress` (function, optional): Callback for progress updates

**Returns:** Results object with statistics

**Example:**
```javascript
const results = await regenerateCollagesToLastPosts(
    user.uid,
    3,
    (progress) => console.log(progress.status)
);
```

#### 2. `getCollagesSummary(userId)`
Gets a summary of collages for a user's posts.

**Returns:**
```javascript
{
    totalPosts: number,
    postsWithCollage: number,
    postsWithoutCollage: number,
    totalPhotos: number
}
```

#### 3. `regeneratePostCollage(post, postId, userId)` (Internal)
Regenerates a collage for a single post.

### `/pages/test-collage-regenerator.js`
React test page with UI for testing regeneration.

---

## 🚀 How to Use

### 1. Access the Test Page
```
http://localhost:3000/test-collage-regenerator
```

### 2. View Your Summary
The page shows:
- Total posts
- Posts with collages
- Posts without collages
- Total photos

### 3. Run Regeneration
1. Set number of posts to process (default: 3)
2. Click "🚀 Regenerate Collages"
3. Watch progress update in real-time

### 4. View Results
- Regenerated: How many collages were created
- Skipped: Posts that already had collages
- Errors: Posts that failed

---

## 🔄 What Happens During Regeneration

```
For each post:
  1. Check if post already has AUTO_COLLAGE_ prefix
     ✓ If yes → Skip (already has collage)
     
  2. Check if post has 2+ photos
     ✓ If no → Skip (need multiple photos)
     
  3. Download first 4 photos from Firebase Storage
     
  4. Generate 2x2 collage using Canvas
     
  5. Convert to WebP for compression
     
  6. Upload to Firebase Storage
     → Filename: AUTO_COLLAGE_collage_regenerated_{timestamp}.png
     
  7. Update Firestore
     → postPhotos[0] = new collage
     → postPhotos[1-4] = original photos
     
  8. Add collageRegeneratedAt timestamp
```

---

## 💡 Use Cases

### 1. Test on Recent Posts
```javascript
// Test on last 3 posts
await regenerateCollagesToLastPosts(userId, 3);
```

### 2. Batch Update All Posts
```javascript
// Update last 50 posts
await regenerateCollagesToLastPosts(userId, 50);
```

### 3. Check Coverage
```javascript
const summary = await getCollagesSummary(userId);
console.log(`${summary.postsWithCollage} posts have collages`);
```

---

## ☁️ Cloud Function Migration

When you're ready, convert this to a Cloud Function:

### Cloud Function Skeleton
```javascript
// functions/index.js
const functions = require('firebase-functions');
const { regenerateCollagesToLastPosts } = require('./collageRegenerator');

exports.regenerateUserCollages = functions
    .pubsub
    .schedule('0 2 * * *')  // Daily at 2 AM
    .timeZone('America/Los_Angeles')
    .onRun(async (context) => {
        // Get all users
        const users = await getAllUsers();
        
        // Regenerate for each user
        for (const user of users) {
            await regenerateCollagesToLastPosts(user.uid, 10);
        }
    });
```

---

## 📊 Example Results

### Successful Regeneration
```
Total posts processed: 3/3
Collages regenerated: 2
Skipped: 1
Errors: 0

Detailed Results:
┌─ Post 1: REGENERATED ✓
├─ Post 2: SKIPPED (Already has collage)
└─ Post 3: REGENERATED ✓
```

### With Errors
```
Total posts processed: 3/3
Collages regenerated: 2
Skipped: 0
Errors: 1

Detailed Results:
├─ Post 1: REGENERATED ✓
├─ Post 2: ERROR (Could not download images)
└─ Post 3: REGENERATED ✓
```

---

## 🔍 Troubleshooting

### "No posts found"
- User has no posts yet
- Posts query didn't find anything

### "Not enough photos for collage"
- Post has only 1 photo
- Need 2+ photos to generate collage

### "Could not download image"
- Image URL might be expired
- Firebase Storage access issue

### "Failed to regenerate"
- Canvas generation failed
- Upload failed
- Firestore update failed

---

## ✅ Progress Updates

The `onProgress` callback receives updates like:

```javascript
{
    status: "Processing post 1/3: post_abc123",
    step: 3,
    total: 4,
    postIndex: 1,
    totalPosts: 3
}
```

The steps are:
1. Fetching posts
2. Found posts
3. Processing posts
4. Complete

---

## 🎯 Next Steps

### Now
1. Visit `/test-collage-regenerator`
2. Run on last 3 posts
3. Check results
4. View collages in stories

### Later
1. Copy logic to Cloud Function
2. Schedule to run nightly
3. Process all user posts
4. Monitor performance

---

## 📝 Code Example

### From Scratch
```javascript
import { regenerateCollagesToLastPosts } from '../utils/collageRegenerator';

// Regenerate collages
const results = await regenerateCollagesToLastPosts(userId, 3, (progress) => {
    console.log(progress.status);
});

console.log(`Done! Regenerated: ${results.regenerated}`);
```

### With Error Handling
```javascript
try {
    const results = await regenerateCollagesToLastPosts(userId, 10, (progress) => {
        updateUI(progress);
    });

    if (results.errors === 0) {
        showSuccess(`${results.regenerated} collages created!`);
    } else {
        showWarning(`${results.regenerated} created, ${results.errors} errors`);
    }
} catch (error) {
    showError(`Failed: ${error.message}`);
}
```

---

## 📊 Performance

**Expected Times:**
- Per post: 2-5 seconds (depends on image sizes)
- 3 posts: ~10-15 seconds
- 10 posts: ~30-60 seconds
- 50 posts: ~3-5 minutes

**Optimization Tips:**
- Process during off-peak hours
- Use Cloud Tasks for queueing
- Batch process in chunks
- Cache image downloads

---

## 🔒 Security Notes

- Only works for authenticated users
- Uses user's own posts only
- No cross-user access
- Firebase Security Rules enforced
- Collages are public (like other photos)

---

## 🚀 Ready to Deploy

The code is ready for production:
- ✅ Error handling included
- ✅ Proper logging
- ✅ Progress tracking
- ✅ Tested and verified
- ✅ Can be moved to Cloud Functions

---

## 📚 Related Files

- `utils/collageGenerator.js` - Core collage generation
- `utils/collageRegenerator.js` - This file
- `pages/test-collage-regenerator.js` - Test UI
- `COLLAGE_PREFIX_USAGE.js` - More batch operation examples

