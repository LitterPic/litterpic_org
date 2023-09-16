// pages/api/subscribe.js

import axios from 'axios';

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const {email} = req.body;

        // Your Mailchimp settings
        const API_KEY = process.env.NEXT_PUBLIC_MAILCHIMP_ACCESS_TOKEN;
        const LIST_ID = '74b6ad6a41';
        const SERVER_PREFIX = 'us21';

        // Mailchimp API endpoint
        const url = `https://${SERVER_PREFIX}.api.mailchimp.com/3.0/lists/${LIST_ID}/members`;

        // Subscriber data
        const data = {
            email_address: email,
            status: 'subscribed',
        };

        // Request headers
        const config = {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        try {
            const response = await axios.post(url, data, config);

            if (response.status === 200) {
                res.status(200).json({success: true});
            } else {
                res.status(400).json({success: false});
            }
        } catch (error) {
            res.status(500).json({success: false, error: error.response.data});
        }
    } else {
        res.status(405).end();
    }
}
