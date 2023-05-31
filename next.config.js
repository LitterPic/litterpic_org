module.exports = {
    // other configurations
    assetPrefix:
        process.env.NODE_ENV === "production" ? "https://litterpic.org" : "",

    trailingSlash: true,

    images: {
        loader: 'imgix', // use 'imgix' as loader
        path: '', // specify the path, could be your website URL or empty
    },
};
