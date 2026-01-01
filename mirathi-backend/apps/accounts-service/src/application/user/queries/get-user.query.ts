// src/application/user/queries/get-user.query.ts

export interface GetUserQueryPayload {
  userId: string;
}

export class GetUserQuery {
  constructor(public readonly payload: GetUserQueryPayload) {}
}
