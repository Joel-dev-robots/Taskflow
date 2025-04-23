import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';
import taskRoutes from '../routes/taskRoutes';
import commentRoutes from '../routes/commentRoutes';
import User from '../models/User';
import Task from '../models/Task';
import Comment from '../models/Comment';

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

let mongoServer: MongoMemoryServer;
let testUser: any;
let testTask: any;
let authToken: string;

beforeAll(async () => {
  // Setup in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  
  // Create a test user
  testUser = new User({
    name: 'Comment Test User',
    email: 'commenttest@example.com',
    password: 'password123'
  });
  await testUser.save();
  
  // Create a test task
  testTask = new Task({
    title: 'Test Task for Comments',
    description: 'This task is for testing comments',
    status: 'pending',
    createdBy: testUser._id,
  });
  await testTask.save();
  
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
  // Clear comments collection before each test
  await Comment.deleteMany({});
});

describe('Comment Routes', () => {
  describe('POST /api/comments/task/:taskId', () => {
    it('should create a new comment for a task', async () => {
      const commentData = {
        content: 'This is a test comment',
      };

      const response = await request(app)
        .post(`/api/comments/task/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(commentData)
        .expect(201);

      // Check response structure
      expect(response.body).toHaveProperty('comment');
      expect(response.body.comment).toHaveProperty('_id');
      expect(response.body.comment.content).toBe(commentData.content);
      expect(response.body.comment.user).toHaveProperty('_id');
      
      // Check that comment was saved to database
      const comment = await Comment.findById(response.body.comment._id);
      expect(comment).toBeTruthy();
      expect(comment?.content).toBe(commentData.content);
      expect(comment?.user.toString()).toBe(testUser._id.toString());
      expect(comment?.task.toString()).toBe(testTask._id.toString());
    });

    it('should validate comment content', async () => {
      const response = await request(app)
        .post(`/api/comments/task/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: '', // Empty content should fail validation
        })
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation error');
    });
  });

  describe('GET /api/comments/task/:taskId', () => {
    beforeEach(async () => {
      // Add some test comments
      const comments = [
        {
          task: testTask._id,
          user: testUser._id,
          content: 'Comment 1',
        },
        {
          task: testTask._id,
          user: testUser._id,
          content: 'Comment 2',
        },
        {
          task: testTask._id,
          user: testUser._id,
          content: 'Comment 3',
        }
      ];
      
      await Comment.insertMany(comments);
    });
    
    it('should get all comments for a task', async () => {
      const response = await request(app)
        .get(`/api/comments/task/${testTask._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('comments');
      expect(Array.isArray(response.body.comments)).toBe(true);
      expect(response.body.comments.length).toBe(3);
    });
  });

  describe('PUT /api/comments/:commentId', () => {
    let testComment: any;
    
    beforeEach(async () => {
      // Create a test comment
      testComment = new Comment({
        task: testTask._id,
        user: testUser._id,
        content: 'Test Comment for Update',
      });
      await testComment.save();
    });
    
    it('should update a comment', async () => {
      const updateData = {
        content: 'Updated comment content',
      };
      
      const response = await request(app)
        .put(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);
      
      expect(response.body).toHaveProperty('comment');
      expect(response.body.comment.content).toBe(updateData.content);
      
      // Verify in database
      const updatedComment = await Comment.findById(testComment._id);
      expect(updatedComment?.content).toBe(updateData.content);
    });
  });

  describe('DELETE /api/comments/:commentId', () => {
    let testComment: any;
    
    beforeEach(async () => {
      // Create a test comment
      testComment = new Comment({
        task: testTask._id,
        user: testUser._id,
        content: 'Test Comment for Deletion',
      });
      await testComment.save();
    });
    
    it('should delete a comment', async () => {
      await request(app)
        .delete(`/api/comments/${testComment._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      // Verify comment is deleted
      const deletedComment = await Comment.findById(testComment._id);
      expect(deletedComment).toBeNull();
    });
  });
}); 