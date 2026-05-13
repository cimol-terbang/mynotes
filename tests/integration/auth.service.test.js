import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import bcrypt from 'bcryptjs';
import { authService } from '../../src/lib/server/auth.service.js';
import { AdminUser } from '../../src/lib/server/models/AdminUser.js';

let mongod;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  // Create a test admin user
  const passwordHash = await bcrypt.hash('testpassword', 10);
  await AdminUser.create({ username: 'testadmin', passwordHash });
});

describe('AuthService', () => {
  it('verifyCredentials returns true for valid credentials', async () => {
    const result = await authService.verifyCredentials('testadmin', 'testpassword');
    expect(result).toBe(true);
  });

  it('verifyCredentials returns false for wrong password', async () => {
    const result = await authService.verifyCredentials('testadmin', 'wrongpassword');
    expect(result).toBe(false);
  });

  it('verifyCredentials returns false for non-existent user', async () => {
    const result = await authService.verifyCredentials('nobody', 'password');
    expect(result).toBe(false);
  });

  it('validateSession returns false for null/undefined sessionId', async () => {
    expect(await authService.validateSession(null)).toBe(false);
    expect(await authService.validateSession(undefined)).toBe(false);
  });

  it('validateSession returns false for non-existent session', async () => {
    const result = await authService.validateSession('non-existent-session-id');
    expect(result).toBe(false);
  });

  it('createSession and validateSession work together', async () => {
    let capturedSessionId;
    const mockEvent = {
      cookies: {
        set: (name, value) => { capturedSessionId = value; },
        get: (name) => capturedSessionId,
        delete: () => {}
      }
    };

    await authService.createSession(mockEvent);
    expect(capturedSessionId).toBeTruthy();

    const valid = await authService.validateSession(capturedSessionId);
    expect(valid).toBe(true);
  });

  it('destroySession invalidates the session', async () => {
    let capturedSessionId;
    const mockEvent = {
      cookies: {
        set: (name, value) => { capturedSessionId = value; },
        get: (name) => capturedSessionId,
        delete: () => {}
      }
    };

    await authService.createSession(mockEvent);
    await authService.destroySession(mockEvent);

    const valid = await authService.validateSession(capturedSessionId);
    expect(valid).toBe(false);
  });
});
