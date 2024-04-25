import React, {useEffect, useState} from 'react';
import {useSwipeable} from 'react-swipeable';
import {FaChevronLeft, FaChevronRight} from 'react-icons/fa';
import Link from 'next/link';

function Post({post}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userName, setUserName] = useState('');
    const [userPhoto, setUserPhoto] = useState('');
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [ambassadorDate, setAmbassadorDate] = useState(null);

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (post && post.user) {
                const {display_name, photo_url} = post.user;
                setUserName(display_name || ' ');
                setUserPhoto(photo_url || 'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg');
            } else {
                setUserName(' ');
                setUserPhoto('https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg');
            }
        };

        const ambassadorStatus = post.user.ambassador || false;
        setIsAmbassador(ambassadorStatus);

        if (ambassadorStatus && post.user.ambassador_date) {
            const timestamp = post.user.ambassador_date;
            const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
            setAmbassadorDate(date);
        }

        fetchUserInfo();
    }, [post]);

    const nextPhoto = () => {
        setCurrentIndex(currentIndex => (currentIndex + 1) % post.photos.length);
    };

    const prevPhoto = () => {
        setCurrentIndex(currentIndex => (currentIndex - 1 + post.photos.length) % post.photos.length);
    };

    const handlers = useSwipeable({
        onSwipedLeft: nextPhoto,
        onSwipedRight: prevPhoto,
        preventDefaultTouchmoveEvent: true,
        trackMouse: true
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
        if (isNaN(date)) {
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
                        <p className="post-ambassador-text">{`LitterPic Ambassador since ${new Date(ambassadorDate).toLocaleDateString()}`}</p>
                    </div>
                )}
            </div>
            <div className="post-carousel" {...handlers}>
                {post.photos.length > 1 &&
                    <FaChevronLeft className="carousel-chevron carousel-chevron-left" onClick={prevPhoto}/>}
                {renderMedia(post.photos[currentIndex], currentIndex)}
                {post.photos.length > 1 &&
                    <FaChevronRight className="carousel-chevron carousel-chevron-right" onClick={nextPhoto}/>}
            </div>
            <div className="post-litter-weight-collected">
                {post.litterWeight > 0 && (
                    <span>
                        Collected <span>{post.litterWeight}</span>{' '}
                        {post.litterWeight === 1 ? 'pound' : 'pounds'} of litter!
                    </span>
                )}
            </div>
            <div className="post-description">
                {post.description ? post.description : 'No description available'}
            </div>
        </div>
    );
}

export default Post;
