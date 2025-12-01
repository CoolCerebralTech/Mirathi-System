// domain/exceptions/estate-not-found.exception.ts
export class EstateNotFoundException extends Error {
  constructor(estateId: string) {
    super(`Estate with ID ${estateId} not found`);
    this.name = 'EstateNotFoundException';
  }
}
