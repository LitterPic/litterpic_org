const {collection, doc, getDocs, getFirestore, limit, orderBy, query, where, updateDoc} = require("firebase/firestore");
const {initializeApp} = require("firebase/app");

const firebaseConfig = {
    apiKey: "AIzaSyA-s9rMh2K9dDqJAERWj6EyQ4Qj3hlIRHg",
    authDomain: "litterpic-fa0bb.firebaseapp.com",
    projectId: "litterpic-fa0bb",
    storageBucket: "litterpic-fa0bb.appspot.com",
    messagingSenderId: "445985363997",
    appId: "1:445985363997:web:3588d2d945f426835e4ef4",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateAmbassadors(userFilter = 'all_users') {
    try {
        let usersSnapshot;

        if (userFilter === 'all_users') {
            // Query all users
            const usersQuery = query(collection(db, 'users'));
            usersSnapshot = await getDocs(usersQuery);
        } else {
            // Query the user with the specified email
            const userQuery = query(collection(db, 'users'), where('email', '==', userFilter));
            usersSnapshot = await getDocs(userQuery);

            if (usersSnapshot.empty) {
                console.log(`No user found with email ${userFilter}`);
                return;
            }
        }

        // Iterate through users and update them
        for (const userDoc of usersSnapshot.docs) {
            const userId = userDoc.id;
            const userEmail = userDoc.data().email;

            // Check if the user should be excluded from ambassador updates
            if (userEmail === 'alek@litterpic.org' || userEmail === 'melanie.tolman@gmail.com') {
                console.log(`User with email ${userEmail} is excluded from updates.`);
                continue;
            }

            const currentDate = new Date();
            const ninetyDaysAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
            const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

            // Query userPosts to get posts for this user within the specified date ranges
            const userPostsQuery = query(collection(db, 'userPosts'),
                where('postUser', '==', doc(db, 'users', userId)),
                where('timePosted', '>=', ninetyDaysAgo),
                orderBy('timePosted')
            );

            const userPostsSnapshot = await getDocs(userPostsQuery);
            const userPosts = userPostsSnapshot.docs;

            // Calculate post counts and check if the user meets the criteria
            const postCount = userPosts.length;

            // Check if the user is currently an ambassador
            const isAmbassador = userDoc.data().ambassador;

            if (postCount > 3) {
                // Check if the user has made a post in the last 30 days
                const lastPostQuery = query(collection(db, 'userPosts'),
                    where('postUser', '==', doc(db, 'users', userId)),
                    where('timePosted', '>=', thirtyDaysAgo),
                    orderBy('timePosted', 'desc'),
                    limit(1)
                );

                const lastPostSnapshot = await getDocs(lastPostQuery);
                const lastPost = lastPostSnapshot.docs[0];

                if (lastPost) {
                    if (!isAmbassador) {
                        // User becomes an ambassador for the first time
                        await updateDoc(doc(db, 'users', userId), {
                            ambassador: true,
                            ambassador_date: lastPost.data().timePosted,
                        });

                        console.log(`User with ID ${userId} updated as an ambassador.`);
                    }
                } else {
                    if (isAmbassador) {
                        // User no longer qualifies as an ambassador
                        await updateDoc(doc(db, 'users', userId), {
                            ambassador: false,
                            ambassador_date: null,
                        });

                        console.log(`User with ID ${userId} no longer qualifies as an ambassador.`);
                    }
                }
            } else {
                if (isAmbassador) {
                    // User no longer qualifies as an ambassador
                    await updateDoc(doc(db, 'users', userId), {
                        ambassador: false,
                        ambassador_date: null,
                    });

                    console.log(`User with ID ${userId} no longer qualifies as an ambassador.`);
                }
            }
        }


        if (userFilter === 'all_users') {
            console.log('Ambassador updates for all users completed.');
        } else {
            console.log(`Ambassador updates for user with email ${userFilter} completed.`);
        }
    } catch (error) {
        console.error('Error processing users:', error);
    }
}

// To run against all users, call the function without specifying a parameter.
// To run against a specific user by email, pass in the email, as a string, as the parameter ('alek@litterpic.org').
updateAmbassadors(); // To run against all users
