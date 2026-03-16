import sharp from 'sharp';

const PROJECT_ID = 'litterpic-fa0bb';
const API_KEY = 'AIzaSyA-s9rMh2K9dDqJAERWj6EyQ4Qj3hlIRHg';

// Facebook recommends 1200x630 for og:image
const COLLAGE_WIDTH = 1200;
const COLLAGE_HEIGHT = 630;
const GAP = 4;

async function fetchPostPhotos(postId) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/userPosts/${postId}?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.fields?.postPhotos?.arrayValue?.values) return [];

    return data.fields.postPhotos.arrayValue.values
        .map(v => v.stringValue)
        .filter(Boolean);
}

async function fetchImageBuffer(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}

async function buildCollage(photoUrls) {
    const count = photoUrls.length;

    if (count === 1) {
        const buf = await fetchImageBuffer(photoUrls[0]);
        return sharp(buf)
            .resize(COLLAGE_WIDTH, COLLAGE_HEIGHT, { fit: 'cover' })
            .jpeg({ quality: 85 })
            .toBuffer();
    }

    // Fetch all images in parallel
    const buffers = await Promise.all(photoUrls.slice(0, 4).map(fetchImageBuffer));
    const n = buffers.length;

    let composites = [];

    if (n === 2) {
        // Side by side
        const halfW = Math.floor((COLLAGE_WIDTH - GAP) / 2);
        const tiles = await Promise.all(buffers.map(buf =>
            sharp(buf).resize(halfW, COLLAGE_HEIGHT, { fit: 'cover' }).toBuffer()
        ));
        composites = [
            { input: tiles[0], left: 0, top: 0 },
            { input: tiles[1], left: halfW + GAP, top: 0 },
        ];
    } else if (n === 3) {
        // Left half = first image, right half = two stacked
        const halfW = Math.floor((COLLAGE_WIDTH - GAP) / 2);
        const halfH = Math.floor((COLLAGE_HEIGHT - GAP) / 2);
        const left = await sharp(buffers[0]).resize(halfW, COLLAGE_HEIGHT, { fit: 'cover' }).toBuffer();
        const topRight = await sharp(buffers[1]).resize(halfW, halfH, { fit: 'cover' }).toBuffer();
        const bottomRight = await sharp(buffers[2]).resize(halfW, halfH, { fit: 'cover' }).toBuffer();
        composites = [
            { input: left, left: 0, top: 0 },
            { input: topRight, left: halfW + GAP, top: 0 },
            { input: bottomRight, left: halfW + GAP, top: halfH + GAP },
        ];
    } else {
        // 4+ images: 2x2 grid
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
        .jpeg({ quality: 85 })
        .toBuffer();
}

export default async function handler(req, res) {
    const { id } = req.query;

    if (!id) {
        return res.status(400).json({ error: 'Missing post ID' });
    }

    try {
        const photoUrls = await fetchPostPhotos(id);

        if (photoUrls.length === 0) {
            // Redirect to default logo if no photos
            return res.redirect(302, 'https://litterpic.org/images/litter_pic_logo.png');
        }

        const collageBuffer = await buildCollage(photoUrls);

        // Cache for 24 hours on CDN, 1 hour in browser
        res.setHeader('Cache-Control', 'public, s-maxage=86400, max-age=3600');
        res.setHeader('Content-Type', 'image/jpeg');
        res.send(collageBuffer);
    } catch (error) {
        console.error('[Collage API] Error generating collage:', error);
        return res.redirect(302, 'https://litterpic.org/images/litter_pic_logo.png');
    }
}

