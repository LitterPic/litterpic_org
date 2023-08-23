import React, {useEffect, useState} from 'react';
import {collection, doc, getDoc, getDocs, limit, orderBy, query} from 'firebase/firestore';
import {getDownloadURL, ref} from 'firebase/storage';
import {db, storage} from '../lib/firebase';
import 'firebase/firestore';

async function fetchRecentPosts() {
    const postsQuery = query(
        collection(db, 'userPosts'),
        orderBy('timePosted', 'desc'),
        limit(3)
    );
    const postsSnapshot = await getDocs(postsQuery);

    const posts = [];

    for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        const photos = [];

        if (Array.isArray(postData.postPhotos)) {
            for (const pictureRef of postData.postPhotos) {
                const pictureUrl = await getDownloadURL(ref(storage, pictureRef));
                photos.push(pictureUrl);
            }
        }

        posts.push({
            user: postData.postUser,
            photos: photos,
            dateCreated: postData.timePosted.toDate(),
        });
    }

    return posts;
}

export default function Index() {
    const CACHE_EXPIRATION_TIME = 5 * 60 * 1000;

    const [recentPosts, setRecentPosts] = useState([]);
    const [images, setImages] = useState([]);
    const [totalWeight, setTotalWeight] = useState(0);

    useEffect(() => {
        const fetchPosts = async () => {
            const posts = await fetchRecentPosts();
            setRecentPosts(posts);
        };

        fetchPosts();
    }, []);

    useEffect(() => {
        const allImages = recentPosts.flatMap((post) => post.photos);
        setImages(allImages);
    }, [recentPosts]);

    useEffect(() => {
        const fetchTotalWeight = async () => {
            try {
                let totalWeight;

                // Check for cached totalWeight
                const cachedData = localStorage.getItem('totalWeight');
                if (cachedData) {
                    const {value, timestamp} = JSON.parse(cachedData);
                    const isCacheValid = Date.now() - timestamp < CACHE_EXPIRATION_TIME;
                    if (isCacheValid) {
                        totalWeight = value;
                    }
                }

                if (totalWeight === undefined) {
                    const statsRef = doc(db, 'stats', 'totalWeight');
                    const statsDoc = await getDoc(statsRef);
                    totalWeight = statsDoc.data().totalWeight;

                    // Cache the fetched total weight with timestamp
                    localStorage.setItem(
                        'totalWeight',
                        JSON.stringify({value: totalWeight, timestamp: Date.now()})
                    );
                }

                setTotalWeight(totalWeight);
            } catch (error) {
                console.error('Error fetching total weight:', error);
            }
        };

        fetchTotalWeight();
    }, []);

    function Carousel({images}) {
        const [currentIndex, setCurrentIndex] = useState(0);

        const handleSwipe = (direction) => {
            if (direction === "left") {
                setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
            } else {
                setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
            }
        };

        useEffect(() => {
            // Automatically change the picture every 5 seconds
            const intervalId = setInterval(() => {
                handleSwipe("left"); // Change to the next picture
            }, 5000);

            return () => {
                clearInterval(intervalId); // Clear the interval when the component is unmounted
            };
        }, [images, handleSwipe]);

        return (
            <div className="carousel-container">
                <div className="carousel-slide">
                    {images.map((image, index) => (
                        <div
                            key={index}
                            className={`carousel-page ${index === currentIndex ? 'active' : ''}`}
                            style={{backgroundImage: `url(${image})`}}
                        />
                    ))}
                </div>
                <div className="carousel-dots">
                    {images.map((_, index) => (
                        <div
                            key={index}
                            className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
                            onClick={() => setCurrentIndex(index)}
                        />
                    ))}
                </div>
                <button className="carousel-button-right" onClick={() => handleSwipe("right")}>{">"}</button>
            </div>
        );
    }

    return (
        <div>
            <div className="banner">
                <img src="/images/homeBanner.webp" alt="Banner Image"/>

                <div className="overlay">
                    <div className="weight-box">
                        <p className="litter-weight">{parseInt(totalWeight).toLocaleString()}<span
                            className="pounds-text"> pounds of litter collected</span>
                        </p>
                    </div>
                </div>
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Inspire Change</h1>
                    <div className="index-wrapper">
                        <div className="index-column-one-row-one">
                            <h1 className="index-starting-text">Starting with LitterPic is a breeze.</h1>
                            <br/>
                            <p>It's crucial that we come together and do something about litter. Our goal should be to
                                encourage and inspire others to join in the fight against it. A cleaner and healthier
                                environment is vital to enhancing everyone's quality of life. Let's collaborate and make
                                a constructive difference in creating a better tomorrow. Share your stories and photos
                                and <span className="index-inspire-change-text">Inspire Change</span>.</p>
                        </div>
                        <div className="index-column-two-row-one">
                            <ul>

                                <li>To begin, pick a time and place you want to clean. You do not need to seek
                                    sponsorship
                                    from the city, but if you need any resources or support, feel free to contact them.
                                    Consult our Events Calendar for any local events already scheduled in your area.
                                </li>


                                <li>It's more enjoyable to pick with others! Spread the word by sharing your picking
                                    plans
                                    on social media. Reach out to local environmental groups to invite them to
                                    participate
                                    with you.
                                </li>


                                <li>Stay safe by wearing fluorescent safety gear available at your local hardware store.
                                    Get
                                    your hands on our LitterPic branded fluorescent t-shirts and safety vests by
                                    donating to
                                    support the LitterPic initiative. Contact us via email to learn more about how you
                                    can
                                    score some branded merchandise.
                                </li>


                                <li>Please take a picture before you start and then another after you finish, and post
                                    them
                                    on this site to share your efforts and inspire others to join the fight for a
                                    healthier,
                                    cleaner planet.
                                </li>
                            </ul>
                        </div>

                    </div>
                    <div className="home-carousel-section">
                        <Carousel className="carousel" images={images}/>

                        <h2 className="home-carousel-section-text">Take a look at all of our volunteer's stories and get
                            inspired by more!
                            <a className="index-more-stories-button" href="/stories">
                                <button type="button">User Stories</button>
                            </a>
                        </h2>
                    </div>

                </div>
            </div>
        </div>
    );
}
