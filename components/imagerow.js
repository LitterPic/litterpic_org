import React, {useState} from 'react';
import {useSwipeable} from 'react-swipeable';
import {LazyLoadImage} from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

const ImageRow = ({images, onSwipeLeft, onSwipeRight}) => {
    const handlers = useSwipeable({
        onSwipedLeft: () => onSwipeLeft(),
        onSwipedRight: () => onSwipeRight(),
        preventDefaultTouchmoveEvent: true,
        trackMouse: true
    });

    const [loadedImages, setLoadedImages] = useState([]);

    const handleImageLoad = (index) => {
        setLoadedImages(prevState => {
            return [...prevState, index];
        });
    };

    return (
        <div className="image-row" id="image-row" {...handlers}>
            {images.map((photoURL, index) => (
                <LazyLoadImage
                    src={photoURL}
                    alt={`Picture ${index + 1}`}
                    effect="blur"
                    afterLoad={() => handleImageLoad(index)}
                    key={index}
                    className={`image-row__item ${loadedImages.includes(index) ? 'loaded' : ''}`}
                />
            ))}
        </div>
    );
};

export default ImageRow;
