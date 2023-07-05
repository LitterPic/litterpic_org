import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getStorage, ref} from 'firebase/storage';
import {getAuth, onAuthStateChanged} from 'firebase/auth';
import {useState, useEffect} from 'react';

const firebaseConfig = {
    apiKey: "AIzaSyA-s9rMh2K9dDqJAERWj6EyQ4Qj3hlIRHg",
    authDomain: "litterpic-fa0bb.firebaseapp.com",
    projectId: "litterpic-fa0bb",
    storageBucket: "litterpic-fa0bb.appspot.com",
    messagingSenderId: "445985363997",
    appId: "1:445985363997:web:3588d2d945f426835e4ef4",
    measurementId: "G-64THCF0R4S",
};

// Initialize Firebase app
const app = initializeApp(firebaseConfig);

// Get Firestore, Storage, and Auth instances
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Custom hook to access authenticated user and authentication state
export function useAuth() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth]);

    return {user, loading};
}

export {app, db, storage, auth, ref};
