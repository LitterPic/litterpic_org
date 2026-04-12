/**
 * Collage Regenerator
 * Regenerates collages for posts that don't have AUTO_COLLAGE_ prefix
 * Used for testing and batch processing
 */

import {
    collection,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    updateDoc,
    doc,
} from 'firebase/firestore';
import { getDownloadURL, uploadBytesResumable, ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../lib/firebase';
import { generateCollage, blobToFile, COLLAGE_PREFIX } from './collageGenerator';
import { convertToWebP } from './imageConverter';

/**
 * Regenerates collages for the last N posts of a specific user
 * @param {string} userId - The user ID to regenerate collages for
 * @param {number} postsToProcess - Number of posts to process (default: 3)
 * @param {Function} onProgress - Callback function for progress updates
 * @returns {Promise<Object>} Results object with success/error counts
 */
export const regenerateCollagesToLastPosts = async (userId, postsToProcess = 3, onProgress = null) => {
    const results = {
        total: 0,
        processed: 0,
        regenerated: 0,
        skipped: 0,
        errors: 0,
        details: [],
    };

    try {
        // Log start
        console.log(`Starting collage regeneration for last ${postsToProcess} posts of user ${userId}`);
        onProgress?.({ status: 'Fetching posts...', step: 1, total: 4 });

        // Fetch last N posts across all users (admin tool - access is restricted at the page level)
        const postsRef = collection(db, 'userPosts');
        const q = query(
            postsRef,
            orderBy('timePosted', 'desc'),
            limit(postsToProcess)
        );

        const snapshot = await getDocs(q);
        results.total = snapshot.size;

        if (results.total === 0) {
            const message = 'No posts found for this user';
            console.warn(message);
            onProgress?.({ status: message, step: 2, total: 4, error: true });
            return results;
        }

        console.log(`Found ${results.total} posts to process`);
        onProgress?.({ status: `Found ${results.total} posts`, step: 2, total: 4 });

        // Process each post
        let postIndex = 0;
        for (const postDoc of snapshot.docs) {
            postIndex++;
            const post = postDoc.data();
            const postId = postDoc.id;

            try {
                const postProgressMessage = `Processing post ${postIndex}/${results.total}: ${postId}`;
                console.log(postProgressMessage);
                onProgress?.({
                    status: postProgressMessage,
                    step: 3,
                    total: 4,
                    postIndex,
                    totalPosts: results.total
                });

                // Check if post already has collage
                const firstPhotoUrl = post.postPhotos?.[0];
                const hasCollage = firstPhotoUrl?.includes(COLLAGE_PREFIX);

                if (hasCollage) {
                    console.log(`  ✓ Post already has collage (${COLLAGE_PREFIX}), skipping`);
                    results.skipped++;
                    results.details.push({
                        postId,
                        status: 'SKIPPED',
                        reason: 'Already has collage prefix'
                    });
                    continue;
                }

                // Check if post has at least 2 photos
                if (!post.postPhotos || post.postPhotos.length < 2) {
                    console.log(`  ⊘ Post has less than 2 photos, skipping collage`);
                    results.skipped++;
                    results.details.push({
                        postId,
                        status: 'SKIPPED',
                        reason: 'Less than 2 photos'
                    });
                    continue;
                }

                // Regenerate collage
                const regenerated = await regeneratePostCollage(post, postId, userId);

                if (regenerated) {
                    results.regenerated++;
                    results.details.push({
                        postId,
                        status: 'REGENERATED',
                        photoCount: post.postPhotos.length
                    });
                } else {
                    results.errors++;
                    results.details.push({
                        postId,
                        status: 'ERROR',
                        reason: 'Failed to regenerate'
                    });
                }

                results.processed++;

            } catch (error) {
                console.error(`Error processing post ${postId}:`, error);
                results.errors++;
                results.processed++;
                results.details.push({
                    postId,
                    status: 'ERROR',
                    reason: error.message
                });
            }
        }

        onProgress?.({ status: 'Regeneration complete!', step: 4, total: 4 });

    } catch (error) {
        console.error('Error in regenerateCollagesToLastPosts:', error);
        results.errors++;
        onProgress?.({
            status: `Error: ${error.message}`,
            step: 4,
            total: 4,
            error: true
        });
    }

    // Log summary
    console.log('Collage Regeneration Summary:');
    console.log(`  Total posts processed: ${results.processed}/${results.total}`);
    console.log(`  Collages regenerated: ${results.regenerated}`);
    console.log(`  Skipped: ${results.skipped}`);
    console.log(`  Errors: ${results.errors}`);

    return results;
};

/**
 * Regenerates a collage for a single post
 * @param {Object} post - The post data from Firestore
 * @param {string} postId - The post ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
const regeneratePostCollage = async (post, postId, userId) => {
    try {
        // Download original images to create collage
        const imageUrls = post.postPhotos || [];

        if (imageUrls.length < 2) {
            console.log('  Not enough photos for collage');
            return false;
        }

        console.log(`  Downloading ${imageUrls.length} images for collage...`);

        // Download images using our own proxy endpoint
        const imageBlobs = [];

        for (const url of imageUrls.slice(0, 4)) {
            try {
                console.log(`  Loading image: ${url.substring(0, 80)}...`);

                // Fetch through our proxy endpoint
                console.log(`  Requesting proxy...`);
                const proxyResponse = await fetch('/api/proxy-image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });

                if (!proxyResponse.ok) {
                    console.warn(`  ⚠️ Proxy returned ${proxyResponse.status}`);
                    continue;
                }

                // Get blob from response
                const blob = await proxyResponse.blob();
                console.log(`  ✓ Downloaded ${(blob.size / 1024).toFixed(0)}KB`);

                // Create image from blob
                const img = await new Promise((resolve, reject) => {
                    const image = new Image();
                    const objectUrl = URL.createObjectURL(blob);

                    image.onload = () => {
                        URL.revokeObjectURL(objectUrl);
                        console.log(`  ✓ Image loaded: ${image.width}x${image.height}`);
                        resolve(image);
                    };

                    image.onerror = (error) => {
                        URL.revokeObjectURL(objectUrl);
                        console.error(`  ✗ Image creation failed`, error);
                        reject(new Error('Failed to create image'));
                    };

                    image.src = objectUrl;

                    // Timeout
                    setTimeout(() => {
                        URL.revokeObjectURL(objectUrl);
                        reject(new Error('Image creation timeout'));
                    }, 10000);
                });

                // Draw to temporary canvas to get blob
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const ctx = tempCanvas.getContext('2d');
                ctx.drawImage(img, 0, 0);

                // Convert canvas to blob
                const canvasBlob = await new Promise((resolve) => {
                    tempCanvas.toBlob(resolve);
                });

                console.log(`  ✓ Converted to blob: ${(canvasBlob.size / 1024).toFixed(0)}KB`);
                imageBlobs.push(canvasBlob);
            } catch (error) {
                console.warn(`  ⚠️ Could not load image: ${error.message}`);
            }
        }

        if (imageBlobs.length < 2) {
            console.log(`  ❌ Only loaded ${imageBlobs.length} images, need 2+`);
            return false;
        }

        // Convert blobs to files
        const imageFiles = imageBlobs.map((blob, index) =>
            new File([blob], `temp_image_${index}.jpg`, { type: blob.type })
        );

        console.log(`  Generating collage from ${imageFiles.length} images...`);

        // Generate collage
        let collageBlob = null;
        try {
            collageBlob = await generateCollage(imageFiles);
        } catch (error) {
            console.error(`  ❌ Collage generation failed: ${error.message}`);
            throw new Error(`Collage generation: ${error.message}`);
        }

        if (!collageBlob) {
            console.log('  ❌ Collage generation returned null');
            return false;
        }

        console.log(`  ✓ Collage generated: ${(collageBlob.size / 1024).toFixed(0)}KB`);

        // Upload collage to Firebase Storage
        const dateFolder = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const collageFileName = `${COLLAGE_PREFIX}collage_regenerated_${Date.now()}.png`;
        const uploadRef = ref(storage, `userPosts/${dateFolder}/${userId}/${collageFileName}`);

        const collageFile = blobToFile(collageBlob, collageFileName);

        // Convert to WebP
        let fileToUpload = collageFile;
        try {
            console.log(`  Converting to WebP...`);
            fileToUpload = await convertToWebP(collageFile, { quality: 0.8, maxWidth: 1600 });
            console.log(`  ✓ Converted to WebP: ${(fileToUpload.size / 1024).toFixed(0)}KB`);
        } catch (error) {
            console.warn(`  ⚠️ WebP conversion failed: ${error.message}`);
            console.warn(`  Using PNG instead...`);
            fileToUpload = collageFile;
        }

        // Upload
        console.log(`  Uploading to Firebase Storage...`);
        let collageUrl = null;
        try {
            const snapshot = await uploadBytesResumable(uploadRef, fileToUpload);
            collageUrl = await getDownloadURL(snapshot.ref);
            console.log(`  ✓ Upload successful`);
            console.log(`  URL: ${collageUrl.substring(0, 80)}...`);
        } catch (uploadError) {
            console.error(`  ❌ Upload failed: ${uploadError.message}`);
            throw new Error(`Firebase upload: ${uploadError.message}`);
        }

        if (!collageUrl) {
            console.error(`  ❌ No collage URL returned`);
            return false;
        }

        // Delete old first photo if it exists (and is not a collage)
        const oldFirstPhoto = post.postPhotos?.[0];
        if (oldFirstPhoto && !oldFirstPhoto.includes(COLLAGE_PREFIX)) {
            try {
                console.log(`  Deleting old first photo...`);
                const oldRef = ref(storage, oldFirstPhoto);
                // Try to delete, but don't fail if it doesn't work
                // deleteObject(oldRef).catch(err => console.warn('Could not delete old photo:', err.message));
            } catch (error) {
                console.warn('  Could not delete old photo:', error.message);
            }
        }

        // Update Firestore with new collage as first photo
        const postRef = doc(db, 'userPosts', postId);
        const updatedPhotos = [collageUrl, ...post.postPhotos];

        try {
            console.log(`  Updating Firestore...`);
            await updateDoc(postRef, {
                postPhotos: updatedPhotos,
                collageRegeneratedAt: new Date(),
            });
            console.log(`  ✓ Post updated successfully`);
        } catch (firestoreError) {
            console.error(`  ❌ Firestore update failed: ${firestoreError.message}`);
            throw new Error(`Firestore update: ${firestoreError.message}`);
        }
        return true;

    } catch (error) {
        console.error('  Error in regeneratePostCollage:', error);
        return false;
    }
};

/**
 * Gets summary of collages for a user's posts
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} Summary object
 */
export const getCollagesSummary = async (userId) => {
    try {
        const postsRef = collection(db, 'userPosts');
        const q = query(
            postsRef,
            where('postUser', '==', doc(db, `users/${userId}`))
        );

        const snapshot = await getDocs(q);

        let postsWithCollage = 0;
        let postsWithoutCollage = 0;
        let totalPhotos = 0;

        snapshot.forEach(postDoc => {
            const post = postDoc.data();
            const firstPhoto = post.postPhotos?.[0];

            if (firstPhoto?.includes(COLLAGE_PREFIX)) {
                postsWithCollage++;
            } else {
                postsWithoutCollage++;
            }

            totalPhotos += post.postPhotos?.length || 0;
        });

        return {
            totalPosts: snapshot.size,
            postsWithCollage,
            postsWithoutCollage,
            totalPhotos,
        };
    } catch (error) {
        console.error('Error getting collages summary:', error);
        return null;
    }
};














