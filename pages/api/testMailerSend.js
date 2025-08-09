import axios from 'axios';

export default async function handler(req, res) {
    if (req.method === "GET") {
        // Test MailerSend configuration
        const API_KEY = process.env.MAILERSEND_API_KEY;
        const FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || "info@litterpic.org";

        console.log('Testing MailerSend configuration...');
        console.log('API Key present:', !!API_KEY);
        console.log('API Key length:', API_KEY ? API_KEY.length : 0);
        console.log('From Email:', FROM_EMAIL);

        if (!API_KEY) {
            return res.status(500).json({
                error: 'MAILERSEND_API_KEY environment variable not set',
                config: {
                    apiKeyPresent: false,
                    fromEmail: FROM_EMAIL
                }
            });
        }

        // Test API connection by getting account info
        try {
            const response = await axios.get('https://api.mailersend.com/v1/me', {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            return res.status(200).json({
                message: 'MailerSend configuration is working!',
                account: response.data,
                config: {
                    apiKeyPresent: true,
                    fromEmail: FROM_EMAIL
                }
            });
        } catch (error) {
            console.error('MailerSend test error:', error.response?.data || error.message);
            return res.status(500).json({
                error: 'MailerSend API connection failed',
                details: error.response?.data || error.message,
                config: {
                    apiKeyPresent: true,
                    fromEmail: FROM_EMAIL
                }
            });
        }
    } else {
        return res.status(405).json({ error: "Method not allowed." });
    }
}
