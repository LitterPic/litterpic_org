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
                source: '/(.*)',
                headers: [
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), payment=(self "https://donorbox.org"), publickey-credentials-get=()',
                    },
                ],
            },
        ];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'firebasestorage.googleapis.com',
                port: '',
                pathname: '/**',
            },
            {
                protocol: 'https',
                hostname: 't4.ftcdn.net',
                port: '',
                pathname: '/**',
            },
        ],
    },
};
