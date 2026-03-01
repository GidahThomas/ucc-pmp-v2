import type { Express } from 'express';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const prisma = {
  user: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  listSource: {
    findMany: vi.fn(),
  },
  street: {
    findMany: vi.fn(),
  },
} as const;

vi.mock('@ucc/db', () => ({ prisma }));

let app: Express;

function makeToken(role = 'admin', userId = 1) {
  return jwt.sign({ userId, role, privileges: ['view'] }, process.env.JWT_SECRET!);
}

function resetPrismaMocks() {
  prisma.user.findFirst.mockReset();
  prisma.user.findUnique.mockReset();
  prisma.user.update.mockReset();
  prisma.listSource.findMany.mockReset();
  prisma.street.findMany.mockReset();
}

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-secret-with-32-characters';
  process.env.CORS_ORIGIN = 'http://localhost:5173';
  process.env.UPLOAD_BASE_URL = 'http://localhost:4000';
  process.env.STORAGE_MODE = 'local';

  app = (await import('./app')).default;
});

beforeEach(() => {
  resetPrismaMocks();
});

describe('API smoke tests', () => {
  it('responds to the health check', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true });
  });

  it('rejects invalid login credentials', async () => {
    const passwordHash = await bcrypt.hash('CorrectPassword@123', 10);

    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      uuid: 'User_1',
      fullName: 'System Admin',
      email: 'admin@ucc-pmp.local',
      passwordHash,
      role: 'admin',
      status: 'active',
      privileges: ['manage'],
    });

    const response = await request(app).post('/api/auth/login').send({
      username: 'admin@ucc-pmp.local',
      password: 'WrongPassword@123',
      rememberMe: true,
    });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Incorrect username or password');
  });

  it('returns a token for a valid login', async () => {
    const passwordHash = await bcrypt.hash('Admin@123', 10);

    prisma.user.findFirst.mockResolvedValue({
      id: 1,
      uuid: 'User_1',
      fullName: 'System Admin',
      email: 'admin@ucc-pmp.local',
      passwordHash,
      role: 'admin',
      status: 'active',
      privileges: ['manage'],
    });

    const response = await request(app).post('/api/auth/login').send({
      username: 'admin@ucc-pmp.local',
      password: 'Admin@123',
      rememberMe: true,
    });

    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).toMatchObject({
      id: 1,
      email: 'admin@ucc-pmp.local',
      role: 'admin',
    });
  });

  it('requires a bearer token for profile lookup', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing Authorization header');
  });

  it('returns the current user profile for an authenticated request', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 1,
      uuid: 'User_1',
      fullName: 'System Admin',
      email: 'admin@ucc-pmp.local',
      role: 'admin',
      status: 'active',
      privileges: ['manage'],
      phone: '+255700000001',
      nationality: 'Tanzanian',
      occupation: 'Administrator',
    });

    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${makeToken('admin', 1)}`);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: 1,
      email: 'admin@ucc-pmp.local',
      fullName: 'System Admin',
    });
  });

  it('returns grouped property metadata for authenticated users', async () => {
    prisma.listSource.findMany.mockResolvedValue([
      { id: 1, category: 'Property Type', parentId: null, listName: 'Property Type' },
      { id: 2, category: 'Property Type', parentId: 1, listName: 'House' },
      { id: 3, category: 'Ownership', parentId: null, listName: 'Ownership' },
      { id: 4, category: 'Ownership', parentId: 3, listName: 'Owned' },
      { id: 5, category: 'Status', parentId: null, listName: 'Status' },
      { id: 6, category: 'Status', parentId: 5, listName: 'Available' },
      { id: 7, category: 'Usage Type', parentId: null, listName: 'Usage Type' },
      { id: 8, category: 'Usage Type', parentId: 7, listName: 'Rented' },
    ]);
    prisma.street.findMany.mockResolvedValue([{ id: 1, streetName: 'Ohio Street' }]);

    const response = await request(app)
      .get('/api/properties/metadata')
      .set('Authorization', `Bearer ${makeToken('manager', 2)}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      propertyTypes: [{ id: 2, category: 'Property Type', parentId: 1, listName: 'House' }],
      ownershipTypes: [{ id: 4, category: 'Ownership', parentId: 3, listName: 'Owned' }],
      propertyStatuses: [{ id: 6, category: 'Status', parentId: 5, listName: 'Available' }],
      usageTypes: [{ id: 8, category: 'Usage Type', parentId: 7, listName: 'Rented' }],
      streets: [{ id: 1, streetName: 'Ohio Street' }],
    });
  });

  it('blocks property creation for tenant users', async () => {
    const response = await request(app)
      .post('/api/properties')
      .set('Authorization', `Bearer ${makeToken('tenant', 3)}`);

    expect(response.status).toBe(403);
    expect(response.body.error.message).toBe('You do not have permission to perform this action');
  });
});
