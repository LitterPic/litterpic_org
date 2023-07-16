import React, {useState, useEffect} from 'react';
import withAuth from '../components/withAuth';
import {storage, db, ref} from '../lib/firebase';
import {collection, addDoc, updateDoc, doc, arrayUnion} from 'firebase/firestore';
import {uploadBytesResumable, getDownloadURL} from 'firebase/storage';
import {useAuth} from '../lib/firebase';
import PlacesAutocomplete, {geocodeByAddress, getLatLng} from 'react-places-autocomplete';
import {useLoadScript} from '@react-google-maps/api';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTimes} from '@fortawesome/free-solid-svg-icons';

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
    const [error, setError] = useState('');

    const clearError = () => {
        setError('');
    };

    const {isLoaded} = useLoadScript({
        googleMapsApiKey: mapApiKey,
        libraries: libraries,
    });

    useEffect(() => {
        if (selectedAddress) {
            geocodeByAddress(selectedAddress)
                .then((results) => getLatLng(results[0]))
                .catch((error) => {
                    console.error('Error geocoding address:', error);
                });
        }
    }, [selectedAddress]);

    const onFileChange = (e) => {
        // Limit the user to upload only up to 5 images
        if (e.target.files.length > 5) {
            console.log('You can only upload up to 5 images');
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
            .catch((error) => {
                console.error('Error geocoding address:', error);
            });
    };


    const onSubmit = async (e) => {
        e.preventDefault();

        // Validation checks
        if (postImages.length === 0) {
            setError('At least 1 photo is required');
            return;
        }

        if (!selectedAddress) {
            setError('A location is required');
            return;
        }

        // Clear any previous errors
        setError('');

        try {
            // Create a new post document in Firestore
            const postDocRef = await addDoc(collection(db, 'userPosts'), {
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
            const imageUrls = [];
            for (let i = 0; i < postImages.length; i++) {
                const file = postImages[i];
                const storageRef = ref(storage, `userPosts/${postDocRef.id}/${file.name}`);
                const task = uploadBytesResumable(storageRef, file);
                const snapshot = await task;

                const imageUrl = await getDownloadURL(snapshot.ref);
                imageUrls.push(imageUrl);
            }

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

            console.log('Post created successfully!');
        } catch (error) {
            console.error('Error creating post:', error);
            setError('Error creating post. Please try again.');
        }
    }

    if (!isLoaded) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <div className="banner">
                <img src="/images/create-post-banner.jpeg" alt="Banner Image"/>
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
                                        style={{width: '400px', height: '400px', objectFit: 'cover'}}
                                    />
                                ))}
                            </div>
                            <div>
                                <input type="file" multiple onChange={onFileChange}/>
                            </div>
                            <div>
                <textarea
                    value={postDescription}
                    onChange={onDescriptionChange}
                    placeholder="Post Description"
                />
                            </div>
                            <div>
                                <input
                                    type="number"
                                    placeholder="Enter the amount of litter collected"
                                    value={litterWeight}
                                    onChange={(e) => {
                                        const value = parseInt(e.target.value);
                                        setLitterWeight(value >= 0 ? value : 0);
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
                                                })}
                                            />
                                            <div className="autocomplete-dropdown-container">
                                                {loading && <div>Loading...</div>}
                                                {suggestions.map((suggestion, index) => (
                                                    <div
                                                        key={index}
                                                        {...getSuggestionItemProps(suggestion)}
                                                        className="suggestion-item"
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
                                <button type="submit">Create Post</button>
                            </div>
                            {error && (
                                <div className="error-container">
                                    <p className="error-message">{error}</p>
                                    <FontAwesomeIcon
                                        icon={faTimes}
                                        className="error-clear-icon"
                                        onClick={clearError}
                                    />
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(CreatePost);
