const { test, expect } = require('@playwright/test');
const path = require('path');

// Import runner modules directly for unit testing
const { getRunner, listRunners, register } = require('../runners');
const newmanAdapter = require('../runners/newman');
const brunoAdapter = require('../runners/bruno');
const playwrightAdapter = require('../runners/playwright');

// ─── Runner Registry Tests ──────────────────────────────────────────────────

test.describe('Runner Registry', () => {
    test('should list all built-in runners', () => {
        const runners = listRunners();
        expect(runners).toContain('newman');
        expect(runners).toContain('bruno');
        expect(runners).toContain('playwright');
    });

    test('should return newman adapter by name', () => {
        const runner = getRunner('newman');
        expect(typeof runner.run).toBe('function');
    });

    test('should return bruno adapter by name', () => {
        const runner = getRunner('bruno');
        expect(typeof runner.run).toBe('function');
    });

    test('should return playwright adapter by name', () => {
        const runner = getRunner('playwright');
        expect(typeof runner.run).toBe('function');
    });

    test('should be case-insensitive', () => {
        expect(getRunner('Newman')).toBe(getRunner('newman'));
        expect(getRunner('BRUNO')).toBe(getRunner('bruno'));
        expect(getRunner('Playwright')).toBe(getRunner('playwright'));
    });

    test('should throw for unknown runner', () => {
        expect(() => getRunner('nonexistent')).toThrow(/Unknown test runner/);
    });

    test('should throw for runner without run method', () => {
        expect(() => register('bad', {})).toThrow(/must have a run\(\) method/);
        expect(() => register('bad', { run: 'not a function' })).toThrow(/must have a run\(\) method/);
    });

    test('should allow registering a custom runner', () => {
        const customRunner = {
            run: async () => ({
                passed: true, totalTests: 1, failedTests: 0,
                avgResponseTime: 0, executionNames: ['custom'], rawResult: {}
            })
        };
        register('custom-test', customRunner);
        expect(getRunner('custom-test')).toBe(customRunner);
        expect(listRunners()).toContain('custom-test');
    });
});

// ─── Newman Adapter Tests ───────────────────────────────────────────────────

test.describe('Newman Adapter', () => {
    test('should have a run method', () => {
        expect(typeof newmanAdapter.run).toBe('function');
    });

    test('should run a real Postman collection and return standardized result', async () => {
        test.setTimeout(30000);
        const collectionPath = path.resolve(__dirname, 'postman', 'collections', 'dashboard.json');
        const envPath = path.resolve(__dirname, 'postman', 'environments', 'envstatus_dev.json');

        const result = await newmanAdapter.run({
            script: collectionPath,
            environment: envPath
        });

        // Validate result shape
        expect(typeof result.passed).toBe('boolean');
        expect(typeof result.totalTests).toBe('number');
        expect(typeof result.failedTests).toBe('number');
        expect(typeof result.avgResponseTime).toBe('number');
        expect(Array.isArray(result.executionNames)).toBe(true);
        expect(result.rawResult).toBeDefined();

        // Validate values are sensible
        expect(result.totalTests).toBeGreaterThan(0);
        expect(result.failedTests).toBeGreaterThanOrEqual(0);
        expect(result.failedTests).toBeLessThanOrEqual(result.totalTests);
        expect(result.executionNames.length).toBeGreaterThan(0);
    });

    test('should report passed=true when all assertions pass', async () => {
        test.setTimeout(30000);
        const collectionPath = path.resolve(__dirname, 'postman', 'collections', 'dashboard.json');
        const envPath = path.resolve(__dirname, 'postman', 'environments', 'envstatus_dev.json');

        const result = await newmanAdapter.run({
            script: collectionPath,
            environment: envPath
        });

        if (result.failedTests === 0) {
            expect(result.passed).toBe(true);
        } else {
            expect(result.passed).toBe(false);
        }
    });

    test('should reject with error for invalid collection', async () => {
        await expect(newmanAdapter.run({
            script: '/nonexistent/collection.json'
        })).rejects.toThrow();
    });

    test('should work without environment or datafile', async () => {
        test.setTimeout(30000);
        const collectionPath = path.resolve(__dirname, 'postman', 'collections', 'dashboard.json');

        // Should not throw even without environment
        const result = await newmanAdapter.run({
            script: collectionPath
        });

        expect(typeof result.passed).toBe('boolean');
        expect(typeof result.totalTests).toBe('number');
    });
});

// ─── Bruno Adapter Tests ────────────────────────────────────────────────────

test.describe('Bruno Adapter', () => {
    test('should have a run method', () => {
        expect(typeof brunoAdapter.run).toBe('function');
    });

    test.describe('parseBrunoOutput', () => {
        const { parseBrunoOutput } = brunoAdapter;

        test('should parse passing test output', () => {
            const stdout = [
                'Running Request',
                '✓ Get Users (200 OK)',
                '✓ Get Products (200 OK)',
                ''
            ].join('\n');

            const result = parseBrunoOutput(stdout, null);
            expect(result.passed).toBe(true);
            expect(result.totalTests).toBe(2);
            expect(result.failedTests).toBe(0);
            expect(result.executionNames).toEqual([
                'Get Users (200 OK)',
                'Get Products (200 OK)'
            ]);
        });

        test('should parse failing test output', () => {
            const stdout = [
                '✓ Get Users (200 OK)',
                '✗ Create User (500 Internal Server Error)',
                '✓ Delete User (204 No Content)',
                ''
            ].join('\n');

            const result = parseBrunoOutput(stdout, null);
            expect(result.passed).toBe(false);
            expect(result.totalTests).toBe(3);
            expect(result.failedTests).toBe(1);
            expect(result.executionNames).toHaveLength(3);
        });

        test('should parse summary line when present', () => {
            const stdout = [
                '✓ Test 1',
                '✗ Test 2',
                '',
                'Tests:    4 passed, 2 failed, 6 total',
                ''
            ].join('\n');

            const result = parseBrunoOutput(stdout, null);
            // Summary line overrides individual counts
            expect(result.totalTests).toBe(6);
            expect(result.failedTests).toBe(2);
            expect(result.passed).toBe(false);
        });

        test('should handle empty output with no error', () => {
            const result = parseBrunoOutput('', null);
            expect(result.passed).toBe(true);
            expect(result.totalTests).toBe(0);
            expect(result.failedTests).toBe(0);
            expect(result.executionNames).toEqual([]);
        });

        test('should handle empty output with error', () => {
            const result = parseBrunoOutput('', { code: 1 });
            expect(result.passed).toBe(false);
            expect(result.totalTests).toBe(1);
            expect(result.failedTests).toBe(1);
            expect(result.executionNames).toEqual(['Bruno execution error']);
        });

        test('should handle all tests failing', () => {
            const stdout = [
                '✗ Login (401 Unauthorized)',
                '✗ Get Profile (403 Forbidden)',
                ''
            ].join('\n');

            const result = parseBrunoOutput(stdout, null);
            expect(result.passed).toBe(false);
            expect(result.totalTests).toBe(2);
            expect(result.failedTests).toBe(2);
        });

        test('should return correct rawResult structure', () => {
            const stdout = '✓ Test 1\n';
            const result = parseBrunoOutput(stdout, null);
            expect(result.rawResult).toHaveProperty('stdout', stdout);
            expect(result.rawResult).toHaveProperty('exitCode', 0);
        });

        test('should set exitCode from error', () => {
            const stdout = '✓ Test 1\n';
            const result = parseBrunoOutput(stdout, { code: 1 });
            expect(result.rawResult.exitCode).toBe(1);
        });
    });
});

// ─── Playwright Adapter Tests ───────────────────────────────────────────────

test.describe('Playwright Adapter', () => {
    test('should have a run method', () => {
        expect(typeof playwrightAdapter.run).toBe('function');
    });

    test.describe('parsePlaywrightOutput', () => {
        const { parsePlaywrightOutput } = playwrightAdapter;

        test('should parse JSON report with all passing tests', () => {
            const report = {
                suites: [{
                    specs: [
                        {
                            title: 'should load homepage',
                            tests: [{ results: [{ status: 'passed' }] }]
                        },
                        {
                            title: 'should show title',
                            tests: [{ results: [{ status: 'passed' }] }]
                        }
                    ]
                }]
            };

            const result = parsePlaywrightOutput(JSON.stringify(report), null, Date.now() - 1000);
            expect(result.passed).toBe(true);
            expect(result.totalTests).toBe(2);
            expect(result.failedTests).toBe(0);
            expect(result.executionNames).toEqual(['should load homepage', 'should show title']);
        });

        test('should parse JSON report with failing tests', () => {
            const report = {
                suites: [{
                    specs: [
                        {
                            title: 'passing test',
                            tests: [{ results: [{ status: 'passed' }] }]
                        },
                        {
                            title: 'failing test',
                            tests: [{ results: [{ status: 'failed' }] }]
                        }
                    ]
                }]
            };

            const result = parsePlaywrightOutput(JSON.stringify(report), null, Date.now() - 2000);
            expect(result.passed).toBe(false);
            expect(result.totalTests).toBe(2);
            expect(result.failedTests).toBe(1);
            expect(result.executionNames).toContain('failing test');
        });

        test('should handle timedOut status as failure', () => {
            const report = {
                suites: [{
                    specs: [{
                        title: 'slow test',
                        tests: [{ results: [{ status: 'timedOut' }] }]
                    }]
                }]
            };

            const result = parsePlaywrightOutput(JSON.stringify(report), null, Date.now());
            expect(result.passed).toBe(false);
            expect(result.failedTests).toBe(1);
        });

        test('should handle nested suites', () => {
            const report = {
                suites: [{
                    specs: [{
                        title: 'parent test',
                        tests: [{ results: [{ status: 'passed' }] }]
                    }],
                    suites: [{
                        specs: [{
                            title: 'nested test',
                            tests: [{ results: [{ status: 'passed' }] }]
                        }]
                    }]
                }]
            };

            const result = parsePlaywrightOutput(JSON.stringify(report), null, Date.now());
            expect(result.totalTests).toBe(2);
            expect(result.executionNames).toContain('parent test');
            expect(result.executionNames).toContain('nested test');
        });

        test('should handle empty suites', () => {
            const report = { suites: [] };
            const result = parsePlaywrightOutput(JSON.stringify(report), null, Date.now());
            expect(result.passed).toBe(true);
            expect(result.totalTests).toBe(0);
            expect(result.failedTests).toBe(0);
        });

        test('should handle invalid JSON with error', () => {
            const result = parsePlaywrightOutput('not json', { code: 1 }, Date.now());
            expect(result.passed).toBe(false);
            expect(result.totalTests).toBe(1);
            expect(result.failedTests).toBe(1);
            expect(result.executionNames).toEqual(['Playwright execution error']);
        });

        test('should handle invalid JSON without error', () => {
            const result = parsePlaywrightOutput('not json', null, Date.now());
            expect(result.passed).toBe(true);
            expect(result.totalTests).toBe(0);
            expect(result.failedTests).toBe(0);
        });

        test('should calculate average response time', () => {
            const report = {
                suites: [{
                    specs: [
                        { title: 'test1', tests: [{ results: [{ status: 'passed' }] }] },
                        { title: 'test2', tests: [{ results: [{ status: 'passed' }] }] }
                    ]
                }]
            };

            const startTime = Date.now() - 2000; // 2 seconds ago
            const result = parsePlaywrightOutput(JSON.stringify(report), null, startTime);
            expect(result.avgResponseTime).toBeGreaterThan(0);
            // With 2 tests over ~2 seconds, avg should be ~1000ms
            expect(result.avgResponseTime).toBeGreaterThanOrEqual(500);
        });

        test('should use last result status when multiple retries', () => {
            const report = {
                suites: [{
                    specs: [{
                        title: 'retried test',
                        tests: [{
                            results: [
                                { status: 'failed' },
                                { status: 'passed' }
                            ]
                        }]
                    }]
                }]
            };

            const result = parsePlaywrightOutput(JSON.stringify(report), null, Date.now());
            // Last result is 'passed', so should count as passed
            expect(result.passed).toBe(true);
            expect(result.failedTests).toBe(0);
        });

        test('should handle test with no results as failed', () => {
            const report = {
                suites: [{
                    specs: [{
                        title: 'no results test',
                        tests: [{ results: [] }]
                    }]
                }]
            };

            const result = parsePlaywrightOutput(JSON.stringify(report), null, Date.now());
            expect(result.failedTests).toBe(1);
        });
    });

    test.describe('flattenTests', () => {
        const { flattenTests } = playwrightAdapter;

        test('should flatten simple suite', () => {
            const suites = [{
                specs: [{
                    title: 'test1',
                    tests: [{ results: [{ status: 'passed' }] }]
                }]
            }];

            const tests = flattenTests(suites);
            expect(tests).toHaveLength(1);
            expect(tests[0].title).toBe('test1');
            expect(tests[0].status).toBe('passed');
        });

        test('should flatten deeply nested suites', () => {
            const suites = [{
                specs: [{ title: 'a', tests: [{ results: [{ status: 'passed' }] }] }],
                suites: [{
                    specs: [{ title: 'b', tests: [{ results: [{ status: 'failed' }] }] }],
                    suites: [{
                        specs: [{ title: 'c', tests: [{ results: [{ status: 'passed' }] }] }]
                    }]
                }]
            }];

            const tests = flattenTests(suites);
            expect(tests).toHaveLength(3);
            expect(tests.map(t => t.title)).toEqual(['a', 'b', 'c']);
            expect(tests[1].status).toBe('failed');
        });

        test('should handle empty suites array', () => {
            expect(flattenTests([])).toEqual([]);
        });

        test('should handle suite with no specs', () => {
            const suites = [{ specs: [] }];
            expect(flattenTests(suites)).toEqual([]);
        });
    });
});

// ─── Cross-Runner Result Shape Tests ────────────────────────────────────────

test.describe('Result Shape Consistency', () => {
    const requiredFields = ['passed', 'totalTests', 'failedTests', 'avgResponseTime', 'executionNames', 'rawResult'];

    test('Bruno parseBrunoOutput returns correct shape', () => {
        const result = brunoAdapter.parseBrunoOutput('✓ Test\n', null);
        for (const field of requiredFields) {
            expect(result).toHaveProperty(field);
        }
        expect(typeof result.passed).toBe('boolean');
        expect(typeof result.totalTests).toBe('number');
        expect(typeof result.failedTests).toBe('number');
        expect(typeof result.avgResponseTime).toBe('number');
        expect(Array.isArray(result.executionNames)).toBe(true);
    });

    test('Playwright parsePlaywrightOutput returns correct shape', () => {
        const report = { suites: [{ specs: [{ title: 't', tests: [{ results: [{ status: 'passed' }] }] }] }] };
        const result = playwrightAdapter.parsePlaywrightOutput(JSON.stringify(report), null, Date.now());
        for (const field of requiredFields) {
            expect(result).toHaveProperty(field);
        }
        expect(typeof result.passed).toBe('boolean');
        expect(typeof result.totalTests).toBe('number');
        expect(typeof result.failedTests).toBe('number');
        expect(typeof result.avgResponseTime).toBe('number');
        expect(Array.isArray(result.executionNames)).toBe(true);
    });

    test('Newman adapter returns correct shape from real run', async () => {
        test.setTimeout(30000);
        const collectionPath = path.resolve(__dirname, 'postman', 'collections', 'dashboard.json');
        const envPath = path.resolve(__dirname, 'postman', 'environments', 'envstatus_dev.json');

        const result = await newmanAdapter.run({ script: collectionPath, environment: envPath });
        for (const field of requiredFields) {
            expect(result).toHaveProperty(field);
        }
        expect(typeof result.passed).toBe('boolean');
        expect(typeof result.totalTests).toBe('number');
        expect(typeof result.failedTests).toBe('number');
        expect(typeof result.avgResponseTime).toBe('number');
        expect(Array.isArray(result.executionNames)).toBe(true);
    });
});
