import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.NEXT_PUBLIC_SENDGRID_API_KEY);

export default async function handler(req, res) {  // Make the function async
    if (req.method === "POST") {
        const {email, templateId, templateData} = req.body;

        if (!email || !templateId || !templateData) {
            return res.status(400).json({error: "Invalid request parameters."});
        }

        try {
            await sendDynamicTemplateEmail(email, templateId, templateData);  // Await the function
            return res.status(200).json({message: "Email sent successfully."});
        } catch (error) {
            return res.status(500).json({error: "Email sending failed."});
        }
    } else {
        return res.status(405).json({error: "Method not allowed."});
    }
}


async function sendDynamicTemplateEmail(email, templateId, templateData) {
    const msg = {
        to: email,
        from: "contact@litterpic.org",
        templateId: templateId,
        dynamicTemplateData: templateData,
    };

    try {
        await sgMail.send(msg);  // Make sure to await
        console.log(`Email sent successfully to ${email} using template ${templateId}`);
    } catch (error) {
        console.error('Error sending email:', error);
        if (error.response) {
            console.error('SendGrid API error:', error.response.body);
        }
        throw error; // Re-throw to be handled by the caller
    }
}
