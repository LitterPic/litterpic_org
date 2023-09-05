export default async function handler(req, res) {
    try {
        const userIPAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        res.status(200).json({userIPAddress});
    } catch (error) {
        res.status(500).json({error: 'Internal server error'});
    }
}
