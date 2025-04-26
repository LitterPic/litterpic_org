import React from "react";
import Head from "next/head";

const ProfileMeta = () => (
    <Head>
        <title>Your Profile - LitterPic</title>
        <meta name="description" content="View and edit your profile on LitterPic." />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://litterpic.org/profile" />

        <meta property="og:title" content="Your Profile - LitterPic" />
        <meta property="og:description" content="View and edit your profile on LitterPic." />
        <meta property="og:image" content="/images/profile_banner.webp" />
        <meta property="og:url" content="https://litterpic.org/profile" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Your Profile - LitterPic" />
        <meta name="twitter:description" content="View and edit your profile on LitterPic." />
        <meta name="twitter:image" content="/images/profile_banner.webp" />
        <meta name="twitter:url" content="https://litterpic.org/profile" />

        <meta name="keywords" content="profile, LitterPic, user account" />
        <meta name="author" content="LitterPic Inc." />
    </Head>
);

export default ProfileMeta;
