import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default function handler(req, res) {
    if (req.method === "POST") {
        const {email, templateId, templateData} = req.body;

        if (!email || !templateId || !templateData) {
            return res.status(400).json({error: "Invalid request parameters."});
        }

        sendDynamicTemplateEmail(email, templateId, templateData);

        return res.status(200).json({message: "Email sent successfully."});
    } else {
        return res.status(405).json({error: "Method not allowed."});
    }
}

async function sendDynamicTemplateEmail(email, templateId, templateData) {
    const msg = {
        to: email,
        from: "contact@litterpic.com",
        templateId: templateId,
        dynamicTemplateData: templateData,
    };

    try {
        await sgMail.send(msg);
        console.log("Email sent");
    } catch (error) {
        console.error("Error sending email:", error);
    }
}
