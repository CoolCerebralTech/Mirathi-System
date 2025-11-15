import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { RelationshipType } from '@prisma/client';

export const FamilyRelationship = createParamDecorator((data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  const relationship = request.body.relationshipType;

  return {
    relationship,
    isValidKenyanRelationship: Object.values(RelationshipType).includes(relationship),
    isImmediateFamily: ['SPOUSE', 'CHILD', 'PARENT'].includes(relationship),
  };
});

export const VALIDATE_RELATIONSHIP = 'validate-relationship';
export const ValidateRelationship = (allowedRelationships: RelationshipType[] = []) =>
  SetMetadata(VALIDATE_RELATIONSHIP, allowedRelationships);

// Specific relationship decorators
export function SpouseRelationship() {
  return ValidateRelationship([RelationshipType.SPOUSE]);
}

export function ChildRelationship() {
  return ValidateRelationship([
    RelationshipType.CHILD,
    RelationshipType.ADOPTED_CHILD,
    RelationshipType.STEPCHILD,
  ]);
}

export function ImmediateFamily() {
  return ValidateRelationship([
    RelationshipType.SPOUSE,
    RelationshipType.CHILD,
    RelationshipType.ADOPTED_CHILD,
    RelationshipType.PARENT,
  ]);
}
