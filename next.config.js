module.exports = {
    sassOptions: {
        includePaths: [],
    },
    async headers() {
        return [
            {
                source: '/favicon.ico',
                headers: [
                    {
                        key: 'Content-Type',
                        value: 'image/x-icon',
                    },
                ],
            },
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
    images: {
        domains: ['firebasestorage.googleapis.com', 't4.ftcdn.net'],
        formats: ['image/webp'],
        minimumCacheTTL: 60,
    },
    // Enable compression
    compress: true,
    // Enable production source maps
    productionBrowserSourceMaps: false,
    // Optimize bundle size
    swcMinify: true,
    // Configure webpack
    webpack: (config, { dev, isServer }) => {
        // Only run in production and client-side
        if (!dev && !isServer) {
            // Enable tree shaking and dead code elimination
            config.optimization.usedExports = true;
        }
        return config;
    },
};
