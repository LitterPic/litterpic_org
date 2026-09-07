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
import {generateCollage, blobToFile} from "../utils/collageGenerator";
import { trackPostCreated } from '../lib/ga';
import Head from 'next/head';
import {
    FaArrowRight,
    FaCamera,
    FaCheck,
    FaImage,
    FaMapMarkerAlt,
    FaPen,
    FaSyncAlt,
    FaTimes,
    FaWeightHanging
} from 'react-icons/fa';

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
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [unit, setUnit] = useState('lbs');
    const [locationSearchError, setLocationSearchError] = useState('');
    const router = useRouter();
    const fileInputRef = React.useRef(null);
    const replaceInputRef = React.useRef(null);
    const replaceImageIndexRef = React.useRef(null);
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

    const onFileChange = (e) => {
        const filesArray = Array.from(e.target.files);

        if (postImages.length + filesArray.length > 5) {
            e.target.value = "";
            toast.error(`You can add ${5 - postImages.length} more ${postImages.length === 4 ? 'photo' : 'photos'}`);
            return;
        }

        const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
        setPostImages((images) => [...images, ...filesArray]);
        setPreviews((images) => [...images, ...newPreviews]);
        e.target.value = '';
    };

    const openReplaceImagePicker = (index) => {
        replaceImageIndexRef.current = index;
        replaceInputRef.current.value = '';
        replaceInputRef.current.click();
    };

    const onReplaceImage = (e) => {
        const replacementFile = e.target.files?.[0];
        const indexToReplace = replaceImageIndexRef.current;

        if (!replacementFile || indexToReplace === null) return;

        URL.revokeObjectURL(previews[indexToReplace]);
        const replacementPreview = URL.createObjectURL(replacementFile);
        setPostImages((images) => images.map((image, index) => index === indexToReplace ? replacementFile : image));
        setPreviews((images) => images.map((preview, index) => index === indexToReplace ? replacementPreview : preview));
        replaceImageIndexRef.current = null;
        e.target.value = '';
    };

    const removeImage = (indexToRemove) => {
        URL.revokeObjectURL(previews[indexToRemove]);
        setPostImages((images) => images.filter((_, index) => index !== indexToRemove));
        setPreviews((images) => images.filter((_, index) => index !== indexToRemove));
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
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
            setLocationSearchError('We could not confirm that location. Please try another search.');
        }
    };

    const handleLocationSearchError = (status) => {
        console.error('Location search failed:', status);
        setLocationSearchError('Location search is temporarily unavailable. Please try again shortly.');
    };

    const highlightSuggestionRow = (event) => {
        event.currentTarget.style.backgroundColor = '#d8f3df';
        event.currentTarget.style.borderLeftColor = '#015e41';
        event.currentTarget.style.color = '#015e41';
    };

    const clearSuggestionRowHighlight = (event) => {
        if (event.currentTarget.contains(event.relatedTarget)) return;
        event.currentTarget.style.backgroundColor = '';
        event.currentTarget.style.borderLeftColor = '';
        event.currentTarget.style.color = '';
    };


    const uploadImages = async (postDocRef) => {
        setUploading(true);

        // Create date folder in format: MMDDYYYY (matching Flutter app)
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const year = now.getFullYear();
        const dateFolder = `${month}${day}${year}`;

        // Generate collage if there are 2+ images
        let collageFile = null;
        if (postImages.length >= 2) {
            try {
                console.log('Generating collage for post with', postImages.length, 'images');
                const collageBlob = await generateCollage(postImages);
                if (collageBlob) {
                    collageFile = blobToFile(collageBlob, `collage_${Date.now()}.png`);
                    console.log('Collage generated successfully');
                }
            } catch (error) {
                console.error('Failed to generate collage:', error);
                toast.warn('Could not generate collage preview, continuing with regular upload');
            }
        }

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

            // Store images in date-organized folders: userPosts/MMDDYYYY/userId/filename
            const storageRef = ref(storage, `userPosts/${dateFolder}/${user.uid}/${fileName}`);
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

        // Upload collage first if it exists
        const imagesToUpload = collageFile ? [collageFile, ...postImages] : postImages;
        const promises = imagesToUpload.map((file) => uploadSingleImage(file));

        const imageUrls = (await Promise.all(promises)).filter(Boolean); // Remove failed uploads

        setUploading(false);

        if (imageUrls.length < imagesToUpload.length) {
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
        setIsSubmitting(true);

        try {
            const postLitterWeightInPounds = unit === 'kg' ? parseFloat(litterWeight) * 2.20462 : parseFloat(litterWeight);
            const roundedLitterWeight = Math.round(postLitterWeightInPounds);
            let geoPoint = null;

            // Check if latLng is not null before attempting to create a GeoPoint
            if (latLng != null) {
                geoPoint = new GeoPoint(latLng.lat, latLng.lng);
            }

            const userRef = doc(db, `users/${user.uid}`);
            const userDoc = await getDoc(userRef);
            const organization = userDoc.data()?.organization || 'Independent';

            // Create a new post document in Firestore
            postDocRef = await addDoc(collection(db, 'userPosts'), {
                postDescription: postDescription,
                litterWeight: roundedLitterWeight,
                timePosted: new Date(),
                postUser: doc(db, `users/${user.uid}`),
                organization: organization,
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
                transaction.update(statsRef, {totalWeight: currentTotalWeight + roundedLitterWeight});
            });

            // Update user's totalWeight
            const currentUserDoc = await getDoc(userRef);
            const currentUserTotalWeight = currentUserDoc.data().totalWeight || 0;
            await updateDoc(userRef, {totalWeight: currentUserTotalWeight + roundedLitterWeight});

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
            previews.forEach((preview) => URL.revokeObjectURL(preview));
            setPreviews([]);
            setSelectedAddress('');
            setLocationSelected(false);

            localStorage.removeItem(getAllPostsCacheKey(1));
            localStorage.removeItem(getMyPostsCacheKey(1, user.uid));
            localStorage.removeItem('totalWeight');

            trackPostCreated(roundedLitterWeight, selectedAddress);

            // Redirect to the /stories.js page
            await router.push('/stories');
        } catch (error) {
            toast.error('Error creating post. Please try again.');

            // Delete the created post document if an error occurs
            if (postDocRef) {
                await deleteDoc(doc(db, 'userPosts', postDocRef.id));
            }
        } finally {
            setIsSubmitting(false);
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
        <div className="create-post-page">
            <Head>
                <title>Create Post - LitterPic</title>
            </Head>
            <ToastContainer/>
            <header className="create-post-hero">
                <img src="/images/create-post-banner.jpeg" alt="Volunteers collecting litter outdoors"/>
                <div className="create-post-hero-shade"/>
                <div className="create-post-hero-copy">
                    <span className="create-post-kicker">Share your impact</span>
                    <h1>Create a LitterPic</h1>
                    <p>Turn today&apos;s cleanup into momentum for your community.</p>
                </div>
            </header>

            <div className="create-post-workspace">
                <div className="create-post-intro">
                    <div>
                        <span className="create-post-eyebrow">New story</span>
                        <h2>Inspire action with your story</h2>
                    </div>
                    <div className="create-post-progress" aria-label="Post requirements">
                        <span className={previews.length ? 'complete' : ''}><FaCamera/> Photos</span>
                        <span className={litterWeightInput ? 'complete' : ''}><FaWeightHanging/> Weight</span>
                        <span className={locationSelected && !isAddressModified ? 'complete' : ''}><FaMapMarkerAlt/> Location</span>
                    </div>
                </div>

                <form className="create-post-composer" onSubmit={onSubmit}>
                    <section className="create-post-media-section" aria-labelledby="photo-heading">
                        <div className="create-post-section-heading">
                            <span className="create-post-step">01</span>
                            <div>
                                <h3 id="photo-heading">Add your photos</h3>
                                <p>Choose the photos that tell your story. Add up to five.</p>
                            </div>
                        </div>

                        <input
                            id="file-input"
                            className="create-post-file-input"
                            ref={fileInputRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            onChange={onFileChange}
                        />
                        <input
                            className="create-post-file-input"
                            ref={replaceInputRef}
                            type="file"
                            accept="image/*,video/*"
                            onChange={onReplaceImage}
                        />

                        {previews.length === 0 ? (
                            <label htmlFor="file-input" className="create-post-dropzone">
                                <span className="create-post-camera"><FaCamera/></span>
                                <strong>Choose photos</strong>
                                <span>JPG, PNG, WebP or video</span>
                            </label>
                        ) : (
                            <div className="create-post-preview-grid">
                                {previews.map((preview, index) => (
                                    <figure className={index === 0 ? 'featured' : ''} key={preview}>
                                        {postImages[index]?.type.startsWith('video/') ? (
                                            <video src={preview} aria-label={`Selected cleanup video ${index + 1}`} muted/>
                                        ) : (
                                            <img src={preview} alt={`Selected cleanup photo ${index + 1}`}/>
                                        )}
                                        {index === 0 && <figcaption>First photo</figcaption>}
                                        <button
                                            type="button"
                                            className="create-post-replace-image"
                                            onClick={() => openReplaceImagePicker(index)}
                                            aria-label={`Replace photo ${index + 1}`}
                                            title="Replace photo"
                                        >
                                            <FaSyncAlt/>
                                        </button>
                                        <button
                                            type="button"
                                            className="create-post-remove-image"
                                            onClick={() => removeImage(index)}
                                            aria-label={`Remove photo ${index + 1}`}
                                            title="Remove photo"
                                        >
                                            <FaTimes/>
                                        </button>
                                    </figure>
                                ))}
                                {previews.length < 5 && (
                                    <label htmlFor="file-input" className="create-post-add-more">
                                        <FaImage/>
                                        <span>Add photos</span>
                                    </label>
                                )}
                                <p className="create-post-preview-note">
                                    <FaImage/>
                                    <span>{previews.length > 1 ? 'Your post opens with an automatic collage, then shows every photo in full.' : 'Your photo will be shown in full on the published post.'}</span>
                                </p>
                            </div>
                        )}
                    </section>

                    <section className="create-post-details-section" aria-labelledby="details-heading">
                        <div className="create-post-section-heading">
                            <span className="create-post-step">02</span>
                            <div>
                                <h3 id="details-heading">Tell the story</h3>
                                <p>A few details make every cleanup count.</p>
                            </div>
                        </div>

                        <div className="create-post-field litter-container">
                            <label htmlFor="litter-weight"><FaWeightHanging/> Litter collected</label>
                            <div className="create-post-weight-row">
                                <input
                                    id="litter-weight"
                                    className="no-increment-decrement hint-placeholder"
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder="0"
                                    value={litterWeightInput}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        setLitterWeightInput(value);

                                        if (value === '') {
                                            setLitterWeight(0);
                                        } else {
                                            const numericValue = parseFloat(value);
                                            if (!isNaN(numericValue)) {
                                                setLitterWeight(numericValue);
                                            }
                                        }
                                    }}
                                />
                                <div className="radio-buttons" aria-label="Weight unit">
                                    <label>
                                        <input type="radio" name="unitRadio" value="lbs" checked={unit === 'lbs'} onChange={() => setUnit('lbs')}/>
                                        <span>lbs</span>
                                    </label>
                                    <label>
                                        <input type="radio" name="unitRadio" value="kg" checked={unit === 'kg'} onChange={() => setUnit('kg')}/>
                                        <span>kg</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="create-post-field location-container">
                            <label htmlFor="cleanup-location"><FaMapMarkerAlt/> Cleanup location</label>
                            {isLoaded && mapApiKey ? (
                                <PlacesAutocomplete value={selectedAddress} onChange={(address) => {
                                    setSelectedAddress(address);
                                    setAddressModified(true);
                                    setLocationSelected(false);
                                    setLocationSearchError('');
                                }} onSelect={(address, result) => handleAddressSelect(address, result)} onError={handleLocationSearchError}>
                                    {({getInputProps, suggestions, getSuggestionItemProps, loading}) => (
                                        <div className="create-post-autocomplete">
                                            <input
                                                id="cleanup-location"
                                                className="location-input hint-placeholder"
                                                {...getInputProps({placeholder: 'Search for a city or place'})}
                                            />
                                            {(loading || suggestions.length > 0) && (
                                                <div className="autocomplete-dropdown-container">
                                                    {loading && <div className="suggestion-item">Finding places...</div>}
                                                    {suggestions.map((suggestion, index) => {
                                                        const suggestionProps = getSuggestionItemProps(suggestion, {
                                                            className: suggestion.active ? 'suggestion-item active' : 'suggestion-item',
                                                        });
                                                        const {key, ...restProps} = suggestionProps;
                                                        return (
                                                            <div
                                                                key={key || index}
                                                                {...restProps}
                                                                onMouseOverCapture={highlightSuggestionRow}
                                                                onMouseOutCapture={clearSuggestionRowHighlight}
                                                            >
                                                                <FaMapMarkerAlt/>
                                                                <span>{suggestion.description}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            {locationSelected && !isAddressModified && <span className="create-post-valid"><FaCheck/> Location selected</span>}
                                        </div>
                                    )}
                                </PlacesAutocomplete>
                            ) : (
                                <input
                                    id="cleanup-location"
                                    className="location-input hint-placeholder"
                                    placeholder={mapApiKey ? 'Loading location services...' : 'Location search is not configured'}
                                    disabled
                                />
                            )}
                            {(!mapApiKey || locationSearchError) && (
                                <span className="create-post-location-error" role="alert">
                                    {locationSearchError || 'Location search needs a Google Maps API key.'}
                                </span>
                            )}
                        </div>

                        <div className="create-post-field description-container">
                            <label htmlFor="post-description"><FaPen/> What happened?</label>
                            <textarea
                                id="post-description"
                                value={postDescription}
                                onChange={onDescriptionChange}
                                placeholder="Share the cleanup, what you found, or who joined you..."
                                maxLength={1000}
                            />
                            <span className="create-post-character-count">{postDescription.length}/1000</span>
                        </div>

                        <button className="create-post-submit" type="submit" disabled={uploading || isSubmitting}>
                            <span>{isSubmitting ? (uploading ? 'Uploading photos...' : 'Publishing...') : 'Publish LitterPic'}</span>
                            {!isSubmitting && <FaArrowRight/>}
                        </button>
                    </section>
                </form>
            </div>
        </div>
    );
}

export default withAuth(CreatePost);
