// pages/[userId].js

import {db} from '../../lib/firebase';
import {useEffect, useState} from 'react';
import {doc, getDoc} from 'firebase/firestore';
import {useRouter} from 'next/router';
import Head from 'next/head';

const UserProfilePage = () => {
    const router = useRouter();
    const [user, setUser] = useState(null);
    const [userPhoto, setUserPhoto] = useState('');
    const [userBio, setUserBio] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [userOrganization, setUserOrganization] = useState('');
    const [litterCollected, setLitterCollected] = useState(0);
    const [memberSince, setMemberSince] = useState(null);
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [ambassadorDate, setAmbassadorDate] = useState(null);

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
                const userId = router.query.userId;
                const userRef = doc(db, `users/${userId}`);
                const userDoc = await getDoc(userRef);

                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUser(userData);
                    setUserPhoto(userData.photo_url);
                    setUserBio(userData.bio);
                    setDisplayName(userData.display_name);
                    setMemberSince(userData.created_time.toDate().toLocaleDateString());
                    setUserOrganization(userData.organization === "Litterpicking Organization" ? "Independent" : userData.organization);

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
                }
            } catch (error) {
                console.error('Error retrieving user profile:', error);
            }
        };


        fetchUserProfile();
    }, [router.query.userId]);

    if (!user) {
        return <p>Loading...</p>;
    }

    return (
        <div>
            <Head>
                <title>Member Profile - LitterPic</title>
                <meta name="description"
                      content="View LitterPic member profiles."/>
                <meta name="robots" content="index, follow"/>
                <link rel="icon" href="/favicon.ico"/>
                <link rel="canonical" href="https://litterpic.org/"/>

                <meta property="og:title" content="Member Profile - LitterPic"/>
                <meta property="og:description"
                      content="View LitterPic member profiles."/>
                <meta property="og:image"
                      content="https://firebasestorage.googleapis.com/v0/b/litterpic-fa0bb.appspot.com/o/users%2F9mumST0cjAOdZydKAYMd1HLfwTr2%2Fuploads%2FprofilePhoto?alt=media&token=a5e0151c-ad9f-4e38-87b4-973f3ffed784"/>
                <meta property="og:url" content="https://litterpic.org/"/>
                <meta property="og:type" content="website"/>

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content="Member Profile - LitterPic"/>
                <meta name="twitter:description"
                      content="View LitterPic member profiles."/>
                <meta name="twitter:image"
                      content="https://firebasestorage.googleapis.com/v0/b/litterpic-fa0bb.appspot.com/o/users%2F9mumST0cjAOdZydKAYMd1HLfwTr2%2Fuploads%2FprofilePhoto?alt=media&token=a5e0151c-ad9f-4e38-87b4-973f3ffed784"/>
                <meta name="twitter:url" content="https://litterpic.org/"/>

                <meta name="keywords"
                      content="profile, member profile, LitterPic profile, social media profile"/>
                <meta name="author" content="LitterPic Inc."/>
            </Head>

            <div className="banner">
                <img src="/images/user_posts_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text profile-heading">{displayName}'s Profile</h1>
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
                    </div>

                    <div className="member-profile-content">
                        <div className="member-profile-info">
                            <p className="member-profile-item">Name</p>
                            <p className="member-profile-value">{displayName || 'None Set'}</p>
                            <p className="member-profile-item">Organization Affiliation</p>
                            <p className="member-profile-value">{userOrganization || 'None'}</p>
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
