/**
 * CLOUD FUNCTION TEMPLATE
 *
 * To use this:
 * 1. Copy this file to your Cloud Functions folder
 * 2. Install dependencies: npm install
 * 3. Deploy: firebase deploy --only functions
 *
 * This template is ready to use with regenerateCollagesToLastPosts()
 */

// NOTE: This is a template file. To actually use it:
// 1. Move to your functions/ directory
// 2. Uncomment and configure as needed
// 3. Update the imports based on your setup

/*
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { regenerateCollagesToLastPosts } = require('./collageRegenerator');

admin.initializeApp();
const db = admin.firestore();

// ============================================================================
// OPTION 1: Scheduled Function (Recommended)
// Runs daily at 2 AM to regenerate collages for all active users
// ============================================================================

exports.regenerateCollagesDailyScheduled = functions
    .pubsub
    .schedule('0 2 * * *')  // Daily at 2 AM UTC
    .timeZone('UTC')
    .onRun(async (context) => {
        console.log('Starting daily collage regeneration...');

        try {
            // Get all users (you may want to filter by active users only)
            const usersSnapshot = await db.collection('users').get();

            let totalProcessed = 0;
            let totalRegenerated = 0;
            let totalErrors = 0;

            // Process each user
            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;

                try {
                    console.log(`Regenerating collages for user: ${userId}`);

                    // Regenerate last 10 posts per user
                    const results = await regenerateCollagesToLastPosts(userId, 10);

                    console.log(`  - Processed: ${results.processed}`);
                    console.log(`  - Regenerated: ${results.regenerated}`);
                    console.log(`  - Errors: ${results.errors}`);

                    totalProcessed += results.processed;
                    totalRegenerated += results.regenerated;
                    totalErrors += results.errors;

                } catch (error) {
                    console.error(`Error processing user ${userId}:`, error);
                    totalErrors++;
                }
            }

            console.log('Daily regeneration complete!');
            console.log(`  Total Processed: ${totalProcessed}`);
            console.log(`  Total Regenerated: ${totalRegenerated}`);
            console.log(`  Total Errors: ${totalErrors}`);

            return {
                success: true,
                processed: totalProcessed,
                regenerated: totalRegenerated,
                errors: totalErrors
            };

        } catch (error) {
            console.error('Error in scheduled regeneration:', error);
            throw error;
        }
    });

// ============================================================================
// OPTION 2: HTTP Callable Function
// Can be called from your app when needed
// ============================================================================

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
        const postsToProcess = data.postsToProcess || 10;

        console.log(`Regenerating collages for user ${userId} (${postsToProcess} posts)`);

        try {
            const results = await regenerateCollagesToLastPosts(userId, postsToProcess);
            return results;
        } catch (error) {
            console.error('Error regenerating collages:', error);
            throw new functions.https.HttpsError('internal', error.message);
        }
    });

// ============================================================================
// OPTION 3: Firestore Trigger
// Runs when a new post is created
// ============================================================================

exports.generateCollageOnNewPost = functions
    .firestore
    .document('userPosts/{postId}')
    .onCreate(async (snap, context) => {
        const post = snap.data();
        const postId = context.params.postId;

        console.log(`New post created: ${postId}`);

        // Check if post has 2+ photos and no collage
        if (!post.postPhotos || post.postPhotos.length < 2) {
            console.log(`  Post has less than 2 photos, skipping`);
            return;
        }

        const firstPhoto = post.postPhotos[0];
        if (firstPhoto.includes('AUTO_COLLAGE_')) {
            console.log(`  Post already has collage, skipping`);
            return;
        }

        try {
            console.log(`  Generating collage...`);

            // Get user ID from post
            const userId = post.postUser?.id || 'unknown';

            // Regenerate this specific post
            // You would need to adapt regeneratePostCollage to work here
            console.log(`  Collage generation queued for post ${postId}`);

        } catch (error) {
            console.error(`Error generating collage for post ${postId}:`, error);
        }
    });

// ============================================================================
// OPTION 4: Admin API Endpoint
// Curl command to run manually:
// curl -X POST http://localhost:5001/project/us-central1/regenerateAllCollages
// ============================================================================

exports.regenerateAllCollages = functions
    .https
    .onRequest(async (req, res) => {
        // In production, add authentication here
        console.log('Regenerating all collages...');

        try {
            const usersSnapshot = await db.collection('users').get();

            const results = [];

            for (const userDoc of usersSnapshot.docs) {
                try {
                    const userId = userDoc.id;
                    const result = await regenerateCollagesToLastPosts(userId, 50);
                    results.push({ userId, ...result });
                } catch (error) {
                    console.error(`Error for user:`, error);
                }
            }

            res.json({
                status: 'complete',
                results: results
            });

        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: error.message });
        }
    });

*/

// ============================================================================
// IMPLEMENTATION GUIDE
// ============================================================================

/*

STEP 1: Setup Cloud Functions Directory
  firebase init functions
  cd functions
  npm install firebase-admin

STEP 2: Copy collageRegenerator.js to functions/
  Copy utils/collageRegenerator.js to functions/utils/collageRegenerator.js

STEP 3: Choose an option above and uncomment it

STEP 4: Deploy
  firebase deploy --only functions

STEP 5: Monitor
  firebase functions:log

STEP 6: Test from your app
  // For HTTP Callable Function (Option 2):
  const regenerateCollages = functions.httpsCallable('regenerateUserCollages');
  const result = await regenerateCollages({ postsToProcess: 5 });

  // For Scheduled Function (Option 1):
  Check Cloud Functions dashboard for logs at scheduled time

STEP 7: View Results
  Visit Cloud Functions dashboard
  Check firestore-debug.log for detailed output

*/

// ============================================================================
// COST CONSIDERATIONS
// ============================================================================

/*

Estimated Costs:
- Invocations: Free tier includes 125,000 invocations/month
- Processing time: First 400,000 GB-seconds free
- Storage read/write: First 50,000 reads/50,000 writes free
- Network: Charged per GB egress

For typical usage (regenerating 100 posts/day):
- Function calls: ~3,000/month (well under free tier)
- Processing: ~1-2 GB-seconds/day (under free tier)
- Storage: ~20,000 reads/month (under free tier)
- Result: Should stay within free tier for small to medium usage

Tips to reduce costs:
- Process fewer posts per run
- Use lower timeout values
- Cache results when possible
- Use scheduled off-peak times

*/

// Export note: This file is a template.
// Don't import it directly - copy to functions/ directory first
module.exports = {};

