const { test, expect } = require('@playwright/test');

// Unit-style tests for functions.js business logic
// We import the module directly since these are pure functions
const fn = require('../functions');

test.describe('functions.js Unit Tests', () => {

  test.describe('calculatePercentage', () => {
    test('should calculate percentage correctly', () => {
      expect(fn.calculatePercentage(50, 100)).toBe(50);
      expect(fn.calculatePercentage(1, 4)).toBe(25);
      expect(fn.calculatePercentage(0, 100)).toBe(0);
      expect(fn.calculatePercentage(100, 100)).toBe(100);
    });

    test('should handle edge case of zero total', () => {
      const result = fn.calculatePercentage(0, 0);
      expect(result).toBeNaN();
    });
  });

  test.describe('RAG', () => {
    test('should return Green for 100%', () => {
      expect(fn.RAG(100)).toBe('Green');
    });

    test('should return Amber for values between 90-99', () => {
      expect(fn.RAG(95)).toBe('Amber');
      expect(fn.RAG(90)).toBe('Amber');
    });

    test('should return Red for values below 90', () => {
      expect(fn.RAG(89)).toBe('Red');
      expect(fn.RAG(0)).toBe('Red');
      expect(fn.RAG(50)).toBe('Red');
    });
  });

  test.describe('calculateStatusCounts', () => {
    test('should count Green, Amber, Red correctly', () => {
      const results = [
        { value: 'Green' },
        { value: 'Green' },
        { value: 'Amber' },
        { value: 'Red' },
      ];
      const counts = fn.calculateStatusCounts(results);
      expect(counts).toEqual({ Green: 2, Amber: 1, Red: 1, Total: 4 });
    });

    test('should return zeros for empty array', () => {
      const counts = fn.calculateStatusCounts([]);
      expect(counts).toEqual({ Green: 0, Amber: 0, Red: 0, Total: 0 });
    });

    test('should return zeros for non-array input', () => {
      expect(fn.calculateStatusCounts(null)).toEqual({ Green: 0, Amber: 0, Red: 0, Total: 0 });
      expect(fn.calculateStatusCounts(undefined)).toEqual({ Green: 0, Amber: 0, Red: 0, Total: 0 });
      expect(fn.calculateStatusCounts('string')).toEqual({ Green: 0, Amber: 0, Red: 0, Total: 0 });
    });

    test('should count unknown values as Red', () => {
      const results = [{ value: 'Unknown' }, { value: 'Blue' }];
      const counts = fn.calculateStatusCounts(results);
      expect(counts).toEqual({ Green: 0, Amber: 0, Red: 2, Total: 2 });
    });

    test('should ensure Total equals Green + Amber + Red', () => {
      const results = [
        { value: 'Green' },
        { value: 'Green' },
        { value: 'Amber' },
        { value: 'Red' },
        { value: 'Red' },
        { value: 'Red' },
      ];
      const counts = fn.calculateStatusCounts(results);
      expect(counts.Total).toBe(counts.Green + counts.Amber + counts.Red);
    });
  });

  test.describe('CreateJsonObjectForResults', () => {
    test('should wrap object in array and stringify', () => {
      const obj = { key: 'test', value: 'Green' };
      const result = fn.CreateJsonObjectForResults(obj);
      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(1);
      expect(parsed[0]).toEqual(obj);
    });
  });

  test.describe('getHistFileName', () => {
    test('should compose history filename correctly', () => {
      const result = fn.getHistFileName('test');
      expect(result).toBe('hist_testresults');
    });

    test('should work for different environments', () => {
      expect(fn.getHistFileName('dev')).toBe('hist_devresults');
      expect(fn.getHistFileName('prod')).toBe('hist_prodresults');
    });
  });

  test.describe('getResultFileName', () => {
    test('should compose result filename correctly', () => {
      expect(fn.getResultFileName('test')).toBe('testresults');
      expect(fn.getResultFileName('dev')).toBe('devresults');
    });
  });

  test.describe('myDateTime', () => {
    test('should return a non-empty string', () => {
      const result = fn.myDateTime();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
