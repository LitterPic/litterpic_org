// subscribeUserToMail.js
export async function subscribeUserToMail(email, type) {
    try {
        const apiResponse = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                Custom_Fields: {
                    Tag: type
                },
            }),
        });

        const mailData = await apiResponse.json();

        if (mailData.success) {
            // Successfully subscribed to MailerLite
            return {
                success: true,
                subscriber: mailData.subscriber
            };
        } else {
            // Log failure for debugging
            console.error('Failed to subscribe user to MailerLite:', mailData.error || 'Unknown error');
            throw new Error(mailData.error || 'Failed to subscribe user to mailing list');
        }
    } catch (error) {
        console.error('Error subscribing user to MailerLite:', error);
        throw error; // Re-throw to allow caller to handle the error
    }
}
