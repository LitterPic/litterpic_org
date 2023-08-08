import {useState, useEffect} from 'react';
import {auth, db} from '../lib/firebase';
import {useAuth} from '../lib/firebase';
import {useRouter} from 'next/router';
import {updateProfile} from 'firebase/auth';
import {collection, getDocs, doc, updateDoc, getDoc, setDoc, query, where} from 'firebase/firestore';
import {getStorage, ref, uploadBytes, getDownloadURL} from 'firebase/storage';

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
                    console.log("No matching documents.");
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

        const storage = getStorage();
        const storageRef = ref(storage, `users/${auth.currentUser.uid}/uploads/profilePhoto`);
        const snapshot = await uploadBytes(storageRef, file);

        // Get download URL
        const downloadURL = await getDownloadURL(snapshot.ref);

        // Set the download URL in the state so it can be displayed and saved
        setPhotoUrl(downloadURL);
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
                console.log("No matching documents.");
                return;
            }

            const userDocRef = doc(db, 'users', userDocs.docs[0].id);

            await setDoc(userDocRef, {
                bio: bio.trim(),
                display_name: displayName,
                organization: organization,
                photo_url: photoUrl,
            }, {merge: true});

            router.push('/profile');
        } catch (error) {
            console.error(error);
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="banner">
                <img src="/images/editProfileBanner.jpeg" alt="Banner Image"/>
            </div>

            <h1 className="heading-text">Edit Profile</h1>
            <form onSubmit={handleSubmit}>
                <label className="edit-profile-label">
                    Display Name:
                    <input className="edit-profile-input"
                           type="text"
                           value={displayName}
                           onChange={(e) => setDisplayName(e.target.value)}
                           required
                    />
                </label>
                <label className="edit-profile-label">
                    Bio:
                    <textarea className="edit-profile-textarea"
                              value={bio}
                              onChange={(e) => setBio(e.target.value)}
                    ></textarea>
                </label>
                <label className="edit-profile-label">
                    Organization:
                    <select className="edit-profile-select"
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
                <label className="edit-profile-label">
                    Profile Photo:
                    <input className="edit-profile-input"
                           type="file"
                           onChange={handleChange}
                    />
                    {photoUrl && <img src={photoUrl} alt="Profile Preview"/>}
                </label>
                <button className="edit-profile-submit-button" type="submit" disabled={isLoading}>
                    {isLoading ? 'Updating...' : 'Update Profile'}
                </button>
            </form>
        </div>
    );
}
