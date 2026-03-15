const request = require('supertest');
const { expect } = require('chai');

// Target the already-running application server
const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

// Models the 4 Postman collections as Supertest API tests

describe('Dashboard Collection - Supertest API Tests', () => {
  it('GET /dashboard should return 200', async () => {
    const res = await request(BASE_URL).get('/dashboard');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Feature Status Monitor Dashboard');
  });
});

describe('Data Collection - Supertest API Tests', () => {
  it('GET /data/directory should return 200 with JSON array', async () => {
    const res = await request(BASE_URL).get('/data/directory');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('GET /data/schedule should return 200', async () => {
    const res = await request(BASE_URL).get('/data/schedule');
    expect(res.status).to.equal(200);
  });
});

describe('Deploy Collection - Supertest API Tests', () => {
  it('GET /readyToDeploy/:env should return 200 with JSON array', async () => {
    const res = await request(BASE_URL).get('/readyToDeploy/dev');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });

  it('GET /readyToDeploy/:env/:trans should return 200 with JSON array', async () => {
    const res = await request(BASE_URL).get('/readyToDeploy/dev/dashboard');
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an('array');
  });
});

describe('Performance Collection - Supertest API Tests', () => {
  it('GET /dashboard/performance/:env/All should return 200', async () => {
    const res = await request(BASE_URL).get('/dashboard/performance/dev/All');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Feature Collection Performance');
  });

  it('GET /dashboard/performance/:env/30 should return 200', async () => {
    const res = await request(BASE_URL).get('/dashboard/performance/dev/30');
    expect(res.status).to.equal(200);
    expect(res.text).to.include('Feature Collection Performance');
  });
});
