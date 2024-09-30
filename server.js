const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors()); // Allow CORS for your browser extension

const PORT = process.env.PORT || 5000;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

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

// Route to transform content using OpenAI
app.post('/api/transform', authenticateToken, async (req, res) => {
    const { content } = req.body;

    if (!content) return res.status(400).json({ error: 'Content is required' });

    try {
        const response = await axios.post(
            'https://api.openai.com/v1/completions',
            {
                model: 'text-davinci-003',  // Replace with your preferred model
                prompt: content,
                max_tokens: 150,
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const transformedContent = response.data.choices[0].text;
        res.json({ transformedContent });
    } catch (error) {
        console.error('Error with OpenAI API:', error.message);
        res.status(500).json({ error: 'Failed to transform content' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
