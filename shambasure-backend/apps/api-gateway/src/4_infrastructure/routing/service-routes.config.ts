import { ServiceRoute } from '../../2_application/interfaces/service-router.interface';

/**
 * Service routing configuration for the API Gateway.
 *
 * This array defines how incoming request paths are mapped to downstream microservices.
 * The order of this array is important: The first match will be used.
 * Place more specific paths before more general ones.
 *
 * Properties:
 * - path: An Express-style path string (e.g., '/users/:id'). It will be used for matching.
 * - methods: An array of HTTP methods allowed for this route.
 * - service: A friendly name for the downstream service.
 * - serviceUrl: The base URL of the downstream service, typically read from environment variables.
 * - requiresAuth: If true, the gateway should ensure the request is authenticated before forwarding.
 */
export const SERVICE_ROUTES: ServiceRoute[] = [
  // --- Accounts Service ---
  // Manages users, profiles, and authentication-related tasks.
  {
    path: '/auth/*',
    methods: ['POST', 'GET'], // For login, register, refresh, etc.
    service: 'accounts-service',
    serviceUrl: process.env.ACCOUNTS_SERVICE_URL || 'http://localhost:3001',
    requiresAuth: false,
  },
  {
    path: '/users/*',
    methods: ['GET', 'PUT', 'PATCH', 'DELETE'], // Standard REST methods for user management
    service: 'accounts-service',
    serviceUrl: process.env.ACCOUNTS_SERVICE_URL || 'http://localhost:3001',
    requiresAuth: true,
  },

  // --- Succession Service ---
  // Core business logic for wills, estates, and family trees.
  {
    path: '/succession/*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    service: 'succession-service',
    serviceUrl: process.env.SUCCESSION_SERVICE_URL || 'http://localhost:3002',
    requiresAuth: true,
  },

  // --- Documents Service ---
  // Handles secure document uploads and management.
  {
    path: '/documents/*',
    methods: ['GET', 'POST', 'DELETE'], // Common methods for document handling
    service: 'documents-service',
    serviceUrl: process.env.DOCUMENTS_SERVICE_URL || 'http://localhost:3003',
    requiresAuth: true,
  },

  // --- Notifications Service ---
  {
    path: '/notifications/status/*',
    methods: ['GET'], // Status endpoints are typically GET only
    service: 'notifications-service',
    serviceUrl: process.env.NOTIFICATIONS_SERVICE_URL || 'http://localhost:3004',
    requiresAuth: true, // Restricted to admins
  },

  // --- Auditing Service ---
  {
    path: '/auditing/status/*',
    methods: ['GET'],
    service: 'auditing-service',
    serviceUrl: process.env.AUDITING_SERVICE_URL || 'http://localhost:3005',
    requiresAuth: true, // Restricted to admins
  },
];
