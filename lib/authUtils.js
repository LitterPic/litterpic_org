import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const checkIfMigratedUser = async (email, setIsMigratedUser, setShowMigratedUserError, setUserId) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), where('isMigrated', '==', true));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        setShowMigratedUserError(true);
        setIsMigratedUser(true);
        const foundUserId = snapshot.docs[0].id;
        setUserId(foundUserId);
    } else {
        setIsMigratedUser(false);
        setShowMigratedUserError(false);
        setUserId(null);
    }
};
