export class ProbateCaseNumber {
  private readonly value: string;

  // Kenyan Probate Case Number Patterns:
  // - "E123 of 2024" (Estate matters)
  // - "P&A 456/2024" (Probate and Administration)
  // - "Succession Cause 789 of 2024"
  // - "HC/E/123/2024" (High Court Estate)
  // - "MC/E/456/2024" (Magistrate Court Estate)
  private static readonly PATTERNS = [
    /^(E|ESTATE)\s?\d+\s?(of|\/)\s?20\d{2}$/i,
    /^(P&A|PROBATE)\s?\d+\s?\/\s?20\d{2}$/i,
    /^SUCCESSION\s+CAUSE\s+\d+\s+OF\s+20\d{2}$/i,
    /^(HC|MC)\/E\/\d+\/20\d{2}$/i,
  ];

  constructor(value: string) {
    const cleaned = value.trim().toUpperCase();

    if (!ProbateCaseNumber.isValidFormat(cleaned)) {
      throw new Error(
        'Invalid Kenyan Probate Case Number Format. Expected: "E123 of 2024", "P&A 456/2024", "Succession Cause 789 of 2024"',
      );
    }

    this.value = cleaned;
  }

  private static isValidFormat(value: string): boolean {
    return this.PATTERNS.some((pattern) => pattern.test(value));
  }

  getValue(): string {
    return this.value;
  }

  getYear(): number {
    const match = this.value.match(/20\d{2}/);
    if (!match) {
      throw new Error('Could not extract year from case number');
    }
    return parseInt(match[0]);
  }

  getCourtLevel(): 'HIGH_COURT' | 'MAGISTRATE_COURT' | 'UNKNOWN' {
    if (this.value.startsWith('HC/') || this.value.includes('HIGH COURT')) {
      return 'HIGH_COURT';
    }
    if (this.value.startsWith('MC/') || this.value.includes('MAGISTRATE')) {
      return 'MAGISTRATE_COURT';
    }
    return 'UNKNOWN';
  }

  equals(other: ProbateCaseNumber): boolean {
    return this.value === other.getValue();
  }

  toString(): string {
    return this.value;
  }
}
