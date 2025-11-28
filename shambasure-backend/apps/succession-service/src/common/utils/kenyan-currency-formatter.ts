export class KenyanCurrencyFormatter {
  /**
   * Format a number into Kenyan Shillings (KES) currency string
   * @param amount - The numeric value to format
   * @param options - Optional formatting options
   */
  static format(
    amount: number,
    options?: {
      includeSymbol?: boolean; // Whether to include "KES"
      decimalPlaces?: number; // Number of decimal places (default 0)
      rounding?: 'nearest' | 'up' | 'down'; // Rounding method (default 'nearest')
    },
  ): string {
    const { includeSymbol = true, decimalPlaces = 0, rounding = 'nearest' } = options || {};

    // Apply rounding
    let roundedAmount: number;
    switch (rounding) {
      case 'up':
        roundedAmount = Math.ceil(amount);
        break;
      case 'down':
        roundedAmount = Math.floor(amount);
        break;
      default:
        roundedAmount = Math.round(amount);
    }

    // Format number with commas and decimal places
    const formatted = roundedAmount.toLocaleString('en-KE', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });

    return includeSymbol ? `KES ${formatted}` : formatted;
  }

  /**
   * Convert numeric value to string with KES and optional decimals
   * Example: 1234567 => "KES 1,234,567"
   */
  static toKES(amount: number, decimalPlaces = 0): string {
    return this.format(amount, { includeSymbol: true, decimalPlaces });
  }

  /**
   * Convert numeric value to plain number string with commas
   * Example: 1234567 => "1,234,567"
   */
  static toPlain(amount: number, decimalPlaces = 0): string {
    return this.format(amount, { includeSymbol: false, decimalPlaces });
  }
}
