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
import {useRouter} from 'next/router';

export async function fetchPosts(page, postsPerPage) {
    let postQuery = query(
        collection(db, 'userPosts'),
        orderBy('timePosted', 'desc'),
        limit(postsPerPage),
    );

    const options = {
        getDocsFromServer: ['likes', 'numComments']
    };

    if (page > 1) {
        const lastVisiblePost = await getLastVisiblePost(page - 1, postsPerPage);
        postQuery = query(
            collection(db, 'userPosts'),
            orderBy('timePosted', 'desc'),
            startAfter(lastVisiblePost),
            limit(postsPerPage)
        );
    }

    const querySnapshot = await getDocs(postQuery, options);

    const posts = [];

    for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data();
        const photos = [];
        const likeIds = postData.likes && postData.likes.map(ref => ref.id);
        const validLikeIds = likeIds && likeIds.filter(id => id !== '');
        const numComments = postData.numComments || 0;

        const likesCount = validLikeIds ? validLikeIds.length : 0;

        if (Array.isArray(postData.postPhotos)) {
            for (const pictureRef of postData.postPhotos) {
                const pictureUrl = await getDownloadURL(ref(storage, pictureRef));
                photos.push(pictureUrl);
            }
        }

        // Fetch user data
        const userId = postData.postUser;
        const userData = await getUserData(userId);

        const likes = likesCount !== undefined ? likesCount : 0;

        posts.push({
            id: postDoc.id,
            user: userData,
            photos: photos,
            dateCreated: postData.timePosted.toDate(),
            location: postData.location,
            description: postData.postDescription,
            litterWeight: postData.litterWeight,
            likes: likes,
            numComments,
            ref: postDoc.ref,
            likeIds: likeIds,
        });
    }

    return posts;
}

async function getUserData(userId) {
    const userQuery = query(collection(db, 'users'), where('__name__', '==', userId));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
        return null;
    }

    return userSnapshot.docs[0].data();
}

async function getLastVisiblePost(page, postsPerPage) {
    const startIndex = (page - 1) * postsPerPage;
    const postQuery = query(
        collection(db, 'userPosts'),
        orderBy('timePosted', 'desc'),
        limit(startIndex + postsPerPage)
    );

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

        // Extract the UIDs from each user reference
        return likedUsersRefs.map((userRef) => userRef.id);
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

    // Get the user's UID
    const userId = currentUser.uid;

    // Construct the document reference using the post ID
    const db = getFirestore();
    const postRef = doc(db, 'userPosts', post.id);

    // Check if the user has already liked the post
    if (!post.likeIds || !Array.isArray(post.likeIds)) {
        await updateDoc(postRef, {likes: arrayUnion(userId)});
        return true;
    } else if (post.likeIds.includes(userId)) {
        await updateDoc(postRef, {likes: arrayRemove(userId)});
        return false;
    } else {
        await updateDoc(postRef, {likes: arrayUnion(userId)});
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

