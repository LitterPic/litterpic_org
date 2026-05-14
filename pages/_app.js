import React, { useEffect } from "react";
import Layout from "../components/layout";
import '../styles/styles.scss';
import { StoriesProvider } from '../contexts/StoriesContext';
import GoogleAnalytics from '../components/GoogleAnalytics';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter } from 'next/router';
import { db } from '../lib/firebase';
import { setGAUserId, clearGAUserId } from '../lib/ga';

const MyApp = ({ Component, pageProps }) => {
    const router = useRouter();

    // On every app load, check auth state:
    //  1. Link the session to GA.
    //  2. For already-authenticated users (i.e. returning with an active session),
    //     apply the same profile-redirect logic that SignInActions uses at login time.
    //     This covers the case where the user never went through the login page.
    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                clearGAUserId();
                return;
            }

            // Always link the session to GA
            setGAUserId(user.uid);

            // Unverified users are treated as unauthenticated everywhere else — skip.
            if (!user.emailVerified) return;

            // Don't redirect if already heading to profile/edit-profile to avoid loops.
            const path = router.pathname;
            if (
                path.startsWith('/profile') ||
                path.startsWith('/edit-profile') ||
                path.startsWith('/login') ||
                path.startsWith('/verify_email')
            ) return;

            try {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                if (!userDoc.exists()) return;

                const userData = userDoc.data();

                if (userData.first_login === true) {
                    // Brand-new user — send to edit profile (same as login flow)
                    await router.push(`/edit-profile/${user.uid}`);
                } else if (userData.has_visited_profile !== true) {
                    // Existing user who has never seen their profile on the web
                    await router.push('/profile?welcome=true');
                }
                // Otherwise: user is all set, no redirect needed
            } catch (err) {
                // Non-critical — don't surface errors to the user
                console.warn('Profile redirect check failed:', err);
            }
        });
        return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
