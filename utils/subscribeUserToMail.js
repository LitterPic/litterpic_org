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
            // explicitly not logging success
            return { success: true };
        } else {
            // Log failure for debugging
            console.error('Failed to subscribe user to SendGrid:', mailData.error || 'Unknown error');
            throw new Error(mailData.error || 'Failed to subscribe user to mailing list');
        }
    } catch (error) {
        console.error('Error subscribing user to SendGrid:', error);
        throw error; // Re-throw to allow caller to handle the error
    }
}
