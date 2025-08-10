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
        <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-500 py-10 px-4">
            <Head>
                <title>Member Profile - LitterPic</title>
                <meta name="description" content="View LitterPic member profiles." />
                <link rel="canonical" href="https://litterpic.org/" />
            </Head>

            {/* Banner */}
            <div className="w-full h-40 mb-8">
                <img src="/images/user_posts_banner.webp" alt="Banner Image" className="w-full h-full object-cover rounded-lg shadow-md" />
            </div>

            {/* Profile Main Section */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
                {/* Profile Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-28 h-28 rounded-full overflow-hidden">
                            <img
                                src={userPhoto || "/images/default-avatar.jpg"}
                                alt="Profile Picture"
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{displayName || "No Display Name"}</h1>
                            <p className="text-sm text-gray-500 mt-1">{userOrganization || "Independent"}</p>
                        </div>
                    </div>
                    {currentUser && currentUser.uid !== userId && (
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
                            className={`mt-4 px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-950 to-green-600 rounded-lg shadow-md transition duration-300 ${
                                isFollowing ? 'hover:from-green-600 hover:to-green-950' : ''
                            }`}
                        >
                            {isFollowing ? `Following ${displayName}` : `Follow ${displayName}`}
                        </button>
                    )}
                </div>

                {/* Profile Stats (Followers & Following) */}
                <div className="flex gap-10 mt-8">
                    <div
                        onClick={() => router.push(`/user/${userId}/followers`)}
                        className="cursor-pointer text-center hover:bg-green-100 hover:shadow-lg rounded-md transition duration-200 ease-in-out"
                    >
                        <p className="text-2xl font-bold text-green-950 hover:text-green-700 transition duration-200 ease-in-out">{followers}</p>
                        <p className="text-gray-600 hover:text-gray-800 transition duration-200 ease-in-out">Followers</p>
                    </div>
                    <div
                        onClick={() => router.push(`/user/${userId}/following`)}
                        className="cursor-pointer text-center hover:bg-green-100 hover:shadow-lg rounded-md transition duration-200 ease-in-out"
                    >
                        <p className="text-2xl font-bold text-green-950 hover:text-green-700 transition duration-200 ease-in-out">{following}</p>
                        <p className="text-gray-600 hover:text-gray-800 transition duration-200 ease-in-out">Following</p>
                    </div>
                </div>

                {/* Ambassador Section */}
                {isAmbassador && (
                    <div className="bg-gradient-to-r from-green-950 to-green-700 text-white rounded-lg shadow-md p-4 mt-8 flex items-center gap-3">
                        <i className="material-icons text-xl">public</i>
                        <p className="text-md">{`LitterPic Ambassador since ${new Date(ambassadorDate).toLocaleDateString()}`}</p>
                    </div>
                )}

                {/* Profile Info Section */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
                    <div>
                        <p className="text-sm text-gray-500 font-semibold">Litter Collected</p>
                        <p className="text-md text-gray-800">{renderCollected()}</p>
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 font-semibold">Biography</p>
                        <p className="text-md text-gray-800">{userBio || "No Bio Available"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold">Member Since</p>
                        <p className="text-md text-gray-800">{memberSince || "Not Available"}</p>
                    </div>
                </div>
            </div>
        </div>
    );

};

export default UserProfilePage;
