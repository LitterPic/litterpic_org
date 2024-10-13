// pages/edit-profile/[id].js

import React, { useEffect, useState } from 'react';
import { auth, db, useAuth } from '../../lib/firebase';
import { useRouter } from 'next/router';
import { updateProfile } from 'firebase/auth';
import { collection, doc, getDocs, query, setDoc, where } from 'firebase/firestore';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';
import { resizeImage } from '../../components/utils';
import { capitalizeFirstWordOfSentences } from '../../utils/textUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EditProfilePage() {
    const { user } = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [organization, setOrganization] = useState('Independent');
    const [organizations, setOrganizations] = useState([]);
    const [photoUrl, setPhotoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [showNewOrganizationInput, setShowNewOrganizationInput] = useState(false);
    const [newOrganization, setNewOrganization] = useState('');

    useEffect(() => {
        const fetchUserDataAndOrganizations = async () => {
            if (user) {
                const usersCollectionRef = collection(db, 'users');
                const userQuery = query(usersCollectionRef, where('uid', '==', user.uid));
                const userDocs = await getDocs(userQuery);

                if (userDocs.empty) {
                    return;
                }

                const userData = userDocs.docs[0].data();
                setDisplayName(userData.display_name || '');
                setBio(userData.bio || '');
                setPhotoUrl(userData.photo_url || '');
                setOrganization(userData.organization || 'Independent');

                const orgsRef = collection(db, 'litterpickingOrganizations');
                const orgsSnapshot = await getDocs(orgsRef);
                let fetchedOrganizations = orgsSnapshot.docs
                    .map((doc) => doc.data().Name)
                    .filter((org) => org && org.trim() !== '');

                let sortedOrganizations = fetchedOrganizations.sort(sortOrganizations);
                setOrganizations(sortedOrganizations);
            }
        };

        fetchUserDataAndOrganizations();
    }, [user]);

    const sortOrganizations = (a, b) => a.localeCompare(b);

    const checkDisplayNameExists = async (displayName) => {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);

        // Perform case-insensitive comparison on the client side
        return querySnapshot.docs.some(
            (doc) =>
                doc.data().display_name.toLowerCase() === displayName.toLowerCase() && doc.data().uid !== user.uid
        );
    };

    const handleAddOrganization = async (e) => {
        e.preventDefault();
        if (newOrganization.trim() === '') {
            toast.error('Please enter an organization name.', { autoClose: 2000 });
            return;
        }

        const newOrgNameNormalized = newOrganization.trim().toLowerCase();
        const organizationExists = organizations.some((org) => org.toLowerCase() === newOrgNameNormalized);
        if (organizationExists) {
            toast.error('An organization with the same name already exists.', { autoClose: 2000 });
            setNewOrganization('');
            return;
        }

        const newOrgRef = doc(collection(db, 'litterpickingOrganizations'));
        await setDoc(newOrgRef, { Name: newOrganization });

        let updatedOrganizations = [...organizations, newOrganization].sort(sortOrganizations);
        setOrganizations(updatedOrganizations);
        setOrganization(newOrganization);
        toast.success('Organization added successfully.', { autoClose: 2000 });

        setNewOrganization('');
        setShowNewOrganizationInput(false);
    };

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

            // Check if the display name exists (case-insensitive)
            const displayNameExists = await checkDisplayNameExists(displayNameTrimmed);
            if (displayNameExists) {
                toast.error('Display name already exists. Please choose a different one.', { autoClose: 2000 });
                setIsLoading(false);
                return;
            }

            await updateProfile(auth.currentUser, {
                displayName: displayNameTrimmed,
                photoURL: photoUrl,
            });

            const finalOrganization = showNewOrganizationInput ? newOrganization : organization;
            const userDocRef = doc(db, 'users', auth.currentUser.uid);

            await setDoc(
                userDocRef,
                {
                    bio: bio.trim(),
                    display_name: displayNameTrimmed,
                    organization: finalOrganization,
                    photo_url: photoUrl,
                    first_login: false,
                },
                { merge: true }
            );

            toast.success('Profile updated successfully.');
            setShowNewOrganizationInput(false);
            await router.push('/profile');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Error updating profile.', { autoClose: 2000 });
            setIsLoading(false);
        }
    };

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p>Please login to edit your profile.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-green-950 to-green-500 py-10 px-4">
            {/* Banner */}
            <div className="banner w-full h-40 mb-8">
                <img
                    src="/images/editProfileBanner.jpeg"
                    alt="Banner Image"
                    className="w-full h-full object-cover rounded-lg shadow-md"
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
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
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
                            className="mt-1 block w-full h-40 rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
                        ></textarea>
                    </div>

                    {/* Organization */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Organization</label>
                        <select
                            value={organization}
                            onChange={(e) => {
                                setOrganization(e.target.value);
                                setShowNewOrganizationInput(e.target.value === 'Other');
                            }}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
                        >
                            {organizations.map((org, index) => (
                                <option key={index} value={org}>
                                    {org}
                                </option>
                            ))}
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* New Organization Input */}
                    {showNewOrganizationInput && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Enter a New Organization</label>
                            <input
                                type="text"
                                value={newOrganization}
                                onChange={(e) => setNewOrganization(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green-600 focus:border-green-600"
                            />
                            <button
                                className="mt-2 px-4 py-2 bg-gradient-to-r from-green-950 to-green-600 text-white rounded-lg shadow-md hover:from-green-600 hover:to-green-950 transition duration-300"
                                onClick={handleAddOrganization}
                            >
                                Add New Organization
                            </button>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div>
                        <button
                            type="submit"
                            disabled={isLoading || showNewOrganizationInput}
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
