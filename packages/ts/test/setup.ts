/**
 * Test setup file
 * Polyfills for Node.js environment
 */

// Polyfill crypto.getRandomValues for Node.js test environment
// Node.js 16+ has webcrypto support
if (typeof globalThis.crypto === 'undefined') {
  try {
    // Dynamic import for Node.js crypto module
    // This works in Node.js 15+ (including Node 16, 18, 20, 22)
    // Using require for better compatibility with Vite/Vitest
    const nodeCrypto = require('crypto');
    if (nodeCrypto.webcrypto) {
      (globalThis as any).crypto = nodeCrypto.webcrypto;
    }
  } catch (e) {
    // If import fails, we're likely in a browser environment or older Node.js
    // The code will fall back to other random sources in curve.ts
    console.warn('Failed to polyfill crypto.getRandomValues:', e);
  }
}
