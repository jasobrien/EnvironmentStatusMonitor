const { test, expect } = require('@playwright/test');

test.describe('API Tests for FeatureStatusMonitor', () => {
  test('should return summary stats for test environment', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/getSummaryStats/test`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Environment', 'test');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  test('should return result keys for test environment', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/histresultskeys/test`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return 3 days data for a specific key', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/histresultsdays/test/starwars/3`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    body.forEach(record => {
      expect(record).toHaveProperty('DateTime');
      expect(record).toHaveProperty('AvgResponseTime');
    });
  });

  test('should return 200 for /data/schedule endpoint', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/data/schedule`);
    expect(response.status()).toBe(200);
  });

  test('should return 200 for /config endpoint', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/config`);
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toBeTruthy();
  });

  test('should return 200 for /histresults endpoint', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/histresults/test/starwars`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return 200 for /results endpoint', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/results/test`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return 200 for /getStats endpoint', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/getStats/test/starwars`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Feature', 'starwars');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  test('should return 200 for /getSummaryStats with days parameter', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/getSummaryStats/test/7`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Environment', 'test');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  test('should return 200 for /runDev endpoint', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/runDev`);
    expect(response.status()).toBe(200);
  });

  test('should return 200 for /runTest endpoint', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/runTest`);
    expect(response.status()).toBe(200);
  });

  test('should return 200 for /runStaging endpoint', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/runStaging`);
    expect(response.status()).toBe(200);
  });
});
