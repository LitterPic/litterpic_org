import {useRouter} from 'next/router';
import React, {useEffect, useState} from 'react';
import {onAuthStateChanged, signOut} from 'firebase/auth';
import {auth} from '../lib/firebase';

const Logobar = () => {
    const [user, setUser] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, user => {
            setUser(user);
        });

        return () => unsubscribe();
    }, [auth]);

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            setUser(null);
            router.push('/login');
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <div className="logo-bar">
            <div className="logo-bar-left-content">
                <div className="logo-content">
                    <img src="/images/litter_pic_logo.png" alt="LitterPic logo" width={100} height={100}
                         onClick={() => router.push('/')}/>
                    <div className="logo-text">
                        <p className="logo">LitterPic</p>
                        <p className="tagline">Inspire Change</p>
                    </div>
                </div>
            </div>
            {user ? (
                <div className="logo-bar-right-content">
                    <span>Welcome, {user.displayName || user.email}</span>
                    <button onClick={handleSignOut}>Sign Out</button>
                </div>
            ) : (
                router.pathname !== '/login' && (
                    <div className="logo-bar-right-content">
                        <button onClick={() => router.push('/login')}>Login</button>
                    </div>
                )
            )}
        </div>
    );
};

export default Logobar;
