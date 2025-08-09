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
        // Simpler approach: Add admin to a special "reports" group that triggers automation
        console.log('Sending admin notification via MailerLite automation...');

        const adminEmail = 'contact@litterpic.org';

        // Create a unique subscriber entry for this report
        const reportSubscriberData = {
            email: `report-${Date.now()}@litterpic.org`, // Unique email for each report
            fields: {
                admin_email: adminEmail,
                report_type: 'inappropriate_post',
                post_id: reportData.postID,
                post_date: reportData.postDate,
                reporter: reportData.reporter,
                reported_user: reportData.userWhoPosted,
                user_concern: reportData.userConcern.substring(0, 200),
                post_description: reportData.postDescription.substring(0, 200),
                report_timestamp: new Date().toISOString()
            }
        };

        console.log('Adding report subscriber to trigger automation:', reportSubscriberData);

        const response = await axios.post('https://api.mailerlite.com/api/v2/subscribers', reportSubscriberData, {
            headers: {
                'X-MailerLite-ApiKey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Report subscriber added to MailerLite - automation should trigger');
        console.log('Response:', response.data);

        // Also try a direct approach - add the actual admin email with report data
        const adminSubscriberData = {
            email: adminEmail,
            fields: {
                last_report_post_id: reportData.postID,
                last_report_date: reportData.postDate,
                last_reporter: reportData.reporter,
                last_reported_user: reportData.userWhoPosted,
                last_report_concern: reportData.userConcern.substring(0, 100),
                last_report_timestamp: new Date().toISOString()
            }
        };

        await axios.post('https://api.mailerlite.com/api/v2/subscribers', adminSubscriberData, {
            headers: {
                'X-MailerLite-ApiKey': apiKey,
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Admin subscriber updated with latest report data');

    } catch (error) {
        console.error('❌ Error sending admin notification via MailerLite:');
        console.error('Status:', error.response?.status);
        console.error('Data:', error.response?.data);
        console.error('Message:', error.message);
        // Don't throw error - we don't want to fail the report submission if email fails
    }
}
