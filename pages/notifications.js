import React, {useEffect, useState} from 'react';
import {collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc} from 'firebase/firestore';
import {auth, db} from '../lib/firebase';
import {formatDistanceToNow} from 'date-fns'; // For better time formatting
import {useRouter} from 'next/router';
import Head from "next/head";
import Script from "next/script";
import withAuth from "../components/withAuth";

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const router = useRouter();
    const currentUser = auth.currentUser;

    useEffect(() => {
        if (!currentUser) return;

        // Query to fetch notifications ordered by timestamp in descending order
        const notificationsRef = collection(db, `users/${currentUser.uid}/notifications`);
        const notificationsQuery = query(notificationsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const fetchedNotifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setNotifications(fetchedNotifications);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = async (notificationId) => {
        const notificationRef = doc(db, `users/${currentUser.uid}/notifications`, notificationId);
        await updateDoc(notificationRef, {isRead: true});
    };

    const deleteNotification = async (notificationId) => {
        const notificationRef = doc(db, `users/${currentUser.uid}/notifications`, notificationId);
        await deleteDoc(notificationRef);
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        router.push(`/stories?postId=${notification.postId}`);
    };

    return (
        <div>
            <Head>
                <title>Your Notifications - LitterPic</title>
                <meta name="description"
                      content="Stay updated with your latest notifications on LitterPic. See who liked, commented, or engaged with your posts. Keep track of your interactions in our community-driven mission to create a litter-free world."/>
                <meta name="robots" content="index, follow"/>
                <link rel="icon" href="/favicon.ico"/>
                <link rel="canonical" href="https://litterpic.org/notifications"/>

                <meta property="og:title" content="Your Notifications - LitterPic"/>
                <meta property="og:description"
                      content="Stay updated with your latest notifications on LitterPic. See who liked, commented, or engaged with your posts. Keep track of your interactions in our community-driven mission to create a litter-free world."/>
                <meta property="og:image" content="https://litterpic.org/images/notifications.webp"/>
                <meta property="og:url" content="https://litterpic.org/notifications"/>
                <meta property="og:type" content="website"/>

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content="Your Notifications - LitterPic"/>
                <meta name="twitter:description"
                      content="Stay updated with your latest notifications on LitterPic. See who liked, commented, or engaged with your posts. Keep track of your interactions in our community-driven mission to create a litter-free world."/>
                <meta name="twitter:image" content="https://litterpic.org/images/notifications.webp"/>
                <meta name="twitter:url" content="https://litterpic.org/notifications"/>

                <meta name="keywords"
                      content="notifications, updates, litterpic, community engagement, environmental conservation, social interactions"/>
                <meta name="author" content="LitterPic Inc."/>
            </Head>

            {/* Google Analytics Scripts */}
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-3VZE7E59CL"
                strategy="afterInteractive"
            />
            <Script
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-3VZE7E59CL');
        `,
                }}
            />

            <div className="banner">
                <img src="/images/AboutUsBanner.webp" alt="Banner Image"/>
            </div>

            <div className="page">
                <div className="notif-content">
                    <h1 className="heading-text">Notifications</h1>
                    <div className="notifications-list">
                        {notifications.length === 0 ? (
                            <p className="no-notifications-message">You have no notifications at the moment. Stay tuned
                                for updates and interactions!</p>
                        ) : (
                            notifications.map(notification => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.isRead ? 'read' : 'unread'}`}
                                >
                                    <button
                                        className="mark-as-read-button"
                                        onClick={() => markAsRead(notification.id)}
                                    >
                                        Mark as Read
                                    </button>
                                    <div className="notification-content"
                                         onClick={() => handleNotificationClick(notification)}>
                                        <span className="notification-time">
                                            {formatDistanceToNow(notification.timestamp.toDate())} ago
                                        </span>
                                        <p className="notification-message">{notification.message}</p>
                                    </div>
                                    <button
                                        className="delete-notification-button"
                                        onClick={() => deleteNotification(notification.id)}
                                    >
                                        Delete
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default withAuth(NotificationsPage);
