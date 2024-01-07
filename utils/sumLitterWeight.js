const admin = require('firebase-admin');

// Initialize Firebase Admin with your service account
const serviceAccount = require('./litterpic-fa0bb-key.json'); // Adjust the path if necessary

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://litterpic-fa0bb.firebaseio.com"
});

const db = admin.firestore();

async function getSumOfLitterWeight() {
    let sum = 0;
    const querySnapshot = await db.collection("userPosts").get();

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.litterWeight) {
            sum += data.litterWeight;
        }
    });

    return sum;
}

getSumOfLitterWeight().then((sum) => {
}).catch((error) => {
    console.error("An error occurred:", error);
});
