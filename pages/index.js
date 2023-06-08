import React, {useEffect, useState} from 'react';
import {collection, query, orderBy, limit, getDocs} from 'firebase/firestore';
import {getDownloadURL, ref} from 'firebase/storage';
import {storage} from '../lib/firebase';
import {db} from '../lib/firebase';
import ImageRow from '../components/imagerow';
import 'firebase/firestore';

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
                    <p>
                        At LitterPic Inc., our vision is bold and unwavering: a world free of litter. We refuse to
                        accept a
                        reality where trash litters our streets, pollutes our waterways, and endangers our wildlife.
                    </p>
                    <p>
                        We believe that every person has the power to make a difference, and our mission is to inspire
                        and
                        empower individuals worldwide to act against litter. By uniting our efforts, we can create a
                        cleaner,
                        safer, and healthier planet for ourselves and future generations.
                    </p>
                    <p>
                        At LitterPic, we're not just dreaming of a better world but actively working to make it a
                        reality.
                        We're
                        harnessing the power of technology to connect people, facilitate litter cleanups, and share
                        inspiring
                        stories of individuals who are making a difference.
                    </p>
                    <p>
                        In addition to our efforts to inspire and empower individuals to act against litter, we are also
                        leveraging technology to make it easier for people to participate. Our team is developing a
                        mobile
                        app
                        that will enable users to connect with other volunteers, organize litter cleanups, and share
                        their
                        progress and impact.
                    </p>
                    <p>
                        Our long-term goal is to create a fleet of self-driving vacuum trucks that can efficiently and
                        effectively clean up litter in even the busiest urban areas.
                    </p>
                    <p>
                        Through the power of technology and community, we are determined to make our vision of a world
                        free
                        of
                        litter a reality. Join us in the fight against litter, and together, we can create a cleaner,
                        safer,
                        and
                        more beautiful planet for all.
                    </p>
                    <h2 className="heading_text">Recent Posts Photos</h2>
                    <ImageRow images={images} onSwipeLeft={swipeLeft} onSwipeRight={swipeRight}/>
                </div>
            </div>
        </div>
    );
}





