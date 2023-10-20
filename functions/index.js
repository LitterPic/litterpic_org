const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
admin.initializeApp();

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


