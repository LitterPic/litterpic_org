import React, {useEffect, useState} from "react";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../lib/firebase";
import {Calendar, momentLocalizer, Navigate} from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import {FaChevronLeft, FaChevronRight} from "react-icons/fa";

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
            {/* replace with your own back icon */}
              <FaChevronLeft className="calendar-chevron-left"/>
          </button>
        </span>
                <span className="rbc-toolbar-label">{this.props.label}</span>
                <span className="rbc-btn-group">
          <button type="button" onClick={() => this.navigate(Navigate.NEXT)}>
            {/* replace with your own next icon */}
              <FaChevronRight className="calendar-chevron-right"/>
          </button>
        </span>
            </div>
        );
    }
}

const Volunteer = () => {
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);

    const handleButtonClick = () => {
        window.location.href = "/community_service_hours"; // Replace with the desired URL or route path
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
            <div className="banner">
                <img src="/images/volunteer_banner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Volunteer Events</h1>
                    LitterPic encourages everyone to play their part in our Environmental Protection Movement. The only
                    way we succeed is when the change comes from within, and we want to empower you to take an active
                    role. Register for volunteering events to lend your support or create a volunteering event for your
                    community. To create a volunteering event, simply utilize the interactive calendar below. Click on
                    the plus sign located at the upper right-hand corner of the calendar or select the desired day for
                    your event.
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
                                toolbar: CustomToolbar,  // Use your custom toolbar
                            }}
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
                </div>
            </div>
        </div>
    )
        ;
};

export default Volunteer;
