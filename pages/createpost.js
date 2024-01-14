import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import withAuth from '../components/withAuth';
import {db, ref, storage, useAuth} from '../lib/firebase';
import {addDoc, arrayUnion, collection, deleteDoc, doc, getDoc, runTransaction, updateDoc} from 'firebase/firestore';
import {getDownloadURL, uploadBytesResumable} from 'firebase/storage';
import PlacesAutocomplete, {geocodeByAddress, getLatLng} from 'react-places-autocomplete';
import {useLoadScript} from '@react-google-maps/api';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {capitalizeFirstWordOfSentences} from "../utils/textUtils";

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
    const [litterWeight, setLitterWeight] = useState('');
    const [previews, setPreviews] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [locationSelected, setLocationSelected] = useState(false);
    const [isAddressModified, setAddressModified] = useState(false);
    const [uploading, setUploading] = useState(false);
    const router = useRouter();
    const fileInputRef = React.useRef(null);

    const {isLoaded} = useLoadScript({
        googleMapsApiKey: mapApiKey,
        libraries: libraries,
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
            toast.error('You can select up to 5 images');
        }
    };

    const onFileChange = (e) => {
        if (e.target.files.length > 5) {
            e.target.value = "";
            toast.error('You can select up to 5 images');
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
        const imageUrls = [];

        for (let i = 0; i < postImages.length; i++) {
            const file = postImages[i];
            // const resizedFile = await resizeImage(file, 600, 600);

            const storageRef = ref(storage, `userPosts/${postDocRef.id}/${file.name}`);
            const task = uploadBytesResumable(storageRef, file);
            const snapshot = await task;

            const imageUrl = await getDownloadURL(snapshot.ref);
            imageUrls.push(imageUrl);
        }

        setUploading(false);
        return imageUrls;
    };

    const onSubmit = async (e) => {
        e.preventDefault();

        // Validation checks
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
            const postLitterWeight = litterWeight ? parseInt(litterWeight) : 0;
            // Create a new post document in Firestore
            postDocRef = await addDoc(collection(db, 'userPosts'), {
                postDescription: postDescription,
                litterWeight: postLitterWeight,
                timePosted: new Date(),
                postUser: doc(db, `users/${user.uid}`),
                location: selectedAddress,
                City: city,
                Country: country,
                State: state,
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
            await updateDoc(userRef, {totalWeight: currentUserTotalWeight + postLitterWeight});

            // Clear the form
            setPostDescription('');
            setPostImages([]);
            setLitterWeight('');
            setPreviews([]);
            setSelectedAddress('');
            setLocationSelected(false);

            // Invalidate the cache for the current page containing the deleted post
            localStorage.removeItem('posts_page_1');
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
                            <div>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    placeholder="Pounds of litter collected"
                                    value={litterWeight}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if ((Number(value) >= 0 && Number.isInteger(Number(value))) || value === '') {
                                            setLitterWeight(value);
                                        }
                                    }}
                                />
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
                                                {...getInputProps({
                                                    placeholder: 'Enter a location',
                                                    className: 'location-input',
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
