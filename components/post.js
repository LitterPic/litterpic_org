import {useState, useEffect} from "react";
import {useSwipeable} from "react-swipeable";
import {FaChevronLeft, FaChevronRight} from "react-icons/fa";

function Post({post}) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [userName, setUserName] = useState("");

    useEffect(() => {
        // Fetch user name
        const fetchUserName = async () => {
            const {display_name} = post.user;
            setUserName(display_name);
        };

        fetchUserName();
    }, [post.user]);

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
        <div className="post">
            <div className="post-user-name">{userName}</div>
            <div className="post-title">{post.title}</div>
            <div className="post-location">
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(post.location)}`}
                   target="_blank" rel="noopener noreferrer">
                    {post.location}
                </a>
            </div>
            <div className="post-litter-weight-collected">
                Collected <span>{post.litterWeight}</span>{" "}
                {post.litterWeight === 1 ? "pound" : "pounds"} of litter!
            </div>
            <div className="post-carousel" {...handlers}>
                {hasMultiplePhotos && (
                    <FaChevronLeft className="carousel-chevron carousel-chevron-left" onClick={prevPhoto}/>
                )}
                <img src={post.photos[currentIndex]} alt="post" className="carousel-image"/>
                {hasMultiplePhotos && (
                    <FaChevronRight className="carousel-chevron carousel-chevron-right" onClick={nextPhoto}/>
                )}
            </div>

            <div className="post-description">
                {post.description ? post.description : "No description available"}
            </div>
        </div>
    );
}

export default Post;
