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
};




