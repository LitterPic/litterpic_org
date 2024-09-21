import {db, useAuth} from '../../lib/firebase';
import React, {useEffect, useState} from 'react';
import {collection, doc, getDoc, getDocs} from 'firebase/firestore';
import {useRouter} from 'next/router';
import Head from 'next/head';
import NotificationSender from "../../utils/notifictionSender";

const UserProfilePage = () => {
    const router = useRouter();
    const {user: currentUser} = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userPhoto, setUserPhoto] = useState('');
    const [userBio, setUserBio] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [userOrganization, setUserOrganization] = useState('');
    const [litterCollected, setLitterCollected] = useState(0);
    const [memberSince, setMemberSince] = useState(null);
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [ambassadorDate, setAmbassadorDate] = useState(null);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);

    const userId = router.query.userId; // The profile user ID

    const renderCollected = () => {
        if (userOrganization === 'Blue Ocean Society') {
            return (
                <a href="https://www.blueoceansociety.org/" target="_blank" rel="noopener noreferrer">
                    Visit Blue Ocean Society
                </a>
            );
        } else {
            return `${litterCollected} pounds`;
        }
    };

    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                if (!userId) return;

                const userRef = doc(db, `users/${userId}`);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setProfileUser(userData);
                    setUserPhoto(userData.photo_url);
                    setUserBio(userData.bio);
                    setDisplayName(userData.display_name);
                    setMemberSince(userData.created_time.toDate().toLocaleDateString());
                    setUserOrganization(userData.organization === "Litterpicking Organization" ? "Independent" : userData.organization);
                    setLitterCollected((userData.totalWeight || 0).toFixed());

                    if (userData.ambassador) {
                        setIsAmbassador(true);
                        setAmbassadorDate(userData.ambassador_date.toDate());
                    }

                    if (currentUser) {
                        const followRef = doc(db, 'followers', userId, 'userFollowers', currentUser.uid);
                        const followDoc = await getDoc(followRef);
                        setIsFollowing(followDoc.exists());
                    }

                    const followersSnapshot = await getDocs(collection(db, `followers/${userId}/userFollowers`));
                    setFollowers(followersSnapshot.size);

                    const followingSnapshot = await getDocs(collection(db, `following/${userId}/userFollowing`));
                    setFollowing(followingSnapshot.size);
                }
            } catch (error) {
                console.error('Error retrieving user profile:', error);
            }
        };

        fetchUserProfile();
    }, [router.query.userId, currentUser]);


    if (!profileUser) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <Head>
                <title>Member Profile - LitterPic</title>
                <meta name="description" content="View LitterPic member profiles."/>
                <link rel="canonical" href="https://litterpic.org/"/>
            </Head>

            <div className="banner">
                <img src="/images/user_posts_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text profile-heading">{displayName}'s Profile</h1>

                    <div className="profile-page-picture">
                        {userPhoto ? (
                            <img src={userPhoto} alt="Profile Picture"/>
                        ) : (
                            <img
                                src="https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg"
                                alt="Default Profile Picture"
                            />
                        )}
                    </div>

                    {isAmbassador && (
                        <div className="ambassador">
                            <i className="material-icons ambassador-icon">public</i>
                            <p className="ambassador-text">{`LitterPic Ambassador since ${new Date(ambassadorDate).toLocaleDateString()}`}</p>
                        </div>
                    )}

                    {/* Follow/Unfollow Button */}
                    {currentUser && currentUser.uid !== userId && (
                        <div>
                            <button
                                onClick={async () => {
                                    if (isFollowing) {
                                        await NotificationSender.handleUnfollow(currentUser, userId);
                                        setIsFollowing(false);
                                    } else {
                                        await NotificationSender.handleFollow(currentUser, userId);
                                        setIsFollowing(true);
                                    }
                                }}
                                className={`follow-button ${isFollowing ? 'following' : ''}`}
                            >
                                {isFollowing ? `Unfollow ${displayName}` : `Follow ${displayName}`}
                            </button>
                        </div>
                    )}

                    <div className="member-profile-content">
                        <div className="member-profile-info">
                            <p className="member-profile-item">Name</p>
                            <p className="member-profile-value">{displayName || 'None Set'}</p>
                            <p className="member-profile-item">Organization Affiliation</p>
                            <p className="member-profile-value">{userOrganization || 'None'}</p>
                            <p className="member-profile-item">Followers</p>
                            <p className="member-profile-value">{followers}</p>
                            <p className="member-profile-item">Following</p>
                            <p className="member-profile-value">{following}</p>
                            <p className="member-profile-item">Litter Collected</p>
                            <p className="member-profile-value">{renderCollected()}</p>
                            <p className="member-profile-item">Biography</p>
                            <p className="member-profile-value">{userBio}</p>
                            <p className="member-profile-item">LitterPic Member Since</p>
                            <p className="member-profile-value">{memberSince}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfilePage;
