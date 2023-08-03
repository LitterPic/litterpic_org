import {
    arrayUnion,
    arrayRemove,
    collection,
    deleteDoc,
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

export async function deletePost(postId) {
    const postRef = doc(db, 'userPosts', postId);
    await deleteDoc(postRef);
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

``

export async function toggleLike(post, posts) {
    const postToUpdate = posts.find((p) => p.id === post.id);
    const auth = getAuth();

    // Check if the user is logged in
    const currentUser = auth.currentUser;
    if (!currentUser) {
        const router = useRouter();
        router.push('/login');
        return;
    }

    // Get the user's UID
    const userId = currentUser.uid;

    // Check if the post exists and if the user has already liked it
    if (!postToUpdate.likeIds || !Array.isArray(postToUpdate.likeIds)) {
        // User has not liked the post, so add their UID to the likes array
        await updateDoc(postToUpdate.ref, {likes: arrayUnion(doc(db, 'users', userId))});
        return true;
    } else if (postToUpdate.likeIds.includes(userId)) {
        // User already liked the post, so remove their UID from the likes array
        await updateDoc(postToUpdate.ref, {likes: arrayRemove(doc(db, 'users', userId))});
        return false;
    } else {
        // User has not liked the post, so add their UID to the likes array
        await updateDoc(postToUpdate.ref, {likes: arrayUnion(doc(db, 'users', userId))});
        return true;
    }
}