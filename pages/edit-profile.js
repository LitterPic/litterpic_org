import {useEffect, useState} from 'react';
import {auth, db, useAuth} from '../lib/firebase';
import {useRouter} from 'next/router';
import {updateProfile} from 'firebase/auth';
import {collection, doc, getDocs, query, setDoc, where} from 'firebase/firestore';
import {getDownloadURL, getStorage, ref, uploadBytes} from 'firebase/storage';
import {capitalizeFirstWordOfSentences} from "../utils/textUtils";

export default function EditProfilePage() {
    const {user} = useAuth();
    const [displayName, setDisplayName] = useState('');
    const [bio, setBio] = useState('');
    const [organization, setOrganization] = useState('');
    const [organizations, setOrganizations] = useState([]);
    const [photoUrl, setPhotoUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

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
                setOrganizations(orgsSnapshot.docs.map(doc => doc.data().Name));
            }
        };

        fetchUserDataAndOrganizations();
    }, [user]);
    const handleChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // const resizedFile = await resizeImage(file, 600, 600);

        const storage = getStorage();
        const storageRef = ref(storage, `users/${auth.currentUser.uid}/uploads/profilePhoto`);
        const snapshot = await uploadBytes(storageRef, file);

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

            // Query the users collection to find the document by uid
            const usersCollectionRef = collection(db, 'users');
            const userQuery = query(usersCollectionRef, where("uid", "==", currentUserUid));
            const userDocs = await getDocs(userQuery);

            if (userDocs.empty) {
                return;
            }

            const userDocRef = doc(db, 'users', currentUserUid);

            await setDoc(userDocRef, {
                bio: bio.trim(),
                display_name: displayName,
                organization: organization,
                photo_url: photoUrl,
                first_login: false,
            }, {merge: true});

            router.push('/profile');
        } catch (error) {
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
                                <select className="edit-profile-organization-select"
                                        value={organization}
                                        onChange={(e) => setOrganization(e.target.value)}
                                >
                                    {organizations.map((org, index) => (
                                        <option key={index} value={org}>
                                            {org}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <button className="edit-profile-submit-button" type="submit" disabled={isLoading}>
                                {isLoading ? 'Updating...' : 'Update Profile'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
