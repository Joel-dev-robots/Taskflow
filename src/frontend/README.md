# Task Management App - Frontend

This is the frontend for a collaborative task management application built with Next.js, Redux, and Tailwind CSS.

## Features

- User authentication (register, login, logout)
- Task management (create, view, edit, delete)
- Task filtering and sorting
- Task assignment to users
- Real-time notifications via Socket.io
- Responsive design

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the frontend directory:
   ```bash
   cd src/frontend
   ```
3. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```
4. Create a `.env.local` file with the following variables:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

### Development

To start the development server:

```bash
npm run dev
# or
yarn dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Building for Production

To build the application for production:

```bash
npm run build
# or
yarn build
```

To start the production server:

```bash
npm run start
# or
yarn start
```

## Project Structure

- `components/` - Reusable UI components
- `pages/` - Next.js pages and routes
- `store/` - Redux store configuration and slices
- `styles/` - Global styles and Tailwind configuration
- `public/` - Static assets

## Pages

- `/` - Home page
- `/login` - User login
- `/register` - User registration
- `/dashboard` - User dashboard
- `/tasks` - Task list view
- `/tasks/[id]` - Task detail view
- `/tasks/new` - Create new task
- `/tasks/edit/[id]` - Edit existing task

## Authentication

The application uses JWT tokens for authentication. Tokens are stored in localStorage and automatically included in API requests.

## State Management

Redux is used for state management with the following slices:

- `auth` - Authentication state (user, token, login/logout)
- `tasks` - Task management state (tasks, loading status, errors)

## API Integration

API requests are made using Axios. The base API URL is configured in the `.env.local` file. 