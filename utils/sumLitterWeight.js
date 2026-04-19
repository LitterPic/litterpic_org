const admin = require('firebase-admin');
const serviceAccount = require('./litterpic-fa0bb-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://litterpic-fa0bb.firebaseio.com"
});

const db = admin.firestore();

async function analyzeLitterWeight() {
    let sum = 0;
    let postCount = 0;
    let skippedCount = 0;
    let stringCount = 0;
    let zeroCount = 0;
    let maxWeight = 0;
    let suspiciouslySmall = [];

    const querySnapshot = await db.collection("userPosts").get();
    console.log(`Total documents fetched: ${querySnapshot.size}`);

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const raw = data.litterWeight;

        if (raw === undefined || raw === null) {
            skippedCount++;
            return;
        }

        if (typeof raw === 'string') {
            stringCount++;
        }

        const weight = parseFloat(raw);

        if (isNaN(weight)) {
            skippedCount++;
            return;
        }

        if (weight === 0) {
            zeroCount++;
        }

        if (weight > 0 && weight < 5) {
            suspiciouslySmall.push({ id: doc.id, weight });
        }

        if (weight > maxWeight) maxWeight = weight;

        sum += weight;
        postCount++;
    });

    console.log("\n===== LITTER WEIGHT ANALYSIS =====");
    console.log(`Posts counted:           ${postCount}`);
    console.log(`Posts skipped (no data): ${skippedCount}`);
    console.log(`Posts with string type:  ${stringCount}`);
    console.log(`Posts with zero weight:  ${zeroCount}`);
    console.log(`Max single post weight:  ${maxWeight} lbs`);
    console.log(`\nCALCULATED TOTAL:        ${Math.round(sum).toLocaleString()} lbs`);

    if (suspiciouslySmall.length > 0) {
        console.log(`\nPosts with weight < 5 lbs (possibly stored in kg): ${suspiciouslySmall.length}`);
        console.log("Sample:", suspiciouslySmall.slice(0, 10));
    }

    const statsDoc = await db.collection('stats').doc('totalWeight').get();
    const storedTotal = statsDoc.data()?.totalWeight;
    console.log(`\nCurrently stored in stats/totalWeight: ${storedTotal?.toLocaleString()} lbs`);
    console.log(`Difference: ${Math.round(sum - storedTotal).toLocaleString()} lbs`);
}

analyzeLitterWeight().catch(console.error);
