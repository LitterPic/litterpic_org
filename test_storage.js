const fs = require('fs');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getStorage, ref, getDownloadURL } = require('firebase/storage');
const { getFirestore, doc, getDoc } = require('firebase/firestore');

// Load environment variables from .env.local
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
        const [key, ...vals] = line.split('=');
        if (key && vals.length) process.env[key.trim()] = vals.join('=').trim();
    });
}

const projectId = process.env.FIREBASE_PROJECT_ID;
const apiKey = process.env.FIREBASE_API_KEY;

if (!projectId || !apiKey) {
    console.error('Missing FIREBASE_PROJECT_ID or FIREBASE_API_KEY in .env.local');
    process.exit(1);
}

const firebaseConfig = {
    apiKey,
    authDomain: `${projectId}.firebaseapp.com`,
    projectId,
    storageBucket: `${projectId}.appspot.com`
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

async function test() {
    try {
        const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/userPosts?pageSize=1`);
        const data = await response.json();
        const firstPost = data.documents[0];
        const photos = firstPost.fields.postPhotos.arrayValue.values;
        if (photos && photos.length > 0) {
            const storagePath = photos[0].stringValue;
            console.log("Path:", storagePath);
            const url = `https://firebasestorage.googleapis.com/v0/b/${projectId}.appspot.com/o/${encodeURIComponent(storagePath)}?alt=media`;
            console.log("Constructed URL:", url);
            const res = await fetch(url);
            console.log("Fetch without token status:", res.status);

            const storageRef = ref(storage, storagePath);
            const sdkUrl = await getDownloadURL(storageRef);
            console.log("SDK URL:", sdkUrl);
        } else {
            console.log("No photos in the first post");
        }
    } catch (e) {
        console.error(e);
    }
}
test();
