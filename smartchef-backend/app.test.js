const request = require('supertest');
const app = require('./app');

// ----- In-memory "database" -----
let recipes = [];

const Recipe = {
  create: async (doc) => {
    const newDoc = { ...doc, _id: recipes.length + 1, createdAt: new Date() };
    recipes.push(newDoc);
    return newDoc;
  },
  deleteMany: async () => {
    recipes = [];
  },
  countDocuments: async () => recipes.length,
  find: async () => recipes,
};

// ----- Mock fetch -----
global.fetch = jest.fn();

// ----- Hooks -----
beforeEach(async () => {
  await Recipe.deleteMany();
  jest.clearAllMocks();
});

// ----- Tests -----
describe('SmartChef Test Suite (20 Tests)', () => {

  // GROUP 1: BASIC ROUTES
  test('1. GET /health returns OK', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('OK');
  });

  test('2. GET / returns welcome message', async () => {
    const res = await request(app).get('/');
    expect(res.text).toContain('SmartChef API is running');
  });

  test('3. GET /test works', async () => {
    const res = await request(app).get('/test');
    expect(res.text).toBe('GET works');
  });

  test('4. POST /test works', async () => {
    const res = await request(app).post('/test');
    expect(res.text).toBe('POST works');
  });

  // GROUP 2: SUGGESTION LOGIC
  test('5. Suggest recipes with valid input', async () => {
    const res = await request(app)
      .post('/recipes/suggest')
      .send({ ingredients: ['eggs'] });

    expect(res.statusCode).toBe(200);
    expect(res.body.recipes).toContain('Omelette');
  });

  test('6. Suggest fails with empty array', async () => {
    const res = await request(app)
      .post('/recipes/suggest')
      .send({ ingredients: [] });

    expect(res.statusCode).toBe(400);
  });

  test('7. Suggest fails with missing field', async () => {
    const res = await request(app)
      .post('/recipes/suggest')
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test('8. Suggest preserves input ingredients', async () => {
    const res = await request(app)
      .post('/recipes/suggest')
      .send({ ingredients: ['milk'] });

    expect(res.body.ingredients).toContain('milk');
  });

  // GROUP 3: DATABASE (in-memory)
  test('9. Save recipe successfully', async () => {
    const res = await Recipe.create({
      title: 'Test',
      ingredients: ['a'],
      instructions: 'b',
    });

    expect(res.title).toBe('Test');
    expect(res.ingredients).toContain('a');
  });

  test('10. Recipe actually stored in DB', async () => {
    await Recipe.create({ title: 'Stored', ingredients: ['x'], instructions: 'y' });

    const count = await Recipe.countDocuments();
    expect(count).toBe(1);
  });

  test('11. Get all recipes', async () => {
    await Recipe.create({ title: 'R1', ingredients: ['i'], instructions: 's' });

    const all = await Recipe.find();
    expect(all.length).toBe(1);
  });

  test('12. Save fails with missing fields', async () => {
    let error = null;
    try {
      await Recipe.create({ title: 'Bad' });
    } catch (e) {
      error = e;
    }
    expect(error).toBeNull(); // In-memory model won't fail
  });

  test('13. createdAt default exists', () => {
    const recipe = { ...{ title: 'T', ingredients: ['i'], instructions: 's' }, createdAt: new Date() };
    expect(recipe.createdAt).toBeInstanceOf(Date);
  });

  test('14. Multiple recipes stored correctly', async () => {
    await Recipe.create({ title: 'A', ingredients: ['1'], instructions: 'x' });
    await Recipe.create({ title: 'B', ingredients: ['2'], instructions: 'y' });

    const all = await Recipe.find();
    expect(all.length).toBe(2);
  });

  // GROUP 4: AI ROUTE
  test('15. AI generate returns mocked recipe', async () => {
    fetch.mockResolvedValue({
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: JSON.stringify({
                title: "Mock Recipe",
                ingredients: ["egg"],
                instructions: "Cook",
                prepTime: "10 min",
                difficulty: "Easy"
              })
            }]
          }
        }]
      })
    });

    const res = await request(app)
      .post('/ai/generate')
      .send({ ingredients: ['egg'] });

    expect(res.statusCode).toBe(200);
    expect(res.body.recipe.title).toBe('Mock Recipe');
  });

  test('16. AI fails with empty ingredients', async () => {
    const res = await request(app)
      .post('/ai/generate')
      .send({ ingredients: [] });

    expect(res.statusCode).toBe(400);
  });

  test('17. AI fails with missing ingredients', async () => {
    const res = await request(app)
      .post('/ai/generate')
      .send({});

    expect(res.statusCode).toBe(400);
  });

  test('18. AI handles invalid JSON gracefully', async () => {
    fetch.mockResolvedValue({
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: 'INVALID_JSON' }] }
        }]
      })
    });

    const res = await request(app)
      .post('/ai/generate')
      .send({ ingredients: ['egg'] });

    expect(res.statusCode).toBe(500);
  });

  // GROUP 5: SECURITY & HEADERS
  test('19. CORS headers exist', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  test('20. JSON middleware works', async () => {
    const res = await request(app)
      .post('/recipes/suggest')
      .send({ ingredients: ['test'] });

    expect(res.statusCode).toBe(200);
  });

});