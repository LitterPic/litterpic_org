import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../lib/firebase';
import withAuth from '../components/withAuth';
import ProfileMeta from '../components/ProfileMeta';
import GoogleAnalytics from '../components/GoogleAnalytics';
import ProfileBanner from '../components/ProfileBanner';
import ProfileHeader from '../components/ProfileHeader';
import ProfileStats from '../components/ProfileStats';
import ProfileInfo from '../components/ProfileInfo';
import { fetchUserProfile } from '../lib/profileHelper';

const ProfilePage = () => {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [profileData, setProfileData] = useState({
        userPhoto: '',
        userBio: '',
        displayName: '',
        userEmail: '',
        userOrganization: '',
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
            <GoogleAnalytics />
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
