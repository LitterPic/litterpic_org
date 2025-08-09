import axios from 'axios';

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { email, templateId, templateData } = req.body;

        if (!email || !templateId || !templateData) {
            return res.status(400).json({ error: "Invalid request parameters." });
        }

        // MailerSend API configuration
        const API_KEY = process.env.MAILERSEND_API_KEY;
        const FROM_EMAIL = process.env.MAILERSEND_FROM_EMAIL || "contact@litterpic.org";

        console.log('MailerSend Environment Check:');
        console.log('API_KEY present:', !!API_KEY);
        console.log('API_KEY length:', API_KEY ? API_KEY.length : 0);
        console.log('FROM_EMAIL:', FROM_EMAIL);

        if (!API_KEY) {
            console.error('❌ MAILERSEND_API_KEY environment variable not set');
            return res.status(500).json({
                error: 'MailerSend API key not configured'
            });
        }

        try {
            await sendMailerSendTemplateEmail(email, templateId, templateData, API_KEY, FROM_EMAIL);
            return res.status(200).json({ message: "Email sent successfully via MailerSend." });
        } catch (error) {
            console.error('MailerSend API error:', error);
            return res.status(500).json({ error: "Email sending failed via MailerSend." });
        }
    } else {
        return res.status(405).json({ error: "Method not allowed." });
    }
}

async function sendMailerSendTemplateEmail(email, templateId, templateData, apiKey, fromEmail) {
    const url = 'https://api.mailersend.com/v1/email';

    // Prepare the MailerSend payload according to their API docs
    const payload = {
        from: {
            email: fromEmail,
            name: "LitterPic"
        },
        to: [
            {
                email: email
            }
        ],
        subject: "Event Confirmation: Thanks for creating your LitterPic event!", // Required field
        template_id: templateId,
        personalization: [
            {
                email: email,
                data: templateData
            }
        ]
    };

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'Authorization': `Bearer ${apiKey}`
        }
    };

    try {
        const response = await axios.post(url, payload, config);
        console.log(`MailerSend email sent successfully to ${email} using template ${templateId}`);
        return response.data;
    } catch (error) {
        console.error('MailerSend API error details:', error.response?.data || error.message);
        throw error;
    }
}
