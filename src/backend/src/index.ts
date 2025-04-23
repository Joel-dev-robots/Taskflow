import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import commentRoutes from './routes/commentRoutes';

// Import middlewares
import loggerMiddleware from './middlewares/logger';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/task-management';
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.send('Task Management API is running');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Socket.io setup
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Notify when tasks change
  socket.on('joinTaskRoom', (taskId) => {
    socket.join(`task:${taskId}`);
  });
  
  socket.on('leaveTaskRoom', (taskId) => {
    socket.leave(`task:${taskId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Function to emit task updates
export const emitTaskUpdate = (taskId: string, action: string, data: any) => {
  io.to(`task:${taskId}`).emit('taskUpdate', { action, data });
};

// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 