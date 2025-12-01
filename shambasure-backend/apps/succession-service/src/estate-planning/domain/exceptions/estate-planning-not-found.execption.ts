// domain/exceptions/estate-planning-not-found.exception.ts
export class EstatePlanningNotFoundException extends Error {
  constructor(estatePlanningId: string) {
    super(`Estate Planning with ID ${estatePlanningId} not found`);
    this.name = 'EstatePlanningNotFoundException';
  }
}
