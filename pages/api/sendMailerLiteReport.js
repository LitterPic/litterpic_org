import axios from 'axios';

export default async function handler(req, res) {
    if (req.method === "POST") {
        const { reportData } = req.body;

        if (!reportData) {
            return res.status(400).json({ error: "Report data is required." });
        }

        // MailerLite API configuration
        const API_KEY = process.env.MAILERLITE_API_KEY;
        const GROUP_ID = process.env.MAILERLITE_REPORTS_GROUP_ID || process.env.MAILERLITE_GROUP_ID;

        console.log('MailerLite Report Environment Check:');
        console.log('API_KEY present:', !!API_KEY);
        console.log('GROUP_ID:', GROUP_ID);

        if (!API_KEY) {
            console.error('❌ MAILERLITE_API_KEY environment variable not set');
            return res.status(500).json({
                error: 'MailerLite API key not configured'
            });
        }

        try {
            // Step 1: Add reporter to MailerLite with report data as custom fields
            const subscriberData = {
                email: reportData.reporter === 'anonymous user' ? 'reports@litterpic.org' : reportData.reporter,
                fields: {
                    post_id: reportData.postID,
                    post_date: reportData.postDate,
                    post_description: reportData.postDescription.substring(0, 100), // Limit length
                    user_concern: reportData.userConcern.substring(0, 100), // Limit length
                    reported_user: reportData.userWhoPosted,
                    report_timestamp: new Date().toISOString()
                },
                ...(GROUP_ID && { groups: [GROUP_ID] })
            };

            console.log('Adding subscriber with report data:', subscriberData);

            const response = await axios.post('https://api.mailerlite.com/api/v2/subscribers', subscriberData, {
                headers: {
                    'X-MailerLite-ApiKey': API_KEY,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Report submitted to MailerLite successfully');
            
            // Step 2: Send immediate notification email to admins
            await sendAdminNotification(reportData);

            return res.status(200).json({ 
                message: "Report submitted successfully to MailerLite",
                subscriber: response.data
            });

        } catch (error) {
            console.error('❌ MailerLite Report API error:');
            console.error('Status:', error.response?.status);
            console.error('Data:', error.response?.data);
            console.error('Message:', error.message);
            
            return res.status(500).json({ 
                error: "Failed to submit report to MailerLite",
                details: error.response?.data || error.message
            });
        }
    } else {
        return res.status(405).json({ error: "Method not allowed." });
    }
}

async function sendAdminNotification(reportData) {
    try {
        // Send a simple email notification to admins
        const emailData = {
            to: 'contact@litterpic.org',
            subject: `🚨 Inappropriate Post Reported - Post ID: ${reportData.postID}`,
            text: `
INAPPROPRIATE POST REPORT

Post ID: ${reportData.postID}
Post Date: ${reportData.postDate}
Reporter: ${reportData.reporter}
Reported User: ${reportData.userWhoPosted}

User Concern:
${reportData.userConcern}

Post Description:
${reportData.postDescription}

Please review this report and take appropriate action.
            `
        };

        // You could use MailerLite's campaign API or a simple email service here
        console.log('Admin notification prepared:', emailData);
        
    } catch (error) {
        console.error('Error sending admin notification:', error);
    }
}
