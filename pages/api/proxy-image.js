/**
 * API route to proxy image downloads, bypassing CORS restrictions
 *
 * Usage: POST /api/proxy-image with { url: "..." } in body
 */

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    try {
        const { url } = req.body;

        if (!url) {
            console.error('[Proxy] No URL provided in request body');
            return res.status(400).json({ error: 'URL required in request body' });
        }

        console.log(`[Proxy] Fetching image from Firebase...`);

        // Fetch the image with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        try {
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'User-Agent': 'LitterPic-Collage-Generator/1.0'
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                console.error(`[Proxy] HTTP ${response.status}: ${response.statusText}`);
                return res.status(502).json({ error: `HTTP ${response.status}` });
            }

            // Get the image as buffer
            const buffer = await response.arrayBuffer();
            const size = (buffer.byteLength / 1024).toFixed(2);
            console.log(`[Proxy] ✓ Success: ${size}KB`);

            // Set appropriate headers
            const contentType = response.headers.get('content-type') || 'image/webp';
            res.setHeader('Content-Type', contentType);
            res.setHeader('Content-Length', buffer.byteLength);
            res.setHeader('Cache-Control', 'public, max-age=3600');
            res.setHeader('Access-Control-Allow-Origin', '*');

            // Send the image
            res.status(200).end(Buffer.from(buffer));

        } catch (fetchError) {
            clearTimeout(timeoutId);
            console.error(`[Proxy] Fetch failed: ${fetchError.message}`);

            if (fetchError.name === 'AbortError') {
                return res.status(504).json({ error: 'Request timeout' });
            }

            return res.status(502).json({ error: `Fetch failed: ${fetchError.message}` });
        }

    } catch (error) {
        console.error(`[Proxy] Error: ${error.message}`);
        res.status(500).json({ error: error.message });
    }
}



