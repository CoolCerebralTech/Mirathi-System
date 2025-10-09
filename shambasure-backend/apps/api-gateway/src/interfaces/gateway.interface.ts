// ============================================================================
// Shamba Sure - API Gateway Interfaces
// ============================================================================
// These interfaces define the contracts for service discovery and health
// monitoring within the API Gateway.
// ============================================================================

/**
 * An enum defining the known microservices in our system.
 * Using an enum prevents typos in configuration and code.
 */
export enum ServiceName {
  ACCOUNTS = 'accounts-service',
  DOCUMENTS = 'documents-service',
  SUCCESSION = 'succession-service',
  // NOTIFICATIONS = 'notifications-service', // The notifications service has no public API
  // AUDITING = 'auditing-service', // The auditing service has a protected API
}

/**
 * Defines the configuration for a single downstream microservice.
 * This will be loaded from our central configuration.
 */
export interface ServiceConfig {
  name: ServiceName;
  /** The base URL of the running service (e.g., "http://localhost:3001"). */
  url: string;
}

/**
 * Represents the health status of a single downstream microservice.
 * This is a dynamic object, updated periodically by the HealthCheckService.
 */
export interface ServiceHealth {
  name: ServiceName;
  status: 'up' | 'down';
  /** The latency of the last health check ping in milliseconds. */
  latency?: number;
  /** The error message if the service is down. */
  error?: string;
  /** The timestamp of the last health check. */
  lastChecked: string;
}

/**
 * Represents the overall health of the entire gateway and its downstream services.
 * This is the object that will be returned by the gateway's primary health endpoint.
 */
export interface GatewayHealth {
  gatewayStatus: 'up' | 'down';
  timestamp: string;
  services: ServiceHealth[];
}