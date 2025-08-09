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
            
            // Step 2: Send immediate notification email to admins via MailerLite
            await sendAdminNotification(reportData, API_KEY);

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

async function sendAdminNotification(reportData, apiKey) {
    try {
        // Send immediate email notification to admin using MailerLite
        console.log('Sending admin notification email via MailerLite...');

        // First, temporarily add admin email as subscriber to send email
        const adminEmail = 'contact@litterpic.org';

        // Add admin as subscriber with report data
        const adminSubscriberData = {
            email: adminEmail,
            fields: {
                notification_type: 'admin_alert',
                post_id: reportData.postID,
                post_date: reportData.postDate,
                reporter: reportData.reporter,
                reported_user: reportData.userWhoPosted,
                user_concern: reportData.userConcern.substring(0, 100),
                post_description: reportData.postDescription.substring(0, 100)
            }
        };

        await axios.post('https://api.mailerlite.com/api/v2/subscribers', adminSubscriberData, {
            headers: {
                'X-MailerLite-ApiKey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        // Create and send campaign to admin
        const campaignData = {
            type: 'regular',
            subject: `🚨 Inappropriate Post Reported - Post ID: ${reportData.postID}`,
            from: 'reports@litterpic.org',
            from_name: 'LitterPic Reports',
            content: `
<h2 style="color: #ff6b6b;">🚨 INAPPROPRIATE POST REPORT</h2>

<div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #dee2e6;">Post ID:</td>
            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${reportData.postID}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #dee2e6;">Post Date:</td>
            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${reportData.postDate}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #dee2e6;">Reporter:</td>
            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${reportData.reporter}</td>
        </tr>
        <tr>
            <td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #dee2e6;">Reported User:</td>
            <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">${reportData.userWhoPosted}</td>
        </tr>
    </table>
</div>

<div style="margin: 20px 0;">
    <h3 style="color: #dc3545;">User Concern:</h3>
    <div style="background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 10px 0;">
        ${reportData.userConcern}
    </div>
</div>

<div style="margin: 20px 0;">
    <h3 style="color: #17a2b8;">Post Description:</h3>
    <div style="background: #d1ecf1; padding: 15px; border-left: 4px solid #17a2b8; margin: 10px 0;">
        ${reportData.postDescription}
    </div>
</div>

<div style="background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
    <strong>⚠️ Action Required:</strong> Please review this report and take appropriate action.
</div>

<hr style="margin: 30px 0;">
<p style="color: #6c757d; font-size: 12px; text-align: center;">
    This is an automated notification from LitterPic.org
</p>
            `,
            plain_text: `🚨 INAPPROPRIATE POST REPORT

Post ID: ${reportData.postID}
Post Date: ${reportData.postDate}
Reporter: ${reportData.reporter}
Reported User: ${reportData.userWhoPosted}

User Concern:
${reportData.userConcern}

Post Description:
${reportData.postDescription}

⚠️ Please review this report and take appropriate action.

---
This is an automated notification from LitterPic.org`
        };

        const campaignResponse = await axios.post('https://api.mailerlite.com/api/v2/campaigns', campaignData, {
            headers: {
                'X-MailerLite-ApiKey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        // Send the campaign to the admin email
        if (campaignResponse.data && campaignResponse.data.id) {
            await axios.post(`https://api.mailerlite.com/api/v2/campaigns/${campaignResponse.data.id}/actions/send`, {
                emails: [adminEmail]
            }, {
                headers: {
                    'X-MailerLite-ApiKey': apiKey,
                    'Content-Type': 'application/json'
                }
            });

            console.log('✅ Admin notification email sent successfully via MailerLite');
        }

    } catch (error) {
        console.error('❌ Error sending admin notification via MailerLite:', error.response?.data || error.message);
        // Don't throw error - we don't want to fail the report submission if email fails
    }
}
