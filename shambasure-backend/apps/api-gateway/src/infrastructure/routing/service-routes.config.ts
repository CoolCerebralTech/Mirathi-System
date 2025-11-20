import { ServiceRoute } from '../../application/interfaces/service-router.interface';

const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
};

export const SERVICE_ROUTES: ServiceRoute[] = [
  {
    path: '/auth/:path*',
    methods: ['POST', 'GET'],
    service: 'accounts-service',
    serviceUrl: requireEnv('ACCOUNTS_SERVICE_URL'),
    requiresAuth: false,
  },
  {
    path: '/users/:path*',
    methods: ['GET', 'PUT', 'PATCH', 'DELETE'],
    service: 'accounts-service',
    serviceUrl: requireEnv('ACCOUNTS_SERVICE_URL'),
    requiresAuth: true,
  },
  {
    path: '/succession/:path*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    service: 'succession-service',
    serviceUrl: requireEnv('SUCCESSION_SERVICE_URL'),
    requiresAuth: true,
  },
  {
    path: '/documents/:path*',
    methods: ['GET', 'POST', 'DELETE'],
    service: 'documents-service',
    serviceUrl: requireEnv('DOCUMENTS_SERVICE_URL'),
    requiresAuth: true,
  },
  {
    path: '/notifications/status/:path*',
    methods: ['GET'],
    service: 'notifications-service',
    serviceUrl: requireEnv('NOTIFICATIONS_SERVICE_URL'),
    requiresAuth: true,
  },
  {
    path: '/auditing/status/:path*',
    methods: ['GET'],
    service: 'auditing-service',
    serviceUrl: requireEnv('AUDITING_SERVICE_URL'),
    requiresAuth: true,
  },
];
