/**
 * A custom composite decorator for validating a strong password.
 * It combines multiple `class-validator` decorators into one.
 * The policy is: 8-100 characters, at least one uppercase letter,
 * one lowercase letter, one number, and one special character.
 */
export declare function IsStrongPassword(): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
//# sourceMappingURL=is-password.decorator.d.ts.map