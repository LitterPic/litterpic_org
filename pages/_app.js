import React from "react";
import Layout from "../components/layout";
import '../styles/styles.css'

const MyApp = ({Component, pageProps}) => {
    return (
        <Layout>
            <Component {...pageProps} />
        </Layout>
    );
};

export default MyApp;
