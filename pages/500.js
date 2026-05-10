import React from 'react';
import Head from 'next/head';

const Custom500 = () => {
    return (
        <div>
            <Head>
                <title>Internal Server Error - LitterPic</title>
            </Head>
            <h1>500 - Internal Server Error</h1>
            <p>Sorry, something went wrong on the server.</p>
        </div>
    );
};

export default Custom500;
