// apps/api-gateway/src/infrastructure/routing/routing.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';

import { ServiceRoute, getServiceByPath } from './service-routes.config';
import { SERVICE_ROUTES } from './service-routes.config';

export interface RouteMatch {
  route: ServiceRoute;
  originalPath: string;
  targetPath: string;
  requiresAuth: boolean;
}
interface DebugRoute {
  path: string;
  service: string;
  serviceUrl: string;
  requiresAuth: boolean;
}

@Injectable()
export class RoutingService {
  private readonly logger = new Logger(RoutingService.name);

  /**
   * Match incoming request to a service route
   */
  matchRoute(req: Request): RouteMatch | null {
    const originalPath = req.path;

    // Special handling for health and docs (handled by gateway itself)
    if (originalPath.startsWith('/health') || originalPath.startsWith('/docs')) {
      return null; // Let NestJS handle these routes directly
    }

    // Find matching service
    const route = getServiceByPath(originalPath);

    if (!route) {
      this.logger.warn(`No route found for path: ${originalPath}`);
      return null;
    }

    // Construct target path
    const targetPath = this.constructTargetPath(originalPath, route.pathPrefix);

    return {
      route,
      originalPath,
      targetPath,
      requiresAuth: route.requiresAuth !== false,
    };
  }

  /**
   * Construct target path for the microservice
   */
  private constructTargetPath(originalPath: string, pathPrefix: string): string {
    let targetPath = originalPath;

    // Remove /api prefix
    targetPath = targetPath.replace(/^\/api/, '');

    // Remove version prefix
    targetPath = targetPath.replace(/^\/v\d+\/?/, '');

    // Remove the service path prefix
    if (pathPrefix && targetPath.startsWith(pathPrefix)) {
      targetPath = targetPath.substring(pathPrefix.length);
    }

    // Ensure path starts with /
    if (!targetPath.startsWith('/')) {
      targetPath = '/' + targetPath;
    }

    // If empty, use root
    if (targetPath === '') {
      targetPath = '/';
    }

    this.logger.debug({
      msg: 'Constructed target path',
      original: originalPath,
      target: targetPath,
      prefix: pathPrefix,
    });

    return targetPath;
  }

  /**
   * Get all available routes for debugging
   */
  getAllRoutes(): DebugRoute[] {
    const routes: DebugRoute[] = [];

    for (const route of SERVICE_ROUTES) {
      if (route.service === 'api-gateway') continue;

      routes.push({
        path: route.path,
        service: route.service,
        serviceUrl: route.serviceUrl,
        requiresAuth: route.requiresAuth !== false,
      });
    }

    return routes;
  }

  /**
   * Check if a path should be proxied or handled internally
   */
  shouldProxy(path: string): boolean {
    const route = getServiceByPath(path);

    if (!route) {
      return false;
    }

    // Don't proxy internal gateway routes
    if (route.service === 'api-gateway') {
      return false;
    }

    return true;
  }

  /**
   * Get service URL for a path
   */
  getServiceUrl(path: string): string | null {
    const route = getServiceByPath(path);
    return route ? route.serviceUrl : null;
  }
}
