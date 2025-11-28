/**
 * Vitest Global Setup
 * 
 * This file runs before all tests and sets up the test environment.
 */

import { vi } from 'vitest';

// ============================================================================
// MOCK BROWSER APIS
// ============================================================================

// Mock localStorage
const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = String(value); },
        removeItem: (key) => { delete store[key]; },
        clear: () => { store = {}; },
        get length() { return Object.keys(store).length; },
        key: (index) => Object.keys(store)[index] || null
    };
})();

Object.defineProperty(global, 'localStorage', {
    value: localStorageMock
});

// Mock console methods to suppress noise (optional)
// Uncomment to silence console output during tests
// vi.spyOn(console, 'log').mockImplementation(() => {});
// vi.spyOn(console, 'warn').mockImplementation(() => {});

// ============================================================================
// GLOBAL TEST UTILITIES
// ============================================================================

/**
 * Reset localStorage between tests
 */
global.resetLocalStorage = () => {
    localStorage.clear();
};

/**
 * Create ISO timestamp for testing
 */
global.createTimestamp = () => new Date().toISOString();

/**
 * Wait for a condition to be true
 */
global.waitFor = async (condition, timeout = 5000) => {
    const start = Date.now();
    while (!condition()) {
        if (Date.now() - start > timeout) {
            throw new Error('waitFor timeout');
        }
        await new Promise(r => setTimeout(r, 50));
    }
};

// ============================================================================
// CLEANUP
// ============================================================================

// Reset state after each test
afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
});
