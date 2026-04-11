import React, {useEffect, useState} from 'react';
import {collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, updateDoc} from 'firebase/firestore';
import {auth, db, useAuth} from '../lib/firebase';
import {formatDistanceToNow} from 'date-fns'; // For better time formatting
import {useRouter} from 'next/router';
import Head from "next/head";
import Script from "next/script";
import withAuth from "../components/withAuth";
import {FaTrashAlt} from "react-icons/fa";
import {toast, ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationsPage = () => {
    const [notifications, setNotifications] = useState([]);
    const router = useRouter();
    const {user} = useAuth();

    useEffect(() => {
        if (!user) return;

        // Query to fetch notifications ordered by timestamp in descending order
        const notificationsRef = collection(db, `users/${user.uid}/notifications`);
        const notificationsQuery = query(notificationsRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(
            notificationsQuery,
            (snapshot) => {
                const fetchedNotifications = snapshot.docs.map(doc => {
                    const data = doc.data();
                    // Remove the 'id' field from data if it exists to prevent overwriting doc.id
                    const {id: dataId, ...restData} = data;
                    return {
                        ...restData,
                        id: doc.id,  // Use the actual Firestore document ID
                    };
                });
                setNotifications(fetchedNotifications);
            },
            (error) => {
                // Handle permission errors gracefully
                console.debug('Error in notifications listener:', error.code);
                setNotifications([]);
            }
        );

        return () => unsubscribe();
    }, [user]);

    const markAsRead = async (notificationId) => {
        if (!user) {
            console.error('No user logged in');
            return;
        }

        try {
            const notificationRef = doc(db, `users/${user.uid}/notifications`, notificationId);
            await updateDoc(notificationRef, {isRead: true});
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const deleteNotification = async (notificationId) => {
        if (!user) {
            toast.error('Unable to delete notification. Please try again.');
            return;
        }

        try {
            const notificationRef = doc(db, `users/${user.uid}/notifications`, notificationId);
            await deleteDoc(notificationRef);
            toast.success('Notification deleted!');
        } catch (error) {
            console.error('Error deleting notification:', error);
            toast.error('Failed to delete notification. Please try again.');
        }
    };

    const clearAllNotifications = async () => {
        if (!user) {
            toast.error('Unable to clear notifications. Please try again.');
            return;
        }

        // Show confirmation dialog
        const confirmed = window.confirm(
            `Are you sure you want to delete all ${notifications.length} notification${notifications.length !== 1 ? 's' : ''}? This action cannot be undone.`
        );

        if (!confirmed) {
            return;
        }

        try {
            // Delete all notifications in parallel
            const deletePromises = notifications.map(notification => {
                const notificationRef = doc(db, `users/${user.uid}/notifications`, notification.id);
                return deleteDoc(notificationRef);
            });

            const results = await Promise.allSettled(deletePromises);

            // Check for any failures
            const failures = results.filter(r => r.status === 'rejected');
            if (failures.length > 0) {
                toast.error(`Failed to delete ${failures.length} notification(s). Please try again.`);
            } else {
                toast.success('All notifications cleared!');
            }
        } catch (error) {
            console.error('Error clearing all notifications:', error);
            toast.error('Failed to clear all notifications. Please try again.');
        }
    };

    const handleNotificationClick = async (notification) => {
        if (!notification.isRead) {
            await markAsRead(notification.id);
        }
        await router.push(`/stories?postId=${notification.postId}`);
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
                    <div className="notifications-header">
                        <h1 className="heading-text">Notifications</h1>
                        {notifications.length > 0 && (
                            <button
                                className="clear-all-button"
                                onClick={clearAllNotifications}
                                title="Clear all notifications"
                            >
                                <i className="material-icons">delete_sweep</i>
                                Clear All
                            </button>
                        )}
                    </div>
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
                                    <div
                                        className="status-indicator"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent triggering parent click
                                            markAsRead(notification.id);
                                        }}
                                        title="Mark as Read"
                                    />
                                    <div
                                        className="notification-content"
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <span className="notification-time">
                                            {formatDistanceToNow(notification.timestamp.toDate())} ago
                                        </span>
                                        <p className="notification-message">{notification.message}</p>
                                    </div>
                                    <button
                                        className="delete-notification-button"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Prevent triggering parent click
                                            deleteNotification(notification.id);
                                        }}
                                        aria-label="Delete notification"
                                    >
                                        <FaTrashAlt/>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <ToastContainer position="bottom-center" autoClose={3000} />
        </div>
    );
};

export default withAuth(NotificationsPage);
