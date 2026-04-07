const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const { google } = require('googleapis');
const axios = require('axios');
admin.initializeApp();

// Create Blue Ocean Society RSVP
exports.createBlueOceanRsvp = functions.https.onRequest((request, response) => {
    cors(request, response, async () => {
        try {
            const eventId = request.body.data.eventId;
            const loggedInUserId = request.body.data.loggedInUserId;

            // Use the logged-in user ID if available, otherwise use the hard-coded ID
            const userId = loggedInUserId || 'jte56G8cX7RVxvXXmhZTcysW9jL2';

            const rsvp = {
                eventAssociation: admin.firestore().doc(`events/${eventId}`),
                user: admin.firestore().doc(`/users/${userId}`),
                numberAttending: 1,
                note: 'RSVP for Blue Ocean Society event',
                timestamp: new Date(),
            };
            await admin.firestore().collection('rsvp').add(rsvp);
            response.status(200).json({data: {status: "RSVP Created"}});
        } catch (error) {
            console.error("Error adding RSVP: ", error);
            response.status(500).json({data: {status: "Internal Server Error", error: error}});
        }
    });
});


// Create Event from Scraped Blue Ocean Society Event Data
exports.createEvent = functions.https.onRequest(async (request, response) => {
    cors(request, response, async () => {
        try {
            const eventData = request.body;
            const eventId = eventData.id;

            // Check if event with the same ID already exists
            const eventSnapshot = await admin.firestore().collection('events').doc(eventId).get();
            if (eventSnapshot.exists) {
                response.status(200).json({status: "Event already exists, skipping creation"});
                return;
            }

            // Convert milliseconds since epoch to JavaScript Date objects
            const startTime = new Date(eventData.eventStartTime);
            const endTime = new Date(eventData.eventEndTime);
            const date = new Date(eventData.date);

            // Create Firestore document reference for the owner
            const ownerRef = admin.firestore().doc('users/jte56G8cX7RVxvXXmhZTcysW9jL2');

	            // Extract latitude and longitude from request body and create a GeoPoint (if valid)
	            // Some scraped events may not have a location or may fail geocoding, leaving lat/lng null.
	            // Firestore GeoPoint rejects NaN/null, so only set latLng when both values are finite numbers.
	            // Use parseFloat so null/undefined/"" become NaN (Number(null) would become 0).
	            const latitude = parseFloat(eventData.latitude);
	            const longitude = parseFloat(eventData.longitude);
	            const hasValidLatLng = Number.isFinite(latitude) && Number.isFinite(longitude);
	            const latLng = hasValidLatLng
	                ? new admin.firestore.GeoPoint(latitude, longitude)
	                : null;


	            const event = {
	                ...eventData,
	                // Only include a GeoPoint when it's valid; otherwise store null so reads don't explode.
	                latLng: latLng,
                eventStartTime: admin.firestore.Timestamp.fromDate(startTime),
                eventEndTime: admin.firestore.Timestamp.fromDate(endTime),
                date: admin.firestore.Timestamp.fromDate(date),
                owner: ownerRef,
                time_created: admin.firestore.Timestamp.now(),
            };

            await admin.firestore().collection('events').doc(eventId).set(event);
            response.status(200).json({status: "Event Created"});
        } catch (error) {
            console.error("Error adding event: ", error);
            response.status(500).json({status: "Internal Server Error", error: error});
        }
    });
});

// Sum Litter Weight by User - Scheduled Function
exports.sumLitterWeightByUser = functions.pubsub.schedule('0 2 * * *') // Runs daily at 2 AM UTC
    .timeZone('America/New_York') // Adjust timezone as needed
    .onRun(async (context) => {
        console.log('Starting litter weight update process...');

        try {
            const db = admin.firestore();

            console.log('Processing all users to calculate total litter weight from all posts');

            // Get all users (more comprehensive approach)
            const usersQuery = db.collection('users');
            const usersSnapshot = await usersQuery.get();

            console.log(`Found ${usersSnapshot.size} total users to process`);

            if (usersSnapshot.size === 0) {
                console.log('No users found in database');
                return null;
            }

            // Update totalWeight for each user
            let updatedCount = 0;
            const batch = db.batch();

            for (const userDoc of usersSnapshot.docs) {
                const userId = userDoc.id;
                try {
                    const totalWeight = await getSumOfLitterWeight(db, userId);
                    const userRef = db.collection('users').doc(userId);
                    batch.update(userRef, { totalWeight: totalWeight });

                    console.log(`User ${userId}: totalWeight = ${totalWeight}`);
                    updatedCount++;

                    // Commit batch every 500 operations (Firestore limit)
                    if (updatedCount % 500 === 0) {
                        await batch.commit();
                        console.log(`Committed batch of ${updatedCount} updates`);
                    }

                } catch (error) {
                    console.error(`Failed to update user ${userId}:`, error);
                }
            }

            // Commit remaining updates
            if (updatedCount % 500 !== 0) {
                await batch.commit();
            }

            console.log(`Successfully updated ${updatedCount} out of ${usersSnapshot.size} users`);
            console.log('Litter weight update process completed successfully');

            return null;

        } catch (error) {
            console.error('Error in litter weight update process:', error);
            throw error;
        }
    });

// Helper function to calculate sum of litter weight for a user
async function getSumOfLitterWeight(db, userUid) {
    try {
        const userRef = db.collection('users').doc(userUid);

        // Query userPosts where postUser references this user
        const postsQuery = db.collection('userPosts').where('postUser', '==', userRef);
        const postsSnapshot = await postsQuery.get();

        let totalWeight = 0.0;
        let postCount = 0;

        postsSnapshot.forEach(doc => {
            const postData = doc.data();
            if (postData.litterWeight !== null && postData.litterWeight !== undefined) {
                const weight = parseFloat(postData.litterWeight);
                if (!isNaN(weight)) {
                    totalWeight += weight;
                    postCount++;
                }
            }
        });

        console.log(`User ${userUid}: ${postCount} posts, total weight: ${totalWeight}`);
        return totalWeight;

    } catch (error) {
        console.error(`Error calculating weight for user ${userUid}:`, error);
        return 0.0;
    }
}

// Update Ambassador Status - Scheduled Function
exports.updateAmbassadorStatus = functions.pubsub.schedule('0 3 * * *') // Runs daily at 3 AM UTC (1 hour after weight update)
    .timeZone('America/New_York') // Adjust timezone as needed
    .onRun(async (context) => {
        console.log('Starting ambassador status update process...');

        try {
            const db = admin.firestore();
            const excludedEmails = ['alek@litterpic.org', 'melanie.tolman@gmail.com'];

            // Get all users
            const usersQuery = db.collection('users');
            const usersSnapshot = await usersQuery.get();

            console.log(`Found ${usersSnapshot.size} users to process`);

            const stats = {
                promoted: 0,
                demoted: 0,
                no_change: 0,
                skipped_admin: 0,
                error: 0
            };

            const batch = db.batch();
            let batchCount = 0;

            for (const userDoc of usersSnapshot.docs) {
                try {
                    const userId = userDoc.id;
                    const userData = userDoc.data();
                    const userEmail = userData.email || '';
                    const currentAmbassadorStatus = userData.ambassador || false;

                    // Skip excluded admin emails (case-insensitive)
                    if (excludedEmails.some(email => email.toLowerCase() === userEmail.toLowerCase())) {
                        console.log(`Skipping admin user: ${userEmail}`);
                        stats.skipped_admin++;
                        continue;
                    }

                    // Check ambassador eligibility
                    const eligibilityResult = await checkAmbassadorEligibility(db, userId);
                    const isEligible = eligibilityResult.eligible;
                    const lastPostDate = eligibilityResult.lastPostDate;

                    // Determine if status change is needed
                    if (isEligible && !currentAmbassadorStatus) {
                        // Promote to ambassador
                        const userRef = db.collection('users').doc(userId);
                        batch.update(userRef, {
                            ambassador: true,
                            ambassador_date: lastPostDate
                        });
                        console.log(`Promoting user ${userId} to ambassador`);
                        stats.promoted++;
                        batchCount++;

                    } else if (!isEligible && currentAmbassadorStatus) {
                        // Remove ambassador status
                        const userRef = db.collection('users').doc(userId);
                        batch.update(userRef, {
                            ambassador: false,
                            ambassador_date: null
                        });
                        console.log(`Removing ambassador status from user ${userId}`);
                        stats.demoted++;
                        batchCount++;

                    } else {
                        // No change needed
                        stats.no_change++;
                    }

                    // Commit batch every 500 operations (Firestore limit)
                    if (batchCount >= 500) {
                        await batch.commit();
                        console.log(`Committed batch of ${batchCount} updates`);
                        batchCount = 0;
                    }

                } catch (error) {
                    console.error(`Error processing user ${userDoc.id}:`, error);
                    stats.error++;
                }
            }

            // Commit remaining updates
            if (batchCount > 0) {
                await batch.commit();
                console.log(`Committed final batch of ${batchCount} updates`);
            }

            console.log('Ambassador status update process completed');
            console.log('Summary:', stats);

            return null;

        } catch (error) {
            console.error('Error in ambassador status update process:', error);
            throw error;
        }
    });

// Helper function to check if a user qualifies for ambassador status
async function checkAmbassadorEligibility(db, userId) {
    try {
        const currentDate = new Date();
        const ninetyDaysAgo = new Date(currentDate.getTime() - 90 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(currentDate.getTime() - 30 * 24 * 60 * 60 * 1000);

        const userRef = db.collection('users').doc(userId);

        // Get posts from last 90 days
        const posts90DaysQuery = db.collection('userPosts')
            .where('postUser', '==', userRef)
            .where('timePosted', '>=', ninetyDaysAgo);

        const posts90DaysSnapshot = await posts90DaysQuery.get();
        const postCount = posts90DaysSnapshot.size;

        console.log(`User ${userId}: ${postCount} posts in last 90 days`);

        // Must have more than 5 posts in 90 days
        if (postCount <= 5) {
            return { eligible: false, lastPostDate: null };
        }

        // Check for posts in last 30 days
        const posts30DaysQuery = db.collection('userPosts')
            .where('postUser', '==', userRef)
            .where('timePosted', '>=', thirtyDaysAgo)
            .orderBy('timePosted', 'desc')
            .limit(1);

        const posts30DaysSnapshot = await posts30DaysQuery.get();

        if (!posts30DaysSnapshot.empty) {
            const lastPost = posts30DaysSnapshot.docs[0];
            const lastPostDate = lastPost.data().timePosted;
            console.log(`User ${userId}: Has recent post from ${lastPostDate.toDate()}`);
            return { eligible: true, lastPostDate: lastPostDate };
        } else {
            console.log(`User ${userId}: No posts in last 30 days`);
            return { eligible: false, lastPostDate: null };
        }

    } catch (error) {
        console.error(`Error checking ambassador eligibility for user ${userId}:`, error);
        return { eligible: false, lastPostDate: null };
    }
}

// Fetch Blue Ocean Society Events - Scheduled Function
exports.fetchBlueOceanEvents = functions.pubsub.schedule('0 6 * * *') // Runs daily at 6 AM EST
    .timeZone('America/New_York')
    .onRun(async (context) => {
        console.log('Starting Blue Ocean Society event fetch process...');

        try {
            // Get Google API key from environment
            const googleApiKey = functions.config().google?.api_key;
            if (!googleApiKey) {
                throw new Error('Google API key not configured.');
            }

            // Get calendar ID from environment
            const calendarId = functions.config().blue_ocean?.calendar_id;
            if (!calendarId) {
                throw new Error('Blue Ocean calendar ID not configured.');
            }

            // Initialize Google Calendar API
            const calendar = google.calendar({
                version: 'v3',
                auth: googleApiKey
            });

            // Get upcoming events within next 45 days
            const now = new Date();
            const ninetyDaysFromNow = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000);

            console.log(`Fetching events from ${now.toISOString()} to ${ninetyDaysFromNow.toISOString()}`);

            const eventsResult = await calendar.events.list({
                calendarId: calendarId,
                timeMin: now.toISOString(),
                timeMax: ninetyDaysFromNow.toISOString(),
                singleEvents: true,
                orderBy: 'startTime'
            });

            const events = eventsResult.data.items || [];
            console.log(`Found ${events.length} upcoming events`);

            if (events.length === 0) {
                console.log('No upcoming events found');
                return null;
            }

            let processedCount = 0;
            let skippedCount = 0;

            for (const event of events) {
                try {
                    // Skip private events.
                    // Relying only on the word "private" in the summary/description misses cases where
                    // Google Calendar marks an event as private via the `visibility` field (or shows as "Busy").
                    const visibility = (event.visibility || '').toString().toLowerCase();
                    const summary = (event.summary || '').toString();
                    const description = (event.description || '').toString();
                    const location = (event.location || '').toString();
                    const haystack = `${summary} ${description} ${location}`.toLowerCase();
                    const isPrivateByVisibility = visibility === 'private' || visibility === 'confidential';
                    const isPrivateByKeywords = haystack.includes('private') || haystack.includes('confidential');
                    const isPrivateBusyPlaceholder = summary.trim().toLowerCase() === 'busy';

                    if (isPrivateByVisibility || isPrivateByKeywords || isPrivateBusyPlaceholder) {
                        console.log(
                            `Skipping private event: ${summary || '(no title)'} ` +
                            `(visibility=${visibility || 'unknown'}, id=${event.id || 'unknown'})`
                        );
                        skippedCount++;
                        continue;
                    }

                    // Extract and process event data
                    const eventData = await processEventData(event, googleApiKey);

                    if (eventData) {
                        // Call the existing createEvent function
                        const createEventUrl = 'https://us-central1-litterpic-fa0bb.cloudfunctions.net/createEvent';
                        const response = await axios.post(createEventUrl, eventData);

                        if (response.status === 200) {
                            console.log(`Successfully created event: ${event.summary}`);
                            processedCount++;
                        } else {
                            console.error(`Failed to create event ${event.summary}: ${response.data}`);
                        }
                    }

                } catch (error) {
                    console.error(`Error processing event ${event.summary}:`, error);
                }
            }

            console.log(`Event fetch completed. Processed: ${processedCount}, Skipped: ${skippedCount}`);
            return null;

        } catch (error) {
            console.error('Error in Blue Ocean event fetch process:', error);
            throw error;
        }
    });

// Helper function to process event data
async function processEventData(event, googleApiKey) {
    try {
        // Normalize description
        let description = event.description || '';
        if (description) {
            // Remove HTML tags and unescape HTML entities
            description = description.replace(/<[^>]*>/g, '');
            description = description.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

            // Truncate at first period
            const firstPeriodIndex = description.indexOf('.');
            if (firstPeriodIndex !== -1) {
                description = description.substring(0, firstPeriodIndex + 1);
            }

            description += ' For more information please RSVP with blueoceansociety.org using the RSVP link.';
        } else {
            description = `Join us for a cleanup at ${event.location || ''}`;
        }

        // Get coordinates from address
        let latitude = null;
        let longitude = null;

        if (event.location) {
            try {
                const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(event.location)}&key=${googleApiKey}`;
                const geocodeResponse = await axios.get(geocodeUrl);

                if (geocodeResponse.data.results && geocodeResponse.data.results.length > 0) {
                    const location = geocodeResponse.data.results[0].geometry.location;
                    latitude = location.lat;
                    longitude = location.lng;
                }
            } catch (geocodeError) {
                console.error('Error geocoding address:', geocodeError);
            }
        }

        // Convert dates to milliseconds
        const startTime = event.start.dateTime || event.start.date;
        const endTime = event.end.dateTime || event.end.date;

        const startMs = new Date(startTime).getTime();
        const endMs = new Date(endTime).getTime();

        // Create date-only timestamp for the date field (Eastern timezone)
        const dateOnly = startTime.split('T')[0]; // Get YYYY-MM-DD part
        const easternDate = new Date(dateOnly + 'T00:00:00-05:00'); // Assume Eastern time
        const dateMs = easternDate.getTime();

        return {
            id: event.id,
            date: dateMs,
            description: description,
            eventEndTime: endMs,
            eventStartTime: startMs,
            event_title: event.summary || '',
            location: event.location || '',
            latitude: latitude,
            longitude: longitude
        };

    } catch (error) {
        console.error('Error processing event data:', error);
        return null;
    }
}

