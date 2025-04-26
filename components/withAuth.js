// components/withAuth.js

import { onAuthStateChanged } from "firebase/auth";
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
            const unsubscribe = onAuthStateChanged(auth, user => {
                try {
                    if (!user) {
                        router.push(`${redirectPath}?redirectTo=${encodeURIComponent(router.asPath)}`);
                    } else {
                        setIsAuth(true);
                    }
                } catch (err) {
                    setError(err.message);
                } finally {
                    setIsLoading(false);
                }
            });

            return () => unsubscribe();
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