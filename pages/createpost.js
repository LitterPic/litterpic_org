import React, {useEffect, useState} from 'react';
import {useRouter} from 'next/router';
import withAuth from '../components/withAuth';
import {db, ref, storage, useAuth} from '../lib/firebase';
import {addDoc, arrayUnion, collection, deleteDoc, doc, updateDoc} from 'firebase/firestore';
import {getDownloadURL, uploadBytesResumable} from 'firebase/storage';
import PlacesAutocomplete, {geocodeByAddress, getLatLng} from 'react-places-autocomplete';
import {useLoadScript} from '@react-google-maps/api';
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const libraries = ['places'];
const mapApiKey = process.env.NEXT_PUBLIC_PLACES_API_KEY;

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

    useEffect(() => {
        if (selectedAddress) {
            geocodeByAddress(selectedAddress)
                .then((results) => getLatLng(results[0]))
                .catch(() => {

                });
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
        setPostDescription(e.target.value);
    };

    const handleAddressSelect = (address) => {
        setSelectedAddress(address);
        setAddressModified(false);
        setLocationSelected(true);

        geocodeByAddress(address)
            .then((results) => {
                const addressComponents = results[0].address_components;
                let city = '';
                let state = '';
                let country = '';

                // Extract city, state, and country from address components
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

                // Update city, state, and country fields
                setCity(city);
                setState(state);
                setCountry(country);
            })
            .catch(() => {

            });
    };

    const uploadImages = async (postDocRef) => {
        setUploading(true);
        const imageUrls = [];
        for (let i = 0; i < postImages.length; i++) {
            const file = postImages[i];
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
        if (postImages.length === 0) {
            toast.error('At least 1 photo is required');
            return;
        }

        if (!locationSelected || isAddressModified || !selectedAddress.trim()) {
            toast.error('Please select a valid location from the suggestions');
            return;
        }

        let postDocRef;

        try {
            // Create a new post document in Firestore
            postDocRef = await addDoc(collection(db, 'userPosts'), {
                postDescription: postDescription,
                litterWeight: litterWeight ? parseInt(litterWeight) : null,
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

            // Clear the form
            setPostDescription('');
            setPostImages([]);
            setLitterWeight('');
            setPreviews([]);
            setSelectedAddress('');
            setLocationSelected(false);

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
                                    placeholder="Pounds of litter collected"
                                    value={litterWeight}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === '' || (value >= 0 && !isNaN(value))) {
                                            setLitterWeight(value);
                                        }
                                    }}
                                />
                            </div>
                            <div>
                                <PlacesAutocomplete
                                    value={selectedAddress}
                                    onChange={handleAddressSelect}
                                    onSelect={handleAddressSelect}
                                >
                                    {({getInputProps, suggestions, getSuggestionItemProps, loading}) => (
                                        <div>
                                            <input
                                                {...getInputProps({
                                                    placeholder: 'Enter a location',
                                                    className: 'location-input',
                                                    onKeyDown: (e) => {
                                                        if (e.key === 'Backspace' || e.key === 'Delete') {
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
