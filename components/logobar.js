import {useRouter} from 'next/router';
import React, {useEffect, useState} from 'react';
import {onAuthStateChanged, signOut} from 'firebase/auth';
import {auth, db} from '../lib/firebase';
import {doc, getDoc} from 'firebase/firestore';
import CustomButton from "./CustomButton";

const Logobar = () => {
    const [user, setUser] = useState(null);
    const [userDetails, setUserDetails] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async user => {
            setUser(user);

            // Retrieve additional user details from Firestore
            if (user) {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setUserDetails(docSnap.data());
                } else {
                    console.log('No such document!');
                }
            } else {
                setUserDetails(null);
            }
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
                    <CustomButton href="/donate">Donate</CustomButton>
                    <button onClick={handleSignOut}><span>Hi, {userDetails?.display_name || user.email}!</span> Log
                        Out?
                    </button>
                </div>
            ) : ((
                <div className="logo-bar-right-content">
                    <CustomButton href="/donate">Donate</CustomButton>
                    <button onClick={() => router.push('/login')}>Login</button>
                </div>
            ))}

        </div>
    );
};

export default Logobar;
