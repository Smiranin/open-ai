import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import cors from 'cors';
import { Configuration, OpenAIApi } from 'openai';


// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Allow CORS for your browser extension

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Set up OpenAI API configuration
const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Middleware to check JWT
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization']?.split(' ')[1];

    if (!token) return res.sendStatus(401); // Unauthorized

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Forbidden
        req.user = user;
        next();
    });
};

// Generate JWT for user (This can be used during login/signup)
app.post('/auth/login', (req, res) => {
    // Normally, you would verify user credentials here
    const { username } = req.body;

    if (!username) return res.status(400).json({ error: 'Username required' });

    // Generate JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
});

// Route to correct grammar
app.post('/correct-grammar', async (req, res) => {
    const { text } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    try {
        const response = await openai.createCompletion({
            model: "gpt-4o",
            prompt: `Correct the grammar of the following text:\n\n${text}`,
            max_tokens: 1000,
            temperature: 0.2,
        });

        const correctedText = response.data.choices[0].text.trim();
        res.json({ original: text, corrected: correctedText });

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        res.status(500).json({ error: 'Error processing your request' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
