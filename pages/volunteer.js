import React, {useEffect, useRef, useState} from "react";
import {useRouter} from 'next/router';
import {
    collection,
    addDoc,
    doc,
    getDocs,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove,
    serverTimestamp,
    deleteDoc,
    getDoc,
    onSnapshot
} from "firebase/firestore";
import {auth, db} from "../lib/firebase";
import {Calendar, momentLocalizer, Navigate} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {FaChevronLeft, FaChevronRight} from "react-icons/fa";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import PlacesAutocomplete, {geocodeByAddress, getLatLng} from 'react-places-autocomplete';
import {useLoadScript} from "@react-google-maps/api";
import {GeoPoint} from "firebase/firestore";
import Link from "next/link";

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
    const currentTime = serverTimestamp();

    await setDoc(newRsvpDocRef, {
        eventAssociation: doc(db, "events", eventId),
        user: doc(db, "users", userId),
        numberAttending: numberAttending,
        noteToOrganizer: note,
        timeOfRSVP: currentTime,
    });

    return newRsvpDocRef.id;
};

const Volunteer = () => {
    const rsvpFormContainerRef = useRef(null);
    const router = useRouter();
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [user, setUser] = useState(null);
    const [rsvps, setRsvps] = useState({});
    const [showThankYou, setShowThankYou] = useState(false);
    const [selectedEventInfo, setSelectedEventInfo] = useState(null);
    const [rsvpSnapshot, setRsvpSnapshot] = useState([]);
    const [showCreateEventForm, setShowCreateEventForm] = useState(false);
    const [selectedAddress, setSelectedAddress] = useState('');
    const [latLng, setLatLng] = useState('');

    const handleAddressSelect = (address) => {
        setSelectedAddress(address);

        geocodeByAddress(address)
            .then((results) => {
                getLatLng(results[0])
                    .then((latLng) => {
                        const geopoint = new GeoPoint(latLng.lat, latLng.lng);
                        setLatLng(geopoint);
                    })
                    .catch((error) => console.error('Error', error));
            })
            .catch((error) => {
                console.error('Error geocoding address:', error);
            });
    };

    const {isLoaded} = useLoadScript({
        googleMapsApiKey: mapApiKey,
        libraries: libraries
    });

    const handleCreateEventClick = () => {
        setShowCreateEventForm(true);
    }

    const handleCancelCreateEventClick = () => {
        setShowCreateEventForm(false);
    }

    const handleCreateEventFormSubmit = async (event) => {

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
            description: event.target.description.value,
            event_title: event.target.event_title.value,
            latLng: latLng,
            location: selectedAddress,
            eventStartTime: eventStartTime,
            eventEndTime: eventEndTime,
            owner: userRef,
            rspvs: [],
            time_created: serverTimestamp(),
        };

        try {
            const eventCollection = collection(db, "events");
            const docRef = await addDoc(eventCollection, eventData);

            setEvents(prevEvents => [...prevEvents, {...eventData, id: docRef.id}]);

            setShowCreateEventForm(false);

            // Date format
            const options = {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            };

            //send email to event organizer
            const eventConfirmTemplateId = "d-bfd47c94859e43118922941af2890044";
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

            fetch("/api/sendEmail", {
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
                .then((response) => response.json())
                .then((data) => {
                })
                .catch((error) => {
                });
        } catch (error) {
            console.error("Error creating event:", error);
        }
    };

    const
        [rsvpFormData, setRsvpFormData] = useState({
            eventId: null,
            numberAttending: 1,
            note: "",
        });

    const handleCancel = () => {
        setRsvpFormData({
            eventId: null,
            numberAttending: 1,
            note: "",
        });
    };

    const handleRsvpFormSubmit = (event) => {
        event.preventDefault();

        const {eventId, numberAttending, note} = rsvpFormData;
        if (eventId) {
            addRsvpDocument(eventId, user.uid, parseInt(numberAttending), note)
                .then(async (rsvpId) => {
                        const eventDocRef = doc(db, "events", eventId);
                        const rsvpsArray = arrayUnion(doc(db, "rsvp", rsvpId));
                        updateDoc(eventDocRef, {rsvps: rsvpsArray});
                        const rsvpDocRef = doc(db, "rsvp", rsvpId);
                        const rsvpDoc = await getDoc(rsvpDocRef);
                        const rsvpData = rsvpDoc.data();

                        const participantId = rsvpData.user.id;

                        const participantDocRef = doc(db, "users", participantId);
                        const participantSnapshot = await getDoc(participantDocRef);
                        const participantData = participantSnapshot.data();

                        const eventSnapshot = await getDoc(eventDocRef);
                        const eventData = eventSnapshot.data();

                        const ownerId = eventData.owner.id;

                        const ownerDocRef = doc(db, "users", ownerId);
                        const ownerSnapshot = await getDoc(ownerDocRef);
                        const ownerData = ownerSnapshot.data();

                        setShowThankYou(true);

                        //send email to person who RSVP'd
                        const participantRsvpTemplateId = "d-d1420f7a054b4424bf7bb990524db1ae";
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
                                email: user.email,
                                templateId: participantRsvpTemplateId,
                                templateData: participantTemplateData,
                            }),
                        })
                            .then((response) => response.json())
                            .then((data) => {
                            })
                            .catch((error) => {
                                console.error("Error sending email:", error);
                            });

                        //send email to event organizer
                        const organizerRsvpTemplateId = "d-60649fab1ee8435db38e1ff3ce8f4645"
                        const organizerTemplateData = {
                            participantName: participantData.display_name,
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
                            participantEmail: user.email,
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
                            .then((data) => {
                            })
                            .catch((error) => {
                                console.error("Error sending email to organizer:", error);
                            });
                    }
                )
                .catch((error) => {
                    console.error("Error adding RSVP document or updating event: ", error);
                });
        }
    };

    const handleRsvpInputChange = (event) => {
        const {name, value} = event.target;
        setRsvpFormData((prevState) => ({
            ...prevState,
            [name]: value,
        }));
    };

    const handleRsvpClick = (eventId) => {
        if (!user) {
            router.push('/login');
        } else {
            const selectedEvent = events.find((event) => event.id === eventId);
            if (selectedEvent) {
                setRsvpFormData({
                    eventId: eventId,
                    numberAttending: 1,
                    note: '',
                });
                setSelectedEventInfo(selectedEvent);
                setTimeout(() => {
                    rsvpFormContainerRef.current.scrollIntoView({
                        behavior: 'smooth',
                        block: 'end',
                    });
                }, 5);
            }
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
                        console.error("Error deleting RSVP document: ", error);
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

            const unsubscribe = onSnapshot(rsvpCollection, (rsvpSnapshot) => {
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
                    const newState = {...prevRsvps, ...numberAttendingByEvent};
                    return newState;
                });
            });

            return unsubscribe;
        };

        fetchRsvps();
    }, [user]);


    const handleButtonClick = () => {
        window.location.href = "/community_service_hours";
    };

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
    }, []);

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
            <div className="banner">
                <img src="/images/volunteer_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Volunteer</h1>
                    <p className="volunteer-top-paragraph"> LitterPic encourages everyone to play their part in our
                        Environmental Protection Movement. The only
                        way we succeed is when the change comes from within, and we want to empower you to take an
                        active
                        role. Register for volunteering events to lend your support or create a volunteering event for
                        your
                        community. To create a volunteering event, simply utilize the interactive calendar below. Click
                        on
                        the plus sign located at the upper right-hand corner of the calendar or select the desired day
                        for
                        your event.</p>
                    <button className="community-service-button" onClick={handleButtonClick}>Community Service</button>
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
                            style={{height: 500}}
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
                                <th>Event</th>
                                <th>Description</th>
                                <th>Date</th>
                                <th>Location</th>
                                <th className="start-time-column">Start Time</th>
                                <th>Attendees</th>
                                <th>RSVP</th>
                            </tr>
                            </thead>
                            <tbody>
                            {events.filter(event => new Date(event.start.toISOString().split('T')[0]) >= new Date()).map((event, index) => {

                                const rsvpForEvent = rsvpSnapshot.find(doc => {
                                    const eventRef = doc.data().eventAssociation;
                                    return eventRef && eventRef.id === event.id;
                                });

                                const isHostingEvent = rsvpForEvent && rsvpForEvent.data().noteToOrganizer === "Auto Owner RSVP";
                                const userEmail = auth && auth.currentUser && auth.currentUser.email ? auth.currentUser.email : '';
                                const shouldShowLink = isHostingEvent || userEmail === 'alek@litterpic.com';

                                return (
                                    <tr key={index}
                                        className={event.start.toISOString().split('T')[0] === selectedDate ? 'highlight' : ''}>
                                        <td>{event.event_title}</td>
                                        <td>{event.description}</td>
                                        <td>{event.start.toLocaleDateString()}</td>
                                        <td>{event.location}</td>
                                        <td className="start-time-column">{event.eventStartTime?.toDate().toLocaleTimeString([], {
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
                                            {rsvps[event.id] ? (
                                                isHostingEvent ? (
                                                    "You're hosting this event"
                                                ) : (
                                                    <>
                                                        You are attending this event
                                                        <br/>
                                                        <button
                                                            className="cancel-rsvp-button"
                                                            onClick={() => handleCancelRsvp(event.id)}
                                                        >
                                                            Cancel RSVP
                                                        </button>
                                                    </>
                                                )
                                            ) : (
                                                <a href="#" onClick={() => handleRsvpClick(event.id)}>
                                                    RSVP
                                                </a>
                                            )}
                                        </td>
                                    </tr>
                                )
                                    ;
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
