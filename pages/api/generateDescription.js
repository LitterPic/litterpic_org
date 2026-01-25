import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { images, location, litterWeight, unit } = req.body;

        if (!images || images.length === 0) {
            return res.status(400).json({ error: 'At least one image is required' });
        }

        // Check if API key is available
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not set in environment variables');
            return res.status(500).json({ error: 'API key not configured' });
        }

        // Initialize Gemini API
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

        // Convert weight to display format
        const weightDisplay = unit === 'kg' 
            ? `${litterWeight} kg` 
            : `${litterWeight} lbs`;

        // Create the prompt
        const prompt = `You are helping create a social media post for LitterPic, an app where people share their litter cleanup efforts. 

Based on the provided image(s) of litter that was collected, generate a brief, engaging description (2-3 sentences max) for a post.

Context:
- Location: ${location || 'Not specified'}
- Amount collected: ${weightDisplay}

Guidelines:
- Write a positive and encouraging description about the cleanup effort
- If the images clearly show litter or cleanup activity, mention specific types of litter if visible
- If the images don't obviously show litter cleanup, still write a creative and positive description that could relate to environmental care or community effort
- Keep it casual and friendly, suitable for social media
- Do not use hashtags
- Do not mention the app name
- Focus on the impact and the effort made
- If weight is provided, you may mention it naturally in the description

Write only the description, nothing else.

Generate the description:`;

        // Process images - convert base64 to the format Gemini expects
        const imageParts = images.map(imageBase64 => {
            // Remove data URL prefix if present
            const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
            
            return {
                inlineData: {
                    data: base64Data,
                    mimeType: 'image/jpeg'
                }
            };
        });

        // Generate content with images
        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const description = response.text();

        return res.status(200).json({ description: description.trim() });

    } catch (error) {
        console.error('Error generating description:', error);
        console.error('Error stack:', error.stack);
        return res.status(500).json({
            error: 'Failed to generate description',
            details: error.message,
            type: error.name
        });
    }
}

