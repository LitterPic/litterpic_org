import axios from 'axios';

export default async function handler(req, res) {
    const ipinfoAccessToken = process.env.NEXT_PUBLIC_IPINFO_ACCESS_TOKEN;

    try {
        const response = await axios.get('http://ipinfo.io', {
            headers: {
                Authorization: `Bearer ${ipinfoAccessToken}`
            }
        });
        const locationData = response.data;
        res.status(200).json(locationData);
    } catch (error) {
        res.status(500).json({error: 'Internal server error'});
    }
}
