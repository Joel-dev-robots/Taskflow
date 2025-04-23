# Project Documentation

This directory contains documentation for the Task Management Collaborative application.

## Contents

- [Project Guide](../guide.md): Overview of the project phases and requirements
- [API Documentation](./api.md): API endpoints and usage examples
- [Deployment Guide](./deploy.md): Instructions for deploying the application

## Architecture

The application follows a standard client-server architecture:

- **Frontend**: Next.js React application with Redux for state management and Tailwind CSS for styling
- **API**: Node.js Express backend with TypeScript
- **Database**: MongoDB for persistent storage
- **Real-time Communication**: Socket.io for real-time notifications

## Development Workflow

1. Set up environment variables:
   - Copy `.env.example` to `.env` in both frontend and backend directories
   - Configure variables as needed

2. Start the development environment:
   ```bash
   docker-compose up -d
   ```

3. Access the application:
   - Frontend: http://localhost:3000
   - API: http://localhost:5000

## Common Tasks

- **Adding a new API endpoint**:
  1. Create a route in `backend/src/routes/`
  2. Create a controller in `backend/src/controllers/`
  3. Define models in `backend/src/models/` if needed
  4. Add tests in `backend/src/__tests__/`

- **Creating a new frontend page**:
  1. Add the page in `frontend/src/pages/`
  2. Create components in `frontend/src/components/`
  3. Add Redux slices in `frontend/src/store/` if needed 