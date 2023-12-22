const AWS = require('aws-sdk');
const admin = require('firebase-admin');

const secretsManager = new AWS.SecretsManager();

async function getFirebaseServiceAccountKey() {
    const secretName = 'firebaseServiceAccountKey';
    const data = await secretsManager.getSecretValue({SecretId: secretName}).promise();

    if ('SecretString' in data) {
        console.log("Secret retrieved successfully"); // Log for successful retrieval
        const parsedSecret = JSON.parse(data.SecretString);
        console.log("Parsed Secret: ", {project_id: parsedSecret.project_id}); // Log part of the parsed secret
        return parsedSecret;
    } else {
        throw new Error('Error parsing secret');
    }
}

exports.handler = async (event) => {
    try {
        // Retrieve the Firebase service account key
        const serviceAccountKey = await getFirebaseServiceAccountKey();

        if (admin.apps.length === 0) {
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccountKey),
                databaseURL: "https://litterpic-fa0bb.firebaseio.com"
            });
        }

        const db = admin.firestore();

        // Query all users
        const usersQuery = db.collection('users');
        const usersSnapshot = await usersQuery.get();

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;

            // Query userPosts to count posts for this user
            const userPostsQuery = db.collection('userPosts').where('postUser', '==', db.doc('users/' + userId));
            const userPostsSnapshot = await userPostsQuery.get();
            const postCount = userPostsSnapshot.docs.length;

            // Update the numberOfPosts field for the user
            await db.doc('users/' + userId).update({
                numberOfPosts: postCount
            });

            console.log(`Updated numberOfPosts for user with ID ${userId} to ${postCount}.`);
        }

        console.log('Post count updates for all users completed.');
        return {
            statusCode: 200,
            body: JSON.stringify('Update successful')
        };
    } catch (error) {
        console.error('Error updating user post counts:', error);
        return {
            statusCode: 500,
            body: JSON.stringify('Error occurred during update')
        };
    }
};
