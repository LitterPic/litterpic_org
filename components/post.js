import {useState} from "react";
import {useSwipeable} from "react-swipeable";
import {FaChevronLeft, FaChevronRight} from "react-icons/fa";

function Post({post}) {
    const [currentIndex, setCurrentIndex] = useState(0);

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
            <div className="post-carousel" {...handlers}>
                {hasMultiplePhotos && (
                    <FaChevronLeft className="carousel-chevron" onClick={prevPhoto}/>
                )}
                <img src={post.photos[currentIndex]} alt="post"/>
                {hasMultiplePhotos && (
                    <FaChevronRight className="carousel-chevron" onClick={nextPhoto}/>
                )}
            </div>
            <div>{post.location}</div>
            <div>
                <p>
                    Collected <span>{post.litterWeight}</span> pounds of litter!
                </p>
            </div>
            <div>
                <p>{post.description}</p>
            </div>
        </div>
    );
}

export default Post;
