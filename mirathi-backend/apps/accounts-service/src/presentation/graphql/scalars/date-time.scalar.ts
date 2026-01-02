// src/presentation/graphql/scalars/date-time.scalar.ts
import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

/**
 * Custom DateTime scalar for GraphQL
 * Handles Date serialization/deserialization
 */
@Scalar('DateTime', () => Date)
export class DateTimeScalar implements CustomScalar<string, Date> {
  description = 'Date custom scalar type (ISO 8601 format)';

  /**
   * Convert Date to string for sending to client
   */
  serialize(value: Date): string {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return new Date(value).toISOString();
  }

  /**
   * Convert string from client to Date
   */
  parseValue(value: string): Date {
    return new Date(value);
  }

  /**
   * Convert AST literal to Date
   */
  parseLiteral(ast: ValueNode): Date {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new Error('DateTime scalar can only parse string values');
  }
}
