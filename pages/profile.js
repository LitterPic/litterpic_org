import withAuth from '../components/withAuth';
import {useAuth} from '../lib/firebase';
import {useState, useEffect} from 'react';
import {db} from '../lib/firebase';
import {getFirestore, doc, getDoc, collection, query, where, getDocs} from "firebase/firestore";

const ProfilePage = () => {
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

                        const userPostsRef = collection(db, 'userPosts');
                        const q = query(userPostsRef, where('postUser', '==', userRef));
                        const querySnapshot = await getDocs(q);

                        let sumLitterCollected = 0;
                        querySnapshot.forEach((doc) => {
                            const post = doc.data();
                            sumLitterCollected += post.litterWeight;
                        });

                        setLitterCollected(sumLitterCollected);
                    }
                } catch (error) {
                    console.error('Error retrieving user profile:', error);
                }
            }
        };

        fetchUserProfile();
    }, [user]);

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

                    <div className="profile-content">
                        <div className="profile-info">
                            <p className="profile-item">Display Name</p>
                            <p className="profile-value">{displayName || 'None Set'}</p>
                            <p className="profile-item">Email</p>
                            <p className="profile-value">{userEmail}</p>
                            <p className="profile-item">Your Organization</p>
                            <p className="profile-value">{userOrganization}</p>
                            <p className="profile-item">Litter Collected</p>
                            <p className="profile-value">{litterCollected} pounds</p>
                            <p className="profile-item">Your Bio</p>
                            <p className="profile-value">{userBio}</p>
                            <p className="profile-item">Member Since</p>
                            <p className="profile-value">
                                {new Date(user.metadata.creationTime).toLocaleDateString()}
                            </p>
                        </div>
                        <div className="profile-picture">
                            {userPhoto ? (
                                <img src={userPhoto} alt="Profile Picture"/>
                            ) : (
                                <img
                                    src="https://w7.pngwing.com/pngs/340/946/png-transparent-avatar-user-computer-icons-software-developer-avatar-child-face-heroes.png"
                                    alt="Default Profile Picture"
                                />
                            )}
                            <a className="edit-profile-button" href="/edit-profile">
                                Edit Profile
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(ProfilePage);
