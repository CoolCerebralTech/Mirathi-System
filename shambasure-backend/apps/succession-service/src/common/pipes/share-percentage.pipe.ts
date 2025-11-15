import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class SharePercentagePipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    if (metadata.type === 'body' && this.isSharePercentageField(metadata.data)) {
      return this.validateSharePercentage(value, metadata.data || 'share');
    }
    return value;
  }

  private isSharePercentageField(fieldName?: string): boolean {
    if (!fieldName) return false;

    const percentageFields = [
      'sharePercent',
      'percentage',
      'allocation',
      'distributionShare',
      'ownershipShare',
    ];
    return percentageFields.some((field) => fieldName.toLowerCase().includes(field.toLowerCase()));
  }

  private validateSharePercentage(value: unknown, fieldName: string): number {
    let numericValue: number;

    if (typeof value === 'string') {
      numericValue = parseFloat(value);
    } else if (typeof value === 'number') {
      numericValue = value;
    } else {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }

    if (isNaN(numericValue)) {
      throw new BadRequestException(`${fieldName} must be a valid number`);
    }

    if (numericValue < 0 || numericValue > 100) {
      throw new BadRequestException(`${fieldName} must be between 0 and 100`);
    }

    // Round to 2 decimal places
    return Math.round(numericValue * 100) / 100;
  }

  // Static method for manual validation
  static validateTotalPercentage(values: number[], fieldName: string = 'Shares'): void {
    const total = values.reduce((sum, value) => sum + value, 0);

    if (Math.abs(total - 100) > 0.01) {
      // Allow for floating point precision
      throw new BadRequestException(
        `${fieldName} must total 100%. Current total: ${total.toFixed(2)}%`,
      );
    }
  }
}
