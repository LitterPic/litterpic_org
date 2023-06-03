import React, {useEffect, useState} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../lib/firebase";
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const Volunteer = () => {
    const [events, setEvents] = useState([]);
    const [calendarDates, setCalendarDates] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            const eventCollection = collection(db, "events");
            const eventSnapshot = await getDocs(eventCollection);
            let eventList = eventSnapshot.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
            }));

            // Filter events to include only dates today and in the future
            const currentDate = new Date();
            eventList = eventList.filter(
                (event) => event.date.toMillis() >= currentDate.getTime()
            );

            // Sort events by date from earliest to latest
            eventList = eventList.sort(
                (a, b) => a.date.toMillis() - b.date.toMillis()
            );

            setEvents(eventList);

            const datesList = eventList.map((event) => event.date.toDate());
            setCalendarDates(datesList);
        };
        fetchData();
    }, []);

    const onDateChange = (date) => {
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    return (
        <div>
            <div className="banner">
                <img src="/images/volunteerBanner.webp" alt="Banner Image"/>
            </div>
            <div className="content">
                <h1 className="heading_text">Volunteer Events</h1>

                <div className="calendar">
                    <div className="calendar">
                        <Calendar
                            value={calendarDates}
                            onChange={onDateChange}
                            tileContent={({date}) => {
                                const dateString = date.toISOString().split('T')[0];
                                return calendarDates.find(
                                    (eventDate) => eventDate.toISOString().split('T')[0] === dateString
                                ) ? "•" : null;
                            }}
                            tileClassName={({activeStartDate, date, view}) => {
                                if (view === 'month') {
                                    const isActiveMonth = date.getMonth() === activeStartDate.getMonth();
                                    if (isActiveMonth && calendarDates.some((eventDate) => eventDate.toDateString() === date.toDateString())) {
                                        return 'event-date';
                                    }
                                }
                                return null;
                            }}
                        />
                    </div>
                </div>


                <table className="table">
                    <thead>
                    <tr>
                        <th>Title</th>
                        <th>Description</th>
                        <th>Date</th>
                        <th>Location</th>

                        <th className="start-time-column">Start Time</th>

                    </tr>
                    </thead>
                    <tbody>
                    {events.map((event, index) => (
                        <tr key={index}
                            className={event.date?.toDate().toISOString().split('T')[0] === selectedDate ? 'highlight' : ''}>
                            <td>{event.event_title}</td>
                            <td>{event.description}</td>
                            <td>{event.date?.toDate().toLocaleDateString()}</td>
                            <td>{event.location}</td>

                            <td className="start-time-column">{event.eventStartTime?.toDate().toLocaleTimeString([], {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                            })}</td>

                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Volunteer;
