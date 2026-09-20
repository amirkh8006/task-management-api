import { type INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { MongoMemoryServer } from 'mongodb-memory-server';
import type { Model } from 'mongoose';
import { existsSync } from 'node:fs';
import type { Server } from 'node:http';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/enums/user-role.enum';
import { configureApp } from '../src/configure-app';
import { Task } from '../src/tasks/schemas/task.schema';
import { User } from '../src/users/schemas/user.schema';

interface AccessTokenResponse {
  accessToken: string;
}

interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
}

interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  user: string;
}

interface PaginatedTaskResponse {
  data: TaskResponse[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ErrorResponse {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
}

describe('Task Management API (e2e)', () => {
  const password = 'password123';
  const originalEnvironment = {
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
    JWT_SECRET: process.env.JWT_SECRET,
    MONGODB_URI: process.env.MONGODB_URI,
    MONGOMS_SYSTEM_BINARY_VERSION_CHECK:
      process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK,
    PORT: process.env.PORT,
  };
  let app: INestApplication;
  let server: Server;
  let mongoServer: MongoMemoryServer;
  let taskModel: Model<Task>;
  let userModel: Model<User>;
  let jwtService: JwtService;

  beforeAll(async () => {
    const localMongoBinary = [
      process.env.MONGOMS_SYSTEM_BINARY,
      '/opt/homebrew/bin/mongod',
      '/usr/local/bin/mongod',
    ].find((path): path is string => path !== undefined && existsSync(path));
    if (localMongoBinary !== undefined) {
      process.env.MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false';
    }
    mongoServer = await MongoMemoryServer.create({
      binary:
        localMongoBinary === undefined
          ? { version: '8.0.15' }
          : { systemBinary: localMongoBinary },
    });
    process.env.MONGODB_URI = mongoServer.getUri('task-management-test');
    process.env.JWT_SECRET = 'test-only-secret-that-is-at-least-32-characters';
    process.env.JWT_EXPIRES_IN = '1h';
    process.env.PORT = '0';

    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    configureApp(app);
    await app.init();

    server = app.getHttpServer() as Server;
    taskModel = app.get<Model<Task>>(getModelToken(Task.name));
    userModel = app.get<Model<User>>(getModelToken(User.name));
    jwtService = app.get(JwtService);
    await Promise.all([taskModel.syncIndexes(), userModel.syncIndexes()]);
  });

  beforeEach(async () => {
    await Promise.all([taskModel.deleteMany({}), userModel.deleteMany({})]);
  });

  afterAll(async () => {
    if (app !== undefined) {
      await app.close();
    }
    if (mongoServer !== undefined) {
      await mongoServer.stop();
    }
    restoreEnvironment('MONGODB_URI', originalEnvironment.MONGODB_URI);
    restoreEnvironment(
      'MONGOMS_SYSTEM_BINARY_VERSION_CHECK',
      originalEnvironment.MONGOMS_SYSTEM_BINARY_VERSION_CHECK,
    );
    restoreEnvironment('JWT_SECRET', originalEnvironment.JWT_SECRET);
    restoreEnvironment('JWT_EXPIRES_IN', originalEnvironment.JWT_EXPIRES_IN);
    restoreEnvironment('PORT', originalEnvironment.PORT);
  });

  async function register(email: string, name = 'Test User'): Promise<string> {
    const response = await request(server)
      .post('/auth/register')
      .send({ name, email, password })
      .expect(201);
    const body = response.body as AccessTokenResponse;

    expect(body.accessToken).toEqual(expect.any(String));
    return body.accessToken;
  }

  async function currentUser(token: string): Promise<UserResponse> {
    const response = await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    return response.body as UserResponse;
  }

  async function createTask(
    token: string,
    input: Record<string, unknown>,
  ): Promise<TaskResponse> {
    const response = await request(server)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send(input)
      .expect(201);

    return response.body as TaskResponse;
  }

  async function promoteAndLogin(email: string): Promise<string> {
    await userModel.updateOne({ email }, { $set: { role: UserRole.Admin } });
    const response = await request(server)
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

    return (response.body as AccessTokenResponse).accessToken;
  }

  it('registers a user, hashes the password, and never returns it', async () => {
    const token = await register('person@example.com', 'Person One');
    const user = await currentUser(token);
    const storedUser = await userModel
      .findOne({ email: 'person@example.com' })
      .select('+password')
      .exec();

    expect(user).toMatchObject({
      name: 'Person One',
      email: 'person@example.com',
      role: UserRole.User,
    });
    expect(user).not.toHaveProperty('password');
    expect(storedUser).not.toBeNull();
    expect(storedUser?.password).not.toBe(password);
    await expect(
      bcrypt.compare(password, storedUser?.password ?? ''),
    ).resolves.toBe(true);
  });

  it('rejects duplicate normalized email registration', async () => {
    await register('duplicate@example.com');
    const response = await request(server)
      .post('/auth/register')
      .send({
        name: 'Duplicate User',
        email: ' DUPLICATE@example.com ',
        password,
      })
      .expect(409);
    const body = response.body as ErrorResponse;

    expect(body).toMatchObject({
      statusCode: 409,
      error: 'Conflict',
      message: 'An account with this email address already exists',
      path: '/auth/register',
    });
  });

  it('logs in with valid credentials and rejects invalid credentials', async () => {
    await register('login@example.com');

    const validResponse = await request(server)
      .post('/auth/login')
      .send({ email: 'LOGIN@example.com', password })
      .expect(200);
    expect((validResponse.body as AccessTokenResponse).accessToken).toEqual(
      expect.any(String),
    );

    const invalidResponse = await request(server)
      .post('/auth/login')
      .send({ email: 'login@example.com', password: 'wrong-password' })
      .expect(401);
    expect(invalidResponse.body as ErrorResponse).toMatchObject({
      statusCode: 401,
      error: 'Unauthorized',
      message: 'Invalid email or password',
    });
  });

  it('accepts valid JWTs and rejects missing, invalid, and expired JWTs', async () => {
    const token = await register('jwt@example.com');
    const user = await currentUser(token);

    await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body as UserResponse).not.toHaveProperty('password');
      });
    await request(server).get('/auth/me').expect(401);
    await request(server)
      .get('/auth/me')
      .set('Authorization', 'Bearer not-a-jwt')
      .expect(401);

    const expiredToken = await jwtService.signAsync(
      { sub: user.id, role: UserRole.User },
      { expiresIn: -1 },
    );
    await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('supports owner task CRUD and keeps task listings owner-scoped', async () => {
    const ownerToken = await register('owner@example.com', 'Owner');
    const otherToken = await register('other@example.com', 'Other');
    const owner = await currentUser(ownerToken);
    const task = await createTask(ownerToken, {
      title: 'Owner task',
      description: 'Private details',
      status: 'pending',
      priority: 'high',
    });
    await createTask(otherToken, { title: 'Other private task' });

    expect(task).toMatchObject({
      title: 'Owner task',
      user: owner.id,
      status: 'pending',
      priority: 'high',
    });

    const listResponse = await request(server)
      .get('/tasks')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const list = listResponse.body as PaginatedTaskResponse;
    expect(list).toMatchObject({ page: 1, limit: 10, total: 1, totalPages: 1 });
    expect(list.data.map(({ id }) => id)).toEqual([task.id]);

    await request(server)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body as TaskResponse).toMatchObject({ id: task.id });
      });

    await request(server)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({ title: 'Updated owner task', status: 'completed' })
      .expect(200)
      .expect(({ body }) => {
        expect(body as TaskResponse).toMatchObject({
          id: task.id,
          title: 'Updated owner task',
          status: 'completed',
        });
      });

    await request(server)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(204);
    await request(server)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(404);
  });

  it('denies cross-user task reads, updates, and deletes without revealing existence', async () => {
    const ownerToken = await register('task-owner@example.com');
    const attackerToken = await register('attacker@example.com');
    const task = await createTask(ownerToken, { title: 'Secret task' });

    await request(server)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .expect(404);
    await request(server)
      .patch(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .send({ title: 'Stolen task' })
      .expect(404);
    await request(server)
      .delete(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${attackerToken}`)
      .expect(404);

    await request(server)
      .get(`/tasks/${task.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body as TaskResponse).toMatchObject({ title: 'Secret task' });
      });
  });

  it('distinguishes unauthenticated admin access from forbidden user access', async () => {
    const userToken = await register('normal-user@example.com');

    await request(server).get('/users').expect(401);
    await request(server).get('/admin/tasks').expect(401);
    await request(server)
      .get('/users')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
    await request(server)
      .get('/admin/tasks')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('allows admins to view users and all tasks, and delete tasks and users', async () => {
    await register('admin@example.com', 'Admin');
    const adminToken = await promoteAndLogin('admin@example.com');
    const firstUserToken = await register(
      'first-user@example.com',
      'First User',
    );
    const secondUserToken = await register(
      'second-user@example.com',
      'Second User',
    );
    const firstUser = await currentUser(firstUserToken);
    const firstTask = await createTask(firstUserToken, {
      title: 'First user task',
    });
    await createTask(secondUserToken, { title: 'Second user task' });

    const usersResponse = await request(server)
      .get('/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const users = usersResponse.body as UserResponse[];
    expect(users).toHaveLength(3);
    expect(users.every((user) => user.password === undefined)).toBe(true);

    const tasksResponse = await request(server)
      .get('/admin/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(tasksResponse.body as PaginatedTaskResponse).toMatchObject({
      total: 2,
      totalPages: 1,
    });

    await request(server)
      .delete(`/admin/tasks/${firstTask.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    await request(server)
      .get(`/tasks/${firstTask.id}`)
      .set('Authorization', `Bearer ${firstUserToken}`)
      .expect(404);

    const secondUser = await currentUser(secondUserToken);
    await request(server)
      .delete(`/users/${secondUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
    expect(await taskModel.countDocuments({ user: secondUser.id })).toBe(0);
    await request(server)
      .get('/auth/me')
      .set('Authorization', `Bearer ${secondUserToken}`)
      .expect(401);

    await request(server)
      .get(`/users/${firstUser.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body as UserResponse).not.toHaveProperty('password');
      });
  });

  it('returns consistent validation errors for invalid DTO and query input', async () => {
    const token = await register('validation@example.com');
    const response = await request(server)
      .post('/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: ' ', status: 'invalid', owner: 'injected' })
      .expect(400);
    const body = response.body as ErrorResponse;

    expect(body.statusCode).toBe(400);
    expect(body.error).toBe('Bad Request');
    expect(body.path).toBe('/tasks');
    expect(body.message).toEqual(
      expect.arrayContaining([
        'property owner should not exist',
        'title must be longer than or equal to 1 characters',
      ]),
    );
    expect(body.timestamp).toEqual(expect.any(String));

    await request(server)
      .get('/tasks?page=0&limit=101&status=unknown')
      .set('Authorization', `Bearer ${token}`)
      .expect(400);
  });

  it('paginates, filters, and searches owner and admin task listings', async () => {
    await register('query-admin@example.com', 'Query Admin');
    const adminToken = await promoteAndLogin('query-admin@example.com');
    const ownerToken = await register('query-owner@example.com');
    const otherToken = await register('query-other@example.com');

    const firstMatch = await createTask(ownerToken, {
      title: 'Learn NestJS',
      description: 'Study guards',
      status: 'pending',
      priority: 'high',
    });
    await createTask(ownerToken, {
      title: 'Write documentation',
      status: 'completed',
      priority: 'low',
    });
    await createTask(ownerToken, {
      title: 'NestJS migration',
      status: 'completed',
      priority: 'high',
    });
    await createTask(otherToken, {
      title: 'NestJS private task',
      status: 'pending',
      priority: 'high',
    });

    const filteredResponse = await request(server)
      .get('/tasks?status=pending&priority=high&search=NESTJS')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const filtered = filteredResponse.body as PaginatedTaskResponse;
    expect(filtered).toMatchObject({
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    });
    expect(filtered.data.map(({ id }) => id)).toEqual([firstMatch.id]);

    const pageResponse = await request(server)
      .get('/tasks?page=2&limit=2')
      .set('Authorization', `Bearer ${ownerToken}`)
      .expect(200);
    const page = pageResponse.body as PaginatedTaskResponse;
    expect(page).toMatchObject({ page: 2, limit: 2, total: 3, totalPages: 2 });
    expect(page.data).toHaveLength(1);

    const adminResponse = await request(server)
      .get('/admin/tasks?priority=high&search=nestjs')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    const adminTasks = adminResponse.body as PaginatedTaskResponse;
    expect(adminTasks.total).toBe(3);
    expect(new Set(adminTasks.data.map(({ user }) => user)).size).toBe(2);
  });
});

function restoreEnvironment(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
