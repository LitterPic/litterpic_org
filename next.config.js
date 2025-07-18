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
