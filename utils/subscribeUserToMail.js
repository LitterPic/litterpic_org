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
        } else {
            // explicitly not logging failure
        }
    } catch (error) {
        console.error('Error subscribing user to SendGrid:', error);
    }
}