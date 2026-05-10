import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { trackEvent } from '../lib/ga';
import Head from 'next/head';

const Custom404 = () => {
    const router = useRouter();

    useEffect(() => {
        trackEvent('page_not_found', { path: router.asPath });
    }, [router.asPath]);

    return (
        <div>
            <Head>
                <title>Page Not Found - LitterPic</title>
            </Head>
            <h1>404 - Page Not Found</h1>
            <p>The page you're looking for does not exist.</p>
        </div>
    );
};

export default Custom404;
