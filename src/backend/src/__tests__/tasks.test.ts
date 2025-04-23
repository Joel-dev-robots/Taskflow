import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';
import authRoutes from '../routes/authRoutes';
import taskRoutes from '../routes/taskRoutes';
import User from '../models/User';
import Task from '../models/Task';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

let mongoServer: MongoMemoryServer;
let testUser: any;
let authToken: string;

beforeAll(async () => {
  // Setup in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  // Create a test user
  testUser = new User({
    name: 'Test User',
    email: 'tasktest@example.com',
    password: 'password123'
  });
  await testUser.save();
  
  // Generate auth token
  const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here';
  authToken = jwt.sign({ userId: testUser._id }, JWT_SECRET, { expiresIn: '1h' });
});

afterAll(async () => {
  // Cleanup after tests
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clear tasks collection before each test
  await Task.deleteMany({});
});

describe('Task Routes', () => {
  describe('POST /api/tasks', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'This is a test task',
        status: 'pending',
      };

      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send(taskData)
        .expect(201);

      // Check response structure
      expect(response.body).toHaveProperty('task');
      expect(response.body.task).toHaveProperty('_id');
      expect(response.body.task.title).toBe(taskData.title);
      expect(response.body.task.description).toBe(taskData.description);
      expect(response.body.task.status).toBe(taskData.status);
      expect(response.body.task.createdBy).toHaveProperty('_id');
      
      // Check that task was saved to database
      const task = await Task.findById(response.body.task._id);
      expect(task).toBeTruthy();
      expect(task?.title).toBe(taskData.title);
      expect(task?.createdBy.toString()).toBe(testUser._id.toString());
    });

    it('should validate task data', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'A', // Too short
          description: 'Short', // Too short
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Add some test tasks
      const tasks = [
        {
          title: 'Task 1',
          description: 'Description for task 1',
          status: 'pending',
          createdBy: testUser._id,
        },
        {
          title: 'Task 2',
          description: 'Description for task 2',
          status: 'in-progress',
          createdBy: testUser._id,
        },
        {
          title: 'Task 3',
          description: 'Description for task 3',
          status: 'completed',
          createdBy: testUser._id,
        }
      ];
      
      await Task.insertMany(tasks);
    });
    
    it('should get all tasks for the user', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('tasks');
      expect(Array.isArray(response.body.tasks)).toBe(true);
      expect(response.body.tasks.length).toBe(3);
    });
    
    it('should filter tasks by status', async () => {
      const response = await request(app)
        .get('/api/tasks?status=in-progress')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body.tasks.length).toBe(1);
      expect(response.body.tasks[0].status).toBe('in-progress');
    });
  });

  describe('GET /api/tasks/:id', () => {
    let testTask: any;
    
    beforeEach(async () => {
      // Create a test task
      testTask = new Task({
        title: 'Test Task',
        description: 'This is a test task',
        status: 'pending',
        createdBy: testUser._id,
      });
      await testTask.save();
    });
    
    it('should get a task by ID', async () => {
      const response = await request(app)
        .get(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('task');
      expect(response.body.task._id.toString()).toBe(testTask._id.toString());
      expect(response.body.task.title).toBe(testTask.title);
    });
    
    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
      
      expect(response.body).toHaveProperty('message', 'Task not found');
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let testTask: any;
    
    beforeEach(async () => {
      // Create a test task
      testTask = new Task({
        title: 'Test Task',
        description: 'This is a test task',
        status: 'pending',
        createdBy: testUser._id,
      });
      await testTask.save();
    });
    
    it('should update a task', async () => {
      const updateData = {
        title: 'Updated Task',
        status: 'in-progress',
      };
      
      const response = await request(app)
        .put(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('task');
      expect(response.body.task.title).toBe(updateData.title);
      expect(response.body.task.status).toBe(updateData.status);
      expect(response.body.task.description).toBe(testTask.description); // Unchanged
      
      // Verify in database
      const updatedTask = await Task.findById(testTask._id);
      expect(updatedTask?.title).toBe(updateData.title);
      expect(updatedTask?.status).toBe(updateData.status);
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    let testTask: any;
    
    beforeEach(async () => {
      // Create a test task
      testTask = new Task({
        title: 'Test Task',
        description: 'This is a test task',
        status: 'pending',
        createdBy: testUser._id,
      });
      await testTask.save();
    });
    
    it('should delete a task', async () => {
      await request(app)
        .delete(`/api/tasks/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify task is deleted
      const deletedTask = await Task.findById(testTask._id);
      expect(deletedTask).toBeNull();
    });
    
    it('should return 404 for non-existent task', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .delete(`/api/tasks/${fakeId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
}); 