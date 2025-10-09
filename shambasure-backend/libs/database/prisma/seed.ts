import { PrismaClient, UserRole, RelationshipType, WillStatus, AssetType } from '@prisma/client';
import { hash } from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await hash('admin123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@shambasure.com' },
    update: {},
    create: {
      email: 'admin@shambasure.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: UserRole.ADMIN, // ✅ use enum
      profile: {
        create: {
          phoneNumber: '+254700000000',
          address: {
            street: 'Admin Street',
            city: 'Nairobi',
            country: 'Kenya',
          },
        },
      },
    },
  });

  // Create sample land owner
  const ownerPassword = await hash('owner123', 12);
  const landOwner = await prisma.user.upsert({
    where: { email: 'john.mwangi@example.com' },
    update: {},
    create: {
      email: 'john.mwangi@example.com',
      password: ownerPassword,
      firstName: 'John',
      lastName: 'Mwangi',
      role: UserRole.LAND_OWNER, // ✅ use enum
      profile: {
        create: {
          phoneNumber: '+254711222333',
          bio: 'Experienced farmer with 20 years of land ownership',
          address: {
            street: '123 Farm Road',
            city: 'Nakuru',
            country: 'Kenya',
          },
          nextOfKin: {
            name: 'Mary Mwangi',
            phone: '+254711222334',
            relationship: 'SPOUSE',
          },
        },
      },
    },
  });

  // Create sample family
  const family = await prisma.family.create({
    data: {
      name: 'Mwangi Family',
      creator: { connect: { id: landOwner.id } },
      members: {
        create: [{ userId: landOwner.id, role: RelationshipType.PARENT }], // ✅ use enum
      },
    },
  });

  // Create sample assets
  const landAsset = await prisma.asset.create({
    data: {
      name: 'Main Family Land',
      description: '10-acre agricultural land in Nakuru',
      type: AssetType.LAND_PARCEL, // ✅ use enum
      ownerId: landOwner.id,
    },
  });

  const vehicleAsset = await prisma.asset.create({
    data: {
      name: 'Family Vehicle',
      description: 'Toyota Land Cruiser 2020',
      type: AssetType.VEHICLE, // ✅ use enum
      ownerId: landOwner.id,
    },
  });

  // Create sample will
  const will = await prisma.will.create({
    data: {
      title: 'John Mwangi Final Will',
      status: WillStatus.DRAFT,
      testatorId: landOwner.id,
    },
  });

  console.log('Database seeded successfully!');
  console.log({
    admin: admin.email,
    landOwner: landOwner.email,
    family: family.name,
    assets: [landAsset.name, vehicleAsset.name],
    will: will.title,
  });
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
