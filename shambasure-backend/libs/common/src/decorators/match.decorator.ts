import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'Match', async: false })
export class MatchConstraint implements ValidatorConstraintInterface {
  validate(value: unknown, args: ValidationArguments): boolean {
    const relatedPropertyName = args.constraints[0] as string;
    // The value of the other property is unknown, which is safer than any
    const relatedValue: unknown = (args.object as Record<string, any>)[relatedPropertyName];
    return value === relatedValue;
  }

  defaultMessage(args: ValidationArguments): string {
    const relatedPropertyName = args.constraints[0] as string;
    // PascalCase/camelCase to sentence case conversion for a cleaner message
    const formattedPropertyName = relatedPropertyName.replace(/([A-Z])/g, ' $1').toLowerCase();
    return `${args.property} must match the${formattedPropertyName}.`;
  }
}

/**
 * Custom decorator to validate that a field matches another field.
 * @param property The name of the property to match against.
 * @param validationOptions Additional validation options.
 */
export function Match(property: string, validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [property],
      validator: MatchConstraint,
    });
  };
}
