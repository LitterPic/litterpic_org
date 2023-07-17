import {
    collection,
    getDocs,
    limit,
    orderBy,
    query,
    startAfter,
    where
} from 'firebase/firestore';
import {db, storage} from '../lib/firebase';
import {getDownloadURL, ref} from 'firebase/storage';

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
