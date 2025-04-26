import { db } from './firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';

export const fetchUserProfile = async (userId) => {
    try {
        const userRef = doc(db, `users/${userId}`);
        const userDoc = await getDoc(userRef);

        if (!userDoc.exists()) {
            throw new Error('User profile not found');
        }

        const userData = userDoc.data();
        const totalWeight = userData.totalWeight || 0;

        // Fetch followers and following
        const followersSnapshot = await getDocs(collection(db, `followers/${userId}/userFollowers`));
        const followingSnapshot = await getDocs(collection(db, `following/${userId}/userFollowing`));

        return {
            userPhoto: userData.photo_url,
            userBio: userData.bio,
            displayName: userData.display_name,
            userEmail: userData.email,
            userOrganization: userData.organization,
            litterCollected: totalWeight.toFixed(),
            isAmbassador: userData.ambassador || false,
            ambassadorDate: userData.ambassador_date?.toDate() || null,
            memberSince: userData.created_time?.toDate() || null,
            followers: followersSnapshot.size,
            following: followingSnapshot.size,
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};
