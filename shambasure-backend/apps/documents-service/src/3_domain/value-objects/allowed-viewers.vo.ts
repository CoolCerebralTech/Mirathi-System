import { UserId } from './user-id.vo';

export class AllowedViewers {
  private static readonly MAX_VIEWERS = 50;

  constructor(private readonly _userIds: UserId[]) {
    this.validate();
  }

  /** ✅ Factory methods */
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

  /** ✅ Returns value primitives safely */
  get userIds(): string[] {
    return this._userIds.map((id) => id.value);
  }

  includes(userId: UserId): boolean {
    return this._userIds.some((id) => id.equals(userId));
  }

  addViewer(userId: UserId): AllowedViewers {
    // Avoid duplicates
    if (this.includes(userId)) return this;
    return new AllowedViewers([...this._userIds, userId]);
  }

  removeViewer(userId: UserId): AllowedViewers {
    return new AllowedViewers(this._userIds.filter((id) => !id.equals(userId)));
  }

  /**
   * ✅ Adds multiple new viewers at once (used by Document.shareWith)
   * Returns a new immutable AllowedViewers instance
   */
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

  equals(other: AllowedViewers): boolean {
    if (this._userIds.length !== other._userIds.length) return false;
    return this._userIds.every((id) => other._userIds.some((oid) => id.equals(oid)));
  }
}
