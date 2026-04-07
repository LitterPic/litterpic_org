import sharp from 'sharp';
const { fetchPostData } = require('../../../utils/firebaseStorageUrl');

// Facebook recommends 1200x630 for og:image
const COLLAGE_WIDTH = 1200;
const COLLAGE_HEIGHT = 630;
const GAP = 4;

// In-memory cache: postId -> { buffer, timestamp }
// Collages rarely change, cache for 1 hour in memory to avoid regeneration
const collageCache = new Map();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

function getCachedCollage(postId) {
    const entry = collageCache.get(postId);
    if (entry && Date.now() - entry.timestamp < CACHE_TTL_MS) {
        return entry.buffer;
    }
    if (entry) collageCache.delete(postId);
    return null;
}

function setCachedCollage(postId, buffer) {
    // Limit cache size to prevent memory issues (max 100 collages)
    if (collageCache.size >= 100) {
        const oldest = collageCache.keys().next().value;
        collageCache.delete(oldest);
    }
    collageCache.set(postId, { buffer, timestamp: Date.now() });
}

async function fetchImageBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status} ${url}`);
    return Buffer.from(await res.arrayBuffer());
}

async function buildCollage(photoUrls) {
    const count = photoUrls.length;

    if (count === 1) {
        const buf = await fetchImageBuffer(photoUrls[0]);
        return sharp(buf)
            .resize(COLLAGE_WIDTH, COLLAGE_HEIGHT, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();
    }

    // Fetch all images in parallel (max 4)
    const buffers = await Promise.all(photoUrls.slice(0, 4).map(fetchImageBuffer));
    const n = buffers.length;

    let composites = [];

    if (n === 2) {
        const halfW = Math.floor((COLLAGE_WIDTH - GAP) / 2);
        const tiles = await Promise.all(buffers.map(buf =>
            sharp(buf).resize(halfW, COLLAGE_HEIGHT, { fit: 'cover' }).toBuffer()
        ));
        composites = [
            { input: tiles[0], left: 0, top: 0 },
            { input: tiles[1], left: halfW + GAP, top: 0 },
        ];
    } else if (n === 3) {
        const halfW = Math.floor((COLLAGE_WIDTH - GAP) / 2);
        const halfH = Math.floor((COLLAGE_HEIGHT - GAP) / 2);
        const [left, topRight, bottomRight] = await Promise.all([
            sharp(buffers[0]).resize(halfW, COLLAGE_HEIGHT, { fit: 'cover' }).toBuffer(),
            sharp(buffers[1]).resize(halfW, halfH, { fit: 'cover' }).toBuffer(),
            sharp(buffers[2]).resize(halfW, halfH, { fit: 'cover' }).toBuffer(),
        ]);
        composites = [
            { input: left, left: 0, top: 0 },
            { input: topRight, left: halfW + GAP, top: 0 },
            { input: bottomRight, left: halfW + GAP, top: halfH + GAP },
        ];
    } else {
        const halfW = Math.floor((COLLAGE_WIDTH - GAP) / 2);
        const halfH = Math.floor((COLLAGE_HEIGHT - GAP) / 2);
        const tiles = await Promise.all(buffers.slice(0, 4).map(buf =>
            sharp(buf).resize(halfW, halfH, { fit: 'cover' }).toBuffer()
        ));
        composites = [
            { input: tiles[0], left: 0, top: 0 },
            { input: tiles[1], left: halfW + GAP, top: 0 },
            { input: tiles[2], left: 0, top: halfH + GAP },
            { input: tiles[3], left: halfW + GAP, top: halfH + GAP },
        ];
    }

    return sharp({
        create: {
            width: COLLAGE_WIDTH,
            height: COLLAGE_HEIGHT,
            channels: 3,
            background: { r: 255, g: 255, b: 255 },
        }
    })
        .composite(composites)
        .jpeg({ quality: 80 })
        .toBuffer();
}

export default async function handler(req, res) {
    let { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Missing post ID' });
    }

    // Strip extension if present so we get the clean Firestore document ID
    if (id.includes('.')) {
        id = id.substring(0, id.lastIndexOf('.'));
    }

    try {
        // Check in-memory cache first
        const cached = getCachedCollage(id);
        if (cached) {
            res.setHeader('Cache-Control', 'public, s-maxage=86400, max-age=3600');
            res.setHeader('Content-Type', 'image/jpeg');
            res.setHeader('X-Cache', 'HIT');
            return res.send(cached);
        }

        // Use shared utility that properly resolves storage paths to download URLs
        const { photoUrls } = await fetchPostData(id);

        // Filter out the default logo fallback
        const realPhotos = photoUrls.filter(
            url => !url.includes('litter_pic_logo.png')
        );

        if (realPhotos.length === 0) {
            return res.redirect(302, 'https://litterpic.org/images/litter_pic_logo.png');
        }

        const collageBuffer = await buildCollage(realPhotos);

        // Cache in memory for subsequent crawler requests
        setCachedCollage(id, collageBuffer);

        // Cache for 24 hours on CDN, 1 hour in browser
        res.setHeader('Cache-Control', 'public, s-maxage=86400, max-age=3600');
        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('X-Cache', 'MISS');
        res.send(collageBuffer);
    } catch (error) {
        console.error('[Collage API] Error generating collage:', error);
        return res.redirect(302, 'https://litterpic.org/images/litter_pic_logo.png');
    }
}

