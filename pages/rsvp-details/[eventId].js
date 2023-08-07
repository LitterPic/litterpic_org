import {useRouter} from 'next/router';
import {useEffect, useState} from 'react';
import {auth, db} from "../../lib/firebase";
import {doc, getDoc} from 'firebase/firestore';

const RsvpDetails = () => {
    const router = useRouter();
    const {eventId} = router.query;
    const [rsvpDetails, setRsvpDetails] = useState([]);

    useEffect(() => {
        const fetchRsvpDetails = async () => {
            if (eventId) {
                // Fetch the event document
                const eventDocRef = doc(db, 'events', eventId);
                const eventDoc = await getDoc(eventDocRef);

                if (eventDoc.exists()) {
                    const eventData = eventDoc.data();
                    const rsvpsRefs = eventData.rsvps;

                    // Fetch each RSVP document using its reference
                    const allRsvpDetails = [];
                    for (const rsvpRef of rsvpsRefs) {
                        const rsvpDocRef = doc(db, rsvpRef.path);
                        const rsvpDoc = await getDoc(rsvpDocRef);

                        if (rsvpDoc.exists()) {
                            const rsvpData = rsvpDoc.data();

                            // Fetch the user document associated with the RSVP
                            const userDocRef = rsvpData.user;
                            const userDoc = await getDoc(userDocRef);
                            if (userDoc.exists()) {
                                const userData = userDoc.data();
                                allRsvpDetails.push({
                                    ...rsvpData,
                                    userEmail: userData.email,
                                    userName: userData.display_name,
                                    organization: userData.organization
                                });
                            } else {
                                // If the user doc doesn't exist, just push the RSVP data
                                allRsvpDetails.push(rsvpData);
                            }
                        }
                    }

                    setRsvpDetails(allRsvpDetails);
                }
            }
        };

        fetchRsvpDetails();
    }, [eventId]);

    const downloadCSV = () => {
        let csvContent = "Email,Username,Note to Organizer,Organization\n";
        rsvpDetails.forEach(item => {
            csvContent += `${item.userEmail},${item.userName},${item.noteToOrganizer},${item.organization}\n`;
        });

        const blob = new Blob([csvContent], {type: 'text/csv;charset=utf-8;'});
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'rsvp_details.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <table className="rsvp-details-table">
                <thead>
                <tr>
                    <th>Email</th>
                    <th>Name</th>
                    <th>Note to Organizer</th>
                    <th>Organization</th>
                </tr>
                </thead>
                <tbody>
                {
                    rsvpDetails.map((rsvp, index) => (
                        <tr key={index}>
                            <td>{rsvp.userEmail}</td>
                            <td>{rsvp.userName}</td>
                            <td>{rsvp.noteToOrganizer}</td>
                            <td>{rsvp.organization}</td>
                        </tr>
                    ))
                }
                </tbody>
            </table>
            <button className="download-csv-button" onClick={downloadCSV}>Download CSV</button>
        </div>
    );
}

export default RsvpDetails;
