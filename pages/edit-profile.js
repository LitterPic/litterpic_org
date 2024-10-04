import React, {useEffect, useState} from 'react';
import {auth, db, useAuth} from '../lib/firebase';
import {useRouter} from 'next/router';
import {updateProfile} from 'firebase/auth';
import {collection, doc, getDocs, query, setDoc, where} from 'firebase/firestore';
import {getDownloadURL, getStorage, ref, uploadBytes} from 'firebase/storage';
import {resizeImage} from "../components/utils";
import {capitalizeFirstWordOfSentences} from "../utils/textUtils";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function EditProfilePage() {
    const {user} = useAuth();
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
                const userQuery = query(usersCollectionRef, where("uid", "==", user.uid));
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
                let fetchedOrganizations = orgsSnapshot.docs.map(doc => doc.data().Name)
                    .filter(org => org && org.trim() !== '');

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
        return querySnapshot.docs.some(doc =>
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
        const organizationExists = organizations.some(org => org.toLowerCase() === newOrgNameNormalized);
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
        toast.success("Organization added successfully.", { autoClose: 2000 });

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
                photoURL: photoUrl
            });

            const finalOrganization = showNewOrganizationInput ? newOrganization : organization;
            const userDocRef = doc(db, 'users', auth.currentUser.uid);

            await setDoc(userDocRef, {
                bio: bio.trim(),
                display_name: displayNameTrimmed,
                organization: finalOrganization,
                photo_url: photoUrl,
                first_login: false,
            }, { merge: true });

            toast.success("Profile updated successfully.");
            setShowNewOrganizationInput(false);
            await router.push('/profile');
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Error updating profile.", { autoClose: 2000 });
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="banner">
                <img src="/images/editProfileBanner.jpeg" alt="Banner Image" />
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Edit Profile</h1>
                    <div className="edit-profile-container">
                        <form onSubmit={handleSubmit}>
                            <label className="edit-profile-label">
                                <div className="edit-profile-photo">
                                    {photoUrl && <img src={photoUrl} alt="Profile Preview" />}
                                </div>
                                <input type="file" id="fileInput" className="edit-profile-file-input"
                                       onChange={handleChange} />
                                <button type="button" className="edit-profile-photo-button" onClick={handleFileClick}>
                                    Change profile photo
                                </button>
                            </label>
                            <label className="edit-profile-label">
                                Display Name:
                                <input className="edit-profile-name-input"
                                       type="text"
                                       value={displayName}
                                       onChange={(e) => setDisplayName(e.target.value)}
                                       required
                                />
                            </label>
                            <label className="edit-profile-label">
                                Bio:
                                <textarea className="edit-profile-bio-textarea"
                                          value={bio}
                                          onChange={(e) => {
                                              const capitalizedText = capitalizeFirstWordOfSentences(e.target.value);
                                              setBio(capitalizedText);
                                          }}
                                ></textarea>
                            </label>
                            <label className="edit-profile-label">
                                Organization:
                                <select className="edit-profile-organization-select"
                                        value={organization}
                                        onChange={(e) => {
                                            setOrganization(e.target.value);
                                            setShowNewOrganizationInput(e.target.value === 'Other');
                                        }}
                                >
                                    {organizations.map((org, index) => (
                                        <option key={index} value={org}>
                                            {org}
                                        </option>
                                    ))}
                                    <option value="Other">Other</option>
                                </select>
                            </label>

                            {showNewOrganizationInput && (
                                <>
                                    <label className="edit-profile-label">
                                        Enter A New Organization:
                                        <input className="edit-profile-new-organization-input"
                                               type="text"
                                               value={newOrganization}
                                               onChange={(e) => setNewOrganization(e.target.value)}
                                        />
                                    </label>
                                    <button className="edit-profile-add-organization-button" onClick={handleAddOrganization}>
                                        Add A New Organization
                                    </button>
                                </>
                            )}
                            <button className="edit-profile-submit-button"
                                    type="submit"
                                    disabled={isLoading || showNewOrganizationInput}>
                                {isLoading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                        <ToastContainer />
                    </div>
                </div>
            </div>
        </div>
    );
}
