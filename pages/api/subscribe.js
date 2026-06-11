//subscribe.js
import axios from 'axios';

export default async function handler(req, res) {
    try {
        const { email, Custom_Fields } = req.body;

        const API_KEY = process.env.MAILERLITE_API_KEY;
        const GROUP_ID = process.env.MAILERLITE_GROUP_ID;

        if (!API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'MailerLite API key not configured'
            });
        }

        // New MailerLite API endpoint (connect.mailerlite.com)
        const url = 'https://connect.mailerlite.com/api/subscribers';

        const data = {
            email: email.toLowerCase(),
            fields: {
                tag: Custom_Fields?.Tag || 'general'
            },
            ...(GROUP_ID && { groups: [GROUP_ID] })
        };

        const config = {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
        };

        const response = await axios.post(url, data, config);

        // 200 = existing subscriber updated, 201 = new subscriber created
        if (response.status === 200 || response.status === 201) {
            res.status(200).json({
                success: true,
                subscriber: response.data
            });
        } else {
            res.status(400).json({
                success: false,
                error: 'Failed to subscribe to MailerLite'
            });
        }
    } catch (error) {
        console.error('MailerLite Subscribe API error:', error);

        let errorMessage = 'Unknown error';
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
            errorMessage = Object.values(error.response.data.errors).flat().join(', ');
        } else if (error.message) {
            errorMessage = error.message;
        }

        res.status(500).json({
            success: false,
            error: errorMessage
        });
    }
}
