import {collection, getDocs, limit, orderBy, query, startAfter} from 'firebase/firestore';
import {db, storage} from '../lib/firebase';
import {getDownloadURL, ref} from 'firebase/storage';

export async function fetchPosts(page, postsPerPage) {
    let postQuery = query(
        collection(db, 'userPosts'),
        orderBy('timePosted', 'desc'),
        limit(postsPerPage)
    );

    if (page > 1) {
        const lastVisiblePost = await getLastVisiblePost(page - 1, postsPerPage);
        postQuery = query(
            collection(db, 'userPosts'),
            orderBy('timePosted', 'desc'),
            startAfter(lastVisiblePost),
            limit(postsPerPage)
        );
    }

    const querySnapshot = await getDocs(postQuery);

    const posts = [];

    for (const postDoc of querySnapshot.docs) {
        const postData = postDoc.data();
        const photos = [];

        if (Array.isArray(postData.postPhotos)) {
            for (const pictureRef of postData.postPhotos) {
                const pictureUrl = await getDownloadURL(ref(storage, pictureRef));
                photos.push(pictureUrl);
            }
        }

        posts.push({
            id: postDoc.id,
            user: postData.postUser,
            photos: photos,
            dateCreated: postData.timePosted.toDate(),
            location: postData.location,
            description: postData.postDescription,
            litterWeight: postData.litterWeight,
        });
    }

    return posts;
}

async function getLastVisiblePost(page, postsPerPage) {
    const startIndex = (page - 1) * postsPerPage;
    const postQuery = query(
        collection(db, 'userPosts'),
        orderBy('timePosted', 'desc'),
        limit(startIndex + 1)
    );

    const querySnapshot = await getDocs(postQuery);
    return querySnapshot.docs[startIndex];
}
