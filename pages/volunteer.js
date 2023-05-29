import React, {useEffect, useState} from "react";
import {collection, getDocs} from 'firebase/firestore';
import {db} from "../lib/firebase";

const Volunteer = () => {
    const [events, setEvents] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            const eventCollection = collection(db, 'events');
            const eventSnapshot = await getDocs(eventCollection);
            const eventList = eventSnapshot.docs.map(doc => ({...doc.data(), id: doc.id}));
            setEvents(eventList);
        };
        fetchData();
    }, []);

    return (
        <div className="content">
            Volunteer Events page
            {events.map((event, index) => (
                <div key={index}>
                    <h2>{event.name}</h2>
                    <p>{event.description}</p>
                </div>
            ))}
        </div>
    );
};

export default Volunteer;
