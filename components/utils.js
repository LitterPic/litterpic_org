import {
    arrayRemove,
    arrayUnion,
    collection,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    limit,
    orderBy,
    query,
    startAfter,
    updateDoc,
    where
} from 'firebase/firestore';
import {db, storage} from '../lib/firebase';
import {getDownloadURL, ref} from 'firebase/storage';
import {getAuth} from 'firebase/auth';

export async function* fetchPosts(page, postsPerPage, userId = null) {
    let postQuery;

    if (userId) {
        const userDocRef = doc(db, 'users', userId);
        postQuery = query(
            collection(db, 'userPosts'),
            where('postUser', '==', userDocRef),
            orderBy('timePosted', 'desc'),
            limit(postsPerPage)
        );
    } else {
        postQuery = query(
            collection(db, 'userPosts'),
            orderBy('timePosted', 'desc'),
            limit(postsPerPage)
        );
    }

    if (page > 1) {
        const lastVisiblePost = await getLastVisiblePost(page - 1, postsPerPage, userId);
        postQuery = query(postQuery, startAfter(lastVisiblePost));
    }

    const querySnapshot = await getDocs(postQuery);
    for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data();
        const userDataPromise = getUserData(postData.postUser);

        const photos = postData.postPhotos || [];
        const photoUrls = await Promise.all(photos.map(async (photoRef) => {
            try {
                return await getDownloadURL(ref(storage, photoRef));
            } catch {
                return "https://example.com/fallback-image.jpg";
            }
        }));

        const userData = await userDataPromise;

        yield {
            id: postDoc.id,
            photos: photoUrls,
            user: userData,
            dateCreated: postData.timePosted.toDate(),
            location: postData.location,
            description: postData.postDescription,
            litterWeight: postData.litterWeight,
            likes: postData.likes ? postData.likes.length : 0,
            numComments: postData.numComments || 0,
        };
    }
}


async function getUserData(userRef) {
    // Check if userRef is a string (user ID) or a Firestore document reference
    let userDocRef;
    if (typeof userRef === 'string') {
        userDocRef = doc(db, 'users', userRef);
    } else if (userRef && typeof userRef.path === 'string') {
        userDocRef = userRef;
    } else {
        console.error("Invalid user reference:", userRef);
        return null;
    }

    const userSnapshot = await getDoc(userDocRef);

    if (userSnapshot.exists()) {
        return userSnapshot.data();
    } else {
        console.log("No user found for reference:", userRef);
        return null;
    }
}


async function getLastVisiblePost(page, postsPerPage, userId = null) {
    let postQuery;

    if (userId) {
        const userDocRef = doc(db, 'users', userId);
        postQuery = query(
            collection(db, 'userPosts'),
            where('postUser', '==', userDocRef),
            orderBy('timePosted', 'desc'),
            limit(page * postsPerPage)
        );
    } else {
        postQuery = query(
            collection(db, 'userPosts'),
            orderBy('timePosted', 'desc'),
            limit(page * postsPerPage)
        );
    }

    const querySnapshot = await getDocs(postQuery);
    return querySnapshot.docs[querySnapshot.docs.length - 1];
}

// Function to fetch the complete user data for each liked user in the post
export async function getUsersWhoLikedPost(postId) {
    const db = getFirestore();
    const postRef = doc(db, 'userPosts', postId);

    const postSnap = await getDoc(postRef);
    if (postSnap.exists()) {
        const postData = postSnap.data();
        const likedUsersRefs = postData.likes || [];

        // Log the user document IDs
        const userDocIds = likedUsersRefs.map((userRef) => {
            return userRef.id;
        });

        // Extract the UIDs from each user reference
        return [...new Set(userDocIds)];
    } else {
        return [];
    }
}


export async function toggleLike(post) {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
        const router = useRouter();
        router.push('/login');
        return;
    }

    // Get the user's UID and construct the DocumentReference
    const userId = currentUser.uid;
    const db = getFirestore();
    const userDocRef = doc(db, 'users', userId);

    // Construct the document reference for the post
    const postRef = doc(db, 'userPosts', post.id);

    // Check if the user has already liked the post
    if (!post.likeIds || !Array.isArray(post.likeIds)) {
        await updateDoc(postRef, {likes: arrayUnion(userDocRef)});
        return true;
    } else if (post.likeIds.some(ref => ref.path === userDocRef.path)) {
        await updateDoc(postRef, {likes: arrayRemove(userDocRef)});
        return false;
    } else {
        await updateDoc(postRef, {likes: arrayUnion(userDocRef)});
        return true;
    }
}

export const resizeImage = (file, maxWidth = 600, maxHeight = 600) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                canvas.toBlob(resolve, 'image/webp', .8);
            };
        };
        reader.readAsDataURL(file);
    });
};

