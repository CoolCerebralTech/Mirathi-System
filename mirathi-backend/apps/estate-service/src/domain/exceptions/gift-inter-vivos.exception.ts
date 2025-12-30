// src/estate-service/src/domain/exceptions/gift-inter-vivos.exception.ts

export class GiftLogicException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GiftLogicException';
    Object.setPrototypeOf(this, GiftLogicException.prototype);
  }
}

export class InvalidGiftValueException extends Error {
  constructor(estateId: string, amount: number, currency: string = 'KES') {
    super(
      `Invalid gift value ${amount} ${currency} for estate ${estateId}. Gift value must be positive.`,
    );
    this.name = 'InvalidGiftValueException';
    Object.setPrototypeOf(this, InvalidGiftValueException.prototype);
  }
}

export class GiftContestationException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GiftContestationException';
    Object.setPrototypeOf(this, GiftContestationException.prototype);
  }
}

export class GiftValidationException extends Error {
  constructor(field: string, reason: string) {
    super(`Validation failed for ${field}: ${reason}`);
    this.name = 'GiftValidationException';
    Object.setPrototypeOf(this, GiftValidationException.prototype);
  }
}
