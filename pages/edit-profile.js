import {useState, useEffect} from 'react';
import {auth, updateUserProfile} from '../lib/firebase';
import {useAuth} from '../lib/firebase';
import {useRouter} from 'next/router';

export default function EditProfilePage() {
    const {user} = useAuth(); // Custom hook to access the authenticated user
    const [displayName, setDisplayName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter(); // Get router instance

    useEffect(() => {
        // Set the display name in the state when the user object is available
        if (user) {
            setDisplayName(user.displayName || '');
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Update the user's display name using the Firebase Auth API
            await updateUserProfile(auth.currentUser, {
                displayName: displayName.trim(),
            });

            // Redirect the user to the profile page after successful update
            router.push('/profile');
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <div>
            <h2>Edit Profile</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Display Name:
                    <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        required
                    />
                </label>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Profile'}
                </button>
            </form>
        </div>
    );
}
