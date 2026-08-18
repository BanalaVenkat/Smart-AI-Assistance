import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

// Initialize the official Google Gen AI SDK securely on the server
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Secure chat endpoint routing browser requests away from raw API keys
app.post('/api/chat', async (req, res) => {
    try {
        const { history } = req.body;

        if (!history || !Array.isArray(history)) {
            return res.status(400).json({ error: "Invalid conversation history format." });
        }

        // Map standard history roles to Gemini's expected format if necessary,
        // or feed the multi-turn contents directly into chats
        const formattedContents = history.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Call Gemini 2.5 Flash for high speed and low latency
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: formattedContents,
            config: {
                systemInstruction: "You are a helpful, professional, and efficient AI assistant.",
                temperature: 0.7,
            }
        });

        const replyText = response.text();
        res.json({ reply: replyText });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: error.message || "Failed to generate response from Gemini." });
    }
});

app.listen(port, () => {
    console.log(`Server running securely at http://localhost:${port}`);
});
