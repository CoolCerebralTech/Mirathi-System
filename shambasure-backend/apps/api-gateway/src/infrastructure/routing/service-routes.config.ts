// apps/api-gateway/src/infrastructure/routing/service-routes.config.ts
import { Logger } from '@nestjs/common';

const logger = new Logger('ServiceRoutesConfig');

export interface ServiceRoute {
  path: string;
  service: string;
  serviceUrl: string;
  pathPrefix: string;
  requiresAuth?: boolean;
  timeout?: number;
  healthCheck?: string;
  retries?: number;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

/**
 * Get environment variable with fallback and validation
 */
const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];

  if (!value && defaultValue === undefined) {
    const error = `Missing required environment variable: ${key}`;
    logger.error(error);
    throw new Error(error);
  }

  if (!value && defaultValue !== undefined) {
    logger.warn(`Using default value for ${key}: ${defaultValue}`);
    return defaultValue;
  }

  return value!;
};

/**
 * Service Routes Configuration
 *
 * Maps incoming paths to microservices. The pathPrefix is stripped
 * when forwarding to the microservice.
 */
export const SERVICE_ROUTES: ServiceRoute[] = [
  // ===== ACCOUNTS SERVICE =====
  {
    path: '/accounts',
    service: 'accounts-service',
    serviceUrl: getEnvVar('ACCOUNTS_SERVICE_URL', 'http://localhost:3001'),
    pathPrefix: '/accounts',
    requiresAuth: false,
    timeout: 30000,
    healthCheck: '/health',
    retries: 3,
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    },
  },

  // ===== SUCCESSION SERVICE =====
  {
    path: '/succession',
    service: 'succession-service',
    serviceUrl: getEnvVar('SUCCESSION_SERVICE_URL', 'http://localhost:3002'),
    pathPrefix: '/succession',
    requiresAuth: true,
    timeout: 30000,
    healthCheck: '/health',
    retries: 2,
  },

  // ===== DOCUMENTS SERVICE =====
  {
    path: '/documents',
    service: 'documents-service',
    serviceUrl: getEnvVar('DOCUMENTS_SERVICE_URL', 'http://localhost:3003'),
    pathPrefix: '/documents',
    requiresAuth: true,
    timeout: 60000, // Longer timeout for file uploads
    healthCheck: '/health',
    retries: 1,
  },

  // ===== NOTIFICATIONS SERVICE =====
  {
    path: '/notifications',
    service: 'notifications-service',
    serviceUrl: getEnvVar('NOTIFICATIONS_SERVICE_URL', 'http://localhost:3004'),
    pathPrefix: '/notifications',
    requiresAuth: true,
    timeout: 30000,
    healthCheck: '/health',
    retries: 2,
  },

  // ===== AUDITING SERVICE =====
  {
    path: '/auditing',
    service: 'auditing-service',
    serviceUrl: getEnvVar('AUDITING_SERVICE_URL', 'http://localhost:3005'),
    pathPrefix: '/auditing',
    requiresAuth: true,
    timeout: 30000,
    healthCheck: '/health',
    retries: 3,
  },

  // ===== HEALTH AND METRICS =====
  {
    path: '/health',
    service: 'api-gateway',
    serviceUrl: getEnvVar('GATEWAY_URL', 'http://localhost:3000'),
    pathPrefix: '/health',
    requiresAuth: false,
    timeout: 5000,
  },

  // ===== API DOCUMENTATION =====
  {
    path: '/docs',
    service: 'api-gateway',
    serviceUrl: getEnvVar('GATEWAY_URL', 'http://localhost:3000'),
    pathPrefix: '/docs',
    requiresAuth: false,
    timeout: 5000,
  },

  // ===== OPENAPI SPEC =====
  {
    path: '/api-json',
    service: 'api-gateway',
    serviceUrl: getEnvVar('GATEWAY_URL', 'http://localhost:3000'),
    pathPrefix: '/api-json',
    requiresAuth: false,
    timeout: 5000,
  },
];

/**
 * Get service route by path
 */
export function getServiceByPath(path: string): ServiceRoute | undefined {
  // Remove API and version prefixes
  const cleanPath = path
    .replace(/^\/api/, '')
    .replace(/^\/v\d+\/?/, '')
    .replace(/^\/+/, '/'); // Ensure single leading slash

  // Try to find exact or prefix match
  return SERVICE_ROUTES.find((route) => {
    // Exact match
    if (cleanPath === route.path) {
      return true;
    }

    // Prefix match (e.g., /accounts/something matches /accounts)
    if (cleanPath.startsWith(route.path + '/')) {
      return true;
    }

    return false;
  });
}

/**
 * Get all service routes
 */
export function getAllServiceRoutes(): ServiceRoute[] {
  return SERVICE_ROUTES;
}

/**
 * Get service route by service name
 */
export function getServiceByName(serviceName: string): ServiceRoute | undefined {
  return SERVICE_ROUTES.find((route) => route.service === serviceName);
}

/**
 * Validate all service routes configuration
 */
export function validateServiceRoutes(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const seenPrefixes = new Set<string>();

  for (const route of SERVICE_ROUTES) {
    // Check for duplicate prefixes
    if (seenPrefixes.has(route.path)) {
      errors.push(`Duplicate path prefix: ${route.path} for service ${route.service}`);
    }
    seenPrefixes.add(route.path);

    // Validate URLs
    try {
      new URL(route.serviceUrl);
    } catch {
      errors.push(`Invalid URL for service ${route.service}: ${route.serviceUrl}`);
    }

    // Validate timeout
    if (route.timeout && route.timeout < 1000) {
      errors.push(`Timeout too low for service ${route.service}: ${route.timeout}ms`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate on import
const validation = validateServiceRoutes();
if (!validation.valid) {
  logger.error('Service routes validation failed:', validation.errors);
}
