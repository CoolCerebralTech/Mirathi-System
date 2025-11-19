// FILE: src/types/assets.schemas.ts

import { z } from 'zod';
import { UserSchema } from './user.types';

// ============================================================================
// SHARED ENUMS AND REUSABLE SCHEMAS
// ============================================================================

/**
 * Defines the distinct types of assets a user can manage in the system.
 */
export const AssetTypeSchema = z.enum([
  'LAND_PARCEL',
  'BANK_ACCOUNT',
  'VEHICLE',
  'RESIDENTIAL_PROPERTY',
  'COMMERCIAL_PROPERTY',
  'OTHER',
]);
export type AssetType = z.infer<typeof AssetTypeSchema>;

/**
 * Basic geolocation schema for mapping assets.
 */
export const GeolocationSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// ============================================================================
// DISCRIMINATED UNION FOR ASSET-SPECIFIC DETAILS
//
// This is a powerful pattern. It ensures that based on the `type` of asset,
// the `details` object will have a specific, validated shape.
// ============================================================================

const LandParcelDetailsSchema = z.object({
  parcelNumber: z.string().trim().min(1, 'Parcel number is required'),
  location: z.string().trim().min(1, 'Location description is required'),
  acreage: z.coerce.number().positive('Acreage must be a positive number'),
  geolocation: GeolocationSchema.optional(),
});

const BankAccountDetailsSchema = z.object({
  bankName: z.string().trim().min(1, 'Bank name is required'),
  accountNumber: z.string().trim().min(1, 'Account number is required'),
  branch: z.string().trim().min(1, 'Branch name is required'),
});

const VehicleDetailsSchema = z.object({
  make: z.string().trim().min(1, 'Vehicle make is required'),
  model: z.string().trim().min(1, 'Vehicle model is required'),
  year: z.coerce.number().int().min(1900).max(new Date().getFullYear() + 1),
  licensePlate: z.string().trim().min(1, 'License plate is required'),
});

const PropertyDetailsSchema = z.object({
  address: z.string().trim().min(1, 'Property address is required'),
  propertyType: z.string().optional(), // e.g., 'Apartment', 'Maisonette'
});

const OtherDetailsSchema = z.object({
  notes: z.string().optional(),
});

// ============================================================================
// CORE ASSET SCHEMAS (API Responses & Form Payloads)
// ============================================================================

/**
 * The base schema for an Asset, intended for internal composition.
 */
const BaseAssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().trim().min(2, 'Asset name is required'),
  description: z.string().max(1000).nullable(),
  ownerId: z.string().uuid(),
  // For performance, the API may optionally include the full owner object
  owner: UserSchema.optional(),
  createdAt: z.string().datetime().transform((val) => new Date(val)),
  updatedAt: z.string().datetime().transform((val) => new Date(val)),
});

/**
 * The main Asset Schema using a discriminated union.
 * This ensures that if `type` is 'LAND_PARCEL', `details` must match LandParcelDetailsSchema.
 */
export const AssetSchema = z.discriminatedUnion('type', [
  BaseAssetSchema.extend({
    type: z.literal(AssetTypeSchema.enum.LAND_PARCEL),
    details: LandParcelDetailsSchema,
  }),
  BaseAssetSchema.extend({
    type: z.literal(AssetTypeSchema.enum.BANK_ACCOUNT),
    details: BankAccountDetailsSchema,
  }),
  BaseAssetSchema.extend({
    type: z.literal(AssetTypeSchema.enum.VEHICLE),
    details: VehicleDetailsSchema,
  }),
  BaseAssetSchema.extend({
    type: z.literal(AssetTypeSchema.enum.RESIDENTIAL_PROPERTY),
    details: PropertyDetailsSchema,
  }),
  BaseAssetSchema.extend({
    type: z.literal(AssetTypeSchema.enum.COMMERCIAL_PROPERTY),
    details: PropertyDetailsSchema,
  }),
  BaseAssetSchema.extend({
    type: z.literal(AssetTypeSchema.enum.OTHER),
    details: OtherDetailsSchema,
  }),
]);

/**
 * Schema for CREATING an asset. Also a discriminated union to ensure
 * the correct details are provided upon creation.
 */
export const CreateAssetSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal(AssetTypeSchema.enum.LAND_PARCEL),
    name: z.string().trim().min(2, 'Asset name is required'),
    description: z.string().max(1000).optional(),
    details: LandParcelDetailsSchema,
  }),
  z.object({
    type: z.literal(AssetTypeSchema.enum.BANK_ACCOUNT),
    name: z.string().trim().min(2, 'Asset name is required'),
    description: z.string().max(1000).optional(),
    details: BankAccountDetailsSchema,
  }),
  // ... other types would follow the same pattern ...
]);

/**
 * Schema for UPDATING an asset. All fields are optional.
 * Prevents submission of an empty object.
 */
export const UpdateAssetSchema = z
  .object({
    name: z.string().trim().min(2, 'Asset name is required').optional(),
    description: z.string().max(1000).nullable().optional(),
    // For updates, the specific details object can be partially updated
    details: LandParcelDetailsSchema.partial()
      .or(BankAccountDetailsSchema.partial())
      .or(VehicleDetailsSchema.partial())
      .or(PropertyDetailsSchema.partial())
      .or(OtherDetailsSchema.partial())
      .optional(),
  })
  .refine(
    (data) => Object.keys(data).length > 0,
    'At least one field must be provided to update.',
  );

// ============================================================================
// API QUERY SCHEMA
// ============================================================================

export const AssetQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().optional(),
  type: AssetTypeSchema.optional(),
  search: z.string().optional(),
  ownerId: z.string().uuid().optional(),
});

// ============================================================================
// INFERRED TYPES
// ============================================================================

export type Asset = z.infer<typeof AssetSchema>;
export type CreateAssetFormInput = z.input<typeof CreateAssetSchema>;
export type CreateAssetInput = z.infer<typeof CreateAssetSchema>;
export type UpdateAssetFormInput = z.input<typeof UpdateAssetSchema>;
export type UpdateAssetInput = z.infer<typeof UpdateAssetSchema>;
export type AssetQuery = z.infer<typeof AssetQuerySchema>;
