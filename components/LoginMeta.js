import React from "react";
import Head from "next/head";

const LoginMeta = () => (
    <Head>
        <title>Login - LitterPic</title>
        <meta name="description" content="Login to your LitterPic account to access your profile and community features." />
        <meta name="robots" content="index, follow" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://litterpic.org/login" />

        <meta property="og:title" content="Login - LitterPic" />
        <meta property="og:description" content="Login to your LitterPic account to access your profile and community features." />
        <meta property="og:image" content="/images/login_banner.webp" />
        <meta property="og:url" content="https://litterpic.org/login" />
        <meta property="og:type" content="website" />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Login - LitterPic" />
        <meta name="twitter:description" content="Login to your LitterPic account to access your profile and community features." />
        <meta name="twitter:image" content="/images/login_banner.webp" />
        <meta name="twitter:url" content="https://litterpic.org/login" />

        <meta name="keywords" content="login, LitterPic, user account" />
        <meta name="author" content="LitterPic Inc." />
    </Head>
);

export default LoginMeta;
