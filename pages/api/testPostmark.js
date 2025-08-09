import { ServerClient } from 'postmark';

export default async function handler(req, res) {
    if (req.method === "GET") {
        // Test Postmark configuration
        const POSTMARK_API_KEY = process.env.POSTMARK_API_KEY;

        console.log('Testing Postmark configuration...');
        console.log('API Key present:', !!POSTMARK_API_KEY);
        console.log('API Key length:', POSTMARK_API_KEY ? POSTMARK_API_KEY.length : 0);

        if (!POSTMARK_API_KEY) {
            return res.status(500).json({
                error: 'POSTMARK_API_KEY environment variable not set',
                config: {
                    apiKeyPresent: false
                }
            });
        }

        try {
            // Initialize Postmark client
            const client = new ServerClient(POSTMARK_API_KEY);

            // Test sending a simple email
            const result = await client.sendEmail({
                From: 'contact@litterpic.org',
                To: 'contact@litterpic.org',
                Subject: 'Test Email from Postmark API',
                HtmlBody: '<h1>Test Email</h1><p>This is a test email to verify Postmark integration is working.</p>',
                TextBody: 'Test Email - This is a test email to verify Postmark integration is working.',
                MessageStream: 'outbound'
            });

            return res.status(200).json({
                message: 'Postmark test email sent successfully!',
                messageId: result.MessageID,
                config: {
                    apiKeyPresent: true,
                    apiKeyLength: POSTMARK_API_KEY.length
                }
            });

        } catch (error) {
            console.error('Postmark test error:', error);
            return res.status(500).json({
                error: 'Postmark API connection failed',
                details: error.message,
                config: {
                    apiKeyPresent: true,
                    apiKeyLength: POSTMARK_API_KEY ? POSTMARK_API_KEY.length : 0
                }
            });
        }
    } else {
        return res.status(405).json({ error: "Method not allowed." });
    }
}
