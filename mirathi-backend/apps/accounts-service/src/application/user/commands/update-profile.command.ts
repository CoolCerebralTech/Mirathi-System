// src/application/user/commands/update-profile.command.ts

export interface UpdateProfileCommandPayload {
  userId: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  county?: string;
  physicalAddress?: string;
}

export class UpdateProfileCommand {
  constructor(public readonly payload: UpdateProfileCommandPayload) {}
}
