// components/withAuth.js

import {onAuthStateChanged} from "firebase/auth";
import {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import {auth} from '../lib/firebase'; // adjust the path to point to your firebase.js file

export default function withAuth(Component) {
    return (props) => {
        const [isAuth, setIsAuth] = useState(false);
        const router = useRouter();

        useEffect(() => {
            const unsubscribe = onAuthStateChanged(auth, user => {
                if (!user) {
                    // User not logged in, redirect to login page with the redirectTo parameter
                    router.push(`/login?redirectTo=${encodeURIComponent(router.asPath)}`);
                } else {
                    // User is logged in
                    setIsAuth(true);
                }
            });

            // Cleanup subscription on unmount
            return () => unsubscribe();
        }, [router]);

        if (!isAuth) {
            // You can show a loading screen here if you want
            return null;
        }

        // If user is authenticated, render the wrapped component
        return <Component {...props} />;
    };
}
