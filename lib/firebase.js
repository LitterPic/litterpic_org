import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your Firebase configuration
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

// Get Firestore and Storage instances
const db = getFirestore(app);
const storage = getStorage(app);

export { app, db, storage };
