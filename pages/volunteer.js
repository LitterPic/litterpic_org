import React, {useEffect, useRef, useState} from "react";
import {
    collection,
    doc,
    getDocs,
    query,
    where,
    setDoc,
    updateDoc,
    arrayUnion,
    serverTimestamp
} from "firebase/firestore";
import {db} from "../lib/firebase";
import {Calendar, momentLocalizer, Navigate} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {FaChevronLeft, FaChevronRight} from "react-icons/fa";
import {getAuth, onAuthStateChanged} from "firebase/auth";
import {useRouter} from 'next/router';

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
        <span
            className={`${isPastEvent ? "volunteer-past-event" : "volunteer-future-event"}`}
        >
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

    const [rsvpFormData, setRsvpFormData] = useState({
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
                .then((rsvpId) => {
                    const eventDocRef = doc(db, "events", eventId);
                    const rsvpsArray = arrayUnion(doc(db, "rsvp", rsvpId));
                    updateDoc(eventDocRef, {rsvps: rsvpsArray});

                    console.log("RSVP document added and event updated successfully!", event && rsvps[event.id]);
                    setShowThankYou(true);

                    setRsvps((prevRsvps) => ({
                        ...prevRsvps,
                        [eventId]: true,
                    }));
                })
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
        const selectedEvent = events.find(event => event.id === eventId);
        if (selectedEvent) {
            setRsvpFormData({
                eventId: eventId,
                numberAttending: 1,
                note: "",
            });
            setSelectedEventInfo(selectedEvent); // Save the selected event details
            setTimeout(() => {
                rsvpFormContainerRef.current.scrollIntoView({behavior: 'smooth', block: 'end'});
            }, 5);
        }
    };

    const scrollToForm = () => {
        const rsvpFormContainer = document.getElementById('rsvpFormContainer');
        if (rsvpFormContainer) {
            rsvpFormContainer.scrollIntoView({behavior: 'smooth', block: 'end'}); // Change 'start' to 'end' if you want to scroll to the bottom
        }
    };

    const handleThankYouOkClick = () => {
        setShowThankYou(false);
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
        console.log("User state changed:", user);

        const fetchRsvps = async () => {
            if (user && user.uid) {
                const loggedInUserId = user.uid;
                const rsvpCollection = collection(db, "rsvp");
                const q = query(rsvpCollection, where("user", "==", doc(db, "users", loggedInUserId)));
                const rsvpSnapshot = await getDocs(q);

                console.log("RSVP Snapshot:", rsvpSnapshot.docs.map((doc) => doc.data()));
                setRsvpSnapshot(rsvpSnapshot.docs);
                const rsvpData = {};
                rsvpSnapshot.forEach((doc) => {
                    const eventAssociationRef = doc.data().eventAssociation;
                    if (eventAssociationRef && eventAssociationRef.id) {
                        const eventId = eventAssociationRef.id;
                        rsvpData[eventId] = true;
                    }
                });

                console.log("RSVP Data:", rsvpData);
                setRsvps((prevRsvps) => ({...prevRsvps, ...rsvpData}));
            } else {
                console.log("User is not logged in.");
                setRsvps({});
            }
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
            color: isPastEvent ? 'darkgrey' : 'white', // change this line
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
                                <th>RSVP</th>
                            </tr>
                            </thead>
                            <tbody>
                            {rsvpSnapshot.length > 0 && events.filter(event => new Date(event.start.toISOString().split('T')[0]) >= new Date()).map((event, index) => {
                                const rsvpForEvent = rsvpSnapshot.find(doc => {
                                    const eventRef = doc.data().eventAssociation;
                                    return eventRef && eventRef.id === event.id;
                                });

                                const isHostingEvent = rsvpForEvent && rsvpForEvent.data().noteToOrganizer === "Auto Owner RSVP";

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

                                            {rsvps[event.id] ? (
                                                isHostingEvent ? "You're hosting this event" : "You are attending this event"
                                            ) : (
                                                <a href="#" onClick={() => handleRsvpClick(event.id)}>RSVP</a>
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
                                        <h3>Thank You for RSVPing!</h3>
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
