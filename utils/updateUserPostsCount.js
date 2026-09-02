const admin = require('firebase-admin');

const serviceAccount = require('./litterpic-fa0bb-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://litterpic-fa0bb.firebaseio.com"
});

const db = admin.firestore();

async function updateUserPostCounts() {
    try {
        const [usersSnapshot, postsSnapshot] = await Promise.all([
            db.collection('users').get(),
            db.collection('userPosts').get()
        ]);

        const postCountsByUser = {};

        for (const postDoc of postsSnapshot.docs) {
            const postData = postDoc.data();
            const postUser = postData.postUser;
            const userId = (postUser && typeof postUser === 'object' && postUser.id)
                ? postUser.id
                : (postData.userId || postData.user_id || null);

            if (!userId) continue;
            postCountsByUser[userId] = (postCountsByUser[userId] || 0) + 1;
        }

        const userUpdates = usersSnapshot.docs.map(userDoc => {
            const userId = userDoc.id;
            const postCount = postCountsByUser[userId] || 0;
            return db.doc('users/' + userId).update({
                numberOfPosts: postCount,
                postCount,
                postsCount: postCount
            });
        });

        await Promise.all(userUpdates);
        console.log(`Updated post counts for ${userUpdates.length} users.`);
    } catch (error) {
        console.error('Error updating user post counts:', error);
    }
}

updateUserPostCounts();
