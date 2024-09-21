import withAuth from '../components/withAuth';
import {db, useAuth} from '../lib/firebase';
import React, {useEffect, useState} from 'react';
import {collection, doc, getDoc, getDocs} from "firebase/firestore";
import {useRouter} from 'next/router';
import Head from "next/head";
import Script from "next/script";

const ProfilePage = () => {
    const router = useRouter();
    const {user, loading} = useAuth();
    const [userPhoto, setUserPhoto] = useState('');
    const [userBio, setUserBio] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userOrganization, setUserOrganization] = useState('');
    const [litterCollected, setLitterCollected] = useState(0);
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [ambassadorDate, setAmbassadorDate] = useState(null)
    const [memberSince, setMemberSince] = useState(null);
    const [followers, setFollowers] = useState(0);
    const [following, setFollowing] = useState(0);

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
                        setLitterCollected(totalWeight.toFixed());

                        // Check if the user is an ambassador
                        const ambassadorStatus = userData.ambassador || false;
                        setIsAmbassador(ambassadorStatus);

                        if (ambassadorStatus) {
                            const timestamp = userData.ambassador_date;
                            const date = timestamp.toDate();
                            setAmbassadorDate(date);
                        }

                        if (userData.created_time) {
                            const memberSinceDate = new Date(userData.created_time.seconds * 1000);
                            setMemberSince(memberSinceDate);
                        }

                        const followersSnapshot = await getDocs(collection(db, `followers/${user.uid}/userFollowers`));
                        setFollowers(followersSnapshot.size);

                        const followingSnapshot = await getDocs(collection(db, `following/${user.uid}/userFollowing`));
                        setFollowing(followingSnapshot.size);
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
            <Head>
                <title>Your Profile - LitterPic</title>
                <meta name="description"
                      content="View and manage your LitterPic profile, including your posts, likes, and settings."/>
                <meta name="robots" content="index, follow"/>
                <link rel="icon" href="/favicon.ico"/>
                <link rel="canonical" href="https://litterpic.org/profile"/>

                <meta property="og:title" content="Your Profile - LitterPic"/>
                <meta property="og:description"
                      content="View and manage your LitterPic profile, including your posts, likes, and settings."/>
                <meta property="og:image"
                      content="https://firebasestorage.googleapis.com/v0/b/litterpic-fa0bb.appspot.com/o/users%2F9mumST0cjAOdZydKAYMd1HLfwTr2%2Fuploads%2FprofilePhoto?alt=media&token=a5e0151c-ad9f-4e38-87b4-973f3ffed784"/>
                <meta property="og:url" content="https://litterpic.org/profile"/>
                <meta property="og:type" content="website"/>

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content="Your Profile - LitterPic"/>
                <meta name="twitter:description"
                      content="View and manage your LitterPic profile, including your posts, likes, and settings."/>
                <meta name="twitter:image"
                      content="https://firebasestorage.googleapis.com/v0/b/litterpic-fa0bb.appspot.com/o/users%2F9mumST0cjAOdZydKAYMd1HLfwTr2%2Fuploads%2FprofilePhoto?alt=media&token=a5e0151c-ad9f-4e38-87b4-973f3ffed784"/>
                <meta name="twitter:url" content="https://litterpic.org/profile"/>

                <meta name="keywords"
                      content="profile, user profile, account settings, LitterPic profile, social media profile"/>
                <meta name="author" content="LitterPic Inc."/>
            </Head>

            {/* Google Analytics Scripts */}
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-3VZE7E59CL"
                strategy="afterInteractive"
            />
            <Script
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-3VZE7E59CL');
                    `,
                }}
            />

            <div className="banner">
                <img src="/images/user_posts_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text profile-heading">Profile</h1>
                    {isAmbassador && (
                        <div className="ambassador">
                            <i className="material-icons ambassador-icon">public</i>
                            <p className="ambassador-text">{`LitterPic Ambassador since
                                ${new Date(ambassadorDate).toLocaleDateString()}`}</p>
                        </div>

                    )}
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
                            <p className="profile-item">Followers</p>
                            <p className="profile-value">{followers}</p>
                            <p className="profile-item">Following</p>
                            <p className="profile-value">{following}</p>
                            <p className="profile-item">Collected</p>
                            <p className="profile-value">{renderCollected()}</p>
                            <p className="profile-item">Bio</p>
                            <p className="profile-value">{userBio}</p>
                            <p className="profile-item">Member</p>
                            <p className="profile-value">
                                {memberSince ? memberSince.toLocaleDateString() : 'Not Available'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(ProfilePage);
