const request = require('supertest');
const { expect } = require('chai');
const app = require('../server');

describe('Error Handler Middleware', () => {
  describe('404 Not Found', () => {
    it('should return 404 for non-existent routes', async () => {
      const res = await request(app).get('/non-existent-route');
      expect(res.status).to.equal(404);
      expect(res.text).to.include('We\'ve Driven Off Course');
    });
  });

  describe('500 Internal Server Error', () => {
    it('should handle async errors', async () => {
      // This route will throw an error
      const res = await request(app).get('/test-error');
      expect(res.status).to.equal(500);
      expect(res.text).to.include('Engine Trouble Detected');
    });
  });

  describe('Validation Error', () => {
    it('should handle validation errors', async () => {
      // This would test your validation error handler
      // You'll need to adjust based on your actual validation
      const res = await request(app)
        .post('/inv/add-classification')
        .send({ classification_name: '' });
      
      expect(res.status).to.equal(400);
    });
  });
});
