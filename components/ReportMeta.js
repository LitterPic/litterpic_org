// ReportMeta.js
import React from 'react';
import Head from 'next/head';

const ReportMeta = () => {
    return (
        <Head>
            <title>LitterPic Statistics</title>
            <meta name="description"
                  content="Explore reports and statistics related to litter collection and environmental conservation efforts."/>
            <meta name="robots" content="index, follow"/>
            <link rel="icon" href="/favicon.ico"/>
            <link rel="canonical" href="https://litterpic.org/reports"/>

            <meta property="og:title" content="Reports - LitterPic"/>
            <meta property="og:description"
                  content="Explore reports and statistics related to litter collection and environmental conservation efforts."/>
            <meta property="og:image" content="https://litterpic.org/images/litter_pic_logo.png"/>
            <meta property="og:url" content="https://litterpic.org/reports"/>
            <meta property="og:type" content="website"/>

            <meta name="twitter:card" content="summary_large_image"/>
            <meta name="twitter:title" content="Reports - LitterPic"/>
            <meta name="twitter:description"
                  content="Explore reports and statistics related to litter collection and environmental conservation efforts."/>
            <meta name="twitter:image" content="https://litterpic.org/images/litter_pic_logo.png"/>
            <meta name="twitter:url" content="https://litterpic.org/reports"/>

            <meta name="keywords"
                  content="reports, statistics, litter collection reports, environmental conservation reports"/>
            <meta name="author" content="LitterPic Inc."/>
        </Head>
    );
};

export default ReportMeta;