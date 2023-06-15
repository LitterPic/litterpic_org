import {initializeApp} from 'firebase/app';
import {getFirestore} from 'firebase/firestore';
import {getStorage} from 'firebase/storage';
import {getAuth} from 'firebase/auth';

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

export {app, db, storage, auth};