console.log("RUNNING THIS FILE");
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Recipe = require('./models/Recipe');
const aiRoutes = require('./routes/ai');

const app = express();

// Middleware (ORDER MATTERS)
app.use(cors());
app.use(express.json());

// Debug logger (AFTER middleware)
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: "OK" });
});

// Root route
app.get('/', (req, res) => {
  res.send('SmartChef API is running');
});

// Test routes
app.get('/test', (req, res) => {
  res.send("GET works");
});

app.post('/test', (req, res) => {
  res.send("POST works");
});





// Recipe suggestion (basic AI placeholder)
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

// Save recipe
app.post('/recipes', async (req, res) => {
  try {
    const { title, ingredients, instructions } = req.body;

    const recipe = new Recipe({
      title,
      ingredients,
      instructions
    });

    await recipe.save();

    res.status(201).json({
      message: 'Recipe saved successfully',
      recipe
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get recipes
app.get('/recipes', async (req, res) => {
  try {
    const recipes = await Recipe.find();
    res.json(recipes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// AI routes
app.use('/ai', aiRoutes);

// Start server (ALWAYS LAST)
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});