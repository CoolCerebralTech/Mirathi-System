import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RelationshipType } from '@prisma/client';
import { ALLOWED_RELATIONSHIPS_KEY } from '../decorators/family-relationship.decorator';
import { RELATIONSHIP_TYPES } from '../constants/relationship-types.constants';

/**
 * A guard that checks if the `relationship` field in the request body
 * is one of the types permitted by the `@AllowedRelationships` decorator on the route handler.
 */
@Injectable()
export class FamilyRelationshipGuard implements CanActivate {
  // --- The list of what is considered immediate family is now sourced from our constants ---
  private readonly IMMEDIATE_FAMILY_RELATIONSHIPS: RelationshipType[];

  constructor(private readonly reflector: Reflector) {
    // We derive the list from our single-source-of-truth constant, ensuring consistency.
    this.IMMEDIATE_FAMILY_RELATIONSHIPS = Object.values(RELATIONSHIP_TYPES)
      .filter((rel) => rel.immediateFamily === true)
      .map((rel) => rel.code as RelationshipType);
  }

  canActivate(context: ExecutionContext): boolean {
    // Get the metadata (the list of allowed relationships) from the decorator.
    let allowed = this.reflector.get<RelationshipType[] | 'IMMEDIATE_FAMILY'>(
      ALLOWED_RELATIONSHIPS_KEY,
      context.getHandler(),
    );

    // If the decorator wasn't used, the guard does nothing and allows the request.
    if (!allowed) {
      return true;
    }

    // Resolve the "IMMEDIATE_FAMILY" shortcut
    if (allowed === 'IMMEDIATE_FAMILY') {
      allowed = this.IMMEDIATE_FAMILY_RELATIONSHIPS;
    }

    const request = context.switchToHttp().getRequest();
    const relationshipInBody = request.body.relationship as RelationshipType;

    if (!relationshipInBody) {
      throw new ForbiddenException('A `relationship` field is required in the request body.');
    }

    if (!allowed.includes(relationshipInBody)) {
      throw new ForbiddenException(
        `The relationship type '${relationshipInBody}' is not permitted for this operation.`,
      );
    }

    return true;
  }
}
