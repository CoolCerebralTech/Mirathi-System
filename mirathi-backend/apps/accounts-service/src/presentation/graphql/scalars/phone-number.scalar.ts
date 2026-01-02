// src/presentation/graphql/scalars/phone-number.scalar.ts
import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

import { PhoneNumber } from '../../../domain/value-objects';

/**
 * Custom PhoneNumber scalar for GraphQL
 * Validates Kenyan phone numbers
 */
@Scalar('PhoneNumber', () => String)
export class PhoneNumberScalar implements CustomScalar<string, string> {
  description = 'Kenyan phone number in E.164 format (+254...)';

  /**
   * Convert PhoneNumber value object to string for client
   */
  serialize(value: PhoneNumber | string): string {
    if (value instanceof PhoneNumber) {
      return value.value;
    }
    return value;
  }

  /**
   * Validate and convert string from client to normalized format
   */
  parseValue(value: string): string {
    try {
      const phoneNumber = PhoneNumber.create(value);
      return phoneNumber.value;
    } catch (error) {
      throw new Error(`Invalid Kenyan phone number: ${error.message}`);
    }
  }

  /**
   * Parse phone number from query/mutation literal
   */
  parseLiteral(ast: ValueNode): string {
    if (ast.kind === Kind.STRING) {
      return this.parseValue(ast.value);
    }
    throw new Error('PhoneNumber scalar can only parse string values');
  }
}
