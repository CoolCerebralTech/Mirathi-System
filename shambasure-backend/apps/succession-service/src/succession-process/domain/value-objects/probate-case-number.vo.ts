export class ProbateCaseNumber {
  private readonly value: string;

  // Pattern: E{digits} of {Year} or P&A {digits}/{Year}
  // e.g. "E345 of 2024"
  private static readonly PATTERN = /^(E|P&A)\s?\d+\s?(of|\/)\s?20\d{2}$/i;

  constructor(value: string) {
    const cleaned = value.trim();
    if (!ProbateCaseNumber.PATTERN.test(cleaned)) {
      // We might relax this if manual entry is messy, but for System Integration strict is better
      throw new Error('Invalid Case Number Format. Expected format: "E123 of 2024"');
    }
    this.value = cleaned.toUpperCase();
  }

  getValue(): string {
    return this.value;
  }

  getYear(): number {
    const match = this.value.match(/20\d{2}/);
    return match ? parseInt(match[0]) : new Date().getFullYear();
  }

  equals(other: ProbateCaseNumber): boolean {
    return this.value === other.getValue();
  }
}
