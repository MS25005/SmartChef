const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post('/generate', async (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: 'Please provide ingredients' });
  }

  // TEMP MOCK - replace with real Gemini call once key is working
  const recipe = {
    title: "Quick Omelette",
    ingredients: ingredients,
    instructions: "Beat eggs, add ingredients, cook on medium heat for 3 minutes.",
    prepTime: "10 minutes",
    difficulty: "Easy"
  };

  res.json({ recipe });
});

module.exports = router;