import Head from 'next/head';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
    const { id } = context.params;
    let authorName = 'A Volunteer';
    let photoUrls = ['https://litterpic.org/images/litter_pic_logo.png'];
    let description = 'Check out this inspiring LitterPic story!';
    let location = '';

    // Get the base URL for the og:url meta tag
    const protocol = context.req.headers['x-forwarded-proto'] || 'http';
    const host = context.req.headers.host || 'litterpic.org';
    const baseUrl = `${protocol}://${host}`;

    const projectId = 'litterpic-fa0bb';
    const apiKey = 'AIzaSyA-s9rMh2K9dDqJAERWj6EyQ4Qj3hlIRHg';

    try {
        // Fetch from Firestore REST API with API key for authentication
        const postUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userPosts/${id}?key=${apiKey}`;

        const response = await fetch(postUrl);
        const data = await response.json();

        if (!data.fields) {
            console.error("[SSR] No fields in Firestore response for post:", id, JSON.stringify(data).substring(0, 500));
        }

        if (data.fields) {
            let rawDescription = data.fields.postDescription?.stringValue;
            if (rawDescription) {
                // Strip HTML tags and newlines for meta description
                description = rawDescription.replace(/<[^>]*>?/gm, '').replace(/\n/g, ' ').trim();
                // Allow longer descriptions for Facebook Open Graph, but don't truncate unless really long
                if (description.length > 500) {
                    description = description.substring(0, 497) + '...';
                }
            }

            // Get photo URLs from postPhotos field
            if (data.fields.postPhotos?.arrayValue?.values?.length > 0) {
                const resolvedUrls = [];
                for (const val of data.fields.postPhotos.arrayValue.values) {
                    let storagePath = val.stringValue;
                    if (!storagePath) continue;

                    if (storagePath.startsWith('http')) {
                        // Already a full download URL (includes token for access)
                        resolvedUrls.push(storagePath);
                    } else {
                        // It's a storage path — resolve it to a download URL
                        let cleanPath = storagePath;
                        if (cleanPath.startsWith('gs://')) {
                            cleanPath = cleanPath.split('/').slice(3).join('/');
                        }
                        const storageUrl = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodeURIComponent(cleanPath)}`;
                        try {
                            // Fetch metadata to get the download token
                            const metaResponse = await fetch(`${storageUrl}?key=${apiKey}`);
                            const metaData = await metaResponse.json();
                            if (metaData.downloadTokens) {
                                resolvedUrls.push(`${storageUrl}?alt=media&token=${metaData.downloadTokens.split(',')[0]}`);
                            } else {
                                resolvedUrls.push(`${storageUrl}?alt=media`);
                            }
                        } catch (storageErr) {
                            console.error("[SSR] Error resolving storage path:", cleanPath, storageErr);
                            resolvedUrls.push(`${storageUrl}?alt=media`);
                        }
                    }
                }
                if (resolvedUrls.length > 0) {
                    photoUrls = resolvedUrls;
                }
            }

            // Get location
            if (data.fields.location?.stringValue) {
                location = data.fields.location.stringValue;
            }

            // Try to fetch author name
            if (data.fields.postUser?.referenceValue) {
                const userRef = data.fields.postUser.referenceValue;
                const userDocId = userRef.split('/').pop();
                const userUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/users/${userDocId}?key=${apiKey}`;
                const userResponse = await fetch(userUrl);
                const userData = await userResponse.json();
                if (userData.fields?.display_name) {
                    authorName = userData.fields.display_name.stringValue;
                }
            }
        }
    } catch (e) {
        console.error("[SSR] Error fetching post data for SSR:", e);
    }

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