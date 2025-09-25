import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { PrismaService } from '@shamba/database';
import { LoggerService } from '@shamba/observability';
import { UserProfileDto } from '@shamba/common';

@Injectable()
export class ProfileService {
  constructor(
    private userRepository: UserRepository,
    private prisma: PrismaService,
    private logger: LoggerService,
  ) {}

  async getProfile(userId: string): Promise<any> {
    this.logger.debug('Fetching user profile details', 'ProfileService', { userId });

    const user = await this.userRepository.findById(userId);
    
    const profile = await this.prisma.userProfile.findUnique({
      where: { userId },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      profile: profile || {},
    };
  }

  async updateProfile(userId: string, profileDto: UserProfileDto): Promise<any> {
    this.logger.info('Updating user profile', 'ProfileService', { userId });

    // Validate phone number if provided
    if (profileDto.phoneNumber && !this.isValidPhoneNumber(profileDto.phoneNumber)) {
      throw new BadRequestException('Invalid phone number format');
    }

    // Validate address structure if provided
    if (profileDto.address && !this.isValidAddress(profileDto.address)) {
      throw new BadRequestException('Invalid address format');
    }

    // Validate next of kin if provided
    if (profileDto.nextOfKin && !this.isValidNextOfKin(profileDto.nextOfKin)) {
      throw new BadRequestException('Invalid next of kin format');
    }

    const user = await this.userRepository.findById(userId);

    const profile = await this.prisma.userProfile.upsert({
      where: { userId },
      update: profileDto,
      create: {
        ...profileDto,
        userId,
      },
    });

    this.logger.info('User profile updated successfully', 'ProfileService', { userId });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      profile,
    };
  }

  async uploadProfileImage(userId: string, file: Express.Multer.File): Promise<{ message: string }> {
    this.logger.info('Uploading profile image', 'ProfileService', { userId });

    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and GIF are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // In a real implementation, you would:
    // 1. Upload to cloud storage (S3, etc.)
    // 2. Generate different sizes (thumbnail, medium, large)
    // 3. Update user profile with image URL

    this.logger.info('Profile image uploaded successfully', 'ProfileService', { 
      userId,
      fileSize: file.size,
      mimeType: file.mimetype,
    });

    return { message: 'Profile image uploaded successfully' };
  }

  async deleteProfileImage(userId: string): Promise<{ message: string }> {
    this.logger.info('Deleting profile image', 'ProfileService', { userId });

    // In a real implementation, you would:
    // 1. Delete from cloud storage
    // 2. Update user profile to remove image URL

    this.logger.info('Profile image deleted successfully', 'ProfileService', { userId });

    return { message: 'Profile image deleted successfully' };
  }

  private isValidPhoneNumber(phoneNumber: string): boolean {
    // Basic phone number validation - adjust for your needs
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(phoneNumber);
  }

  private isValidAddress(address: any): boolean {
    if (typeof address !== 'object' || address === null) {
      return false;
    }

    // Basic address validation
    const allowedFields = ['street', 'city', 'state', 'country', 'postalCode'];
    const addressFields = Object.keys(address);

    return addressFields.every(field => allowedFields.includes(field)) &&
           addressFields.length > 0;
  }

  private isValidNextOfKin(nextOfKin: any): boolean {
    if (typeof nextOfKin !== 'object' || nextOfKin === null) {
      return false;
    }

    return !!nextOfKin.name && !!nextOfKin.phone && !!nextOfKin.relationship;
  }
}