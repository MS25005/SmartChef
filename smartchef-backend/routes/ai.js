const express = require('express');
const router = express.Router();

router.post('/generate', async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || ingredients.length === 0) {
      return res.status(400).json({ error: 'Please provide ingredients' });
    }

    const prompt = `You are a helpful chef assistant. 
Given these ingredients: ${ingredients.join(', ')}
Suggest ONE recipe. Respond in this exact JSON format with no extra text:
{
  "title": "Recipe Name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "Step by step cooking instructions.",
  "prepTime": "15 minutes",
  "difficulty": "Easy"
}`;

    const response = await fetch(
      `https://aiplatform.googleapis.com/v1/publishers/google/models/gemini-2.5-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;

    const cleaned = text.replace(/```json|```/g, '').trim();
    const recipe = JSON.parse(cleaned);

    res.json({ recipe });

  } catch (error) {
    console.error('Gemini error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;