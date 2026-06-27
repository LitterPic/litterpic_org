// pages/edit-profile/[id].js

import React, { useEffect, useState } from 'react';
import { auth, db, useAuth } from '../../lib/firebase';
import { useRouter } from 'next/router';
import { updateProfile, signOut } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { resizeImage } from '../../components/utils';
import { capitalizeFirstWordOfSentences } from '../../utils/textUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Head from 'next/head';
import OrganizationSelect from '../../components/OrganizationSelect';

export default function EditProfilePage() {
    const { user, loading } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [organization, setOrganization] = useState('Independent');
    const [organizations, setOrganizations] = useState([]);
    const [photoUrl, setPhotoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { id } = router.query;
    const [isRedirecting, setIsRedirecting] = useState(false);

    // Redirect if not logged in and loading is finished
    useEffect(() => {
        if (loading || isRedirecting) return;

        if (!user) {
            router.push('/');
            return;
        }

        if (!user.emailVerified) {
            setIsRedirecting(true);
            toast.error('Please verify your email before editing your profile.', { autoClose: 3000 });
            // Keep policy consistent with login: unverified users should not remain authenticated.
            signOut(auth).catch(() => {});
            router.push('/verify_email');
        }
    }, [loading, user, router, isRedirecting]);

    // Fetch user data and organizations when user and id are available
    useEffect(() => {
        const fetchUserDataAndOrganizations = async () => {
            if (user && id && user.uid === id) {
                const usersCollectionRef = collection(db, 'users');
                const userQuery = query(usersCollectionRef, where('uid', '==', user.uid));
                const userDocs = await getDocs(userQuery);

                if (userDocs.empty) return;

                const userData = userDocs.docs[0].data();
                setDisplayName(userData.display_name || '');
                setBio(userData.bio || '');
                setPhotoUrl(userData.photo_url || '');
                setOrganization(userData.organization || 'Independent');

                const orgsRef = collection(db, 'litterpickingOrganizations');
                const orgsSnapshot = await getDocs(orgsRef);
                let fetchedOrganizations = orgsSnapshot.docs
                    .map((doc) => ({
                        name: doc.data().Name,
                        logoUrl: doc.data().logoUrl || null
                    }))
                    .filter((org) => org.name && org.name.trim() !== '');

                setOrganizations(fetchedOrganizations.sort(sortOrganizations));
            }
        };

        fetchUserDataAndOrganizations();
    }, [user, id]);

    const sortOrganizations = (a, b) => a.name.localeCompare(b.name);

    const checkDisplayNameExists = async (displayName) => {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);

        // Perform case-insensitive comparison on the client side
        return querySnapshot.docs.some((doc) => {
            const existingDisplayName = doc.data().display_name;
            // Check if display_name exists and is a string, then compare
            return (
                typeof existingDisplayName === 'string' &&
                existingDisplayName.toLowerCase() === displayName.toLowerCase() &&
                doc.data().uid !== user.uid
            );
        });
    };

    const DEFAULT_AVATAR = "https://litterpic.org/images/default-avatar.jpg";

    const handleChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const resizedFile = await resizeImage(file, 600, 600);
        const storage = getStorage();
        const storageRef = ref(storage, `users/${auth.currentUser.uid}/uploads/profilePhoto`);
        const snapshot = await uploadBytes(storageRef, resizedFile);
        const downloadURL = await getDownloadURL(snapshot.ref);
        setPhotoUrl(downloadURL);
    };

    const handleFileClick = () => document.getElementById('fileInput').click();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const displayNameTrimmed = displayName.trim();

            const displayNameExists = await checkDisplayNameExists(displayNameTrimmed);
            if (displayNameExists) {
                toast.error('Display name already exists. Please choose a different one.', { autoClose: 2000 });
                setIsLoading(false);
                return;
            }

            const finalPhotoUrl = photoUrl && photoUrl.startsWith('http')
                ? photoUrl
                : DEFAULT_AVATAR;

            await updateProfile(auth.currentUser, {
                displayName: displayNameTrimmed,
                photoURL: finalPhotoUrl,
            });

            const userDocRef = doc(db, 'users', auth.currentUser.uid);

            await setDoc(
                userDocRef,
                {
                    bio: bio.trim(),
                    display_name: displayNameTrimmed,
                    organization: organization,
                    photo_url: finalPhotoUrl,
                    first_login: false,
                    has_visited_profile: true,
                },
                { merge: true }
            );

            toast.success('Profile updated successfully.');
            await router.push('/profile');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Error updating profile.', { autoClose: 2000 });
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Loading...</p>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please login to edit your profile.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-500 py-10 px-4">
            <Head>
                <title>Edit Profile - LitterPic</title>
            </Head>
            {/* Banner */}
            <div className="banner w-full h-40 mb-8">
                <img
                    src="/images/editProfileBanner.jpeg"
                    alt="Banner Image"
                    className="w-full h-full max-h-60 object-cover rounded-lg shadow-md"
                />
            </div>

            {/* Edit Profile Form */}
            <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-6">Edit Profile</h1>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Profile Photo */}
                    <div className="flex items-center">
                        <div className="w-28 h-28 rounded-full overflow-hidden">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Profile Preview" className="object-cover w-full h-full" />
                            ) : (
                                <div className="bg-gray-200 w-full h-full flex items-center justify-center">
                                    <span className="text-gray-500">No Photo</span>
                                </div>
                            )}
                        </div>
                        <div className="ml-6">
                            <input type="file" id="fileInput" className="hidden" onChange={handleChange} />
                            <button
                                type="button"
                                className="px-4 py-2 bg-gradient-to-r from-green-950 to-green-600 text-white rounded-lg shadow-md hover:from-green-600 hover:to-green-950 transition duration-300"
                                onClick={handleFileClick}
                            >
                                Change Profile Photo
                            </button>
                        </div>
                    </div>

                    {/* Display Name */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Display Name</label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            required
                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                        />
                    </div>

                    {/* Bio */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bio</label>
                        <textarea
                            value={bio}
                            onChange={(e) => {
                                const capitalizedText = capitalizeFirstWordOfSentences(e.target.value);
                                setBio(capitalizedText);
                            }}
                            className="mt-1 block w-full h-40 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600"
                        ></textarea>
                    </div>

                    {/* Organization */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                        <OrganizationSelect
                            organizations={organizations}
                            value={organization}
                            onChange={(val) => setOrganization(val)}
                        />
                    </div>

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`w-full py-3 text-white rounded-lg shadow-md ${
                                isLoading
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-green-950 to-green-600 hover:from-green-600 hover:to-green-950 transition duration-300'
                            }`}
                        >
                            {isLoading ? 'Updating...' : 'Update Profile'}
                        </button>
                    </div>
                </form>
                <ToastContainer />
            </div>
        </div>
    );
}
