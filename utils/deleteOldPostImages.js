const admin = require('firebase-admin');

const serviceAccount = require('./litterpic-fa0bb-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://litterpic-fa0bb.firebaseio.com",
    storageBucket: "litterpic-fa0bb.appspot.com"
});

const db = admin.firestore();
const storage = admin.storage();

async function deleteOldPostImages() {
    const deleteToDate = new Date();
    const daysAgo = 365;
    deleteToDate.setDate(deleteToDate.getDate() - daysAgo);

    const oldPostsQuery = db.collection("userPosts").where('timePosted', '<=', deleteToDate);
    const oldPostsSnapshot = await oldPostsQuery.get();

    for (const doc of oldPostsSnapshot.docs) {
        const post = doc.data();
        const imageRefs = post.postPhotos;

        const deleteImagePromises = imageRefs.map(async (imageRef) => {
            const file = storage.bucket().file(imageRef);
            try {
                await file.delete();
                console.log('Deleted images for doc id:', doc.id);
            } catch (error) {
                console.error(`Failed to delete image: ${imageRef}`, error);
            }
        });

        await Promise.all(deleteImagePromises);

        await doc.ref.update({postPhotos: []});
    }
}

deleteOldPostImages().then(() => {
    console.log("Image deletion process completed.");
}).catch((error) => {
    console.error("An error occurred during the image deletion process:", error);
});


