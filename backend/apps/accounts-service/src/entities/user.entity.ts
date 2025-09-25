import { UserRole } from '@shamba/common';
import { Exclude } from 'class-transformer';

export class UserEntity {
  id: string;
  email: string;
  
  @Exclude()
  password: string;
  
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(partial: Partial<UserEntity>) {
    Object.assign(this, partial);
  }

  // Business logic methods
  canCreateWills(): boolean {
    return this.role === UserRole.LAND_OWNER || this.role === UserRole.ADMIN;
  }

  canManageUsers(): boolean {
    return this.role === UserRole.ADMIN;
  }

  isProfileComplete(): boolean {
    return !!this.firstName && !!this.lastName && !!this.email;
  }

  // Security methods
  isEligibleForPasswordReset(): boolean {
    return this.isActive;
  }

  // Validation methods
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('Password must contain at least one special character');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}