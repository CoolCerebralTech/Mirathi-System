import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';

@Scalar('PhoneNumber')
export class PhoneNumberScalar implements CustomScalar<string, string> {
  description = 'A valid E.164 phone number';

  parseValue(value: string): string {
    // Value coming from the client input
    return value;
  }

  serialize(value: string): string {
    // Value sent to the client
    return value;
  }

  parseLiteral(ast: ValueNode): string {
    // Value from the client query literal (e.g. mutation { ... phoneNumber: "+254..." })
    if (ast.kind === Kind.STRING) {
      return ast.value;
    }
    throw new Error('PhoneNumber must be a string');
  }
}
