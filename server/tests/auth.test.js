const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth Controller', () => {
  beforeEach(async () => {
    await User.deleteMany();
  });

  describe('POST /register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          latitude: 16.8054,
          longitude: 96.1565
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('token');
    });
  });
});
