import React from "react";
import Layout from "../components/layout";
import '../styles/styles.scss'
import { StoriesProvider } from '../contexts/StoriesContext';

const MyApp = ({Component, pageProps}) => {
    return (
        <StoriesProvider>
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </StoriesProvider>
    );
};

export default MyApp;
