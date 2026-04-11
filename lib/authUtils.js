import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const checkIfMigratedUser = async (email, setIsMigratedUser, setShowMigratedUserError, setUserId) => {
    // Don't query if email is empty or invalid
    if (!email || !email.includes('@')) {
        setIsMigratedUser(false);
        setShowMigratedUserError(false);
        setUserId(null);
        return;
    }

    try {
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
    } catch (error) {
        // Silently handle permission errors - this query runs before authentication
        // If user isn't authenticated, we'll get permission-denied, which is expected
        console.debug('Could not check migrated user status (user may not be authenticated yet):', error.code);
        setIsMigratedUser(false);
        setShowMigratedUserError(false);
        setUserId(null);
    }
};
