import React from "react";
import Head from 'next/head'; // Import Head from next/head
import Layout from "../components/layout";
import '../styles/styles.scss'

const MyApp = ({Component, pageProps}) => {
    return (
        <>
            <Head>
                {/* Add the Material Icons stylesheet */}
                <link
                    href="https://fonts.googleapis.com/icon?family=Material+Icons"
                    rel="stylesheet"
                />
            </Head>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </>
    );
};

export default MyApp;
