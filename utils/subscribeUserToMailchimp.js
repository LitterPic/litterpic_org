// Function to subscribe a user to Mailchimp
export async function subscribeUserToMailchimp(email) {
    try {
        const mailchimpResponse = await fetch('/api/subscribe', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
            }),
        });

        const mailchimpData = await mailchimpResponse.json();

        if (mailchimpData.success) {
            // explicitly not logging success
        } else {
            // explicitly not logging failure
        }
    } catch (error) {
        console.error('Error subscribing user to Mailchimp:', error);
    }
}