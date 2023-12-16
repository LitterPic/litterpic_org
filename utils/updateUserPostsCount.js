const admin = require('firebase-admin');

const serviceAccount = require('./litterpic-fa0bb-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://litterpic-fa0bb.firebaseio.com"
});

const db = admin.firestore();

async function updateUserPostCounts() {
    try {
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

    } catch (error) {
        console.error('Error updating user post counts:', error);
    }
}

updateUserPostCounts();
