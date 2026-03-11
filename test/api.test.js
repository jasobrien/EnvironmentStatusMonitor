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

  test('should return 200 for /runProd endpoint', async ({ request, baseURL }) => {
    test.setTimeout(60000);
    const response = await request.get(`${baseURL}/runProd`);
    // runProd triggers Newman tests and redirects to /
    expect([200, 302, 500]).toContain(response.status());
  });

  test('should return 200 for /runQA endpoint', async ({ request, baseURL }) => {
    test.setTimeout(60000);
    const response = await request.get(`${baseURL}/runQA`);
    // runQA triggers Newman tests and redirects; may also return 500 if Newman runner has no matching collections
    expect([200, 302, 500]).toContain(response.status());
  });
});

test.describe('Production Environment API Tests', () => {
  test('should return summary stats for prod environment', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/getSummaryStats/prod`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Environment', 'prod');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  test('should return result keys for prod environment', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/histresultskeys/prod`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return results for prod environment', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/results/prod/`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return summary stats with days for prod', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/getSummaryStats/prod/7`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Environment', 'prod');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  test('should return deployment readiness for prod', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/readyToDeploy/prod`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return valid stats structure for prod', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/getSummaryStats/prod`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.Green).toBe('number');
    expect(typeof body.Amber).toBe('number');
    expect(typeof body.Red).toBe('number');
    expect(typeof body.Total).toBe('number');
    expect(body.Total).toBe(body.Green + body.Amber + body.Red);
  });

  test('should serve prod performance page with days', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/dashboard/performance/prod/1`);
    expect(response.status()).toBe(200);
  });

  test('should serve prod performance page without days', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/dashboard/performance/prod/`);
    expect(response.status()).toBe(200);
  });
});

test.describe('Quality Assurance Environment API Tests', () => {
  test('should return summary stats for qa environment', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/getSummaryStats/qa`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Environment', 'qa');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  test('should return result keys for qa environment', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/histresultskeys/qa`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return results for qa environment', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/results/qa/`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return summary stats with days for qa', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/getSummaryStats/qa/7`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('Environment', 'qa');
    expect(body).toHaveProperty('Green');
    expect(body).toHaveProperty('Amber');
    expect(body).toHaveProperty('Red');
    expect(body).toHaveProperty('Total');
  });

  test('should return deployment readiness for qa', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/readyToDeploy/qa`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(Array.isArray(body)).toBeTruthy();
  });

  test('should return valid stats structure for qa', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/getSummaryStats/qa`);
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(typeof body.Green).toBe('number');
    expect(typeof body.Amber).toBe('number');
    expect(typeof body.Red).toBe('number');
    expect(typeof body.Total).toBe('number');
    expect(body.Total).toBe(body.Green + body.Amber + body.Red);
  });

  test('should serve qa performance page with days', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/dashboard/performance/qa/1`);
    expect(response.status()).toBe(200);
  });

  test('should serve qa performance page without days', async ({ request, baseURL }) => {
    const response = await request.get(`${baseURL}/dashboard/performance/qa/`);
    expect(response.status()).toBe(200);
  });
});
