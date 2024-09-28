import React, {useEffect, useState} from 'react';
import {useSwipeable} from 'react-swipeable';
import {FaChevronLeft, FaChevronRight} from 'react-icons/fa';
import Link from 'next/link';
import {doc, getDoc, getFirestore} from 'firebase/firestore';
import NotificationSender from "../utils/notifictionSender";

function Post({post, currentUser}) {
    const [isFollowing, setIsFollowing] = useState(false);
    const currentUserUid = currentUser ? currentUser.uid : null;
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userName, setUserName] = useState('');
    const [userPhoto, setUserPhoto] = useState('');
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [ambassadorDate, setAmbassadorDate] = useState(null);
    const firestore = getFirestore();

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (post && post.user) {
                let { display_name, photo_url, uid } = post.user;

                if (!display_name || !photo_url) {
                    const userRef = doc(firestore, 'users', uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        display_name = display_name || userData.display_name;
                        photo_url = photo_url || userData.photo_url;
                    }
                }

                setUserName(display_name || 'Anonymous');
                setUserPhoto(
                    photo_url || 'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg'
                );
            } else {
                setUserName('Anonymous');
                setUserPhoto('https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg');
            }
        };

        const ambassadorStatus = post.user?.ambassador || false;
        setIsAmbassador(ambassadorStatus);

        if (ambassadorStatus && post.user.ambassador_date) {
            const timestamp = post.user.ambassador_date;
            const date = new Date(
                timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
            );
            setAmbassadorDate(date);
        }

        fetchUserInfo();

        // Check if the current user is following the post's user
        const checkFollowStatus = async () => {
            if (currentUserUid && post.user.uid && currentUserUid !== post.user.uid) {
                const docRef = doc(firestore, 'followers', post.user.uid, 'userFollowers', currentUserUid);
                const docSnapshot = await getDoc(docRef);
                setIsFollowing(docSnapshot.exists());
            }
        };

        checkFollowStatus();
    }, [post, currentUserUid, firestore]);

    const nextPhoto = () => {
        setCurrentIndex((currentIndex) => (currentIndex + 1) % post.photos.length);
    };

    const prevPhoto = () => {
        setCurrentIndex(
            (currentIndex) => (currentIndex - 1 + post.photos.length) % post.photos.length
        );
    };

    const handlers = useSwipeable({
        onSwipedLeft: nextPhoto,
        onSwipedRight: prevPhoto,
        preventDefaultTouchmoveEvent: true,
        trackMouse: true,
    });

    const isVideo = (url) => /\.(mp4|webm)(\?|$)/i.test(url);

    const renderMedia = (url, index) => {
        return isVideo(url) ? (
            <video key={index} controls className="carousel-image">
                <source src={url} type="video/mp4"/>
                Your browser does not support the video tag.
            </video>
        ) : (
            <img key={index} src={url} alt="post" className="carousel-image"/>
        );
    };

    const formatDate = (timestamp) => {
        if (!timestamp) {
            return ' ';
        }

        const date = new Date(timestamp);
        if (isNaN(date.getMilliseconds())) {
            return ' ';
        }

        const options = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        };

        return date.toLocaleString('en-US', options);
    };

    return (
        <div className="fetch-post">
            <div className="post-username-location">
                <div className="profile-image">
                    <img src={userPhoto} alt="Profile"/>
                </div>

                {/* Follow Button */}
                {currentUserUid && post.user.uid !== currentUserUid && (
                    <button
                        onClick={async () => {
                            if (isFollowing) {
                                await NotificationSender.handleUnfollow(currentUser, post.user.uid);
                                setIsFollowing(false);
                            } else {
                                await NotificationSender.handleFollow(currentUser, post.user.uid);
                                setIsFollowing(true);
                            }
                        }}
                        className={`follow-button ${isFollowing ? 'following' : ''}`}
                    >
                        {isFollowing ? `Following ${userName}` : `Follow ${userName}`}
                    </button>
                )}

                <Link href={`/profile/${post.user.uid}`} legacyBehavior>
                    <a className="post-user-name">{userName}</a>
                </Link>

                <div className="post-location">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.location)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {post.location}
                    </a>
                </div>
                <div className="post-time">{formatDate(post.dateCreated)}</div>
                {isAmbassador && (
                    <div className="post-ambassador">
                        <i className="material-icons post-ambassador-icon">public</i>
                        <p className="post-ambassador-text">{`LitterPic Ambassador since ${new Date(
                            ambassadorDate
                        ).toLocaleDateString()}`}</p>
                    </div>
                )}
            </div>
            <div className="post-carousel" {...handlers}>
                {post.photos.length > 1 && (
                    <FaChevronLeft
                        className="carousel-chevron carousel-chevron-left"
                        onClick={prevPhoto}
                    />
                )}
                {renderMedia(post.photos[currentIndex], currentIndex)}
                {post.photos.length > 1 && (
                    <FaChevronRight
                        className="carousel-chevron carousel-chevron-right"
                        onClick={nextPhoto}
                    />
                )}
            </div>
            <div className="post-litter-weight-collected">
                {post.litterWeight > 0 && (
                    <span>
                        Collected <span>{post.litterWeight}</span> {post.litterWeight === 1 ? 'pound' : 'pounds'} of litter!
                    </span>
                )}
            </div>
            <div className="post-description">{post.description ? post.description : 'No description available'}</div>
        </div>
    );
}

export default Post;
