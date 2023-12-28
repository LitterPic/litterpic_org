const admin = require('firebase-admin');

const serviceAccount = require('./litterpic-fa0bb-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://litterpic-fa0bb.firebaseio.com"
});

const db = admin.firestore();

async function getSumOfLitterWeight(userUid) {
    let sum = 0;
    const querySnapshot = await db.collection("userPosts")
        .where('postUser', '==', db.doc('users/' + userUid))
        .get();

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.litterWeight) {
            sum += data.litterWeight;
        }
    });

    return sum;
}

const userEmail = "mark_a_murray@hotmail.com";
const userRef = db.collection("users").where("email", "==", userEmail);
userRef.get()
    .then((querySnapshot) => {
        if (!querySnapshot.empty) {
            const userUid = querySnapshot.docs[0].id;
            return getSumOfLitterWeight(userUid);
        } else {
            throw new Error(`User with email ${userEmail} not found.`);
        }
    })
    .then((sum) => {
        console.log(`The sum of all litterWeight fields for user ${userEmail} is:`, sum);
    })
    .catch((error) => {
        console.error("An error occurred:", error);
    });
