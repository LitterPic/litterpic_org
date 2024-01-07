const AWS = require('aws-sdk');
const admin = require('firebase-admin');

const secretsManager = new AWS.SecretsManager();

async function getFirebaseServiceAccountKey() {
    const secretName = 'firebaseServiceAccountKey';
    const data = await secretsManager.getSecretValue({SecretId: secretName}).promise();

    if ('SecretString' in data) {
        return JSON.parse(data.SecretString);
    } else {
        throw new Error('Error retrieving Firebase service account key');
    }
}

async function getSumOfLitterWeight(userUid) {
    const db = admin.firestore();
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

exports.handler = async (event) => {
    try {
        // Retrieve the Firebase service account key
        const serviceAccountKey = await getFirebaseServiceAccountKey();

        // Initialize Firebase Admin
        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountKey),
                databaseURL: "https://litterpic-fa0bb.firebaseio.com" // Replace with your actual Firebase database URL
            });
        }

        const db = admin.firestore();
        const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);


        // Query userPosts for posts made in the last 24 hours
        const recentPostsQuery = db.collection('userPosts')
            .where('timePosted', '>=', twentyFiveHoursAgo)
            .get();

        const recentPostsSnapshot = await recentPostsQuery;

        const usersToUpdate = new Set();

        // Collect user IDs from the recent posts
        recentPostsSnapshot.forEach(doc => {
            const post = doc.data();
            usersToUpdate.add(post.postUser.id);
        });

        // Update totalWeight for users who made a post in the last 24 hours
        for (const userId of usersToUpdate) {
            const sum = await getSumOfLitterWeight(userId);

            // Update the user's totalWeight field
            await db.doc(`users/${userId}`).update({
                totalWeight: sum,
            });

        }

        return {
            statusCode: 200,
            body: JSON.stringify({message: 'TotalWeight update process completed successfully'})
        };
    } catch (error) {
        console.error('Error in TotalWeight update process:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({message: 'Error occurred during the TotalWeight update process'})
        };
    }
};
