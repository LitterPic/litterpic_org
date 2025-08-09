//subscribe.js
import axios from 'axios';

export default async function handler(req, res) {
    try {
        const { email, Custom_Fields } = req.body;

        // Your MailerLite settings
        const API_KEY = process.env.MAILERLITE_API_KEY;
        const GROUP_ID = process.env.MAILERLITE_GROUP_ID; // Optional: specific group/list ID

        if (!API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'MailerLite API key not configured'
            });
        }

        // MailerLite API endpoint for adding subscribers (v1 API)
        const url = 'https://api.mailerlite.com/api/v2/subscribers';

        // Define the data payload for MailerLite v2 API
        const data = {
            email: email.toLowerCase(),
            fields: {
                // Map your custom fields to MailerLite fields
                tag: Custom_Fields?.Tag || 'general'
            },
            // Optionally add to specific groups
            ...(GROUP_ID && { groups: [GROUP_ID] })
        };

        // Request headers for MailerLite v2 API
        const config = {
            headers: {
                'X-MailerLite-ApiKey': API_KEY,
                'Content-Type': 'application/json'
            },
        };

        // Make the MailerLite API request
        const response = await axios.post(url, data, config);

        // Check the response status
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

        // Handle MailerLite specific errors
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
