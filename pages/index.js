import React, {useEffect, useState} from 'react';
import {collection, doc, getDoc, getDocs, limit, orderBy, query} from 'firebase/firestore';
import {getDownloadURL, ref} from 'firebase/storage';
import {db, storage} from '../lib/firebase';
import 'firebase/firestore';
import Head from "next/head";
import Script from "next/script";

const AWS = require('aws-sdk');

AWS.config.update({
    accessKeyId: process.env.NEXT_PUBLIC_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.NEXT_PUBLIC_AWS_SECRET_ACCESS_KEY,
    region: process.env.NEXT_PUBLIC_AWS_REGION || 'us-east-1'
});

async function fetchRecentPosts() {
    const postsQuery = query(
        collection(db, 'userPosts'),
        orderBy('timePosted', 'desc'),
        limit(10)
    );
    const postsSnapshot = await getDocs(postsQuery);

    const posts = [];
    let totalPhotosCount = 0;

    for (const postDoc of postsSnapshot.docs) {
        const postData = postDoc.data();
        const photos = [];

        if (Array.isArray(postData.postPhotos)) {
            const remainingPhotosCount = 10 - totalPhotosCount;
            const limitedPhotos = postData.postPhotos.slice(0, remainingPhotosCount);

            for (const pictureRef of limitedPhotos) {
                try {
                    const pictureUrl = await getDownloadURL(ref(storage, pictureRef));
                    photos.push(pictureUrl);
                } catch (error) {
                    photos.push("https://ih1.redbubble.net/image.4905811447.8675/flat,750x,075,f-pad,750x1000,f8f8f8.jpg");
                }
            }

            totalPhotosCount += limitedPhotos.length;
        }

        posts.push({
            user: postData.postUser,
            photos: photos,
            dateCreated: postData.timePosted.toDate(),
        });

        if (totalPhotosCount >= 10) {
            break;
        }
    }

    return posts;
}

export default function Index() {
    const CACHE_EXPIRATION_TIME = 5 * 60 * 1000;

    const [recentPosts, setRecentPosts] = useState([]);
    const [images, setImages] = useState([]);
    const [totalWeight, setTotalWeight] = useState(0);
    const [isDataLoaded, setIsDataLoaded] = useState(false);

    useEffect(() => {
        async function sendNotification() {
            try {
                // Get the user's IP Address
                const res = await fetch('https://api64.ipify.org?format=json');
                const data = await res.json();
                const ipAddress = data.ip;

                // Get Geographical Info using ipstack
                const geoRes = await fetch(`https://ipinfo.io/${ipAddress}?token=6b6a41269b8130`);
                const geoData = await geoRes.json();
                const location = 'City: ' + geoData.city +
                    '\nRegion: ' + geoData.region +
                    '\nPostal Code: ' + geoData.postal +
                    '\nCountry: ' + geoData.country +
                    '\nLocation: https://maps.google.com/?q=' + geoData.loc +
                    '\nTime Zone: ' + geoData.timezone;

                // Send SNS notification
                const sns = new AWS.SNS();
                const topicArn = 'arn:aws:sns:us-east-1:710280486241:litterpicOrgNewVisitor';
                const message = `A user from has visited LitterPic.org! \n\n ${location}`;

                const params = {
                    Message: message,
                    TopicArn: topicArn,
                };

                await sns.publish(params).promise();
            } catch (error) {
                console.error("Error sending notification: ", error.message);
            }
        }

        (async () => {
            await sendNotification();
        })();
    }, []);

    useEffect(() => {
        const fetchPosts = async () => {
            const posts = await fetchRecentPosts();
            setRecentPosts(posts);
        };

        (async () => {
            await fetchPosts();
        })();
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
                setIsDataLoaded(true);
            } catch (error) {
                console.error('Error fetching total weight:', error);
            }
        };

        (async () => {
            await fetchTotalWeight();
        })();
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
            <Head>
                <title>LitterPic</title>
                <meta name="description"
                      content="LitterPic Inc. is dedicated to creating a litter-free world. Harnessing technology, we
                      empower individuals to combat litter, facilitate cleanups, and share impactful stories. Our innovative
                      solutions include a mobile app for community collaboration and a vision for self-driving vacuum trucks
                      for urban cleanups. Join LitterPic in making a cleaner, safer planet."/>
                <meta name="robots" content="index, follow"/>
                <link rel="icon" href="/favicon.ico"/>

                <meta property="og:title" content="LitterPic"/>
                <meta property="og:description"
                      content="LitterPic Inc. is dedicated to creating a litter-free world..."/>
                <meta property="og:image" content="https://litterpic.org/images/litter_pic_logo.png"/>
                <meta property="og:url" content="https://litterpic.org"/>
                <meta property="og:type" content="website"/>

                <meta name="twitter:card" content="summary_large_image"/>
                <meta name="twitter:title" content="LitterPic"/>
                <meta name="twitter:description"
                      content="LitterPic Inc. is dedicated to creating a litter-free world..."/>
                <meta name="twitter:image" content="https://litterpic.org/images/litter_pic_logo.png"/>
                <meta name="twitter:url" content="https://litterpic.org"/>

                <meta name="keywords"
                      content="litter, litterpicking, litter collection, community cleanups, environmental conservation, inspiring stories"/>
                <meta name="author" content="LitterPic Inc."/>
            </Head>

            {/* Google Analytics Scripts */}
            <Script
                src="https://www.googletagmanager.com/gtag/js?id=G-3VZE7E59CL"
                strategy="afterInteractive"
            />
            <Script
                strategy="afterInteractive"
                dangerouslySetInnerHTML={{
                    __html: `
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-3VZE7E59CL');
                    `,
                }}
            />

            <div className="banner">
                <img src="/images/homeBanner.webp" alt="Banner Image"/>

                {isDataLoaded && (
                    <div className="overlay">
                        <div className="weight-box">
                            <p className="litter-weight">{parseInt(totalWeight).toLocaleString()}<span
                                className="pounds-text"> pounds of litter collected</span>
                            </p>
                        </div>
                    </div>
                )}
            </div>

            <div className="page">
                <div className="content">
                    <h1 className="heading-text">Inspire Change</h1>
                    <div className="home-carousel-section">
                        <Carousel className="carousel" images={images}/>

                        <h2 className="home-carousel-section-text">Take a look at all of our volunteer's stories
                            and
                            get
                            inspired by more!
                            <a className="index-more-stories-button" href="/stories">
                                <button type="button">User Stories</button>
                            </a>
                        </h2>
                    </div>
                    <br/>
                    <br/>
                    <div className="index-wrapper">
                        <div className="index-column-one-row-one">
                            <h1 className="index-starting-text">Starting with LitterPic is a breeze.</h1>
                            <br/>
                            <p>It's crucial that we come together and do something about litter. Our goal is
                                to
                                encourage and inspire others to join in the fight against it. A cleaner and
                                healthier
                                environment is vital to enhancing everyone's quality of life. Let's collaborate and
                                make
                                a constructive difference in creating a better tomorrow. Share your stories and
                                photos
                                and <span className="index-inspire-change-text">Inspire Change</span>.</p>
                        </div>
                        <div className="index-column-two-row-one">
                            <ul>

                                <li>To begin, pick a time and place you want to clean. You do not need to seek
                                    sponsorship
                                    from the city, but if you need any resources or support, feel free to contact
                                    them.
                                    Consult our Events Calendar for any local events already scheduled in your area.
                                </li>


                                <li>It's more enjoyable to pick with others! Spread the word by sharing your picking
                                    plans
                                    on social media. Reach out to local environmental groups to invite them to
                                    participate
                                    with you.
                                </li>


                                <li>Stay safe by wearing fluorescent safety gear available at your local hardware
                                    store.
                                    Get
                                    your hands on our LitterPic branded fluorescent t-shirts and safety vests by
                                    donating to
                                    support the LitterPic initiative. Contact us via email to learn more about how
                                    you
                                    can
                                    score some branded merchandise.
                                </li>


                                <li>Please take a picture before you start and then another after you finish, and
                                    post
                                    them
                                    on this site to share your efforts and inspire others to join the fight for a
                                    healthier,
                                    cleaner planet.
                                </li>
                            </ul>
                        </div>
                    </div>
                    <br/>
                    <div className="ambassador-heading-text-with-icon">
                        <h2 className="heading-text">Become a LitterPic Ambassador</h2>
                        <div className="material-icons ambassador-heading-icon">public</div>
                    </div>

                    <div className="ambassador-wrapper">
                        <div>
                            Here's how you can join the ranks of change-makers and inspire the world:
                            <br/>
                            <br/>
                            <ol>
                                <li>
                                    Post your passion: Share your impactful photos and stories of cleanups,
                                    transformations,
                                    and environmental victories. Every image and tale has the power to spark action in
                                    others.
                                </li>

                                <li>
                                    Stay active: After you created your 5th post, keep the momentum going by posting at
                                    least once every 30 days. Consistency is key to keeping the fight for a cleaner
                                    planet at the forefront.
                                </li>

                                <li>
                                    Connect and collaborate: Engage with fellow LitterPic users, share tips and
                                    encouragement, and amplify each other's voices. Together, we're louder than ever.
                                </li>

                                <li>
                                    Spread the word: Share your LitterPic journey on social media, tag friends, and
                                    encourage
                                    them to join the movement. Let's grow our community of planet protectors!
                                </li>

                                <li>
                                    Embrace the spirit: Be a champion for positive change, a beacon of hope, and an
                                    embodiment of LitterPic's values. Your passion is contagious, so let it shine!
                                </li>

                            </ol>
                            Remember, every action, big or small, makes a difference. By becoming a LitterPic
                            Ambassador, you're not just joining a program, you're becoming part of a global movement to
                            heal our planet, one inspiring photo at a time.
                        </div>
                        <div>
                            <p className="ambassador-paragraph">
                                LitterPic isn't just a platform for sharing inspirational photos – it's a movement. A
                                movement of everyday heroes, united by a passion for our planet. And at the heart of
                                this movement stand our LitterPic Ambassadors. These dedicated individuals are more
                                than just posters; they're the spark that ignites change, the ripple that becomes a
                                wave.
                                <br/>
                                <br/>
                                As an Ambassador, you're not just beautifying your local park or documenting a
                                breathtaking cleanup – you're inspiring others to join the fight. Every post, every
                                like, every comment becomes a beacon, a rallying cry for those who care. You're the
                                living, breathing embodiment of LitterPic's mission, a testament to the power of
                                collective action.

                                <br/>
                                <br/>
                                But being an Ambassador is more than just recognition – it's a journey of growth.
                                With each post, you hone your storytelling skills, capturing the essence of
                                environmental action in a way that resonates. You connect with a community of
                                like-minded individuals, forging friendships and sharing tips. And after six months of
                                unwavering dedication, you earn a special reward: a LitterPic t-shirt, a badge of honor
                                you can wear with pride.

                                <br/>
                                <br/>
                                So, are you ready to step up, to be the change you wish to see in the world? Join
                                the LitterPic Ambassador program and become a beacon of hope, a catalyst for action. Let
                                your photos ignite a fire, your stories inspire a generation, and your t-shirt
                                become a symbol of a planet reborn. Remember, every action, no matter how small, ripples
                                outward. Together, we can make a difference.
                            </p>
                            <br/>
                            <div className="home-bottom-carousel-section">
                                <Carousel className="carousel" images={images}/>
                            </div>
                        </div>
                        <br/>
                        <br/>
                    </div>
                    <div className='qr-section'>
                        <div className='app-text'>
                            <div className='head-and-icon'>
                                <h2 className='heading-text '> Stay informed with our app!</h2>
                                <div className="material-icons ambassador-heading-icon">public</div>
                            </div>
                            
                            <p> <span className="index-inspire-change-text">Inspire Change</span>, take a picture, and download the LitterPic app today.</p>
                        </div>
                        <div className='qr-group'>
                            <div  className="qr-container" >
                                <img src='../images/large_ios_qr.jpg' alt='iOS app QR code'/>
                                <div className='qr-box qr-b-1'>
                                    <p> Scan the QR Code to download the app.</p>
                                    <img className='app-store' src='../images/iphone-app-store-apple-store-stock-e2904e244823ccff8630acc91812664c.png' alt='apple store'/>
                                </div>
                            </div>
                            <div className="qr-container qr-c-2" >
                                <img src='../images/large_android_qr.jpg' alt='Android app QR code'/>
                                <div className='qr-box'>
                                    <p> Scan the QR Code to download the app.</p>
                                    <img src='../images/google_play_app.png' alt='google play'/>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
