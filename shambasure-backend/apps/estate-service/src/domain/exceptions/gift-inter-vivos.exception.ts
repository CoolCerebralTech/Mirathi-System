// src/estate-service/src/domain/exceptions/gift-inter-vivos.exception.ts

export class GiftException extends Error {
  constructor(
    message: string,
    public readonly giftId?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, GiftException.prototype);
  }
}

/**
 * Thrown when business rules for gifts are violated.
 * e.g. "Cannot contest a reclassified loan"
 */
export class GiftLogicException extends GiftException {
  constructor(message: string, giftId?: string) {
    super(message, giftId);
  }
}

/**
 * Thrown if gift value is invalid (e.g. negative or zero).
 */
export class InvalidGiftValueException extends GiftException {
  constructor(estateId: string, amount: number) {
    super(`Invalid gift value: ${amount}. Must be greater than zero.`, estateId);
  }
}

/**
 * Thrown if Hotchpot calculation fails due to missing recipient data.
 */
export class MissingRecipientException extends GiftException {
  constructor(giftId: string) {
    super(`Cannot apply Hotchpot logic: Gift ${giftId} has no linked Recipient`, giftId);
  }
}
