/**
 * An enum defining character sets for random string generation.
 */
export declare enum Charset {
    NUMERIC = "0123456789",
    ALPHA_LOWER = "abcdefghijklmnopqrstuvwxyz",
    ALPHA_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ALPHA = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ALPHA_NUMERIC = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
}
/**
 * Generates a random string of a given length from a specified character set.
 *
 * @param length The desired length of the string.
 * @param charset The set of characters to choose from. Defaults to numeric.
 * @returns A random string.
 */
export declare function generateRandomString(length: number, charset?: Charset): string;
/**
 * Creates a new object containing only the specified fields from the source object.
 * This is useful for sanitizing data before sending it in a response or saving it.
 *
 * @param obj The source object.
 * @param allowedFields An array of keys to include in the new object.
 * @returns A new object with only the allowed fields.
 */
export declare function sanitizeObject<T extends object>(obj: T, allowedFields: (keyof T)[]): Partial<T>;
//# sourceMappingURL=index.d.ts.map