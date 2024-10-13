import withAuth from '../components/withAuth';
import { db, useAuth } from '../lib/firebase';
import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useRouter } from 'next/router';
import Head from "next/head";
import Script from "next/script";

const ProfilePage = () => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [userPhoto, setUserPhoto] = useState('');
    const [userBio, setUserBio] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [userOrganization, setUserOrganization] = useState('');
    const [litterCollected, setLitterCollected] = useState(0);
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [ambassadorDate, setAmbassadorDate] = useState(null);
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

    const userId = user?.uid;

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-500 py-10 px-4">
            <Head>
                <title>Your Profile - LitterPic</title>
                {/* Meta tags and other head elements remain unchanged */}
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

            {/* Banner */}
            <div className="banner w-full h-40 mb-8">
                <img src="/images/user_posts_banner.webp" alt="Banner Image" className="w-full h-full object-cover rounded-lg shadow-md" />
            </div>

            {/* Profile Main Section */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
                {/* Profile Header Section */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-28 h-28 rounded-full overflow-hidden">
                            <img
                                src={userPhoto || "https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg"}
                                alt="Profile Picture"
                                className="object-cover w-full h-full"
                            />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-800">{displayName || "No Display Name"}</h1>
                            <p className="text-sm text-gray-500 mt-1">{userEmail}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => router.push(`/edit-profile/${userId}`)}
                        className="px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-950 to-green-600 rounded-lg shadow-md hover:from-green-600 hover:to-green-950 transition duration-300"
                    >
                        Edit Profile
                    </button>
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
                        <p className="text-sm text-gray-500 font-semibold">Organization</p>
                        <p className="text-md text-gray-800">{userOrganization || "Independent"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold">Collected</p>
                        <p className="text-md text-gray-800">{renderCollected()}</p>
                    </div>
                    <div className="md:col-span-2">
                        <p className="text-sm text-gray-500 font-semibold">Bio</p>
                        <p className="text-md text-gray-800">{userBio || "No Bio Available"}</p>
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 font-semibold">Member Since</p>
                        <p className="text-md text-gray-800">{memberSince ? memberSince.toLocaleDateString() : "Not Available"}</p>
                    </div>
                </div>

                {/* Delete Account Section */}
                <div className="mt-10 text-center">
                    <a
                        href="#"
                        className="text-red-600 font-semibold hover:underline"
                        onClick={handleDeleteAccountClick}
                    >
                        Delete Account
                    </a>
                </div>
            </div>
        </div>
    );
};

export default withAuth(ProfilePage);
