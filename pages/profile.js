import withAuth from '../components/withAuth';
import {db, useAuth} from '../lib/firebase';
import {useEffect, useState} from 'react';
import {doc, getDoc} from "firebase/firestore";
import {useRouter} from 'next/router';

const ProfilePage = () => {
    const router = useRouter();
    const {user, loading} = useAuth();
    const [userPhoto, setUserPhoto] = useState('');
    const [userBio, setUserBio] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userOrganization, setUserOrganization] = useState('');
    const [litterCollected, setLitterCollected] = useState(0);

    useEffect(() => {
        const fetchUserProfile = async () => {
            if (user) {
                try {
                    const userRef = doc(db, `users/${user.uid}`);
                    const userDoc = await getDoc(userRef);

                    if (userDoc.exists()) {
                        const userData = userDoc.data();
                        setUserPhoto(userData.photo_url);
                        setUserBio(userData.bio);
                        setDisplayName(userData.display_name);
                        setUserEmail(userData.email);
                        setUserOrganization(userData.organization);

                        const totalWeight = userData.totalWeight || 0;
                        setLitterCollected(totalWeight);
                    }
                } catch (error) {
                    console.error('Error retrieving user profile:', error);
                }
            }
        };

        fetchUserProfile();
    }, [user]);

    const handleDeleteAccountClick = async () => {
        await router.push('/delete_account');
    }

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return <p>Please login to view your profile.</p>;
    }

    return (
        <div>
            <div className="banner">
                <img src="/images/user_posts_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Profile</h1>
                    <div className="profile-page-picture">
                        {userPhoto ? (
                            <img src={userPhoto} alt="Profile Picture"/>
                        ) : (
                            <img
                                src="https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg"
                                alt="Default Profile Picture"
                            />
                        )}
                        <button className="edit-profile-button"
                                onClick={() => router.push('/edit-profile')}>Edit Profile
                        </button>
                        <a href="#"
                           className="delete-account-profile-link"
                           onClick={handleDeleteAccountClick}>Delete
                            Account
                        </a>
                    </div>

                    <div className="profile-content">
                        <div className="profile-info">
                            <p className="profile-item">Name</p>
                            <p className="profile-value">{displayName || 'None Set'}</p>
                            <p className="profile-item">Email</p>
                            <p className="profile-value">{userEmail}</p>
                            <p className="profile-item">Organization</p>
                            <p className="profile-value">{userOrganization}</p>
                            <p className="profile-item">Collected</p>
                            <p className="profile-value">{litterCollected} pounds</p>
                            <p className="profile-item">Bio</p>
                            <p className="profile-value">{userBio}</p>
                            <p className="profile-item">Member</p>
                            <p className="profile-value">
                                {new Date(user.metadata.creationTime).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(ProfilePage);
