import React, {useEffect, useState} from 'react';
import {collection, query, orderBy, limit, getDocs} from 'firebase/firestore';
import {getDownloadURL, ref} from 'firebase/storage';
import {storage} from '../lib/firebase';
import {db} from '../lib/firebase';
import ImageRow from '../components/imagerow';
import 'firebase/firestore';
import CustomButton from "../components/CustomButton";

async function fetchRecentPosts() {
    const postsQuery = query(
        collection(db, 'userPosts'),
        orderBy('timePosted', 'desc'),
        limit(5)
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
                const userPostsCol = collection(db, 'userPosts');
                const snapshot = await getDocs(userPostsCol);
                let sum = 0;

                snapshot.forEach((doc) => {
                    const post = doc.data();
                    if (post.litterWeight) {
                        sum += post.litterWeight;
                    }
                });

                setTotalWeight(sum);
            } catch (error) {
                console.error('Error fetching total weight:', error);
            }
        };

        fetchTotalWeight();
    }, []);

    const swipeLeft = () => {
        if (images.length > 0) {
            const firstImage = images.shift();
            images.push(firstImage);
            setImages([...images]);
        }
    };

    const swipeRight = () => {
        if (images.length > 0) {
            const lastImage = images.pop();
            images.unshift(lastImage);
            setImages([...images]);
        }
    };

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
                    <h2 className="heading-text">Recent Posts Photos</h2>
                    <ImageRow className="image-row" images={images} onSwipeLeft={swipeLeft} onSwipeRight={swipeRight}/>

                    <h2>Take a look at all of our volunteer's stories and get inspired by more!
                        <a className="index-more-stories-button" href="/stories">
                            <button type="button">User Stories</button>
                        </a>
                    </h2>

                </div>
            </div>
        </div>
    );
}





