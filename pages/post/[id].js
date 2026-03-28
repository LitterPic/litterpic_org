import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
const { fetchPostData } = require('../../utils/firebaseStorageUrl');

export async function getServerSideProps(context) {
    const { id } = context.params;

    // Get the base URL for the og:url meta tag
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host || 'litterpic.org';
    const baseUrl = `${protocol}://${host}`;

    // Single parallelized fetch for all post data (photos + user resolved concurrently)
    const { description, authorName, photoUrls, location } = await fetchPostData(id);

    return {
        props: {
            id,
            description,
            authorName,
            photoUrls,
            location,
            baseUrl
        }
    };
}

export default function PostShareRedirect({ id, description, authorName, photoUrls, location, baseUrl }) {
    const router = useRouter();
    const [redirecting, setRedirecting] = useState(false);

    const ogTitle = location
        ? `LitterPic Cleanup by ${authorName} in ${location}`
        : `LitterPic Cleanup by ${authorName}`;

    const ogDescription = location
        ? `📍 ${location}\n\n${description}`
        : description;

    useEffect(() => {
        const timer = setTimeout(() => {
            setRedirecting(true);
            router.push(`/stories?postId=${id}`);
        }, 1500);

        return () => clearTimeout(timer);
    }, [id, router]);

    return (
        <div>
            <Head>
                <title>{ogTitle}</title>
                <meta name="description" content={ogDescription} />

                {/* Open Graph / Facebook */}
                <meta property="og:type" content="article" />
                <meta property="og:url" content={`${baseUrl}/post/${id}`} />
                <meta property="og:title" content={ogTitle} />
                <meta property="og:description" content={ogDescription} />
                <meta property="og:site_name" content="LitterPic" />
                <meta property="fb:app_id" content="1948502922329534" />

                {/* Collage image combining all post photos */}
                <meta property="og:image" content={`${baseUrl}/api/collage/${id}`} />
                <meta property="og:image:secure_url" content={`${baseUrl}/api/collage/${id}`} />
                <meta property="og:image:width" content="1200" />
                <meta property="og:image:height" content="630" />

                {/* Twitter */}
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:url" content={`${baseUrl}/post/${id}`} />
                <meta name="twitter:title" content={ogTitle} />
                <meta name="twitter:description" content={ogDescription} />
                <meta name="twitter:image" content={`${baseUrl}/api/collage/${id}`} />
            </Head>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', padding: '20px' }}>
                <img src="/images/litter_pic_logo.png" alt="LitterPic Logo" style={{ width: '150px' }} />
                <h1 style={{ marginTop: '20px', fontFamily: 'sans-serif', textAlign: 'center' }}>{ogTitle}</h1>
                {location && (
                    <p style={{ marginTop: '5px', fontFamily: 'sans-serif', color: '#015e41' }}>📍 {location}</p>
                )}
                <p style={{ marginTop: '10px', fontFamily: 'sans-serif', maxWidth: '600px', textAlign: 'center' }}>{description}</p>
                <p style={{ marginTop: '20px', fontFamily: 'sans-serif', color: '#666' }}>
                    {redirecting ? 'Redirecting to story...' : 'Preparing story...'}
                </p>

                <a href={`/stories?postId=${id}`} style={{ marginTop: '20px', padding: '10px 20px', background: '#015e41', color: 'white', textDecoration: 'none', borderRadius: '5px', fontFamily: 'sans-serif' }}>
                    Click here if you are not redirected
                </a>
            </div>
        </div>
    );
}