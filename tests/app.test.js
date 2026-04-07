const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const express = require('express');
const Recipe = require('../smartchef-backend/models/Recipe');
app = require('../smartchef-backend/app');

let mongoServer;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    // We connect to the in-memory DB here before tests run
    await mongoose.connect(uri);
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

afterEach(async () => {
    await Recipe.deleteMany({});
});

describe('SmartChef Unit Test Suite', () => {

    // --- GROUP 1: HEALTH & CONNECTIVITY (3 Tests) ---
    
    test('1. GET /health should return status OK', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toEqual(200);
        expect(res.body.status).toBe('OK');
    });

    test('2. GET / should return welcome message', async () => {
        const res = await request(app).get('/');
        expect(res.text).toContain('SmartChef API is running');
    });

    test('3. GET /test should return "GET works"', async () => {
        const res = await request(app).get('/test');
        expect(res.text).toBe('GET works');
    });

    // --- GROUP 2: RECIPE SUGGESTION LOGIC (3 Tests) ---

    test('4. POST /recipes/suggest should return recipes for valid ingredients', async () => {
        const res = await request(app)
            .post('/recipes/suggest')
            .send({ ingredients: ['eggs', 'cheese'] });
        expect(res.statusCode).toEqual(200);
        expect(res.body.recipes).toContain('Omelette');
    });

    test('5. POST /recipes/suggest should fail (400) if ingredients list is empty', async () => {
        const res = await request(app)
            .post('/recipes/suggest')
            .send({ ingredients: [] });
        expect(res.statusCode).toEqual(400);
        expect(res.body.error).toBe('Please provide ingredients');
    });

    test('6. POST /recipes/suggest should fail (400) if ingredients field is missing', async () => {
        const res = await request(app)
            .post('/recipes/suggest')
            .send({});
        expect(res.statusCode).toEqual(400);
    });

    // --- GROUP 3: DATABASE OPERATIONS (4 Tests) ---

    test('7. POST /recipes should successfully save a recipe to the DB', async () => {
        const newRecipe = {
            title: 'Test Pasta',
            ingredients: ['noodles', 'sauce'],
            instructions: 'Boil and mix.'
        };
        const res = await request(app).post('/recipes').send(newRecipe);
        expect(res.statusCode).toEqual(201);
        expect(res.body.recipe.title).toBe('Test Pasta');
        
        const count = await Recipe.countDocuments();
        expect(count).toBe(1);
    });

    test('8. GET /recipes should retrieve all saved recipes', async () => {
        await Recipe.create({ title: 'R1', ingredients: ['i1'], instructions: 'step 1' });
        await Recipe.create({ title: 'R2', ingredients: ['i2'], instructions: 'step 2' });

        const res = await request(app).get('/recipes');
        expect(res.statusCode).toEqual(200);
        expect(res.body.length).toBe(2);
    });

    test('9. POST /recipes should fail if required fields are missing', async () => {
        const res = await request(app).post('/recipes').send({ title: 'Incomplete' });
        expect(res.statusCode).toEqual(500); // Per your app.js error handling
    });

    test('10. Recipe model should default createdAt to current date', async () => {
        const recipe = new Recipe({ title: 'T', ingredients: ['I'], instructions: 'S' });
        expect(recipe.createdAt).toBeDefined();
        expect(recipe.createdAt instanceof Date).toBe(true);
    });

    // --- GROUP 4: SECURITY & MIDDLEWARE (2 Tests) ---

    test('11. CORS headers should be present', async () => {
        const res = await request(app).get('/health');
        expect(res.headers['access-control-allow-origin']).toBeDefined();
    });

    test('12. POST /test should echo "POST works"', async () => {
        const res = await request(app).post('/test');
        expect(res.statusCode).toEqual(200);
        expect(res.text).toBe('POST works');
    });
});