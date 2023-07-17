import React, {useState, useEffect} from 'react';
import {useSwipeable} from 'react-swipeable';
import {FaChevronLeft, FaChevronRight} from 'react-icons/fa';

function Post({post}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userName, setUserName] = useState('');
    const [userPhoto, setUserPhoto] = useState('');

    useEffect(() => {
        const fetchUserInfo = async () => {
            if (post) {
                const {display_name, photo_url} = post.user;
                setUserName(display_name);
                setUserPhoto(photo_url);
                console.log("Display Name:", display_name);
                console.log("Profile Pic:", photo_url);
            }
        };

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

    return (
        <div className="fetch-post">
            <div className="post-username-location">
                <div className="profile-image">
                    {userPhoto || post.user.photo_url ? (
                        <img src={userPhoto || post.user.photo_url} alt="Profile"/>
                    ) : (
                        <img
                            src="https://cdn.pixabay.com/photo/2016/11/08/15/21/user-1808597_640.png"
                            alt="Default Profile"
                        />
                    )}
                </div>
                <div className="post-user-name">{userName}</div>
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
            </div>
            <div className="post-description">
                {post.description ? post.description : 'No description available'}
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

        </div>
    );
}

export default Post;
