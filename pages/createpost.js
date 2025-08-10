import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import withAuth from '../components/withAuth';
import {auth, db, ref, storage, useAuth} from '../lib/firebase';
import {
    addDoc,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    GeoPoint,
    getDoc,
    getDocs,
    getFirestore,
    runTransaction,
    serverTimestamp,
    setDoc,
    updateDoc
} from 'firebase/firestore';
import {getDownloadURL, uploadBytesResumable} from 'firebase/storage';
import PlacesAutocomplete, {geocodeByAddress, getLatLng} from 'react-places-autocomplete';
import {useLoadScript} from '@react-google-maps/api';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {capitalizeFirstWordOfSentences} from "../utils/textUtils";
import {convertToWebP} from "../utils/imageConverter";
import {sendNewPostNotificationEmail} from "../utils/emailService";


const libraries = ['places'];
const mapApiKey = process.env.NEXT_PUBLIC_PLACES_API_KEY;

function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(() => {
            fn(...args);
        }, delay);
    };
}

function CreatePost() {
    const {user} = useAuth();
    const [postDescription, setPostDescription] = useState('');
    const [postImages, setPostImages] = useState([]);
    const [litterWeightInput, setLitterWeightInput] = useState('');
    const [litterWeight, setLitterWeight] = useState(0);
    const [previews, setPreviews] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [locationSelected, setLocationSelected] = useState(false);
    const [isAddressModified, setAddressModified] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [unit, setUnit] = useState('lbs');
    const router = useRouter();
    const fileInputRef = React.useRef(null);
    const [latLng, setLatLng] = useState(null);

    const getAllPostsCacheKey = (page) => `all_posts_cache_page_${page}`;
    const getMyPostsCacheKey = (page, userId) => `my_posts_cache_page_${userId}_${page}`;


    // we can useEffect to handle the conversion when the unit  changes
    //useEffect runs after the components rendered
    // when the unit changes, the #'s of that unit change
    useEffect(() => {
        if (litterWeight !== null) { // Check for non-zero
            const conversionFactor = unit === 'kg' ? 1 / 2.20462 : 2.20462;
            setLitterWeight(parseFloat((litterWeight * conversionFactor).toFixed(2)));
        }
    }, [unit]);

    const {isLoaded} = useLoadScript({
        googleMapsApiKey: mapApiKey,
        libraries: libraries,
        preventGoogleFontsLoading: true,
        version: "weekly",
        // Add loading=async parameter to the URL
        url: `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places&loading=async&v=weekly&callback=initMap`
    });

    const debouncedGeocode = debounce((address) => {
        geocodeByAddress(address)
            .then((results) => getLatLng(results[0]))
            .catch(() => {
            });
    }, 2000);

    useEffect(() => {
        if (selectedAddress) {
            debouncedGeocode(selectedAddress);
        }
    }, [selectedAddress]);

    const onFileInputClick = () => {
        if (fileInputRef.current.files.length > 5) {
            fileInputRef.current.value = "";
            toast.error('Please select less images, you can upload up to 5 photos');
        }
    };

    const onFileChange = (e) => {
        if (e.target.files.length > 5) {
            e.target.value = "";
            toast.error('Please select less images, you can upload up to 5 photos');
            return;
        }

        setPostImages(e.target.files);

        // Generate previews
        let newPreviews = Array.from(e.target.files).map((file) => URL.createObjectURL(file));
        setPreviews(newPreviews);
    };


    const onDescriptionChange = (e) => {
        const capitalizedText = capitalizeFirstWordOfSentences(e.target.value);
        setPostDescription(capitalizedText);
    };

    const handleAddressSelect = async (address, placeId) => {
        setSelectedAddress(address);
        setAddressModified(false);
        setLocationSelected(true);

        try {
            // Use geocodeByAddress to get address details using the placeId
            const results = await geocodeByAddress(address);
            const latLng = await getLatLng(results[0]);
            setLatLng(latLng);

            const addressComponents = results[0]?.address_components || [];

            if (addressComponents.length === 0) {
                console.error("addressComponents is missing or empty!");
                return;
            }

            let city = '';
            let state = '';
            let country = '';

            for (let i = 0; i < addressComponents.length; i++) {
                const component = addressComponents[i];

                if (component.types.includes('locality')) {
                    city = component.long_name;
                }

                if (component.types.includes('administrative_area_level_1')) {
                    state = component.short_name;
                }

                if (component.types.includes('country')) {
                    country = component.long_name;
                }
            }

            setCity(city);
            setState(state);
            setCountry(country);
        } catch (error) {
            console.error("Failed to get address details:", error);
        }
    };


    const uploadImages = async (postDocRef) => {
        setUploading(true);

        const uploadSingleImage = async (file) => {
            // Check if the file is an image that can be converted to WebP
            const isImage = file.type.startsWith('image/');
            const isWebP = file.type === 'image/webp';
            const isVideo = file.type.startsWith('video/');

            // Convert image to WebP if it's not already WebP and not a video
            let fileToUpload = file;
            let fileName = file.name;

            if (isImage && !isWebP && !isVideo) {
                try {
                    // Convert to WebP with 80% quality and max width of 1600px
                    fileToUpload = await convertToWebP(file, { quality: 0.8, maxWidth: 1600 });
                    fileName = `${file.name.split('.')[0]}.webp`;

                    // Log size reduction
                    const originalSizeMB = file.size / (1024 * 1024);
                    const newSizeMB = fileToUpload.size / (1024 * 1024);
                    const reductionPercent = (100 - (newSizeMB / originalSizeMB) * 100).toFixed(0);
                    console.log(`Image size reduced by ${reductionPercent}% (${originalSizeMB.toFixed(2)}MB → ${newSizeMB.toFixed(2)}MB)`);
                } catch (error) {
                    console.error('Error converting image to WebP:', error);
                    // If conversion fails, use the original file
                    fileToUpload = file;
                    fileName = file.name;
                }
            }

            const storageRef = ref(storage, `userPosts/${user.uid}/${fileName}`);
            const task = uploadBytesResumable(storageRef, fileToUpload);

            for (let attempt = 1; attempt <= 3; attempt++) {
                try {
                    const snapshot = await task;
                    const imageUrl = await getDownloadURL(snapshot.ref);

                    // Immediately update the post document with the uploaded image URL
                    await updateDoc(postDocRef, {
                        postPhotos: arrayUnion(imageUrl),
                    });

                    return imageUrl;
                } catch (error) {
                    console.error(`Attempt ${attempt} failed for image ${file.name}:`, error);

                    // Wait 1 second before retrying
                    if (attempt < 3) {
                        await new Promise((resolve) => setTimeout(resolve, 1000));
                    } else {
                        toast.error(`Failed to upload image ${file.name} after 3 attempts.`);
                    }
                }
            }

            return null; // Failed after all attempts
        };

        const promises = Array.from(postImages).map((file) => uploadSingleImage(file));

        const imageUrls = (await Promise.all(promises)).filter(Boolean); // Remove failed uploads

        setUploading(false);

        if (imageUrls.length < postImages.length) {
            toast.warn('Some images failed to upload.');
        }

        return imageUrls;
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        // Validation checks
        if (postImages.length > 10) {
            toast.error('Please select less images, you can upload up to 10 photos');
            return;
        }

        if (litterWeight === '' || Number(litterWeight) < 0) {
            toast.error('Please enter litter weight collected');
            return;
        }

        if (postImages.length === 0) {
            toast.error('Please add at least 1 photo');
            return;
        }

        if (!locationSelected || isAddressModified || !selectedAddress.trim()) {
            toast.error('Please select a valid location from the suggestions');
            return;
        }

        let postDocRef;

        try {
            const postLitterWeightInPounds = unit === 'kg' ? parseFloat(litterWeight) * 2.20462 : parseFloat(litterWeight);
            const roundedLitterWeight = parseFloat(postLitterWeightInPounds.toFixed());
            let geoPoint = null;

            // Check if latLng is not null before attempting to create a GeoPoint
            if (latLng != null) {
                geoPoint = new GeoPoint(latLng.lat, latLng.lng);
            }

            // Create a new post document in Firestore
            postDocRef = await addDoc(collection(db, 'userPosts'), {
                postDescription: postDescription,
                litterWeight: roundedLitterWeight,
                timePosted: new Date(),
                postUser: doc(db, `users/${user.uid}`),
                location: selectedAddress,
                City: city,
                Country: country,
                State: state,
                latLng: geoPoint,
            });

            // Upload the images to Firebase Storage
            const imageUrls = await uploadImages(postDocRef);

            // Update the post document with the image URLs
            await updateDoc(postDocRef, {
                postPhotos: arrayUnion(...imageUrls),
            });

            // Reference to totalWeight document
            const statsRef = doc(db, 'stats', 'totalWeight');

            // Run a transaction to update the total weight
            await runTransaction(db, async (transaction) => {
                // Retrieve the current total weight
                const statsDoc = await transaction.get(statsRef);
                const currentTotalWeight = statsDoc.data().totalWeight;

                // Increment the total weight by the litterWeight from the new post
                transaction.update(statsRef, {totalWeight: currentTotalWeight + parseInt(litterWeight)});
            });

            // Update user's totalWeight
            const userRef = doc(db, `users/${user.uid}`);
            const userDoc = await getDoc(userRef);
            const currentUserTotalWeight = userDoc.data().totalWeight || 0;
            await updateDoc(userRef, {totalWeight: currentUserTotalWeight + postLitterWeightInPounds});

            await notifyFollowersOfNewPost(postDocRef.id);

            const now = new Date();

            // Send email notification about the new post
            try {
                await sendNewPostNotificationEmail(
                    'alek@litterpic.org',  // Recipient email
                    postDescription,
                    roundedLitterWeight,
                    now,
                    selectedAddress,
                    auth.currentUser.email
                );
            } catch (error) {
                console.error("Error sending email notification:", error);
                // Continue with the rest of the function even if email fails
            }

            // Clear the form
            setPostDescription('');
            setPostImages([]);
            setLitterWeightInput('');
            setLitterWeight(0);
            setPreviews([]);
            setSelectedAddress('');
            setLocationSelected(false);

            localStorage.removeItem(getAllPostsCacheKey(1));
            localStorage.removeItem(getMyPostsCacheKey(1, user.uid));
            localStorage.removeItem('totalWeight');

            // Redirect to the /stories.js page
            await router.push('/stories');
        } catch (error) {
            toast.error('Error creating post. Please try again.');

            // Delete the created post document if an error occurs
            if (postDocRef) {
                await deleteDoc(doc(db, 'userPosts', postDocRef.id));
            }
        }
    };

    const notifyFollowersOfNewPost = async (postId) => {
        try {
            // Fetch the post object using the postId
            const postDocRef = doc(db, 'userPosts', postId);
            const postDoc = await getDoc(postDocRef);

            if (!postDoc.exists()) {
                console.error('Post not found for postId:', postId);
                return;
            }

            const post = postDoc.data();

            const postUserRef = post.postUser;
            const postUserDoc = await getDoc(postUserRef);

            if (!postUserDoc.exists()) {
                console.error('User not found for postUser:', postUserRef.id);
                return;
            }

            const postUserData = postUserDoc.data();
            const postUserName = postUserData.display_name || postUserData.email;

            // Fetch the followers of the post author
            const followersSnapshot = await getDocs(collection(db, `followers/${postUserRef.id}/userFollowers`));
            const followers = followersSnapshot.docs.map((doc) => doc.id);

            // Send notifications to all followers
            for (const followerId of followers) {
                await sendNewPostNotification(followerId, postId, postUserName);
            }
        } catch (error) {
            console.error("Error sending notifications to followers:", error);
        }
    };


    const sendNewPostNotification = async (followerId, postId, postUserName) => {
        const db = getFirestore();
        const notificationMessage = `${postUserName} has posted a new story!`;

        const notification = {
            id: doc(collection(db, 'notifications')).id,
            title: 'New Post Alert!',
            message: notificationMessage,
            timestamp: serverTimestamp(),
            isRead: false,
            postId: `userPosts/${postId}`,
            userId: `users/${followerId}`,
        };

        try {
            await setDoc(doc(db, `users/${followerId}/notifications/${notification.id}`), notification);
        } catch (e) {
            console.error("Failed to add notification:", e);
        }
    };

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="banner">
                <img src="/images/create-post-banner.jpeg" alt="Banner Image"/>
                <ToastContainer/>
            </div>
            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Create Post</h1>
                    <div className="create-post-content">
                        <form onSubmit={onSubmit}>
                            <div>
                                {previews.map((preview, index) => (
                                    <img
                                        key={index}
                                        src={preview}
                                        alt="Preview"
                                    />
                                ))}
                            </div>
                            <div>
                                <div>
                                    <input
                                        id="file-input"
                                        className="create-post-file-input"
                                        ref={fileInputRef}
                                        type="file"
                                        multiple
                                        onClick={onFileInputClick}
                                        onChange={onFileChange}
                                        style={{display: 'none'}} // Hide the actual file input
                                    />
                                    <label htmlFor="file-input" className="custom-file-button">
                                        Select Files
                                    </label>
                                    <p className="create-post-limit-message">Select up to 5 photos</p>
                                </div>
                            </div>
                            <div>
                                <textarea
                                    value={postDescription}
                                    onChange={onDescriptionChange}
                                    placeholder="Description"
                                />
                            </div>
                            <div className="litter-container">
                                <input
                                    className="no-increment-decrement hint-placeholder"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="Total amount of litter collected"
                                    value={litterWeightInput}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setLitterWeightInput(value); // Directly update the input display state

                                        if (value === '') {
                                            setLitterWeight(0); // Set the actual litterWeight to 0 if the input is empty
                                        } else {
                                            const numericValue = parseFloat(value);
                                            if (!isNaN(numericValue)) {
                                                setLitterWeight(numericValue); // Update the actual litterWeight with the numeric value
                                            }
                                        }
                                    }}
                                />
                                <div className="radio-buttons">
                                    <label>
                                        <input
                                            type="radio"
                                            name="unitRadio"
                                            value="lbs"
                                            checked={unit === 'lbs'}
                                            onChange={() => setUnit('lbs')}
                                        />
                                        <span>lbs</span>
                                    </label>
                                    <label>
                                        <input
                                            type="radio"
                                            name="unitRadio"
                                            value="kg"
                                            checked={unit === 'kg'}
                                            onChange={() => setUnit('kg')}
                                        />
                                        <span>kg</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <PlacesAutocomplete
                                    value={selectedAddress}
                                    onChange={setSelectedAddress}
                                    onSelect={(address, result) => handleAddressSelect(address, result)}
                                >
                                    {({getInputProps, suggestions, getSuggestionItemProps, loading}) => (
                                        <div>
                                            <input
                                                className="location-input hint-placeholder"
                                                {...getInputProps({
                                                    placeholder: 'Enter a location',
                                                    onKeyDown: (e) => {
                                                        if ((e.key === 'Backspace' || e.key === 'Delete') && selectedAddress !== '') {
                                                            setAddressModified(true);
                                                        }
                                                    },
                                                })}
                                            />
                                            <div className="autocomplete-dropdown-container">
                                                {loading && <div>Loading...</div>}
                                                {suggestions.map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        {...getSuggestionItemProps(suggestion, {
                                                            className: suggestion.active ? 'suggestion-item active' : 'suggestion-item',
                                                        })}
                                                    >
                                                        <span>{suggestion.description}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </PlacesAutocomplete>
                            </div>
                            <div>
                                <button
                                    type="submit"
                                    disabled={uploading}>
                                    {uploading ? 'Uploading...' : 'Create Post'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(CreatePost);
