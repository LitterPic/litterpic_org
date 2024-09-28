const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = require('./litterpic-fa0bb-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://litterpic-fa0bb.firebaseio.com"
});

const db = admin.firestore(); // Ensure parentheses are here

// Function to update display name for one user or all users
async function updateDisplayName(userId = null) {
    if (userId) {
        // Update for a single user
        const userRef = db.collection("users").doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            console.log("No such user found!");
            return;
        }

        const userData = userDoc.data();
        const email = userData.email;

        if (!userData.display_name || userData.display_name.trim() === "") {
            const newDisplayName = email.split("@")[0];
            console.log(`Updating user ${userId} with display_name: ${newDisplayName}`);

            await userRef.update({
                display_name: newDisplayName,
            });

            console.log(`User ${userId} display_name updated successfully!`);
        } else {
            console.log(`User ${userId} already has a display_name.`);
        }
    } else {
        // Update for all users
        const usersRef = db.collection("users");
        const snapshot = await usersRef.get();

        snapshot.forEach(async (doc) => {
            const userData = doc.data();
            const email = userData.email;

            if (!userData.display_name || userData.display_name.trim() === "") {
                const newDisplayName = email.split("@")[0];
                console.log(`Updating user ${doc.id} with display_name: ${newDisplayName}`);

                await usersRef.doc(doc.id).update({
                    display_name: newDisplayName,
                });

                console.log(`User ${doc.id} display_name updated successfully!`);
            } else {
                console.log(`User ${doc.id} already has a display_name.`);
            }
        });

        console.log("Display names updated for all users where necessary.");
    }
}

// To run, uncomment one of the calls below and run node updateDisplayName.js
updateDisplayName();

// To run for a single user, pass the userId
// updateDisplayName('MDNa5NjUp9Z1Qj0u7gpDjkCGanE3');

