/**
 * Shared utility for resolving Firebase Storage paths to public download URLs.
 * Used by both the post SSR page and the collage API to avoid duplication.
 *
 * Server-side only — reads from environment variables (no NEXT_PUBLIC_ prefix
 * so these are never exposed to the client bundle).
 */

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const API_KEY = process.env.FIREBASE_API_KEY;

/**
 * Resolve a single photo value (either a full URL or a storage path) to a download URL.
 * @param {string} storagePath - Either a full HTTP URL or a Firebase Storage path
 * @returns {Promise<string>} - The resolved download URL
 */
async function resolvePhotoUrl(storagePath) {
    if (!storagePath) return null;

    // Already a full download URL
    if (storagePath.startsWith('http')) {
        return storagePath;
    }

    // It's a storage path — resolve it to a download URL
    let cleanPath = storagePath;
    if (cleanPath.startsWith('gs://')) {
        cleanPath = cleanPath.split('/').slice(3).join('/');
    }

    const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${PROJECT_ID}.appspot.com/o/${encodeURIComponent(cleanPath)}`;

    try {
        const metaResponse = await fetch(`${storageUrl}?key=${API_KEY}`);
        const metaData = await metaResponse.json();
        if (metaData.downloadTokens) {
            return `${storageUrl}?alt=media&token=${metaData.downloadTokens.split(',')[0]}`;
        }
        return `${storageUrl}?alt=media`;
    } catch (err) {
        console.error('[resolvePhotoUrl] Error resolving storage path:', cleanPath, err);
        return `${storageUrl}?alt=media`;
    }
}

/**
 * Resolve an array of photo values to download URLs in parallel.
 * @param {string[]} photoPaths - Array of URLs or storage paths
 * @returns {Promise<string[]>} - Array of resolved download URLs
 */
async function resolvePhotoUrls(photoPaths) {
    const results = await Promise.all(photoPaths.map(resolvePhotoUrl));
    return results.filter(Boolean);
}

/**
 * Fetch post data from Firestore REST API and return structured post info.
 * All network calls (photos, user) are parallelized for speed.
 * @param {string} postId - The Firestore document ID
 * @returns {Promise<{description: string, authorName: string, photoUrls: string[], location: string}>}
 */
async function fetchPostData(postId) {
    const defaultResult = {
        description: 'Check out this inspiring LitterPic story!',
        authorName: 'A Volunteer',
        photoUrls: ['https://litterpic.org/images/litter_pic_logo.png'],
        location: '',
    };

    try {
        const postUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/userPosts/${postId}?key=${API_KEY}`;
        const response = await fetch(postUrl);
        const data = await response.json();

        if (!data.fields) {
            console.error('[fetchPostData] No fields in Firestore response for post:', postId);
            return defaultResult;
        }

        // Extract description
        let description = defaultResult.description;
        const rawDescription = data.fields.postDescription?.stringValue;
        if (rawDescription) {
            description = rawDescription.replace(/<[^>]*>?/gm, '').replace(/\n/g, ' ').trim();
            if (description.length > 500) {
                description = description.substring(0, 497) + '...';
            }
        }

        // Extract location
        const location = data.fields.location?.stringValue || '';

        // Build parallel promises for photos and user
        const promises = {};

        // Photo resolution (parallel)
        const rawPhotos = data.fields.postPhotos?.arrayValue?.values
            ?.map(v => v.stringValue)
            .filter(Boolean) || [];

        if (rawPhotos.length > 0) {
            promises.photos = resolvePhotoUrls(rawPhotos);
        }

        // User fetch (parallel with photos)
        if (data.fields.postUser?.referenceValue) {
            const userDocId = data.fields.postUser.referenceValue.split('/').pop();
            const userUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${userDocId}?key=${API_KEY}`;
            promises.user = fetch(userUrl).then(r => r.json());
        }

        // Await all in parallel
        const results = {};
        const keys = Object.keys(promises);
        const values = await Promise.all(keys.map(k => promises[k]));
        keys.forEach((k, i) => { results[k] = values[i]; });

        const photoUrls = results.photos?.length > 0
            ? results.photos
            : defaultResult.photoUrls;

        const authorName = results.user?.fields?.display_name?.stringValue
            || defaultResult.authorName;

        return { description, authorName, photoUrls, location };
    } catch (e) {
        console.error('[fetchPostData] Error:', e);
        return defaultResult;
    }
}

module.exports = { resolvePhotoUrl, resolvePhotoUrls, fetchPostData, PROJECT_ID, API_KEY };

