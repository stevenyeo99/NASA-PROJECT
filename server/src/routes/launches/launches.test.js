const request = require('supertest');

const app = require('../../app');
const { mongoConnect, mongoDisconnect } = require('../../services/mongo');
const { loadPlanetsData } = require('../../models/planets.model');

describe('Test Launches API', () => {
    beforeAll(async () => {
        await mongoConnect();
        await loadPlanetsData();
    });

    afterAll(async () => {
        await mongoDisconnect();
    });

    describe('/GET Launches', () => {
        test('Test 200 status code', async () => {
            const response = await request(app)
                .get('/v1/launches')
                .expect('Content-Type', /json/)
                .expect(200);
        });
    });

    describe('/POST Launches', () => {
        const requestBody = {
            mission: 'Steven Node JS',
            rocket: 'Space-X',
            launchDate: "30 January, 1999",
            destination: "Kepler-1652 b"
        };

        const requestBodyWithoutDate = {
            mission: 'Steven Node JS',
            rocket: 'Space-X',
            destination: "Kepler-1652 b"
        };

        const requestBodyWithInvalidProperty = {

        };

        test('Test Status Code and Response Body Format', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(requestBody)
                .expect('Content-Type', /json/)
                .expect(201);

            const requestDate = new Date(requestBody.launchDate).valueOf();
            const responseDate = new Date(response.body.launchDate).valueOf();

            expect(responseDate).toBe(requestDate);
            expect(response.body).toMatchObject(requestBodyWithoutDate);
        });

        test('Test Invalid Date', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(requestBodyWithoutDate)
                .expect('Content-Type', /json/)
                .expect(400);
        });

        test('Test Invalid Field', async () => {
            const response = await request(app)
                .post('/v1/launches')
                .send(requestBodyWithInvalidProperty)
                .expect('Content-Type', /json/)
                .expect(400);

            expect(response.body).toStrictEqual({
                error: 'Missing Required Launch Input!'
            });
        });
    });
});