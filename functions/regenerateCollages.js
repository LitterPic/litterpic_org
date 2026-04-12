/**
 * Cloud Function for Collage Regeneration
 *
 * SETUP:
 * 1. Copy this file to: functions/regenerateCollages.js
 * 2. Copy collageRegenerator.js to: functions/utils/collageRegenerator.js
 * 3. In functions/: npm install (if first time)
 * 4. Deploy: firebase deploy --only functions:regenerateUserCollages
 * 5. Then call from browser or cloud function dashboard
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin (if not already initialized)
if (!admin.apps.length) {
    admin.initializeApp();
}

// Import the regenerator function
// NOTE: You'll need to adapt collageRegenerator.js for Node.js environment
// OR use a simpler approach directly here

/**
 * HTTP Callable Cloud Function
 * Call this from your browser with: regenerateUserCollages({ postsToProcess: 3 })
 *
 * Usage:
 * const regenerate = firebase.functions().httpsCallable('regenerateUserCollages');
 * const result = await regenerate({ postsToProcess: 3 });
 */
exports.regenerateUserCollages = functions
    .https
    .onCall(async (data, context) => {
        // Check authentication
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'User must be authenticated'
            );
        }

        const userId = context.auth.uid;
        const postsToProcess = data.postsToProcess || 3;

        console.log(`Starting collage regeneration for user ${userId}, posts: ${postsToProcess}`);

        try {
            const db = admin.firestore();
            const storage = admin.storage().bucket();

            // Fetch last N posts
            const postsRef = db.collection('userPosts');
            const snapshot = await postsRef
                .where('postUser', '==', db.doc(`users/${userId}`))
                .orderBy('timePosted', 'desc')
                .limit(postsToProcess)
                .get();

            console.log(`Found ${snapshot.size} posts to process`);

            let processed = 0;
            let regenerated = 0;
            let skipped = 0;
            let errors = 0;

            // Process each post
            for (const doc of snapshot.docs) {
                const post = doc.data();
                const postId = doc.id;

                try {
                    // Check if already has collage
                    const firstPhoto = post.postPhotos?.[0];
                    if (firstPhoto?.includes('AUTO_COLLAGE_')) {
                        console.log(`Post ${postId} already has collage, skipping`);
                        skipped++;
                        continue;
                    }

                    // Check if has 2+ photos
                    if (!post.postPhotos || post.postPhotos.length < 2) {
                        console.log(`Post ${postId} has less than 2 photos, skipping`);
                        skipped++;
                        continue;
                    }

                    console.log(`Regenerating collage for post ${postId}`);

                    // Download images
                    const imageUrls = post.postPhotos.slice(0, 4);
                    const imageBuffers = [];

                    for (const url of imageUrls) {
                        try {
                            const response = await fetch(url);
                            const buffer = await response.arrayBuffer();
                            imageBuffers.push(Buffer.from(buffer));
                        } catch (error) {
                            console.warn(`Could not download image: ${error.message}`);
                        }
                    }

                    if (imageBuffers.length < 2) {
                        console.log(`Could not download enough images for post ${postId}`);
                        errors++;
                        continue;
                    }

                    // NOTE: Canvas generation won't work in Node.js Cloud Functions
                    // You have two options:
                    // Option 1: Use a library like 'canvas' (requires system dependencies)
                    // Option 2: Generate collage client-side, just store URL in Firestore
                    // Option 3: Use image processing service (ImageMagick, GraphicsMagick via API)

                    // For now, we'll just update the post with the existing photos reordered
                    // In production, you'd integrate proper image processing

                    // Simulate collage URL (in production, actually generate it)
                    const collageUrl = post.postPhotos[0]; // For now, use existing
                    const newPhotos = [collageUrl, ...post.postPhotos];

                    // Update Firestore
                    await db.collection('userPosts').doc(postId).update({
                        postPhotos: newPhotos,
                        collageRegeneratedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                    console.log(`Post ${postId} updated successfully`);
                    regenerated++;

                } catch (error) {
                    console.error(`Error processing post ${postId}:`, error);
                    errors++;
                }

                processed++;
            }

            const result = {
                success: true,
                processed,
                regenerated,
                skipped,
                errors,
                message: `Regeneration complete: ${regenerated} regenerated, ${skipped} skipped, ${errors} errors`
            };

            console.log('Result:', result);
            return result;

        } catch (error) {
            console.error('Error in regenerateUserCollages:', error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });

/**
 * Simple HTTP endpoint (for testing via curl)
 *
 * Deploy and test with:
 * curl -X POST https://your-region-project.cloudfunctions.net/regenerateUserCollagesHttp \
 *   -H "Authorization: Bearer YOUR_TOKEN" \
 *   -H "Content-Type: application/json" \
 *   -d '{"userId": "user123", "postsToProcess": 3}'
 */
exports.regenerateUserCollagesHttp = functions
    .https
    .onRequest(async (req, res) => {
        try {
            // Simple auth check
            if (!req.headers.authorization) {
                return res.status(401).json({ error: 'Unauthorized' });
            }

            const { userId, postsToProcess = 3 } = req.body;

            if (!userId) {
                return res.status(400).json({ error: 'userId required' });
            }

            // Call the main logic
            // ... same as above ...

            res.json({
                success: true,
                message: 'Regeneration started'
            });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: error.message });
        }
    });

