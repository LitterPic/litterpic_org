import React, { useEffect } from "react";
import Layout from "../components/layout";
import '../styles/styles.scss';
import { StoriesProvider } from '../contexts/StoriesContext';
import GoogleAnalytics from '../components/GoogleAnalytics';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { setGAUserId, clearGAUserId } from '../lib/ga';

const MyApp = ({ Component, pageProps }) => {
    // Link authenticated sessions to GA so user journeys are stitched across devices
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setGAUserId(user.uid);
            } else {
                clearGAUserId();
            }
        });
        return () => unsubscribe();
    }, []);

    return (
        <StoriesProvider>
            <GoogleAnalytics />
            <Layout>
                <Component {...pageProps} />
            </Layout>
        </StoriesProvider>
    );
};

export default MyApp;
