import React, {useEffect, useState} from 'react';
import {useSwipeable} from 'react-swipeable';
import {FaChevronLeft, FaChevronRight} from 'react-icons/fa';
import Link from "next/link";

function Post({post}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userName, setUserName] = useState('');
    const [userPhoto, setUserPhoto] = useState('');
    const [isAmbassador, setIsAmbassador] = useState(false);
    const [ambassadorDate, setAmbassadorDate] = useState(null)

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (post && post.user) {
                const {display_name, photo_url} = post.user;
                setUserName(display_name || ' ');
                setUserPhoto(photo_url || 'https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg');
            } else {
                // Handle the case where post.user is not available
                setUserName(' ');
                setUserPhoto('https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg');
            }
        };

        // Check if the user is an ambassador
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
        setCurrentIndex((currentIndex + 1) % post.photos.length);
    };

    const prevPhoto = () => {
        setCurrentIndex((currentIndex - 1 + post.photos.length) % post.photos.length);
    };

    const handlers = useSwipeable({
        onSwipedLeft: nextPhoto,
        onSwipedRight: prevPhoto,
    });

    const hasMultiplePhotos = post.photos.length > 1;

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
                    {userPhoto ? (<img src={userPhoto} alt="Profile"/>) : (
                        <img
                            src="https://t4.ftcdn.net/jpg/05/49/98/39/360_F_549983970_bRCkYfk0P6PP5fKbMhZMIb07mCJ6esXL.jpg"
                            alt="Default Profile"
                        />
                    )}
                </div>
                <Link className="post-user-name" href={`/profile/${post.user.uid}`} passHref>
                    <div>{userName}</div>
                </Link>
                <div className="post-location">
                    <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            post.location
                        )}`}
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
                        <p className="post-ambassador-text">{`LitterPic Ambassador since
                                ${new Date(ambassadorDate).toLocaleDateString()}`}</p>
                    </div>

                )}
            </div>
            <div className="post-carousel" {...handlers}>
                {hasMultiplePhotos && (
                    <FaChevronLeft
                        className="carousel-chevron carousel-chevron-left"
                        onClick={prevPhoto}
                    />
                )}
                <img
                    src={post.photos[currentIndex]}
                    alt="post"
                    className="carousel-image"
                />
                {hasMultiplePhotos && (
                    <FaChevronRight
                        className="carousel-chevron carousel-chevron-right"
                        onClick={nextPhoto}
                    />
                )}
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
