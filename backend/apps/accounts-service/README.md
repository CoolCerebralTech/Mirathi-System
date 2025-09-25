# Accounts Service

User identity and management service for Shamba Sure platform.

## Features

- User registration and authentication
- Profile management
- Password reset functionality
- Role-based access control
- User statistics and reporting

## API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh tokens
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password
- `GET /auth/profile` - Get user profile
- `PATCH /auth/profile` - Update profile
- `PATCH /auth/change-password` - Change password

### Users (Admin only)
- `GET /users` - List all users
- `GET /users/stats` - Get user statistics
- `GET /users/:id` - Get user by ID
- `DELETE /users/:id` - Delete user

## Development

```bash
# Start in development mode
pnpm start:dev

# Run tests
pnpm test

# Build for production
pnpm build