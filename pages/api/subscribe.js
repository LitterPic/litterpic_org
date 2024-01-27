//subscribe.js
import axios from 'axios';

export default async function handler(req, res) {
    try {
        const {email} = req.body;

        // Your SendGrid settings
        const API_KEY = process.env.NEXT_PUBLIC_SENDGRID_ACCESS_TOKEN;

        // SendGrid API endpoint for adding or updating contacts
        const url = 'https://api.sendgrid.com/v3/marketing/contacts';

        // Define the data payload with email and list_ids
        const data = {
            list_ids: [],
            contacts: [
                {
                    email: email.toLowerCase(),
                    Custom_Fields: {
                        Tag: req.body.Custom_Fields.Tag
                    },
                },
            ],
        };

        // Request headers
        const config = {
            headers: {
                Authorization: `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
            },
        };

        // Make the SendGrid API request with a PUT request
        const response = await axios.put(url, data, config);

        // Check the response status
        if (response.status === 202) { // Updated status code to 202
            res.status(200).json({success: true});
        } else {
            res.status(400).json({success: false});
        }
    } catch (error) {
        res.status(500).json({success: false, error: error.response.data});
    }
}
