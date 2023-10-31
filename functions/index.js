const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
admin.initializeApp();

// Create Blue Ocean Society RSVP
exports.createBlueOceanRsvp = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        try {
            const eventId = request.body.data.eventId;
            const loggedInUserId = request.body.data.loggedInUserId;

            // Use the logged-in user ID if available, otherwise use the hard-coded ID
            const userId = loggedInUserId || 'jte56G8cX7RVxvXXmhZTcysW9jL2';

            const rsvp = {
                eventAssociation: admin.firestore().doc(`events/${eventId}`),
                user: admin.firestore().doc(`/users/${userId}`),
                numberAttending: 1,
                note: 'RSVP for Blue Ocean Society event',
                timestamp: new Date(),
            };
            await admin.firestore().collection('rsvp').add(rsvp);
            response.status(200).json({status: "RSVP Created"});
        } catch (error) {
            console.error("Error adding RSVP: ", error);
            response.status(500).json({status: "Internal Server Error", error: error});
        }
    });
});


// Create Event from Scraped Blue Ocean Society Event Data
exports.createEvent = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        try {
            const eventData = request.body;
            const eventId = eventData.id;

            // Check if event with the same ID already exists
            const eventSnapshot = await admin.firestore().collection('events').doc(eventId).get();
            if (eventSnapshot.exists) {
                response.status(200).json({status: "Event already exists, skipping creation"});
                return;
            }

            // Convert milliseconds since epoch to JavaScript Date objects
            const startTime = new Date(eventData.eventStartTime);
            const endTime = new Date(eventData.eventEndTime);
            const date = new Date(eventData.date);

            // Create Firestore document reference for the owner
            const ownerRef = admin.firestore().doc('users/jte56G8cX7RVxvXXmhZTcysW9jL2');

            // Extract latitude and longitude from request body and create a GeoPoint
            const latitude = parseFloat(eventData.latitude);
            const longitude = parseFloat(eventData.longitude);
            const latLng = new admin.firestore.GeoPoint(latitude, longitude);


            const event = {
                ...eventData,
                latLng: latLng,  // Include GeoPoint object in event data
                eventStartTime: admin.firestore.Timestamp.fromDate(startTime),
                eventEndTime: admin.firestore.Timestamp.fromDate(endTime),
                date: admin.firestore.Timestamp.fromDate(date),
                owner: ownerRef,
                time_created: admin.firestore.Timestamp.now(),
            };

            await admin.firestore().collection('events').doc(eventId).set(event);
            response.status(200).json({status: "Event Created"});
        } catch (error) {
            console.error("Error adding event: ", error);
            response.status(500).json({status: "Internal Server Error", error: error});
        }
    });
});

