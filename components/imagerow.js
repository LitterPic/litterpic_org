import React from 'react';
import {useSwipeable} from 'react-swipeable';
import 'react-lazy-load-image-component/src/effects/blur.css';

const ImageRow = ({images, onSwipeLeft, onSwipeRight}) => {
    const handlers = useSwipeable({
        onSwipedLeft: () => onSwipeLeft(),
        onSwipedRight: () => onSwipeRight(),
        preventDefaultTouchmoveEvent: true,
        trackMouse: true
    });

    return (
        <div className="image-row" id="image-row" {...handlers}>
            {images.map((photoURL, index) => (
                <img
                    src={photoURL}
                    alt={`Picture ${index + 1}`}
                    key={index}
                    className="image-row__item"
                />
            ))}
        </div>
    );
};

export default ImageRow;
