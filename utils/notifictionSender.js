import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    getFirestore,
    limit,
    query,
    serverTimestamp,
    setDoc,
    where
} from 'firebase/firestore';
import {db} from "../lib/firebase";
import {getUsersWhoLikedPost} from "../components/utils";

class NotificationSender {

    static titles = [
        "Keep being awesome!",
        "Every piece of litter counts!",
        "You make the world cleaner!",
        "Small acts, big impact!",
        "Thank you for making a difference!",
        "Your kindness is inspiring!",
        "Together, we create change!",
        "Keep up the great work!",
        "You're a hero for our planet!",
        "Changing the world!",
        "Your actions speak volumes!"
    ];

    static async notificationExists(postId, postAuthorId, userId, message) {
        const db = getFirestore();
        const notificationsQuery = query(
            collection(db, `users/${postAuthorId}/notifications`),
            where('postId', '==', `userPosts/${postId}`),
            where('userId', '==', `users/${userId}`),
            where('message', '==', message),
            limit(1)
        );

        const querySnapshot = await getDocs(notificationsQuery);
        return !querySnapshot.empty;
    }

    static async handleFollow(currentUser, followedUserId) {
        if (!currentUser?.uid) {
            throw new Error('User must be logged in to follow others.');
        }

        try {
            await setDoc(doc(db, 'followers', followedUserId, 'userFollowers', currentUser.uid), {
                followedAt: serverTimestamp(),
            });
            await setDoc(doc(db, 'following', currentUser.uid, 'userFollowing', followedUserId), {
                followedAt: serverTimestamp(),
            });

            await NotificationSender.sendFollowNotification(followedUserId, currentUser);
        } catch (error) {
            console.error('Error following user:', error);
        }
    }

    static async handleUnfollow(currentUser, followedUserId) {
        if (!currentUser?.uid) {
            throw new Error('User must be logged in to unfollow others.');
        }

        try {
            await deleteDoc(doc(db, 'followers', followedUserId, 'userFollowers', currentUser.uid));
            await deleteDoc(doc(db, 'following', currentUser.uid, 'userFollowing', followedUserId));

            console.log('User unfollowed successfully!');
        } catch (error) {
            console.error('Error unfollowing user:', error);
        }
    }

    static async sendFollowNotification(followedUserId, loggedInUser) {
        try {
            const notificationMessage = `${loggedInUser.displayName || loggedInUser.email} followed you.`;

            const notification = {
                id: doc(collection(db, 'notifications')).id,
                title: "You're getting popular!",
                message: notificationMessage,
                timestamp: serverTimestamp(),
                isRead: false,
                userId: `users/${followedUserId}`,
            };

            await setDoc(doc(db, `users/${followedUserId}/notifications/${notification.id}`), notification);
        } catch (e) {
            console.error('Failed to send follow notification:', e);
        }
    }

    static async sendNewPostNotification(followerId, postId, postUserName) {
        try {
            const notificationMessage = `${postUserName} just posted a new story!`;

            const notification = {
                id: doc(collection(db, 'notifications')).id,
                title: "New Story!",
                message: notificationMessage,
                timestamp: serverTimestamp(),
                isRead: false,
                postId: `userPosts/${postId}`,
                userId: `users/${followerId}`,
            };

            await setDoc(doc(db, `users/${followerId}/notifications/${notification.id}`), notification);
            console.log('New post notification sent!');
        } catch (e) {
            console.error('Failed to send new post notification:', e);
        }
    }

    static async createLikeNotification(postId, postAuthorId, user) {
        const randomTitle = this.titles[Math.floor(Math.random() * this.titles.length)];
        const db = getFirestore();
        const notificationMessage = `${user.displayName || user.email} liked your post.`;

        if (await NotificationSender.notificationExists(postId, postAuthorId, user.uid, notificationMessage)) {
            return;
        }

        const notification = {
            id: doc(collection(db, 'notifications')).id,
            title: randomTitle,
            message: notificationMessage,
            timestamp: serverTimestamp(),
            isRead: false,
            postId: `userPosts/${postId}`,
            userId: `users/${postAuthorId}`,
        };

        try {
            await setDoc(doc(db, `users/${postAuthorId}/notifications/${notification.id}`), notification);
        } catch (e) {
            console.error("Failed to add notification:", e);
        }
    }

    static async createLikeNotificationForOthers(postId, likingUser, postAuthorId) {
        try {
            const likedUserIds = await getUsersWhoLikedPost(postId);
            const db = getFirestore();
            const message = `${likingUser.displayName || likingUser.email} liked a post you liked.`;

            // Send a notification to each user who liked the post, except the current user and the post author
            const notificationPromises = likedUserIds
                .filter(uid => uid !== likingUser.uid && uid !== postAuthorId)
                .map(async (uid) => {
                    if (await NotificationSender.notificationExists(postId, uid, likingUser.uid, message)) {
                        return;
                    }

                    const notification = {
                        id: doc(collection(db, 'notifications')).id,
                        title: "Someone liked a post you liked!",
                        message: message,
                        timestamp: serverTimestamp(),
                        isRead: false,
                        postId: `userPosts/${postId}`,
                        userId: `users/${uid}`,
                    };

                    return setDoc(doc(db, `users/${uid}/notifications/${notification.id}`), notification);
                });

            await Promise.all(notificationPromises);
        } catch (e) {
            console.error("Failed to send notifications to other users:", e);
        }
    }

    static async createCommentNotification(postId, postAuthorId, user, comment) {
        const db = getFirestore();
        const words = comment.split(' ');
        const commentPreview = words.length > 10 ? words.slice(0, 10).join(' ') + '...' : comment;
        const randomTitle = this.titles[Math.floor(Math.random() * this.titles.length)];
        const notificationMessage = `${user.displayName || user.email} commented: "${commentPreview}"`;
        
        if (await NotificationSender.notificationExists(postId, postAuthorId, user.uid, notificationMessage)) {
            return;
        }

        const notification = {
            id: doc(collection(db, 'notifications')).id,
            title: randomTitle,
            message: notificationMessage,
            timestamp: serverTimestamp(),
            isRead: false,
            postId: `userPosts/${postId}`,
            userId: `users/${postAuthorId}`,
        };

        try {
            await setDoc(doc(db, `users/${postAuthorId}/notifications/${notification.id}`), notification);
        } catch (e) {
            console.error("Failed to add notification:", e);
        }
    }

    static async createCommentNotificationForOthers(postId, commentingUser, commentText, postAuthorId) {
        const db = getFirestore();

        try {
            const q = query(collection(db, 'storyComments'), where('postAssociation', '==', doc(db, 'userPosts', postId)));
            const querySnapshot = await getDocs(q);

            const commenterIds = new Set();
            querySnapshot.forEach((doc) => {
                const commentUser = doc.data().commentUser;
                if (commentUser && commentUser._key && commentUser._key.path && commentUser._key.path.segments) {
                    const userIdFromComment = commentUser._key.path.segments[6];
                    commenterIds.add(userIdFromComment);
                }
            });

            const message = `${commentingUser.displayName || commentingUser.email} also commented on a post you commented on: "${commentText}"`;

            // Send a notification to each user who commented on the post, except the current user and the post author
            const notificationPromises = Array.from(commenterIds)
                .filter(uid => uid !== commentingUser.uid && uid !== postAuthorId)
                .map(async (uid) => {
                    if (await NotificationSender.notificationExists(postId, uid, commentingUser.uid, message)) {
                        return;
                    }

                    const notification = {
                        id: doc(collection(db, 'notifications')).id,
                        title: "Someone commented on a post you commented on!",
                        message: message,
                        timestamp: serverTimestamp(),
                        isRead: false,
                        postId: `userPosts/${postId}`,
                        userId: `users/${uid}`,
                    };

                    return setDoc(doc(db, `users/${uid}/notifications/${notification.id}`), notification);
                });

            await Promise.all(notificationPromises);
        } catch (e) {
            console.error("Failed to send notifications to other users:", e);
        }
    }
}

export default NotificationSender;
