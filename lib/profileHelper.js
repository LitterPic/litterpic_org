import { db } from './firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

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

        const countValidUsers = async (snapshot) => {
            const checks = snapshot.docs.map(async (docSnapshot) => {
                const userDoc = await getDoc(doc(db, `users/${docSnapshot.id}`));
                return userDoc.exists() ? 1 : 0;
            });
            const results = await Promise.all(checks);
            return results.reduce((sum, val) => sum + val, 0);
        };

        const followersCount = await countValidUsers(followersSnapshot);
        const followingCount = await countValidUsers(followingSnapshot);

        let organizationLogoUrl = null;
        if (userData.organization) {
            const orgNameToQuery = userData.organization === "Litterpicking Organization" ? "Independent" : userData.organization;
            const orgsRef = collection(db, 'litterpickingOrganizations');
            const q = query(orgsRef, where('Name', '==', orgNameToQuery));
            const orgsSnapshot = await getDocs(q);
            if (!orgsSnapshot.empty) {
                organizationLogoUrl = orgsSnapshot.docs[0].data().logoUrl || null;
            }
        }

        return {
            userPhoto: userData.photo_url,
            userBio: userData.bio,
            displayName: userData.display_name,
            userEmail: userData.email,
            userOrganization: userData.organization,
            userOrganizationLogo: organizationLogoUrl,
            litterCollected: totalWeight.toFixed(),
            isAmbassador: userData.ambassador || false,
            ambassadorDate: userData.ambassador_date?.toDate() || null,
            memberSince: userData.created_time?.toDate() || null,
            followers: followersCount,
            following: followingCount,
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        throw error;
    }
};
