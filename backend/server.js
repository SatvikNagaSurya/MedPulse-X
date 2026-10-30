const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { GoogleGenAI } = require('@google/genai');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/medpulsex')
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Basic Route
app.get('/api/health', (req, res) => {
  res.json({ status: 'MedPulse-X Backend is running' });
});

// Example Gemini Route for Analysis
app.post('/api/analyze-health', async (req, res) => {
  try {
    const { profileData } = req.body;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: `Analyze this health profile for drug-lab contraindications: ${JSON.stringify(profileData)}`,
    });
    res.json({ analysis: response.text });
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to analyze health data' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
