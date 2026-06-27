import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import withAuth from '../components/withAuth';
import ProfileMeta from '../components/ProfileMeta';
import ProfileBanner from '../components/ProfileBanner';
import ProfileHeader from '../components/ProfileHeader';
import ProfileStats from '../components/ProfileStats';
import ProfileInfo from '../components/ProfileInfo';
import { fetchUserProfile } from '../lib/profileHelper';

const ProfilePage = () => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [showWelcomeModal, setShowWelcomeModal] = useState(false);
    const [profileData, setProfileData] = useState({
        userPhoto: '',
        userBio: '',
        displayName: '',
        userEmail: '',
        userOrganization: '',
        userOrganizationLogo: '',
        litterCollected: 0,
        isAmbassador: false,
        ambassadorDate: null,
        memberSince: null,
        followers: 0,
        following: 0,
    });

    useEffect(() => {
        if (user) {
            fetchUserProfile(user.uid)
                .then((data) => setProfileData(data))
                .catch((error) => console.error('Error fetching profile:', error));
        }
    }, [user]);

    // Show the welcome prompt only when the login flow redirected here via ?welcome=true
    useEffect(() => {
        if (router.query.welcome === 'true') {
            setShowWelcomeModal(true);
        }
    }, [router.query.welcome]);

    // One-time flag: mark that this user has visited their profile page.
    // The login flow redirects here when has_visited_profile != true; once we
    // set it, subsequent logins go straight to the home page.
    useEffect(() => {
        if (!user) return;

        const markProfileVisited = async () => {
            try {
                const userRef = doc(db, 'users', user.uid);
                const userDoc = await getDoc(userRef);
                if (userDoc.exists() && userDoc.data().has_visited_profile !== true) {
                    await updateDoc(userRef, { has_visited_profile: true });
                }
            } catch (err) {
                // Non-critical — silently swallow errors so the profile page still works
                console.warn('markProfileVisited failed:', err);
            }
        };

        markProfileVisited();
    }, [user]);

    const handleDeleteAccountClick = async () => {
        await router.push('/delete_account');
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!user) {
        return <p>Please login to view your profile.</p>;
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-500 py-10 px-4">
            <ProfileMeta />

            {/* Welcome / profile-update prompt — only shown on the first redirected visit */}
            {showWelcomeModal && (
                <div className="welcome-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="welcome-modal-title">
                    <div className="welcome-modal">
                        <div className="welcome-modal-icon">🌿</div>
                        <h2 id="welcome-modal-title" className="welcome-modal-title">
                            Every Pick Counts!
                        </h2>
                        <p className="welcome-modal-message">
                            You're making the world a cleaner, greener place — one piece of litter at a time.
                            Help the LitterPic community get to know the hero behind the work by completing
                            your profile. Add a photo, bio, and organization so others can be inspired by your story!
                        </p>
                        <div className="welcome-modal-actions">
                            <button
                                className="welcome-modal-btn welcome-modal-btn--primary"
                                onClick={() => {
                                    setShowWelcomeModal(false);
                                    router.push(`/edit-profile/${user.uid}`);
                                }}
                            >
                                Update My Profile
                            </button>
                            <button
                                className="welcome-modal-btn welcome-modal-btn--secondary"
                                onClick={() => setShowWelcomeModal(false)}
                            >
                                Maybe Later
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <ProfileBanner />
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
                <ProfileHeader
                    userPhoto={profileData.userPhoto}
                    displayName={profileData.displayName}
                    userEmail={profileData.userEmail}
                    onEdit={() => router.push(`/edit-profile/${user.uid}`)}
                />
                <ProfileStats
                    followers={profileData.followers}
                    following={profileData.following}
                    userId={user.uid}
                />
                <ProfileInfo
                    userOrganization={profileData.userOrganization}
                    userOrganizationLogo={profileData.userOrganizationLogo}
                    litterCollected={profileData.litterCollected}
                    userBio={profileData.userBio}
                    memberSince={profileData.memberSince}
                    isAmbassador={profileData.isAmbassador}
                    ambassadorDate={profileData.ambassadorDate}
                />
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
