const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Recipe = require('./models/Recipe');
const app = require('./app');

let mongoServer;

// Mock fetch to avoid real API calls
global.fetch = jest.fn();

beforeAll(async () => {
  process.env.NODE_ENV = 'test';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Recipe.deleteMany({});
  jest.clearAllMocks();
});

describe('SmartChef Test Suite (20 Tests)', () => {

  // GROUP 1: BASIC ROUTES (4)
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

  // GROUP 2: SUGGESTION LOGIC (4)
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

  // GROUP 3: DATABASE (6)
  test('9. Save recipe successfully', async () => {
    const res = await request(app).post('/recipes').send({
      title: 'Test',
      ingredients: ['a'],
      instructions: 'b'
    });

    expect(res.statusCode).toBe(201);
  });

  test('10. Recipe actually stored in DB', async () => {
    await request(app).post('/recipes').send({
      title: 'Stored',
      ingredients: ['x'],
      instructions: 'y'
    });

    const count = await Recipe.countDocuments();
    expect(count).toBe(1);
  });

  test('11. Get all recipes', async () => {
    await Recipe.create({ title: 'R1', ingredients: ['i'], instructions: 's' });

    const res = await request(app).get('/recipes');
    expect(res.body.length).toBe(1);
  });

  test('12. Save fails with missing fields', async () => {
    const res = await request(app).post('/recipes').send({ title: 'Bad' });
    expect(res.statusCode).toBe(500);
  });

  test('13. createdAt default exists', () => {
    const recipe = new Recipe({
      title: 'T',
      ingredients: ['i'],
      instructions: 's'
    });

    expect(recipe.createdAt).toBeInstanceOf(Date);
  });

  test('14. Multiple recipes stored correctly', async () => {
    await Recipe.create({ title: 'A', ingredients: ['1'], instructions: 'x' });
    await Recipe.create({ title: 'B', ingredients: ['2'], instructions: 'y' });

    const res = await request(app).get('/recipes');
    expect(res.body.length).toBe(2);
  });

  // GROUP 4: AI ROUTE (4)
  test('15. AI generate returns mocked recipe', async () => {
    fetch.mockResolvedValue({
      json: async () => ({
        candidates: [{
          content: {
            parts: [{
              text: `{
                "title": "Mock Recipe",
                "ingredients": ["egg"],
                "instructions": "Cook",
                "prepTime": "10 min",
                "difficulty": "Easy"
              }`
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
          content: {
            parts: [{ text: `INVALID_JSON` }]
          }
        }]
      })
    });

    const res = await request(app)
      .post('/ai/generate')
      .send({ ingredients: ['egg'] });

    expect(res.statusCode).toBe(500);
  });

  // GROUP 5: SECURITY & HEADERS (2)
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