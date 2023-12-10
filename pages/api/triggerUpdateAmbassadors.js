import updateAmbassadors from "../../utils/updateAmbassadors"

const admin = require('firebase-admin');

admin.initializeApp({
    credential: admin.credential.cert(process.env.NEXT_PUBLIC_FIREBASE_DB_SERVICE_ACCOUNT_KEY),
    databaseURL: 'https://litterpic-fa0bb.firebaseio.com',
});

export default async (req, res) => {
    // Trigger the updateAmbassadors function
    await updateAmbassadors();

    res.status(200).json({message: "Ambassador updates triggered successfully!"});
};
