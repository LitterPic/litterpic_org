import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export default async (req, res) => {
    if (req.method === 'POST') {
        const {firstName, lastName, email, message} = req.body;

        const msg = {
            to: 'contact@litterpic.com',
            from: 'contact@litterpic.org',
            subject: `New Contact from ${firstName} ${lastName}`,
            text: `${message} - you can reply to them at ${email}`,
            html: `<p>${message} - you can reply to them at ${email}</p>`,
        };

        try {
            await sgMail.send(msg);
            res.status(200).json({success: true});
        } catch (error) {
            console.error(error);
            res.status(500).json({error: 'Error sending email'});
        }
    } else {
        res.status(405).json({error: 'We only accept POST'});
    }
};
