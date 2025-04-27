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
    const [showSwipeHint, setShowSwipeHint] = useState(true);
    const [touchStart, setTouchStart] = useState(0);
    const [touchEnd, setTouchEnd] = useState(0);
    const [mouseStart, setMouseStart] = useState(0);
    const [mouseEnd, setMouseEnd] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [slidePosition, setSlidePosition] = useState(0);
    const [userName, setUserName] = useState('');
    const [userPhoto, setUserPhoto] = useState('');
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [ambassadorDate, setAmbassadorDate] = useState(null);
    const firestore = getFirestore();

    // Hide swipe hint after a few seconds
    useEffect(() => {
        if (post.photos.length > 1 && showSwipeHint) {
            const timer = setTimeout(() => {
                setShowSwipeHint(false);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [post.photos.length, showSwipeHint]);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (post && post.user) {
                let { display_name, photo_url, uid, ambassador, ambassador_date } = post.user;

                if (!display_name || !photo_url || ambassador === undefined || !ambassador_date) {
                    const userRef = doc(firestore, 'users', uid);
                    const userSnap = await getDoc(userRef);

                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        display_name = display_name || userData.display_name;
                        photo_url = photo_url || userData.photo_url;
                        ambassador = ambassador === undefined ? userData.ambassador : ambassador;
                        ambassador_date = ambassador_date || userData.ambassador_date;
                    }
                }

                setUserName(display_name || 'Anonymous');
                setUserPhoto(
                    photo_url || 'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg'
                );
                setIsAmbassador(ambassador || false);

                if (ambassador && ambassador_date) {
                    const timestamp = ambassador_date;
                    const date = new Date(
                        timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000
                    );
                    setAmbassadorDate(date);
                }
            } else {
                setUserName('Anonymous');
                setUserPhoto('https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg');
                setIsAmbassador(false);
            }
        };

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
        trackTouch: true,
        delta: 10, // Minimum swipe distance required
        swipeDuration: 500, // Maximum time allowed for swipe motion
    });

    const isVideo = (url) => /\.(mp4|webm)(\?|$)/i.test(url);

    // Manual touch handlers as a backup to the swipeable library
    const handleTouchStart = (e) => {
        setTouchStart(e.targetTouches[0].clientX);
        setSlidePosition(0); // Reset slide position
    };

    const handleTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);

        // Calculate and set the slide position for visual feedback during swiping
        const dragDistance = e.targetTouches[0].clientX - touchStart;
        const maxDistance = 150; // Maximum slide distance
        const boundedDistance = Math.max(Math.min(dragDistance, maxDistance), -maxDistance);
        setSlidePosition(boundedDistance);
    };

    const handleTouchEnd = () => {
        // Reset slide position with animation
        setSlidePosition(0);

        if (touchStart - touchEnd > 50) {
            // Swipe left
            nextPhoto();
        }

        if (touchStart - touchEnd < -50) {
            // Swipe right
            prevPhoto();
        }
    };

    // Mouse-specific handlers for desktop swiping
    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsDragging(true);
        setMouseStart(e.clientX);
        setSlidePosition(0); // Reset slide position
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        setMouseEnd(e.clientX);

        // Calculate and set the slide position for visual feedback during dragging
        const dragDistance = e.clientX - mouseStart;
        const maxDistance = 150; // Maximum slide distance
        const boundedDistance = Math.max(Math.min(dragDistance, maxDistance), -maxDistance);
        setSlidePosition(boundedDistance);
    };

    const handleMouseUp = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        setIsDragging(false);

        const swipeDistance = mouseStart - mouseEnd;

        // Reset slide position with animation
        setSlidePosition(0);

        if (Math.abs(swipeDistance) > 50) {
            if (swipeDistance > 0) {
                // Swipe left
                nextPhoto();
            } else {
                // Swipe right
                prevPhoto();
            }
        }
    };

    const handleMouseLeave = (e) => {
        if (isDragging) {
            handleMouseUp(e);
        }
    };

    const renderMedia = (url, index) => {
        const mediaStyle = {
            transform: `translateX(${slidePosition}px)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease-out'
        };

        return isVideo(url) ? (
            <video
                key={index}
                controls
                className="carousel-image"
                style={mediaStyle}
            >
                <source src={url} type="video/mp4"/>
                Your browser does not support the video tag.
            </video>
        ) : (
            <img
                key={index}
                src={url}
                alt={`Post image ${index + 1}`}
                className="carousel-image"
                style={mediaStyle}
            />
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

    const makeLinksClickable = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.replace(urlRegex, (url) => `<br /><a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a><br />`);
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
            <div
                className="post-carousel"
                {...handlers}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                style={isDragging ? { cursor: 'grabbing' } : {}}
            >
                {renderMedia(post.photos[currentIndex], currentIndex)}

                {/* Swipe hint overlay */}
                {post.photos.length > 1 && showSwipeHint && (
                    <div className="carousel-swipe-hint">
                        <span>← Swipe or drag to navigate →</span>
                    </div>
                )}

                {/* Modern dot indicators for multiple photos */}
                {post.photos.length > 1 && (
                    <div className="carousel-dots">
                        <span className="carousel-counter">{currentIndex + 1}/{post.photos.length}</span>
                        {post.photos.map((_, index) => (
                            <span
                                key={index}
                                className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                                onClick={() => setCurrentIndex(index)}
                                title={`View image ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>
            <div className="post-litter-weight-collected">
                {post.litterWeight > 0 && (
                    <span>
                        Collected <span>{post.litterWeight}</span> {post.litterWeight === 1 ? 'pound' : 'pounds'} of litter!
                    </span>
                )}
            </div>
            <div
                className="post-description"
                dangerouslySetInnerHTML={{ __html: post.description ? makeLinksClickable(post.description) : 'No description available' }}
            ></div>
        </div>
    );
}

export default Post;
