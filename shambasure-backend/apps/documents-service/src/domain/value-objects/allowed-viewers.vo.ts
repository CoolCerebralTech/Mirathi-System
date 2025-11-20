import { UserId } from './user-id.vo';

export class AllowedViewers {
  private static readonly MAX_VIEWERS = 50;

  constructor(private readonly _userIds: UserId[]) {
    this.validate();
  }

  static create(userIds: UserId[]): AllowedViewers {
    return new AllowedViewers(userIds);
  }

  static createEmpty(): AllowedViewers {
    return new AllowedViewers([]);
  }

  private validate(): void {
    if (this._userIds.length > AllowedViewers.MAX_VIEWERS) {
      throw new Error(`Cannot exceed ${AllowedViewers.MAX_VIEWERS} allowed viewers`);
    }

    this._userIds.forEach((id) => {
      if (!(id instanceof UserId)) {
        throw new Error(`Invalid UserId in allowed viewers`);
      }
    });
  }

  get userIds(): string[] {
    return this._userIds.map((id) => id.value);
  }
  toArray(): UserId[] {
    return [...this._userIds];
  }

  includes(userId: UserId): boolean {
    return this._userIds.some((id) => id.equals(userId));
  }

  addViewer(userId: UserId): AllowedViewers {
    if (this.includes(userId)) return this;
    return new AllowedViewers([...this._userIds, userId]);
  }

  removeViewer(userId: UserId): AllowedViewers {
    return new AllowedViewers(this._userIds.filter((id) => !id.equals(userId)));
  }

  grantAccess(userIds: UserId[]): AllowedViewers {
    const combined = [...this._userIds];
    userIds.forEach((userId) => {
      if (!combined.some((existing) => existing.equals(userId))) {
        combined.push(userId);
      }
    });
    if (combined.length > AllowedViewers.MAX_VIEWERS) {
      throw new Error(`Cannot exceed ${AllowedViewers.MAX_VIEWERS} allowed viewers`);
    }
    return new AllowedViewers(combined);
  }

  revokeAccess(userIds: UserId[]): AllowedViewers {
    const remaining = this._userIds.filter(
      (existing) => !userIds.some((target) => existing.equals(target)),
    );
    return new AllowedViewers(remaining);
  }

  equals(other: AllowedViewers): boolean {
    if (this._userIds.length !== other._userIds.length) return false;
    return this._userIds.every((id) => other._userIds.some((oid) => id.equals(oid)));
  }
}
