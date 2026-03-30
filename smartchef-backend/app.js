const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('static'));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

// Root route
app.get('/', (req, res) => {
  res.send('SmartChef API is running');
});

// Recipe suggestion route (basic)
app.post('/recipes/suggest', (req, res) => {
  const { ingredients } = req.body;

  if (!ingredients || ingredients.length === 0) {
    return res.status(400).json({ error: 'Please provide ingredients' });
  }

  res.json({
    message: 'Recipe suggestions',
    ingredients,
    recipes: ['Omelette', 'Pasta', 'Salad']
  });
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});