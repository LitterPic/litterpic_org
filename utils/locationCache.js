// locationCache.js
import {db} from '../lib/firebase';
import {addDoc, collection, deleteDoc, doc, getDocs, query, where} from 'firebase/firestore';

export const cacheLocation = async (userId, place) => {
    if (!userId) return;

    // Check for existing location
    const q = query(
        collection(db, 'recentLocations'),
        where('userId', '==', userId),
        where('lat', '==', place.lat),
        where('lng', '==', place.lng)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) return;

    // Add new location
    await addDoc(collection(db, 'recentLocations'), {
        userId: userId,
        name: place.name,
        address: place.address,
        lat: place.lat,
        lng: place.lng
    });
};

export const getRecentLocations = async (userId) => {
    if (!userId) return [];

    const q = query(
        collection(db, 'recentLocations'),
        where('userId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => doc.data());
};

// TODO: Add ability to remove cached location
export const removeLocation = async (docId) => {
    await deleteDoc(doc(db, 'recentLocations', docId));
};
