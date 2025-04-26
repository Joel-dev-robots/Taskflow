import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import cors from 'cors';
import http from 'http';
import { Server } from 'socket.io';

// Load environment variables
dotenv.config();

// Initialize app
const app = express();
const server = http.createServer(app);

// Configuración CORS más permisiva
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Socket.io setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  }
});

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join a task room
  socket.on('join-task', (taskId) => {
    socket.join(`task-${taskId}`);
    console.log(`User ${socket.id} joined room: task-${taskId}`);
  });

  // Leave a task room
  socket.on('leave-task', (taskId) => {
    socket.leave(`task-${taskId}`);
    console.log(`User ${socket.id} left room: task-${taskId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Function to emit task updates
export const emitTaskUpdate = (taskId: string, event: string, data: any) => {
  io.to(`task-${taskId}`).emit(event, data);
};

// Middleware
app.use(express.json());

// Database connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/taskflow';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Siempre intentar conectar a MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    console.log('Continuing without MongoDB connection...');
  });

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Taskflow API is running',
    status: 'ok',
    env: NODE_ENV
  });
});

// API routes
import authRoutes from './routes/authRoutes';
import taskRoutes from './routes/taskRoutes';
import commentRoutes from './routes/commentRoutes';
import adminRoutes from './routes/adminRoutes';

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/tasks', commentRoutes);
app.use('/api/admin', adminRoutes);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT} in ${NODE_ENV} mode`);
  console.log(`Server accessible at http://localhost:${PORT}`);
});

