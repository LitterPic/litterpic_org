import React, {useEffect, useState} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../lib/firebase";
import {Calendar, momentLocalizer} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

const Volunteer = () => {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

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

            const currentDate = new Date();
            eventList = eventList.filter(
                (event) => event.start.getTime() >= currentDate.getTime()
            );

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

    const EventComponent = ({event}) => {
        return (
            <span className="event-background">
                <strong>{event.event_title}</strong>
            </span>
        )
    };

    return (
        <div>
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
                    }}
                />
            </div>

            <table className="table">
                <thead>
                <tr>
                    <th>Event</th>
                    <th>Description</th>
                    <th>Date</th>
                    <th>Location</th>
                    <th className="start-time-column">Start Time</th>
                </tr>
                </thead>
                <tbody>
                {events.map((event, index) => (
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
                    </tr>
                ))}
                </tbody>
            </table>
        </div>
    )
        ;
};

export default Volunteer;
