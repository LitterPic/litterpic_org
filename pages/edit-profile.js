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
    const [organization, setOrganization] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [photoUrl, setPhotoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const [showNewOrganizationInput, setShowNewOrganizationInput] = useState(false);
    const [newOrganization, setNewOrganization] = useState('');

    useEffect(() => {
        const fetchUserDataAndOrganizations = async () => {
            if (user) {
                // Query the users collection to find the document by uid
                const usersCollectionRef = collection(db, 'users');
                const userQuery = query(usersCollectionRef, where("uid", "==", user.uid));
                const userDocs = await getDocs(userQuery);

                if (userDocs.empty) {
                    return;
                }

                // Set user's existing data
                const userData = userDocs.docs[0].data();
                setDisplayName(userData.display_name || '');
                setBio(userData.bio || '');
                setPhotoUrl(userData.photo_url || '');
                setOrganization(userData.organization || '');

                // Fetch organizations
                const orgsRef = collection(db, 'litterpickingOrganizations');
                const orgsSnapshot = await getDocs(orgsRef);
                let fetchedOrganizations = orgsSnapshot.docs.map(doc => doc.data().Name);

                // Sort the organizations using the custom sorting function
                let sortedOrganizations = fetchedOrganizations.sort(sortOrganizations);
                setOrganizations(sortedOrganizations);
            }
        };

        fetchUserDataAndOrganizations();
    }, [user]);

    // Sort the Organization list alphabetically
    const sortOrganizations = (a, b) => {
        return a.localeCompare(b);
    };

    const handleAddOrganization = async (e) => {
        e.preventDefault();
        if (newOrganization.trim() === '') {
            toast.error('Please enter an organization name.');
            return;
        }

        // Add the new organization to the database
        const newOrgRef = doc(collection(db, 'litterpickingOrganizations'));
        await setDoc(newOrgRef, {Name: newOrganization});

        // Append 'Other' and then blank ('') at the end of the array
        let updatedOrganizations = [...organizations, newOrganization].sort(sortOrganizations);
        setOrganizations(updatedOrganizations);

        // Set the user's organization to the new organization
        setOrganization(newOrganization);

        toast.success("Organization added successfully.", {
            autoClose: 1000,
        });

        // Send email to review newly added organization
        const now = new Date();

        const newOrganizationAddedTemplateId = "d-b58d5be8b6f54d939f23903badb0107a";
        const newOrganizationTemplateData = {
            orgId: newOrgRef.id,
            organizationName: newOrganization,
            addedDate: now.toDateString(),
            userWhoAdded: auth.currentUser.email,
        };

        fetch("/api/sendEmail", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email: 'alek@litterpic.org',
                templateId: newOrganizationAddedTemplateId,
                templateData: newOrganizationTemplateData,
            }),
        })
            .then((response) => response.json())
            .then(() => {

            })
            .catch((error) => {
                console.error("Error sending email:", error);
            });

        // Reset the new organization input field and hide it
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

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Set the download URL in the state so it can be displayed and saved
        setPhotoUrl(downloadURL);
    };

    const handleFileClick = () => {
        document.getElementById('fileInput').click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const currentUserUid = auth.currentUser.uid;

            await updateProfile(auth.currentUser, {
                displayName: displayName.trim(),
                photoURL: photoUrl
            });

            // If a new organization was added, ensure it's used in the user's profile
            const finalOrganization = showNewOrganizationInput ? newOrganization : organization;

            const userDocRef = doc(db, 'users', currentUserUid);

            await setDoc(userDocRef, {
                bio: bio.trim(),
                display_name: displayName.trim(),
                organization: finalOrganization, // Use the finalOrganization here
                photo_url: photoUrl,
                first_login: false,
            }, {merge: true});
            toast.success("Profile updated successfully.");
            setShowNewOrganizationInput(false);
            router.push('/profile');
        } catch (error) {
            console.error("Error updating profile:", error);
            toast.error("Error updating profile.", {
                autoClose: 1000,
            });
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="banner">
                <img src="/images/editProfileBanner.jpeg" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Edit Profile</h1>
                    <div className="edit-profile-container">
                        <form onSubmit={handleSubmit}>

                            <label className="edit-profile-label">
                                <div className="edit-profile-photo">
                                    {photoUrl && <img src={photoUrl} alt="Profile Preview"/>}
                                </div>
                                <input type="file" id="fileInput" className="edit-profile-file-input"
                                       onChange={handleChange}/>
                                <button type="button" className="edit-profile-photo-button"
                                        onClick={handleFileClick}>Change profile photo
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
                                <select
                                    className="edit-profile-organization-select"
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
                                        <input
                                            className="edit-profile-new-organization-input"
                                            type="text"
                                            value={newOrganization}
                                            onChange={(e) => setNewOrganization(e.target.value)}
                                        />
                                    </label>
                                    <button
                                        className="edit-profile-add-organization-button"
                                        onClick={handleAddOrganization}
                                    >
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
                        <ToastContainer/>
                    </div>
                </div>
            </div>
        </div>
    );
}
