const { test, expect } = require('@playwright/test');

test.describe('API Error Handling Tests', () => {
  
  test.describe('Path Traversal Prevention', () => {
    test('should reject path traversal in environment parameter', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/results/../../../etc/passwd/`);
      // Express resolves the path which may result in 404 or 400
      expect([400, 404]).toContain(response.status());
    });

    test('should reject path traversal with encoded characters', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/results/..%2F..%2Fetc%2Fpasswd/`);
      // May be 400 (validation) or 404 (not found)
      expect([400, 404]).toContain(response.status());
    });

    test('should reject invalid environment names', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/results/invalid_env/`);
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error', 'Invalid environment');
      expect(body).toHaveProperty('validEnvironments');
      expect(Array.isArray(body.validEnvironments)).toBe(true);
    });
  });

  test.describe('Missing Parameters', () => {
    test('should handle missing environment parameter gracefully', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/getSummaryStats/`);
      expect([400, 404]).toContain(response.status());
    });

    test('should handle missing key parameter in getStats', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/getStats/test/`);
      expect([400, 404]).toContain(response.status());
    });
  });

  test.describe('Non-existent Resources', () => {
    test('should return 404 for non-existent endpoint', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/nonexistent/endpoint`);
      expect(response.status()).toBe(404);
    });

    test('should handle non-existent result keys gracefully', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/getStats/test/nonexistent_key_12345`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      // Should return empty stats
      expect(body).toHaveProperty('Total', 0);
    });
  });

  test.describe('Invalid Data Types', () => {
    test('should handle non-numeric days parameter', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/getSummaryStats/test/invalid`);
      expect(response.status()).toBe(200);
      // Should still work as it tries to parse
    });

    test('should handle negative days parameter', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/getSummaryStats/test/-5`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('Total');
    });
  });

  test.describe('Configuration API', () => {
    test('should return valid configuration structure', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/config`);
      expect(response.status()).toBe(200);
      const config = await response.json();
      
      // Verify required config properties
      expect(config).toHaveProperty('page_title');
      expect(config).toHaveProperty('refresh');
      expect(config).toHaveProperty('environments');
      expect(Array.isArray(config.environments)).toBe(true);
      
      // Verify environment structure
      if (config.environments.length > 0) {
        const env = config.environments[0];
        expect(env).toHaveProperty('id');
        expect(env).toHaveProperty('name');
        expect(env).toHaveProperty('displayName');
      }
    });

    test('should handle API config endpoint', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/api/config`);
      expect(response.status()).toBe(200);
      const config = await response.json();
      expect(config).toHaveProperty('web');
      expect(config).toHaveProperty('environments');
    });
  });

  test.describe('Deployment Readiness API', () => {
    test('should return deployment readiness for valid environment', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/readyToDeploy/test`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test('should reject invalid environment in deployment check', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/readyToDeploy/invalid_env`);
      expect(response.status()).toBe(400);
      const body = await response.json();
      expect(body).toHaveProperty('error');
    });

    test('should return deployment readiness for specific key', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/readyToDeploy/test/starwars`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });
  });

  test.describe('Historical Data API', () => {
    test('should handle "All" as days parameter', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/histresultsdays/test/starwars/All`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test('should return empty array for future dates', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/getSummaryStats/test/0`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('Total');
      expect(body.Total).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Rate Limiting & Performance', () => {
    test('should handle multiple rapid requests', async ({ request, baseURL }) => {
      const requests = Array(5).fill(null).map(() => 
        request.get(`${baseURL}/config`)
      );
      
      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status()).toBe(200);
      });
    });

    test('should handle large days parameter', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/getSummaryStats/test/999999`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body).toHaveProperty('Total');
    });
  });

  test.describe('Data Validation', () => {
    test('should return consistent data structure across endpoints', async ({ request, baseURL }) => {
      const summaryResponse = await request.get(`${baseURL}/getSummaryStats/test`);
      const summaryWithDaysResponse = await request.get(`${baseURL}/getSummaryStats/test/7`);
      
      expect(summaryResponse.status()).toBe(200);
      expect(summaryWithDaysResponse.status()).toBe(200);
      
      const summary = await summaryResponse.json();
      const summaryWithDays = await summaryWithDaysResponse.json();
      
      // Both should have same structure
      expect(Object.keys(summary).sort()).toEqual(Object.keys(summaryWithDays).sort());
    });

    test('should return valid stats structure', async ({ request, baseURL }) => {
      const response = await request.get(`${baseURL}/getSummaryStats/test`);
      expect(response.status()).toBe(200);
      const body = await response.json();
      
      // Verify all stats are numbers
      expect(typeof body.Green).toBe('number');
      expect(typeof body.Amber).toBe('number');
      expect(typeof body.Red).toBe('number');
      expect(typeof body.Total).toBe('number');
      
      // Verify math is correct
      expect(body.Total).toBe(body.Green + body.Amber + body.Red);
    });
  });

  test.describe('Environment-specific Tests', () => {
    const environments = ['dev', 'test', 'staging'];

    environments.forEach(env => {
      test(`should handle results endpoint for ${env}`, async ({ request, baseURL }) => {
        const response = await request.get(`${baseURL}/results/${env}/`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
      });

      test(`should handle histresultskeys endpoint for ${env}`, async ({ request, baseURL }) => {
        const response = await request.get(`${baseURL}/histresultskeys/${env}`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(Array.isArray(body)).toBe(true);
      });

      test(`should handle getSummaryStats for ${env}`, async ({ request, baseURL }) => {
        const response = await request.get(`${baseURL}/getSummaryStats/${env}`);
        expect(response.status()).toBe(200);
        const body = await response.json();
        expect(body).toHaveProperty('Environment', env);
      });
    });
  });
});
