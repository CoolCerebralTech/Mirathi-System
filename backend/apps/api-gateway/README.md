# API Gateway

Single entry point for all Shamba Sure microservices.

## Features

- **Request Routing**: Automatically routes requests to appropriate microservices
- **Authentication**: Centralized JWT authentication for all services
- **Rate Limiting**: Protects against abuse with configurable rate limits
- **Security**: Implements security best practices (Helmet, CORS, etc.)
- **Logging**: Comprehensive request/response logging with correlation IDs
- **Health Checks**: Monitors health of all microservices
- **Error Handling**: Unified error handling and response formatting

## Routing

The gateway automatically routes requests based on URL patterns:

- `/auth/*` → accounts-service
- `/users/*` → accounts-service  
- `/wills/*` → succession-service
- `/assets/*` → succession-service
- `/families/*` → succession-service
- `/documents/*` → documents-service
- `/notifications/*` → notifications-service

## Authentication

All routes require JWT authentication except:
- `/health/*` - Health checks
- `/auth/login` - User login
- `/auth/register` - User registration
- `/auth/forgot-password` - Password reset request
- `/auth/reset-password` - Password reset

## Rate Limiting

- **Global**: 1000 requests per 15 minutes per IP
- **Login**: 5 requests per minute per IP
- **Registration**: 2 requests per minute per IP
- **Password Reset**: 3 requests per minute per IP

## Health Endpoints

- `GET /health` - Comprehensive health status
- `GET /health/liveness` - Liveness probe
- `GET /health/readiness` - Readiness probe
- `GET /health/metrics` - Gateway metrics

## Development

```bash
# Start in development mode
pnpm start:dev

# Run tests
pnpm test

# Build for production
pnpm build