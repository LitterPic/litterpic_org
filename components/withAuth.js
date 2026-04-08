// components/withAuth.js

import { onAuthStateChanged, signOut } from "firebase/auth";
import { useEffect, useState, memo } from 'react';
import { useRouter } from 'next/router';
import { auth } from '../lib/firebase';

/**
 * Higher-Order Component that ensures the user is authenticated before rendering the wrapped component.
 * @param {React.ComponentType} Component - The component to be wrapped.
 * @param {string} redirectPath - The path to redirect to if the user is not authenticated. Defaults to '/login'.
 * @returns {React.ComponentType} - The wrapped component.
 */
export default function withAuth(Component, redirectPath = '/login') {
    return memo((props) => {
        const [isAuth, setIsAuth] = useState(false);
        const [isLoading, setIsLoading] = useState(true);
        const [error, setError] = useState(null);
        const router = useRouter();

        useEffect(() => {
	        let didCancel = false;
	        const unsubscribe = onAuthStateChanged(auth, async (user) => {
                try {
	                if (!user) {
	                    setIsAuth(false);
	                    await router.push(`${redirectPath}?redirectTo=${encodeURIComponent(router.asPath)}`);
	                    return;
	                }

	                // Require verified email for protected pages.
	                // (OAuth providers typically set this true; email/password requires verification.)
	                if (!user.emailVerified) {
	                    setIsAuth(false);
	                    // Ensure the user can't remain authenticated if they haven't verified.
	                    await signOut(auth);
	                    await router.push('/verify_email');
	                    return;
	                }

	                setIsAuth(true);
                } catch (err) {
                    setError(err.message);
                } finally {
	                if (!didCancel) {
	                    setIsLoading(false);
	                }
                }
            });

	        return () => {
	            didCancel = true;
	            unsubscribe();
	        };
        }, [router, redirectPath]);

        if (isLoading) {
            return <div>Loading...</div>; // Replace with a spinner component if available
        }

        if (error) {
            return <div>Error: {error}</div>;
        }

        if (!isAuth) {
            return null;
        }

        return <Component {...props} />;
    });
}