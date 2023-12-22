const AWS = require('aws-sdk');
const admin = require('firebase-admin');

const secretsManager = new AWS.SecretsManager();

async function getFirebaseServiceAccountKey() {
    const secretName = 'firebaseServiceAccountKey';
    const data = await secretsManager.getSecretValue({SecretId: secretName}).promise();

    if ('SecretString' in data) {
        console.log("Secret retrieved successfully");
        return JSON.parse(data.SecretString);
    } else {
        throw new Error('Error retrieving Firebase service account key');
    }
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
        const userFilter = event.userFilter || 'all_users';
        let usersSnapshot;

        if (userFilter === 'all_users') {
            const usersQuery = db.collection('users');
            usersSnapshot = await usersQuery.get();
        } else {
            const userQuery = db.collection('users').where('email', '==', userFilter);
            usersSnapshot = await userQuery.get();

            if (usersSnapshot.empty) {
                console.log(`No user found with email ${userFilter}`);
                return {
                    statusCode: 404,
                    body: JSON.stringify({message: `No user found with email ${userFilter}`})
                };
            }
        }

        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userEmail = userDoc.data().email;

            if (userEmail === 'alek@litterpic.org' || userEmail === 'melanie.tolman@gmail.com') {
                console.log(`User with email ${userEmail} is excluded from updates.`);
                continue;
            }

            const currentDate = new Date();
            const ninetyDaysAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

            const userPostsQuery = db.collection('userPosts')
                .where('postUser', '==', db.doc('users/' + userId))
                .where('timePosted', '>=', ninetyDaysAgo)
                .orderBy('timePosted');

            const userPostsSnapshot = await userPostsQuery.get();
            const userPosts = userPostsSnapshot.docs;
            const postCount = userPosts.length;
            const isAmbassador = userDoc.data().ambassador;

            if (postCount > 5) {
                const lastPostQuery = db.collection('userPosts')
                    .where('postUser', '==', db.doc('users/' + userId))
                    .where('timePosted', '>=', thirtyDaysAgo)
                    .orderBy('timePosted', 'desc')
                    .limit(1);

                const lastPostSnapshot = await lastPostQuery.get();
                const lastPost = lastPostSnapshot.docs[0];

                if (lastPost) {
                    if (!isAmbassador) {
                        await db.doc('users/' + userId).update({
                            ambassador: true,
                            ambassador_date: lastPost.data().timePosted,
                        });
                        console.log(`User with ID ${userId} updated as an ambassador.`);
                    }
                } else {
                    if (isAmbassador) {
                        await db.doc('users/' + userId).update({
                            ambassador: false,
                            ambassador_date: null,
                        });
                        console.log(`User with ID ${userId} no longer qualifies as an ambassador.`);
                    }
                }
            } else {
                if (isAmbassador) {
                    await db.doc('users/' + userId).update({
                        ambassador: false,
                        ambassador_date: null,
                    });
                    console.log(`User with ID ${userId} no longer qualifies as an ambassador.`);
                }
            }
        }

        console.log(userFilter === 'all_users' ? 'Ambassador updates for all users completed.' : `Ambassador updates for user with email ${userFilter} completed.`);
        return {
            statusCode: 200,
            body: JSON.stringify({message: 'Ambassador update process completed successfully'})
        };
    } catch (error) {
        console.error('Error in ambassador update process:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({message: 'Error occurred during the ambassador update process'})
        };
    }
};
