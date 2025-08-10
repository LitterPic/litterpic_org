import axios from 'axios';

export default async (req, res) => {
    if (req.method === 'POST') {
        const {firstName, lastName, email, message} = req.body;

        // Check for required environment variables
        const apiKey = process.env.MAILERSEND_API_KEY;
        const fromEmail = process.env.MAILERSEND_FROM_EMAIL || 'info@litterpic.org';

        if (!apiKey) {
            console.error('MailerSend API key not configured');
            return res.status(500).json({error: 'Email service not configured'});
        }

        // MailerSend API endpoint
        const url = 'https://api.mailersend.com/v1/email';

        // Prepare the email payload
        const payload = {
            from: {
                email: fromEmail,
                name: "LitterPic Contact Form"
            },
            to: [
                {
                    email: 'contact@litterpic.org',
                    name: 'LitterPic Support'
                }
            ],
            subject: `New Contact from ${firstName} ${lastName}`,
            text: `${message}\n\nFrom: ${firstName} ${lastName}\nEmail: ${email}\n\nYou can reply directly to: ${email}`,
            html: `
                <h3>New Contact Form Submission</h3>
                <p><strong>From:</strong> ${firstName} ${lastName}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message.replace(/\n/g, '<br>')}</p>
                <hr>
                <p><em>You can reply directly to: ${email}</em></p>
            `,
            reply_to: [
                {
                    email: email,
                    name: `${firstName} ${lastName}`
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
            console.log(`Contact form email sent successfully from ${firstName} ${lastName} (${email})`);
            res.status(200).json({success: true});
        } catch (error) {
            console.error('MailerSend API error:', error.response?.data || error.message);
            res.status(500).json({error: 'Error sending email'});
        }
    } else {
        res.status(405).json({error: 'We only accept POST'});
    }
};
