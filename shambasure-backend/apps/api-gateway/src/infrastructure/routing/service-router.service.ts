import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import {
  IServiceRouter,
  ServiceRoute,
} from '../../application/interfaces/service-router.interface';
import { SERVICE_ROUTES } from './service-routes.config';
import { match, MatchFunction, Decode } from 'path-to-regexp';

@Injectable()
export class ServiceRouterService implements IServiceRouter {
  private readonly logger = new Logger(ServiceRouterService.name);
  private readonly routes = SERVICE_ROUTES;

  constructor() {
    this.logger.log(`Initialized with ${this.routes.length} service routes.`);
  }

  /**
   * Finds the appropriate downstream service for a given request.
   * It iterates through the configured routes and returns the first one that matches the request path.
   *
   * @param request The incoming Express request object.
   * @returns The matched ServiceRoute configuration, or null if no match is found.
   */
  findService(request: Request): ServiceRoute | null {
    // Extract just the pathname, removing query strings and fragments
    const url = new URL(request.originalUrl, `http://${request.headers.host || 'localhost'}`);
    const path = url.pathname;

    // Adapter to satisfy the Decode signature expected by path-to-regexp.
    // We use decodeURIComponent under the hood for safety.
    const safeDecode: Decode = (value: string) => decodeURIComponent(value);

    for (const route of this.routes) {
      // Check if the HTTP method is allowed for this route
      if (!route.methods.includes(request.method)) {
        continue;
      }

      // The `match` function from path-to-regexp checks if the URL conforms to the route's path pattern.
      // We use `end: false` to allow wildcard matching (e.g., '/users/*' matches '/users/123/profile').
      const fn: MatchFunction<Record<string, string>> = match<Record<string, string>>(route.path, {
        decode: safeDecode,
        end: false,
      });

      const matchResult = fn(path);

      if (matchResult !== false) {
        this.logger.debug(
          `Request [${request.method} ${path}] matched route [${route.path}] -> service [${route.service}]`,
        );
        return route;
      }
    }

    this.logger.warn(`No service route found for: ${request.method} ${path}`);
    return null;
  }

  /**
   * Retrieves the full list of registered service routes.
   * Useful for health check endpoints or debugging.
   */
  getRoutes(): ServiceRoute[] {
    return this.routes;
  }

  /**
   * Checks if a given request path corresponds to a route that requires authentication.
   *
   * @param path The request path string.
   * @returns True if authentication is required, otherwise false.
   */
  requiresAuth(path: string): boolean {
    // Adapter to satisfy the Decode signature expected by path-to-regexp.
    const safeDecode: Decode = (value: string) => decodeURIComponent(value);

    // Match against routes using just the path
    for (const route of this.routes) {
      const fn: MatchFunction<Record<string, string>> = match<Record<string, string>>(route.path, {
        decode: safeDecode,
        end: false,
      });

      const matchResult = fn(path);

      if (matchResult !== false) {
        return route.requiresAuth ?? false;
      }
    }

    // Default to secure: if no route is found, assume auth is required.
    return true;
  }
}
