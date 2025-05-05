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
            likes: postData.likes || [],
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

    try {
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
            const postData = postSnap.data();
            const likedUsersRefs = postData.likes || [];

            if (Array.isArray(likedUsersRefs)) {
                // Extract the UIDs from each user reference
                const userDocIds = likedUsersRefs.map((userRef) => {
                    // Check if the userRef is a document reference
                    if (userRef && userRef.id) {
                        return userRef.id; // Extract the document ID
                    } else {
                        return userRef;
                    }

                });

                // Remove duplicates
                return [...new Set(userDocIds)];
            } else {
                return [];
            }
        } else {
            return [];
        }
    } catch (error) {
        console.error("Error getting liked users", error);
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

    const userId = currentUser.uid;
    const db = getFirestore();
    const postRef = doc(db, 'userPosts', post.id);

    // Fetch the latest post data
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
        console.error("Post does not exist:", post.id);
        return false; // Or throw an error
    }

    const updatedPostData = postSnap.data();
    const currentLikes = updatedPostData.likes || [];

    // Create the user document reference
    const userDocRef = doc(db, 'users', userId);

    // Check if the user has already liked the post using their document reference
    if (!currentLikes || !Array.isArray(currentLikes)) {
        await updateDoc(postRef, { likes: arrayUnion(userDocRef) });
        return true;
    } else {
        // Check if the userDocRef is in the array.
        const userLiked = currentLikes.some(like => like.path === userDocRef.path);
        if (userLiked) {
            await updateDoc(postRef, { likes: arrayRemove(userDocRef) });
            return false;
        } else {
            await updateDoc(postRef, { likes: arrayUnion(userDocRef) });
            return true;
        }
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

