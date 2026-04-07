// SmartChef Frontend Script
// Issue #18: Ingredient input logic
// Issue #19: Saved recipes display
// Issue #20: API integration

// Auto-detect backend URL: use deployed URL in production, localhost in dev
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://YOUR-DEPLOYED-BACKEND-URL.onrender.com'; // ← the real URL here


// Check backend health on page load
async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    if (data.status === 'OK') {
      console.log('Backend connected ✅');
    }
  } catch (err) {
    console.warn('Backend not reachable. Working in offline mode.');
  }
}
checkBackendHealth();

// ---- Ingredient list state ----
let ingredients = [];

// DOM elements
const ingredientInput = document.getElementById('ingredient-input');
const addBtn = document.getElementById('add-btn');
const ingredientList = document.getElementById('ingredient-list');
const generateBtn = document.getElementById('generate-btn');
const loading = document.getElementById('loading');
const recipeResult = document.getElementById('recipe-result');
const recipeTitle = document.getElementById('recipe-title');
const recipePrep = document.getElementById('recipe-prep');
const recipeDifficulty = document.getElementById('recipe-difficulty');
const recipeInstructions = document.getElementById('recipe-instructions');
const saveBtn = document.getElementById('save-btn');
const loadRecipesBtn = document.getElementById('load-recipes-btn');
const savedRecipesList = document.getElementById('saved-recipes-list');

// The current generated recipe (so we can save it)
let currentRecipe = null;

// ---- Issue #18: Add ingredient to the list ----
function addIngredient() {
  const value = ingredientInput.value.trim();
  if (!value) return;
  if (ingredients.includes(value)) {
    ingredientInput.value = '';
    return;
  }

  ingredients.push(value);
  ingredientInput.value = '';
  renderIngredients();
}

function removeIngredient(name) {
  ingredients = ingredients.filter(i => i !== name);
  renderIngredients();
}

function renderIngredients() {
  ingredientList.innerHTML = '';
  ingredients.forEach(name => {
    const li = document.createElement('li');
    li.innerHTML = `${name} <button onclick="removeIngredient('${name}')" title="Remove">✕</button>`;
    ingredientList.appendChild(li);
  });
}

// Allow pressing Enter to add ingredient
addBtn.addEventListener('click', addIngredient);
ingredientInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addIngredient();
});

// ---- Issue #18: Generate recipe ----
generateBtn.addEventListener('click', async () => {
  if (ingredients.length === 0) {
    alert('Please add at least one ingredient first.');
    return;
  }

  loading.classList.remove('hidden');
  recipeResult.classList.add('hidden');

  try {
    const response = await fetch(`${API_URL}/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients })
    });

    const data = await response.json();
    const recipe = data.recipe;

    currentRecipe = recipe;
    recipeTitle.textContent = recipe.title;
    recipePrep.textContent = recipe.prepTime || 'N/A';
    recipeDifficulty.textContent = recipe.difficulty || 'N/A';
    recipeInstructions.textContent = recipe.instructions;

    loading.classList.add('hidden');
    recipeResult.classList.remove('hidden');

  } catch (err) {
    loading.classList.add('hidden');
    alert('Error connecting to the server. Is the backend running?');
    console.error(err);
  }
});

// ---- Issue #19: Save recipe to backend ----
saveBtn.addEventListener('click', async () => {
  if (!currentRecipe) return;

  try {
    const response = await fetch(`${API_URL}/recipes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: currentRecipe.title,
        ingredients: currentRecipe.ingredients,
        instructions: currentRecipe.instructions
      })
    });

    if (response.ok) {
      alert('Recipe saved! ✅');
    } else {
      alert('Failed to save recipe.');
    }
  } catch (err) {
    alert('Error saving recipe. Is the backend running?');
    console.error(err);
  }
});

// ---- Issue #19: Load and display saved recipes ----
loadRecipesBtn.addEventListener('click', async () => {
  savedRecipesList.innerHTML = '<p>Loading...</p>';

  try {
    const response = await fetch(`${API_URL}/recipes`);
    const recipes = await response.json();

    if (recipes.length === 0) {
      savedRecipesList.innerHTML = '<p>No saved recipes yet.</p>';
      return;
    }

    savedRecipesList.innerHTML = '';
    recipes.forEach(recipe => {
      const card = document.createElement('div');
      card.className = 'saved-recipe-card';
      card.innerHTML = `
        <h4>${recipe.title}</h4>
        <p><strong>Ingredients:</strong> ${recipe.ingredients.join(', ')}</p>
        <p>${recipe.instructions}</p>
      `;
      savedRecipesList.appendChild(card);
    });

  } catch (err) {
    savedRecipesList.innerHTML = '<p class="error">Error loading recipes. Is the backend running?</p>';
    console.error(err);
  }
});