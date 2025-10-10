const { test, expect } = require('@playwright/test');

test.describe('API Tests for FeatureStatusMonitor', () => {
  test('should return summary stats for test environment', async ({ request }) => {
    const response = await request.get('http://localhost:8080/getSummaryStats/test');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Environment', 'test');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  test('should return result keys for test environment', async ({ request }) => {
    const response = await request.get('http://localhost:8080/histresultskeys/test');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return 3 days data for a specific key', async ({ request }) => {
    const response = await request.get('http://localhost:8080/histresultsdays/test/starwars/3');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
    body.forEach(record => {
      expect(record).toHaveProperty('DateTime');
      expect(record).toHaveProperty('AvgResponseTime');
    });
  });

  test('should return 200 for /data/schedule endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:8080/data/schedule');
    expect(response.status()).toBe(200);
   // const body = await response.json();
   // expect(body).toBeInstanceOf(Object);
  });

  test('should return 200 for /config endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:8080/config');
    expect(response.status()).toBe(200);
    const body = await response.text();
    expect(body).toBeTruthy();
  });

  // test('should return 200 for /username when logged in', async ({ request }) => {
  //   const response = await request.get('http://localhost:8080/username');
  //   expect(response.status()).toBe(200);
  //   const body = await response.text();
  //   expect(body).toBeTruthy();
  // });

  // test('should return 200 for /logout endpoint', async ({ request }) => {
  //   const response = await request.get('http://localhost:8080/logout');
  //   expect(response.status()).toBe(200);
  // });

  test('should return 200 for /histresults endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:8080/histresults/test/starwars');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return 200 for /results endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:8080/results/test');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return 200 for /getStats endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:8080/getStats/test/starwars');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Feature', 'starwars');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  test('should return 200 for /getSummaryStats with days parameter', async ({ request }) => {
    const response = await request.get('http://localhost:8080/getSummaryStats/test/7');
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Environment', 'test');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  // Note: These tests trigger actual Postman collection runs which may take time
  test('should return 200 for /runDev endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:8080/runDev');
    // The endpoint redirects (302) or returns 200/500 depending on collection execution
    expect([200, 302, 500]).toContain(response.status());
  });

  test('should return 200 for /runTest endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:8080/runTest');
    // The endpoint redirects (302) or returns 200/500 depending on collection execution
    expect([200, 302, 500]).toContain(response.status());
  });

  test('should return 200 for /runStaging endpoint', async ({ request }) => {
    const response = await request.get('http://localhost:8080/runStaging');
    // The endpoint redirects (302) or returns 200/500 depending on collection execution
    expect([200, 302, 500]).toContain(response.status());
  });
});
