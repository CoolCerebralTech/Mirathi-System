import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { RelationshipType } from '@prisma/client';
import {
  ALLOWED_RELATIONSHIPS_KEY,
  RelationshipOptions,
  AllowedRelationshipsConfig,
} from '../decorators/family-relationship.decorator';

// Extended request type with typed body
interface RelationshipRequest extends Request {
  body: Record<string, unknown>;
}

/**
 * A guard that checks if the relationship field in the request body
 * is one of the types permitted by the `@AllowedRelationships` decorator.
 *
 * Features:
 * - Validates relationship types against allowed configurations
 * - Supports predefined groups (IMMEDIATE_FAMILY, EXTENDED_FAMILY)
 * - Customizable body field names
 * - Comprehensive error handling
 */
@Injectable()
export class FamilyRelationshipGuard implements CanActivate {
  private readonly logger = new Logger(FamilyRelationshipGuard.name);

  // Define relationship categories based on Kenyan family structures
  private readonly IMMEDIATE_FAMILY_RELATIONSHIPS: RelationshipType[] = [
    RelationshipType.SPOUSE,
    RelationshipType.CHILD,
    RelationshipType.ADOPTED_CHILD,
    RelationshipType.STEPCHILD,
    RelationshipType.PARENT,
    RelationshipType.SIBLING,
  ];

  private readonly EXTENDED_FAMILY_RELATIONSHIPS: RelationshipType[] = [
    RelationshipType.GRANDCHILD,
    RelationshipType.GRANDPARENT,
    RelationshipType.NIECE_NEPHEW,
    RelationshipType.AUNT_UNCLE,
    RelationshipType.COUSIN,
    RelationshipType.GUARDIAN,
    RelationshipType.OTHER,
  ];

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.get<RelationshipOptions>(
      ALLOWED_RELATIONSHIPS_KEY,
      context.getHandler(),
    );

    // If the decorator wasn't used, the guard does nothing and allows the request.
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RelationshipRequest>();
    const bodyField = options.bodyField || 'relationship';

    // Extract and validate the relationship from request body
    const relationship = this.extractRelationship(request.body, bodyField);

    if (!relationship) {
      throw new BadRequestException(`A '${bodyField}' field is required in the request body.`);
    }

    // Resolve the allowed relationships based on configuration
    const allowedRelationships = this.resolveAllowedRelationships(options.allowed);

    // Validate the relationship against allowed types
    if (!allowedRelationships.includes(relationship)) {
      const allowedTypes = allowedRelationships.join(', ');
      this.logger.warn(
        `Relationship validation failed: '${relationship}' not in allowed types: [${allowedTypes}]`,
      );
      throw new ForbiddenException(
        `The relationship type '${relationship}' is not permitted for this operation. ` +
          `Allowed types: ${allowedTypes}`,
      );
    }

    this.logger.debug(`Relationship validation passed: ${relationship}`);
    return true;
  }

  /**
   * Extract relationship from request body with proper typing
   */
  private extractRelationship(
    body: Record<string, unknown>,
    field: string,
  ): RelationshipType | null {
    const value = body[field];

    if (!value) {
      return null;
    }

    if (typeof value !== 'string') {
      throw new BadRequestException(`The '${field}' field must be a string.`);
    }

    // Validate that the value is a valid RelationshipType
    if (!this.isValidRelationshipType(value)) {
      const validTypes = Object.values(RelationshipType).join(', ');
      throw new BadRequestException(
        `Invalid relationship type '${value}'. Valid types are: ${validTypes}`,
      );
    }

    return value;
  }

  /**
   * Check if a string is a valid RelationshipType
   */
  private isValidRelationshipType(value: string): value is RelationshipType {
    return Object.values(RelationshipType).includes(value as RelationshipType);
  }

  /**
   * Resolve the allowed relationships based on configuration
   */
  private resolveAllowedRelationships(config: AllowedRelationshipsConfig): RelationshipType[] {
    if (Array.isArray(config)) {
      return config;
    }

    // Use a type assertion to fix the "never" type issue
    const configType = config as string;

    if (config === 'IMMEDIATE_FAMILY') {
      return this.IMMEDIATE_FAMILY_RELATIONSHIPS;
    }

    if (config === 'EXTENDED_FAMILY') {
      return this.EXTENDED_FAMILY_RELATIONSHIPS;
    }

    // This should never happen with proper typing, but handle it safely
    this.logger.error(`Unsupported relationship configuration: ${configType}`);
    throw new ForbiddenException('Invalid relationship configuration.');
  }
}
