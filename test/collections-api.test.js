const { test, expect } = require('@playwright/test');

// Models the 4 Postman collections as API tests using Playwright request

test.describe('Dashboard Collection - API Tests', () => {
  test('GET /dashboard should return 200', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/dashboard`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Feature Status Monitor Dashboard');
  });
});

test.describe('Data Collection - API Tests', () => {
  test('GET /data/directory should return 200', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/data/directory`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /data/schedule should return 200', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/data/schedule`);
    expect(response.status()).toBe(200);
  });
});

test.describe('Deploy Collection - API Tests', () => {
  test('GET /readyToDeploy/:env should return 200', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/readyToDeploy/dev`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('GET /readyToDeploy/:env/:trans should return 200', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/readyToDeploy/dev/dashboard`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });
});

test.describe('Performance Collection - API Tests', () => {
  test('GET /dashboard/performance/:env/All should return 200', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/dashboard/performance/dev/All`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Feature Collection Performance');
  });

  test('GET /dashboard/performance/:env/30 should return 200', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/dashboard/performance/dev/30`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toContain('Feature Collection Performance');
  });
});
