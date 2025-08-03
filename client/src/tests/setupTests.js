import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { TextEncoder, TextDecoder } from 'util';

// Mock global objects
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Configure test behavior
configure({
  testIdAttribute: 'data-testid',
});

// Mock socket.io
jest.mock('../services/socketService', () => ({
  on: jest.fn(),
  emit: jest.fn(),
  off: jest.fn(),
}));

// Mock API calls
jest.mock('../services/api', () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
}));
