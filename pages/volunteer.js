import React, {useEffect, useRef, useState} from "react";
import {useRouter} from 'next/router';
import {
    addDoc,
    arrayRemove,
    arrayUnion,
    collection,
    deleteDoc,
    doc,
    GeoPoint,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    serverTimestamp,
    setDoc,
    updateDoc,
    where
} from "firebase/firestore";
import {auth, db} from "../lib/firebase";
import {Calendar, momentLocalizer, Navigate} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {FaChevronLeft, FaChevronRight} from "react-icons/fa";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import PlacesAutocomplete, {geocodeByAddress, getLatLng} from 'react-places-autocomplete';
import {useLoadScript} from "@react-google-maps/api";
import Link from "next/link";
import Head from "next/head";
import {capitalizeFirstWordOfSentences} from "../utils/textUtils";
import {getFunctions, httpsCallable} from "firebase/functions";
import {subscribeUserToMail} from '../utils/subscribeUserToMail';
import Script from "next/script";

const libraries = ['places'];
const mapApiKey = process.env.NEXT_PUBLIC_PLACES_API_KEY;

const localizer = momentLocalizer(moment);

class CustomToolbar extends React.Component {
    navigate = action => {
        this.props.onNavigate(action);
    };

    render() {
        return (
            <div className="rbc-toolbar">
        <span className="rbc-btn-group">
          <button type="button" onClick={() => this.navigate(Navigate.PREVIOUS)}>
            <FaChevronLeft className="calendar-chevron-left"/>
          </button>
        </span>
                <span className="rbc-toolbar-label">{this.props.label}</span>
                <span className="rbc-btn-group">
          <button type="button" onClick={() => this.navigate(Navigate.NEXT)}>
            <FaChevronRight className="calendar-chevron-right"/>
          </button>
        </span>
            </div>
        );
    }
}

const EventComponent = ({event}) => {
    const currentDate = new Date();
    const eventDate = event.start.toISOString().split("T")[0];
    const isPastEvent = new Date(eventDate) < currentDate;

    return (
        <span className={`${isPastEvent ? "volunteer-past-event" : "volunteer-future-event"}`}>
      <strong>{event.event_title}</strong>
    </span>
    );
};

const addRsvpDocument = async (eventId, userId, numberAttending, note) => {
    const rsvpCollection = collection(db, "rsvp");
    const newRsvpDocRef = doc(rsvpCollection);

    // Check if userId is not null before accessing its properties
    const userDocRef = userId ? doc(db, "users", userId) : null;

    // Use setDoc instead of addDoc to set the data on the specific document
    await setDoc(newRsvpDocRef, {
        eventAssociation: doc(db, "events", eventId),
        user: userDocRef,
        numberAttending: numberAttending,
        noteToOrganizer: note,
        timeOfRSVP: new Date(),
    });

    return newRsvpDocRef.id;
};

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

const Volunteer = () => {
    const rsvpFormContainerRef = useRef(null);
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [user, setUser] = useState(null);
    const [rsvps, setRsvps] = useState({});
    const [showThankYou, setShowThankYou] = useState(false);
    const [selectedEventInfo, setSelectedEventInfo] = useState(null);
    const [rsvpSnapshot, setRsvpSnapshot] = useState([]);
    const [showCreateEventForm, setShowCreateEventForm] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [addressModified, setAddressModified] = useState(false);
    const [latLng, setLatLng] = useState(null);
    const [eventsChanged, setEventsChanged] = useState(false);
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [country, setCountry] = useState('');
    const [ownerPhotos, setOwnerPhotos] = useState({});
    const [ownerEmails, setOwnerEmails] = useState({});
    const [rsvpFormData, setRsvpFormData] = useState({
        eventId: null,
        numberAttending: 1,
        note: "",
        email: "",
        name: "",
    });
    const [selectedDate, setSelectedDate] = useState('');
    const [filteredEvents, setFilteredEvents] = useState(events);


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const uniqueDates = Array.from(new Set(events.map(event => {
        return event.start instanceof Date ? event.start : new Date(event.start);
    })))
        .filter(date => date >= today)
        .map(date => ({
            raw: date.toISOString().split('T')[0],
            formatted: date.toLocaleDateString('en-US', {
                year: '2-digit',
                month: '2-digit',
                day: '2-digit'
            })
        }))
        .sort((a, b) => a.raw.localeCompare(b.raw));


    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set today to the start of the day

        if (selectedDate) {
            // If a specific date is selected, filter events for that date
            const filtered = events.filter(event => {
                const eventStartDate = new Date(event.start);
                const eventStartDateStr = `${eventStartDate.getFullYear()}-${String(eventStartDate.getMonth() + 1).padStart(2, '0')}-${String(eventStartDate.getDate()).padStart(2, '0')}`;
                return eventStartDateStr === selectedDate;
            });
            setFilteredEvents(filtered);
        } else {
            // If no date is selected, show events from today or in the future
            const futureEvents = events.filter(event => {
                const eventStartDate = new Date(event.start);
                return eventStartDate >= today;
            });
            setFilteredEvents(futureEvents);
        }
    }, [events, selectedDate]);


    useEffect(() => {
        const fetchOwnerData = async () => {
            const newOwnerPhotos = {};
            const newOwnerEmails = {};

            for (const event of events) {
                const ownerRef = event.owner;

                if (ownerRef) {
                    const ownerData = await getDoc(ownerRef);
                    if (ownerData.exists()) {
                        newOwnerPhotos[event.id] = ownerData.data().photo_url;
                        newOwnerEmails[event.id] = ownerData.data().email; // Fetch the email
                    }
                }
            }

            setOwnerPhotos(newOwnerPhotos);
            setOwnerEmails(newOwnerEmails);
        };

        fetchOwnerData();
    }, [events]);


    const handleAddressSelect = async (address, placeId) => {
        setSelectedAddress(address);
        setAddressModified(false);

        try {
            // Use geocodeByAddress to get address details using the placeId
            const results = await geocodeByAddress(address);
            const addressComponents = results[0]?.address_components || [];

            if (addressComponents.length === 0) {

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

        }
    };

    const {isLoaded} = useLoadScript({
        googleMapsApiKey: mapApiKey,
        libraries: libraries
    });

    const debouncedGeocode = debounce((address) => {
        geocodeByAddress(address)
            .then((results) => getLatLng(results[0]))
            .then((latLng) => {
                // Create a Firestore GeoPoint
                const geoPoint = new GeoPoint(latLng.lat, latLng.lng);

                // Update state with the newly fetched GeoPoint
                setLatLng(geoPoint);
            })
            .catch(() => {
                // Handle error
            });
    }, 2500);

    useEffect(() => {
        if (selectedAddress) {
            debouncedGeocode(selectedAddress);
        }
    }, [selectedAddress]);

    const handleCreateEventClick = () => {
        setShowCreateEventForm(true);
    }

    const handleCancelCreateEventClick = () => {
        setShowCreateEventForm(false);
    }

    const handleCreateEventFormSubmit = async (event) => {
        event.preventDefault();

        const startTimeString = event.target.eventStartTime.value;
        const endTimeString = event.target.eventEndTime.value;

        const startDateTime = `${event.target.date.value}T${startTimeString}`;
        const endDateTime = `${event.target.date.value}T${endTimeString}`;

        const eventStartTime = new Date(startDateTime);
        const eventEndTime = new Date(endDateTime);

        const dateValue = event.target.date.value;
        const date = moment(dateValue).hours(0).minutes(0).seconds(0).toDate();

        const userRef = doc(db, 'users', user.uid);

        const eventData = {
            date: date,
            description: capitalizeFirstWordOfSentences(event.target.description.value),
            event_title: capitalizeFirstWordOfSentences(event.target.event_title.value),
            latLng: latLng,
            location: selectedAddress,
            eventStartTime: eventStartTime,
            eventEndTime: eventEndTime,
            owner: userRef,
            rsvps: [],
            time_created: serverTimestamp(),
        };

        try {
            const eventCollection = collection(db, "events");
            const docRef = await addDoc(eventCollection, eventData);
            const userRef = doc(db, 'users', user.uid);

            // Create the RSVP document with necessary fields
            const rsvpData = {
                eventAssociation: docRef, // reference to the created event
                noteToOrganizer: "Auto Owner RSVP",
                user: userRef,
            };

            const rsvpCollection = collection(db, "rsvp");
            const rsvpDocRef = await addDoc(rsvpCollection, rsvpData);

            await updateDoc(docRef, {
                rsvps: arrayUnion(rsvpDocRef)
            });

            eventData.rsvps.push(rsvpDocRef);

            setEvents(prevEvents => [...prevEvents, {...eventData, id: docRef.id}]);
            setEventsChanged(!eventsChanged);

            setShowCreateEventForm(false);

            // Date format
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            };

            //send email to event organizer
            const eventConfirmTemplateId = "pxkjn41xv7pgz781";
            const eventConfirmTemplateData = {
                eventDate: date.toLocaleDateString('en-US', options),
                eventStartTime: eventStartTime.toLocaleTimeString([], {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                }),
                eventEndTime: eventEndTime
                    ? eventEndTime.toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                    })
                    : 'N/A',
                eventLocation: selectedAddress,
            };

            fetch("/api/sendMailerSendEmail", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: user.email,
                    templateId: eventConfirmTemplateId,
                    templateData: eventConfirmTemplateData,
                }),
            })
                .then((response) => {
                    console.log("MailerSend API response status:", response.status);
                    return response.json();
                })
                .then((data) => {
                    console.log("MailerSend API response data:", data);
                    if (data.message) {
                        console.log("✅ Event creation confirmation email sent successfully via MailerSend");
                    } else {
                        console.error("❌ MailerSend API error:", data.error);
                    }
                })
                .catch((error) => {
                    console.error("❌ Error sending MailerSend event confirmation email:", error);
                });
        } catch (error) {

        }
    };

    const handleCancel = () => {
        setRsvpFormData({
            eventId: null,
            numberAttending: 1,
            note: "",
            email: "",
            name: "",
        });
    };

    const handleRsvpFormSubmit = async (event) => {
        event.preventDefault();

        const {eventId, numberAttending, note, email, name} = rsvpFormData;

        // Check if the user is logged in
        const userUid = user ? user.uid : null;

        // Determine whether to use userUid or email based on user authentication
        const userEmail = user?.uid || email;

        // If the user is not logged in, check if the email exists in the database
        let existingUserUid = null;
        if (!userUid) {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', userEmail));

            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                existingUserUid = querySnapshot.docs[0].id;
            }
        }

        if (eventId) {
            try {
                let participantDocRef;
                let userDocId = null;

                // Trim the email to handle potential whitespace
                const trimmedUserIdOrEmail = userEmail.trim();

                // Check if userIdOrEmail is an email address
                if (trimmedUserIdOrEmail.includes("@")) {
                    // If it contains '@', treat it as an email address
                    const usersCollection = collection(db, 'users');
                    const userQuerySnapshot = await getDocs(query(usersCollection, where('email', '==', trimmedUserIdOrEmail)));

                    // If the user with the provided email doesn't exist, create a new user document
                    if (!userQuerySnapshot.empty) {
                        participantDocRef = userQuerySnapshot.docs[0].ref;
                    } else {
                        const defaultUserData = {
                            created_time: new Date(),
                            email: userEmail,
                            display_name: name,
                            first_login: true,
                            createdForRSVP: true,
                        };

                        const userDocRef = await addDoc(usersCollection, defaultUserData);
                        userDocId = userDocRef.id;
                        await updateDoc(userDocRef, {uid: userDocId});

                        // Add user to SendGrid subscription list
                        await subscribeUserToMail(userEmail, "RSVP");

                        // Use the userDocRef as participantDocRef for a new user
                        participantDocRef = userDocRef;
                    }
                } else {
                    // If it doesn't contain '@', treat it as a user ID
                    participantDocRef = doc(db, "users", userUid);
                }

                const userIdOrEmail = userUid || userDocId || existingUserUid;

                const eventDocRef = doc(db, "events", eventId);
                const rsvpDocRef = doc(db, "rsvp", await addRsvpDocument(eventId, userIdOrEmail, parseInt(numberAttending), note));
                const rsvpData = (await getDoc(rsvpDocRef)).data();

                const participantSnapshot = await getDoc(participantDocRef);
                const participantData = participantSnapshot.data();

                const eventSnapshot = await getDoc(eventDocRef);
                const eventData = eventSnapshot.data();

                const ownerId = eventData.owner.id;
                const ownerDocRef = doc(db, "users", ownerId);
                const ownerSnapshot = await getDoc(ownerDocRef);
                const ownerData = ownerSnapshot.data();

                // Update the rsvps array in the events document
                const updatedRsvpsArray = arrayUnion(rsvpDocRef);
                await updateDoc(eventDocRef, {rsvps: updatedRsvpsArray});

                setShowThankYou(true);

                //send email to person who RSVP'd (keep using original system)
                const participantRsvpTemplateId = "d-06e757b5a0464ed7a043a33b3f9fa686";
                const participantTemplateData = {
                    eventDate: selectedEventInfo.start.toDateString(),
                    eventStartTime: selectedEventInfo.eventStartTime?.toDate().toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    eventEndTime: selectedEventInfo.eventEndTime
                        ? selectedEventInfo.eventEndTime.toDate().toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        })
                        : 'N/A',
                    eventLocation: selectedEventInfo.location,
                };

                fetch("/api/sendEmail", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: rsvpFormData.email,
                        templateId: participantRsvpTemplateId,
                        templateData: participantTemplateData,
                    }),
                })
                    .then((response) => response.json())
                    .then(() => {

                    })
                    .catch((error) => {
                        console.error("Error sending email to participant:", error);
                    });

                //send email to event organizer
                const organizerRsvpTemplateId = "d-4d8f6c48259f43f2b40f38bc6267e4fa";
                const organizerTemplateData = {
                    participantName: rsvpFormData.name || rsvpFormData.email,
                    eventDate: selectedEventInfo.start.toDateString(),
                    eventStartTime: selectedEventInfo.eventStartTime?.toDate().toLocaleTimeString([], {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    eventEndTime: selectedEventInfo.eventEndTime
                        ? selectedEventInfo.eventEndTime.toDate().toLocaleTimeString([], {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                        })
                        : 'N/A',
                    eventLocation: selectedEventInfo.location,
                    participantEmail: rsvpFormData.email,
                    numberOfAttendees: rsvpData.numberAttending,
                    participantNote: rsvpData.noteToOrganizer,
                };

                fetch("/api/sendEmail", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        email: ownerData.email,
                        templateId: organizerRsvpTemplateId,
                        templateData: organizerTemplateData,
                    }),
                })
                    .then((response) => response.json())
                    .then(() => {

                    })
                    .catch((error) => {
                        console.error("Error sending email to organizer:", error);
                    });

            } catch (error) {
                console.error("Error in addRsvpDocument:", error);
            }
        }
    };


    const handleRsvpInputChange = (event) => {
        const {name, value} = event.target;
        const capitalizedValue = capitalizeFirstWordOfSentences(value);

        setRsvpFormData((prevState) => ({
            ...prevState,
            [name]: capitalizedValue,
        }));
    };

    const handleRsvpClick = async (eventId) => {
        const selectedEvent = events.find((event) => event.id === eventId);
        let userData = null;
        // If the event is a Blue Ocean Society event, then skip the login requirement
        const functions = getFunctions();
        const createBlueOceanRsvp = httpsCallable(functions, 'createBlueOceanRsvp');

        if (ownerEmails[eventId] === 'programs@blueoceansociety.org') {
            const loggedInUserId = user ? user.uid : null;
            const payload = {eventId, loggedInUserId};
            try {
                const result = await createBlueOceanRsvp(payload);
                window.open('https://www.blueoceansociety.org/cleanup', '_blank');
                return;
            } catch (error) {
                console.error("There was an error with the function call:", error);
                return;
            }
        }

        if (user) {
            const userRef = user.uid;
            const userDocRef = doc(db, "users", userRef);
            const ownerSnapshot = await getDoc(userDocRef);
            userData = ownerSnapshot.data();
        }

        if (selectedEvent) {
            setRsvpFormData({
                eventId: eventId,
                numberAttending: 1,
                note: '',
                email: user ? user.email : '',
                name: user && userData ? userData.display_name : '',
            });
            setSelectedEventInfo(selectedEvent);
            setTimeout(() => {
                rsvpFormContainerRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'end',
                });
            }, 5);
        }
    };

    const handleCancelRsvp = (eventId) => {
        if (user && rsvps[eventId]) {
            const rsvpDoc = rsvpSnapshot.find(doc => {
                const eventRef = doc.data().eventAssociation;
                return eventRef && eventRef.id === eventId;
            });

            if (rsvpDoc) {
                const rsvpDocRef = doc(db, "rsvp", rsvpDoc.id);

                // Delete the RSVP document
                deleteDoc(rsvpDocRef)
                    .then(() => {
                        // Remove the RSVP from the events array
                        const eventDocRef = doc(db, "events", eventId);
                        const rsvpsArray = arrayRemove(doc(db, "rsvp", rsvpDoc.id));
                        updateDoc(eventDocRef, {rsvps: rsvpsArray});
                        setRsvps(prevRsvps => ({...prevRsvps, [eventId]: false}));
                    })
                    .catch(error => {

                    });
            }
        }
    };

    const handleThankYouOkClick = () => {
        setShowThankYou(false);
        setRsvpFormData({
            eventId: null,
            numberAttending: 1,
            note: "",
            email: "",
            name: "",
        });
        router.push('/stories');
    };


    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchRsvps = () => {
            const rsvpCollection = collection(db, "rsvp");

            return onSnapshot(rsvpCollection, (rsvpSnapshot) => {
                setRsvpSnapshot(rsvpSnapshot.docs);

                const numberAttendingByEvent = rsvpSnapshot.docs.reduce((acc, doc) => {
                    const {eventAssociation, numberAttending = 0} = doc.data();

                    if (eventAssociation && eventAssociation.id) {
                        const eventId = eventAssociation.id;
                        acc[eventId] = (acc[eventId] || 0) + numberAttending;
                    }

                    return acc;
                }, {});

                setRsvps((prevRsvps) => {
                    return {...prevRsvps, ...numberAttendingByEvent};
                });
            });
        };

        fetchRsvps();
    }, [user]);


    useEffect(() => {
        const fetchData = async () => {
            const eventCollection = collection(db, "events");
            const eventSnapshot = await getDocs(eventCollection);
            let eventList = eventSnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
                start: doc.data().date.toDate(),
                end: doc.data().date.toDate()
            }));

            eventList = eventList.sort(
                (a, b) => a.start.getTime() - b.start.getTime()
            );

            setEvents(eventList);
        };
        fetchData();
    }, [eventsChanged]);

    const onEventSelect = (event) => {
        setSelectedDate(event.start.toISOString().split('T')[0]);
    };

    const eventStyleGetter = (event, start, end, isSelected) => {
        const currentDate = new Date();
        const eventDate = new Date(event.start);
        const isPastEvent = eventDate < currentDate;

        let style = {
            backgroundColor: isPastEvent ? '#E6E6E6' : '#015e41',
            borderRadius: '0px',
            opacity: 0.8,
            color: isPastEvent ? 'darkgrey' : 'white',
            border: '0px',
            display: 'block'
        };

        return {
            style: style
        };
    };

    return (
        <div>
            <Head>
                <title>Volunteer with LitterPic</title>
                <meta name="description"
                      content="Join LitterPic's Environmental Protection Movement as a volunteer. Empower change from within
                      by registering for events or creating community clean-up initiatives. Get started with the 'Create Event'
                      button after logging in. Make a difference today!"/>
                <meta name="robots" content="index, follow"/>
                <link rel="canonical" href="https://litterpic.org/volunteer"/>

                <meta property="og:title" content="LitterPic"/>
                <meta property="og:description"
                      content="Join LitterPic's Environmental Protection Movement as a volunteer. Empower change from within
                      by registering for events or creating community clean-up initiatives. Get started with the 'Create Event'
                      button after logging in. Make a difference today!"/>
                <meta property="og:image"
                      content="https://firebasestorage.googleapis.com/v0/b/litterpic-fa0bb.appspot.com/o/userPosts%2F1vsOyQTdD4iMdteFj4E1%2F1.webp?alt=media&token=9e92eeb7-9cb3-4c94-86dd-b520ef7d3563"/>
                <meta property="og:url" content="https://litterpic.org/volunteer"/>
                <meta property="og:type" content="website"/>

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content="LitterPic"/>
                <meta name="twitter:description"
                      content="Join LitterPic's Environmental Protection Movement as a volunteer. Empower change from within
                      by registering for events or creating community clean-up initiatives. Get started with the 'Create Event'
                      button after logging in. Make a difference today!"/>
                <meta name="twitter:image"
                      content="https://firebasestorage.googleapis.com/v0/b/litterpic-fa0bb.appspot.com/o/userPosts%2F1vsOyQTdD4iMdteFj4E1%2F1.webp?alt=media&token=9e92eeb7-9cb3-4c94-86dd-b520ef7d3563"/>
                <meta name="twitter:url" content="https://litterpic.org/volunteer"/>

                <meta name="keywords"
                      content="litter, litterpicking, litter collection, volunteer, community service, environmental conservation, inspiring stories"/>
                <meta name="author" content="LitterPic Inc."/>

            </Head>
            
            {/* Google Analytics Scripts */}
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-3VZE7E59CL"
                strategy="afterInteractive"
            />
            <Script
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-3VZE7E59CL');
                    `,
                }}
            />

            <div className="banner">
                <img src="/images/volunteer_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Events</h1>
                    <p className="volunteer-top-paragraph"> LitterPic encourages everyone to play their part in our
                        Environmental Protection Movement. The only
                        way we succeed is when the change comes from within, and we want to empower you to take an
                        active
                        role. Register for volunteering events to lend your support or create a volunteering event for
                        your
                        community. To create a volunteering event, simply log in, and utilize the Create Event button
                        below!</p>
                    <div title={!user ? "Please login to create an event" : ""}>
                        <button className="create-event-button"
                                onClick={handleCreateEventClick}
                                disabled={!user}
                        >
                            Create Event
                        </button>
                    </div>

                    {showCreateEventForm && (
                        <div>
                            <form onSubmit={handleCreateEventFormSubmit} className="event-form">
                                <div className="form-row">
                                    <label htmlFor="date">Event Date</label>
                                    <input type="date" name="date" required/>

                                    <label htmlFor="event_title">Event Title</label>
                                    <input type="text" className="event-title" name="event_title" required/>

                                    <label htmlFor="description">Event Description</label>
                                    <textarea className="event-description-input" name="description" required/>

                                    <label htmlFor="eventStartTime">Event Start Time</label>
                                    <input type="time" name="eventStartTime" required/>

                                    <label htmlFor="eventEndTime">Event End Time</label>
                                    <input type="time" name="eventEndTime"/>

                                    <label htmlFor="location" className="event-location">Event Location</label>
                                    {isLoaded ? (
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
                                                                    className: suggestion.active
                                                                        ? 'suggestion-item active'
                                                                        : 'suggestion-item',
                                                                })}
                                                            >
                                                                <span>{suggestion.description}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </PlacesAutocomplete>
                                    ) : (
                                        <div>Loading...</div>
                                    )}
                                </div>

                                <div className="create-event-buttons">
                                    <button className="event-submit" type="submit">Submit</button>
                                    <button className="event-submit-cancel"
                                            onClick={handleCancelCreateEventClick}>Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    <div className="calendar">
                        <Calendar
                            localizer={localizer}
                            events={events}
                            startAccessor="start"
                            endAccessor="end"
                            style={{height: 800}}
                            onSelectEvent={onEventSelect}
                            views={['month']}
                            components={{
                                event: EventComponent,
                                toolbar: CustomToolbar,
                            }}
                            eventPropGetter={eventStyleGetter}
                        />
                    </div>


                    <div>
                        <table className="table">
                            <thead>
                            <tr>
                                <th className="narrow-column">Organizer</th>
                                <th className="medium-column">Event</th>
                                <th className="wide-column">Description</th>
                                <th className="narrow-column">
                                    <div className="date-input-container">
                                        <select
                                            className="date-dropdown"
                                            value={selectedDate}
                                            onChange={(e) => setSelectedDate(e.target.value)}
                                        >
                                            <option value="">All Dates</option>
                                            {uniqueDates.map(dateObj => (
                                                <option
                                                    key={dateObj.raw}
                                                    value={dateObj.raw}>{dateObj.formatted}</option>
                                            ))}
                                        </select>
                                    </div>
                                </th>
                                <th className="medium-column">Location</th>
                                <th className="narrow-column">Start Time</th>
                                <th className="narrow-column">End Time</th>
                                <th className="narrow-column">Attendees</th>
                                <th className="medium-column">RSVP</th>
                            </tr>
                            </thead>
                            <tbody>
                            {filteredEvents.map((event, index) => {
                                const currentUserID = auth && auth.currentUser && auth.currentUser.uid;

                                const rsvpForEvent = rsvpSnapshot.find(doc => {
                                    const eventRef = doc.data().eventAssociation;
                                    const userRef = doc.data().user;

                                    // Add null check for userRef
                                    return eventRef && eventRef.id === event.id && userRef && userRef.id === currentUserID && doc.data().noteToOrganizer === "Auto Owner RSVP";
                                });

                                const attendingEvent = rsvpSnapshot.find(doc => {
                                    const eventRef = doc.data().eventAssociation;
                                    const userRef = doc.data().user;

                                    // Add null check for userRef
                                    return eventRef && eventRef.id === event.id && userRef && userRef.id === currentUserID;
                                });

                                const isHostingEvent = Boolean(rsvpForEvent);
                                const userEmail = auth && auth.currentUser && auth.currentUser.email ? auth.currentUser.email : '';
                                const shouldShowLink = isHostingEvent || userEmail === 'alek@litterpic.org';

                                return (
                                    <tr key={index}>
                                        <td className="volunteer-event-organizer-photo">
                                            <img src={ownerPhotos[event.id] || 'default_image_url'} alt="Owner"
                                                 width="50"/>
                                        </td>
                                        <td>{event.event_title}</td>
                                        <td>{event.description}</td>
                                        <td>{event.start.toLocaleDateString('en-US', { // Formatted for display
                                            year: '2-digit',
                                            month: '2-digit',
                                            day: '2-digit'
                                        })}</td>
                                        <td>{event.location}</td>
                                        <td className="start-time-column">{event.eventStartTime?.toDate().toLocaleTimeString([], {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}</td>
                                        <td className="start-time-column">{event.eventEndTime?.toDate().toLocaleTimeString([], {
                                            hour: 'numeric',
                                            minute: '2-digit',
                                            hour12: true
                                        })}</td>
                                        <td>
                                            {
                                                (shouldShowLink && rsvps[event.id] > 0) ?
                                                    <Link href={`/rsvp-details/${event.id}`}>
                                                        {rsvps[event.id]}
                                                    </Link> :
                                                    rsvps[event.id] || 0
                                            }
                                        </td>

                                        <td>
                                            {isHostingEvent ? (
                                                "You're hosting this event"
                                            ) : attendingEvent && rsvps[event.id] ? (
                                                <>
                                                    You're attending this event
                                                    <br/>
                                                    <button
                                                        className="cancel-rsvp-button"
                                                        onClick={() => handleCancelRsvp(event.id)}
                                                    >
                                                        Cancel RSVP
                                                    </button>
                                                </>
                                            ) : (
                                                <a href="#" onClick={() => handleRsvpClick(event.id)}>
                                                    {ownerEmails[event.id] === 'programs@blueoceansociety.org' ? 'RSVP with Blue Ocean Society' : 'RSVP'}
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    </div>

                    {/* RSVP Form */}
                    <div>
                        {rsvpFormData.eventId && (
                            <div>
                                {showThankYou ? (
                                    <div className="rsvp-thankyou">
                                        <h3>Thank You for your RSVP!</h3>
                                        <p>We've sent you and email with the details, we can't wait to see you
                                            there!</p>
                                        <button onClick={handleThankYouOkClick}>OK</button>
                                    </div>
                                ) : (
                                    <div ref={rsvpFormContainerRef} id="rsvpFormContainer">
                                        <br/>
                                        <br/>
                                        <h1 className="heading-text">RSVP</h1>

                                        <div ref={rsvpFormContainerRef} id="rsvpFormContainer">
                                            {rsvpFormData.eventId && (
                                                <div>
                                                    {selectedEventInfo && (
                                                        <div className="volunteer-event-details">
                                                            <p>
                                                                <b>Date:</b> {selectedEventInfo.start.toLocaleDateString()}
                                                            </p>
                                                            <p>
                                                                <b>Time:</b> {selectedEventInfo.eventStartTime?.toDate().toLocaleTimeString([], {
                                                                hour: 'numeric',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}</p>
                                                            <p><b>Location:</b> {selectedEventInfo.location}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        <form onSubmit={handleRsvpFormSubmit}>
                                            <div className="form-container">
                                                <label htmlFor="numberAttending">Number of attendees:</label>
                                                <input
                                                    type="number"
                                                    name="numberAttending"
                                                    value={rsvpFormData.numberAttending}
                                                    onChange={handleRsvpInputChange}
                                                    required
                                                    className="input-small"
                                                    min="1"
                                                />
                                                <br/>
                                                <label htmlFor="email">Email Address:</label>
                                                <input
                                                    type="email"
                                                    name="email"
                                                    value={rsvpFormData.email}
                                                    onChange={handleRsvpInputChange}
                                                    className="input-medium"
                                                    required
                                                />
                                                <br/>
                                                <label htmlFor="name">Name:</label>
                                                <input
                                                    type="text"
                                                    name="name"
                                                    value={rsvpFormData.name}
                                                    onChange={handleRsvpInputChange}
                                                    className="input-medium"
                                                    required
                                                />
                                                <br/>
                                                <label htmlFor="note">Note for event organizer:</label>
                                                <textarea
                                                    name="note"
                                                    value={rsvpFormData.note}
                                                    onChange={handleRsvpInputChange}
                                                    className="textarea-large"
                                                />
                                            </div>
                                            <br/>
                                            <div className="rsvp-buttons">
                                                <button className="rsvp-button submit" type="submit">Submit</button>
                                                <button className="rsvp-button cancel" type="button"
                                                        onClick={handleCancel}>Cancel
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Volunteer;
