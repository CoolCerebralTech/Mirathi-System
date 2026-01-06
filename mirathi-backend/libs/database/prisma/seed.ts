// ============================================================================
// prisma/seed.ts
// Production-Ready Seed File for Junior Howkins Test Account
// Net Worth Target: KES 40,000,000
// ============================================================================

import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // ============================================================================
  // 1. CREATE USER ACCOUNT
  // ============================================================================
  
  const hashedPassword = await argon2.hash('9UjC38kpFKrymX9?');
  
  const user = await prisma.user.upsert({
    where: { email: 'juniorhowkins@gmail.com' },
    update: {},
    create: {
      email: 'juniorhowkins@gmail.com',
      password: hashedPassword,
      firstName: 'Junior',
      lastName: 'Howkins',
      role: 'USER',
      isActive: true,
      profile: {
        create: {
          bio: 'Software Developer & Estate Planner',
          phoneNumber: '+254712345678',
          phoneVerified: true,
          emailVerified: true,
          marketingOptIn: true,
          address: {
            street: 'Riverside Drive',
            city: 'Nairobi',
            county: 'NAIROBI',
            postalCode: '00100',
          },
          nextOfKin: {
            name: 'Sarah Howkins',
            relationship: 'Spouse',
            phone: '+254723456789',
            email: 'sarah.howkins@example.com',
          },
        },
      },
    },
  });

  console.log('✅ User created:', user.email);

  // ============================================================================
  // 2. CREATE ESTATE (Net Worth: KES 40M)
  // ============================================================================
  
  const estate = await prisma.estate.upsert({
    where: { userId: user.id },
    update: {},
    create: {
      userId: user.id,
      userName: 'Junior Howkins',
      kraPin: 'A012345678Z',
      totalAssets: 45000000, // KES 45M in assets
      totalDebts: 5000000,   // KES 5M in debts
      netWorth: 40000000,    // Net: KES 40M
      isInsolvent: false,
      currency: 'KES',
    },
  });

  console.log('✅ Estate created - Net Worth: KES', estate.netWorth.toNumber());

  // ============================================================================
  // 3. CREATE ASSETS (Total: KES 45M)
  // ============================================================================

  // --- LAND ASSETS (KES 20M) ---
  
  const landKiambu = await prisma.asset.create({
    data: {
      estateId: estate.id,
      name: 'Residential Land - Kiambu',
      description: 'Half-acre plot near Thika Road, suitable for residential development',
      category: 'LAND',
      status: 'VERIFIED',
      estimatedValue: 8000000,
      currency: 'KES',
      isVerified: true,
      isEncumbered: true,
      encumbranceDetails: 'Mortgage of KES 2M with Equity Bank',
      proofDocumentUrl: 'https://storage.example.com/title-deed-kiambu.pdf',
      purchaseDate: new Date('2020-03-15'),
      location: 'Kiambu County, Thika Sub-County',
      landDetails: {
        create: {
          titleDeedNumber: 'KIAMBU/THIKA/12345',
          parcelNumber: 'KIAMBU/THIKA/BLOCK 1/678',
          county: 'KIAMBU',
          subCounty: 'Thika Sub-County',
          landCategory: 'RESIDENTIAL',
          sizeInAcres: 0.5,
        },
      },
    },
  });

  const landNakuru = await prisma.asset.create({
    data: {
      estateId: estate.id,
      name: 'Agricultural Land - Nakuru',
      description: '5-acre farm near Naivasha, suitable for horticulture',
      category: 'LAND',
      status: 'ACTIVE',
      estimatedValue: 12000000,
      currency: 'KES',
      isVerified: false,
      isEncumbered: false,
      purchaseDate: new Date('2018-07-20'),
      location: 'Nakuru County, Naivasha Sub-County',
      landDetails: {
        create: {
          titleDeedNumber: 'NAKURU/NAIVASHA/67890',
          parcelNumber: 'NAKURU/NAIVASHA/BLOCK 5/234',
          county: 'NAKURU',
          subCounty: 'Naivasha Sub-County',
          landCategory: 'AGRICULTURAL',
          sizeInAcres: 5.0,
        },
      },
    },
  });

  // --- VEHICLE ASSETS (KES 4.5M) ---
  
  const vehicle1 = await prisma.asset.create({
    data: {
      estateId: estate.id,
      name: 'Toyota Land Cruiser V8',
      description: 'Personal vehicle, excellent condition',
      category: 'VEHICLE',
      status: 'VERIFIED',
      estimatedValue: 3500000,
      currency: 'KES',
      isVerified: true,
      isEncumbered: false,
      proofDocumentUrl: 'https://storage.example.com/logbook-kca123a.pdf',
      purchaseDate: new Date('2019-11-10'),
      location: 'Nairobi',
      vehicleDetails: {
        create: {
          registrationNumber: 'KCA 123A',
          make: 'Toyota',
          model: 'Land Cruiser V8',
          year: 2019,
          vehicleCategory: 'PERSONAL_CAR',
        },
      },
    },
  });

  const vehicle2 = await prisma.asset.create({
    data: {
      estateId: estate.id,
      name: 'Nissan NP300 Pickup',
      description: 'Commercial pickup for farm use',
      category: 'VEHICLE',
      status: 'ACTIVE',
      estimatedValue: 1000000,
      currency: 'KES',
      isVerified: false,
      isEncumbered: false,
      purchaseDate: new Date('2021-05-20'),
      location: 'Nakuru',
      vehicleDetails: {
        create: {
          registrationNumber: 'KBZ 456B',
          make: 'Nissan',
          model: 'NP300',
          year: 2021,
          vehicleCategory: 'COMMERCIAL_VEHICLE',
        },
      },
    },
  });

  // --- PROPERTY ASSETS (KES 15M) ---
  
  const property = await prisma.asset.create({
    data: {
      estateId: estate.id,
      name: '3-Bedroom Apartment - Kilimani',
      description: 'Modern apartment in Kilimani, Nairobi. Rental income: KES 80,000/month',
      category: 'PROPERTY',
      status: 'VERIFIED',
      estimatedValue: 15000000,
      currency: 'KES',
      isVerified: true,
      isEncumbered: true,
      encumbranceDetails: 'Mortgage of KES 3M with KCB Bank',
      proofDocumentUrl: 'https://storage.example.com/title-deed-kilimani.pdf',
      purchaseDate: new Date('2017-09-01'),
      location: 'Kilimani, Nairobi',
    },
  });

  // --- BANK ACCOUNTS (KES 2.5M) ---
  
  const bankAccount1 = await prisma.asset.create({
    data: {
      estateId: estate.id,
      name: 'Equity Bank - Savings Account',
      description: 'Primary savings account',
      category: 'BANK_ACCOUNT',
      status: 'ACTIVE',
      estimatedValue: 1500000,
      currency: 'KES',
      isVerified: false,
      isEncumbered: false,
      location: 'Equity Bank, Westlands Branch',
    },
  });

  const bankAccount2 = await prisma.asset.create({
    data: {
      estateId: estate.id,
      name: 'KCB Bank - Current Account',
      description: 'Business current account',
      category: 'BANK_ACCOUNT',
      status: 'ACTIVE',
      estimatedValue: 1000000,
      currency: 'KES',
      isVerified: false,
      isEncumbered: false,
      location: 'KCB Bank, Kimathi Street',
    },
  });

  // --- INVESTMENTS (KES 2M) ---
  
  const investment = await prisma.asset.create({
    data: {
      estateId: estate.id,
      name: 'SACCO Shares - Stima SACCO',
      description: 'Monthly contributions + dividends',
      category: 'INVESTMENT',
      status: 'ACTIVE',
      estimatedValue: 2000000,
      currency: 'KES',
      isVerified: false,
      isEncumbered: false,
      location: 'Stima SACCO',
    },
  });

  console.log('✅ Assets created: 8 assets totaling KES 45M');

  // ============================================================================
  // 4. CREATE DEBTS (Total: KES 5M)
  // ============================================================================

  const debt1 = await prisma.debt.create({
    data: {
      estateId: estate.id,
      creditorName: 'Equity Bank Kenya',
      creditorContact: '+254711111111',
      description: 'Home mortgage for Kiambu land',
      category: 'MORTGAGE',
      priority: 'HIGH',
      status: 'OUTSTANDING',
      originalAmount: 3000000,
      outstandingBalance: 2000000,
      currency: 'KES',
      dueDate: new Date('2030-03-15'),
      isSecured: true,
      securityDetails: 'Secured against Kiambu land (Title: KIAMBU/THIKA/12345)',
    },
  });

  const debt2 = await prisma.debt.create({
    data: {
      estateId: estate.id,
      creditorName: 'KCB Bank',
      creditorContact: '+254722222222',
      description: 'Property mortgage for Kilimani apartment',
      category: 'MORTGAGE',
      priority: 'HIGH',
      status: 'OUTSTANDING',
      originalAmount: 5000000,
      outstandingBalance: 3000000,
      currency: 'KES',
      dueDate: new Date('2032-09-01'),
      isSecured: true,
      securityDetails: 'Secured against Kilimani apartment',
    },
  });

  console.log('✅ Debts created: 2 debts totaling KES 5M');

  // ============================================================================
  // 5. CREATE FAMILY TREE
  // ============================================================================

  const family = await prisma.family.create({
    data: {
      creatorId: user.id,
      name: 'The Howkins Family',
      description: 'Nuclear family based in Nairobi',
      homeCounty: 'NAIROBI',
      isPolygamous: false,
      totalMembers: 4,
      totalMinors: 2,
      totalSpouses: 1,
      hasMissingLinks: false,
      completenessScore: 85,
    },
  });

  // Self (Junior Howkins)
  const memberSelf = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      userId: user.id,
      firstName: 'Junior',
      lastName: 'Howkins',
      relationship: 'SELF',
      gender: 'MALE',
      dateOfBirth: new Date('1988-05-15'),
      placeOfBirth: 'Nairobi, Kenya',
      nationalId: '12345678',
      kraPin: 'A012345678Z',
      phoneNumber: '+254712345678',
      email: 'juniorhowkins@gmail.com',
      currentAddress: 'Riverside Drive, Nairobi',
      isAlive: true,
      isMinor: false,
      age: 36,
      hasDisability: false,
      isMentallyCapable: true,
      isAdopted: false,
      verificationStatus: 'VERIFIED',
    },
  });

  // Spouse (Sarah Howkins)
  const memberSpouse = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      firstName: 'Sarah',
      maidenName: 'Wanjiku',
      lastName: 'Howkins',
      relationship: 'SPOUSE',
      gender: 'FEMALE',
      dateOfBirth: new Date('1990-08-22'),
      placeOfBirth: 'Kiambu, Kenya',
      nationalId: '23456789',
      kraPin: 'A023456789Y',
      phoneNumber: '+254723456789',
      email: 'sarah.howkins@example.com',
      currentAddress: 'Riverside Drive, Nairobi',
      isAlive: true,
      isMinor: false,
      age: 34,
      hasDisability: false,
      isMentallyCapable: true,
      isAdopted: false,
      verificationStatus: 'VERIFIED',
    },
  });

  // Child 1 (Ethan Howkins)
  const memberChild1 = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      firstName: 'Ethan',
      lastName: 'Howkins',
      relationship: 'CHILD',
      gender: 'MALE',
      dateOfBirth: new Date('2015-03-10'),
      placeOfBirth: 'Nairobi, Kenya',
      birthCertNo: 'BIRTH-2015-12345',
      isAlive: true,
      isMinor: true,
      age: 9,
      hasDisability: false,
      isMentallyCapable: true,
      isAdopted: false,
      verificationStatus: 'VERIFIED',
    },
  });

  // Child 2 (Emma Howkins)
  const memberChild2 = await prisma.familyMember.create({
    data: {
      familyId: family.id,
      firstName: 'Emma',
      lastName: 'Howkins',
      relationship: 'CHILD',
      gender: 'FEMALE',
      dateOfBirth: new Date('2018-11-05'),
      placeOfBirth: 'Nairobi, Kenya',
      birthCertNo: 'BIRTH-2018-67890',
      isAlive: true,
      isMinor: true,
      age: 6,
      hasDisability: false,
      isMentallyCapable: true,
      isAdopted: false,
      verificationStatus: 'VERIFIED',
    },
  });

  // Marriage Record
  const marriage = await prisma.marriage.create({
    data: {
      familyId: family.id,
      spouse1Id: memberSelf.id,
      spouse2Id: memberSpouse.id,
      type: 'MONOGAMOUS',
      status: 'ACTIVE',
      marriageDate: new Date('2014-06-20'),
      isPolygamous: false,
      certNumber: 'MARRIAGE-2014-NAIROBI-12345',
      registeredAt: new Date('2014-06-20'),
      registryOffice: 'Nairobi Registry Office',
      numberOfChildren: 2,
      verificationStatus: 'VERIFIED',
    },
  });

  console.log('✅ Family created: 4 members (2 adults, 2 minors)');

  // ============================================================================
  // 6. CREATE GUARDIANSHIP FOR MINORS
  // ============================================================================

  const guardianship1 = await prisma.guardianship.create({
    data: {
      familyId: family.id,
      wardId: memberChild1.id,
      wardName: 'Ethan Howkins',
      wardAge: 9,
      status: 'ACTIVE',
      eligibilityScore: 100,
      proximityScore: 100,
      relationshipScore: 100,
      overallScore: 100,
      legalReference: 'Section 70, Children Act (Cap 141)',
      warnings: [],
      blockingIssues: [],
      isCompliant: true,
    },
  });

  await prisma.guardianAssignment.create({
    data: {
      guardianshipId: guardianship1.id,
      guardianId: memberSpouse.id,
      guardianName: 'Sarah Howkins',
      wardId: memberChild1.id,
      isPrimary: true,
      isAlternate: false,
      priorityOrder: 1,
      isActive: true,
      eligibilityScore: 100,
      courtApproved: false,
      appointedDate: new Date('2015-03-10'),
      activatedDate: new Date('2015-03-10'),
    },
  });

  const guardianship2 = await prisma.guardianship.create({
    data: {
      familyId: family.id,
      wardId: memberChild2.id,
      wardName: 'Emma Howkins',
      wardAge: 6,
      status: 'ACTIVE',
      eligibilityScore: 100,
      proximityScore: 100,
      relationshipScore: 100,
      overallScore: 100,
      legalReference: 'Section 70, Children Act (Cap 141)',
      warnings: [],
      blockingIssues: [],
      isCompliant: true,
    },
  });

  await prisma.guardianAssignment.create({
    data: {
      guardianshipId: guardianship2.id,
      guardianId: memberSpouse.id,
      guardianName: 'Sarah Howkins',
      wardId: memberChild2.id,
      isPrimary: true,
      isAlternate: false,
      priorityOrder: 1,
      isActive: true,
      eligibilityScore: 100,
      courtApproved: false,
      appointedDate: new Date('2018-11-05'),
      activatedDate: new Date('2018-11-05'),
    },
  });

  console.log('✅ Guardianships created: 2 (Sarah as primary guardian)');

  // ============================================================================
  // 7. CREATE WILL
  // ============================================================================

  const will = await prisma.will.create({
    data: {
      userId: user.id,
      testatorName: 'Junior Howkins',
      status: 'ACTIVE',
      versionNumber: 1,
      executorName: 'Sarah Howkins',
      executorPhone: '+254723456789',
      executorEmail: 'sarah.howkins@example.com',
      executorRelationship: 'Spouse',
      funeralWishes: 'Simple ceremony at All Saints Cathedral, Nairobi',
      burialLocation: 'Lang\'ata Cemetery, Nairobi',
      specialInstructions: 'Ensure children\'s education is prioritized. Maintain the Nakuru farm for agricultural training.',
      hasExecutor: true,
      hasBeneficiaries: true,
      hasWitnesses: true,
      isComplete: true,
      completenessScore: 95,
      validationWarnings: ['Consider adding alternate executor'],
    },
  });

  // Bequests
  await prisma.bequest.createMany({
    data: [
      {
        willId: will.id,
        beneficiaryName: 'Sarah Howkins',
        beneficiaryType: 'SPOUSE',
        relationship: 'Wife',
        bequestType: 'PERCENTAGE',
        percentage: 50,
        description: 'My wife Sarah shall receive 50% of my entire estate',
        hasConditions: false,
      },
      {
        willId: will.id,
        beneficiaryName: 'Ethan Howkins',
        beneficiaryType: 'CHILD',
        relationship: 'Son',
        bequestType: 'PERCENTAGE',
        percentage: 25,
        description: 'My son Ethan shall receive 25% of my estate, held in trust until age 21',
        hasConditions: true,
        conditions: 'Funds to be held in trust by Sarah Howkins until Ethan turns 21 years old',
      },
      {
        willId: will.id,
        beneficiaryName: 'Emma Howkins',
        beneficiaryType: 'CHILD',
        relationship: 'Daughter',
        bequestType: 'PERCENTAGE',
        percentage: 25,
        description: 'My daughter Emma shall receive 25% of my estate, held in trust until age 21',
        hasConditions: true,
        conditions: 'Funds to be held in trust by Sarah Howkins until Emma turns 21 years old',
      },
      {
        willId: will.id,
        assetId: landNakuru.id,
        beneficiaryName: 'Ethan Howkins',
        beneficiaryType: 'CHILD',
        relationship: 'Son',
        bequestType: 'SPECIFIC_ASSET',
        description: 'The Nakuru agricultural land shall go to my son Ethan for farming',
        hasConditions: true,
        conditions: 'Must maintain the land for agricultural use for at least 10 years',
      },
      {
        willId: will.id,
        beneficiaryName: 'Hope Children\'s Home',
        beneficiaryType: 'CHARITY',
        relationship: 'Charitable Organization',
        bequestType: 'CASH_AMOUNT',
        cashAmount: 500000,
        description: 'KES 500,000 to Hope Children\'s Home, Nairobi',
        hasConditions: false,
      },
    ],
  });

  // Witnesses
  await prisma.witness.createMany({
    data: [
      {
        willId: will.id,
        fullName: 'David Kimani Mwangi',
        nationalId: '34567890',
        phoneNumber: '+254734567890',
        email: 'david.kimani@example.com',
        address: 'Karen, Nairobi',
        status: 'SIGNED',
        signedAt: new Date('2024-01-15T10:00:00Z'),
        isOver18: true,
        isNotBeneficiary: true,
        isMentallyCapable: true,
      },
      {
        willId: will.id,
        fullName: 'Grace Akinyi Odhiambo',
        nationalId: '45678901',
        phoneNumber: '+254745678901',
        email: 'grace.akinyi@example.com',
        address: 'Westlands, Nairobi',
        status: 'SIGNED',
        signedAt: new Date('2024-01-15T10:15:00Z'),
        isOver18: true,
        isNotBeneficiary: true,
        isMentallyCapable: true,
      },
    ],
  });

  console.log('✅ Will created with 5 bequests and 2 witnesses');

  // ============================================================================
  // 8. CREATE DOCUMENTS
  // ============================================================================

  await prisma.document.createMany({
    data: [
      {
        uploaderId: user.id,
        documentName: 'Title Deed - Kiambu Land',
        referenceNumber: 'KIAMBU/THIKA/12345',
        referenceType: 'TITLE_DEED',
        status: 'VERIFIED',
        storageKey: 'documents/title-deed-kiambu-12345.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 1024000,
        ocrConfidence: 0.98,
        verifiedAt: new Date('2024-01-10T09:00:00Z'),
        uploadedAt: new Date('2024-01-09T14:30:00Z'),
      },
      {
        uploaderId: user.id,
        documentName: 'Vehicle Logbook - Land Cruiser',
        referenceNumber: 'KCA 123A',
        referenceType: 'OTHER',
        status: 'VERIFIED',
        storageKey: 'documents/logbook-kca123a.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 512000,
        ocrConfidence: 0.95,
        verifiedAt: new Date('2024-01-12T11:00:00Z'),
        uploadedAt: new Date('2024-01-11T16:45:00Z'),
      },
      {
        uploaderId: user.id,
        documentName: 'National ID - Junior Howkins',
        referenceNumber: '12345678',
        referenceType: 'NATIONAL_ID',
        status: 'VERIFIED',
        storageKey: 'documents/national-id-12345678.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 256000,
        ocrConfidence: 0.99,
        verifiedAt: new Date('2024-01-05T08:00:00Z'),
        uploadedAt: new Date('2024-01-05T08:00:00Z'),
      },
      {
        uploaderId: user.id,
        documentName: 'Marriage Certificate',
        referenceNumber: 'MARRIAGE-2014-NAIROBI-12345',
        referenceType: 'MARRIAGE_CERTIFICATE',
        status: 'VERIFIED',
        storageKey: 'documents/marriage-cert-12345.pdf',
        mimeType: 'application/pdf',
        fileSizeBytes: 384000,
        ocrConfidence: 0.97,
        verifiedAt: new Date('2024-01-06T10:00:00Z'),
        uploadedAt: new Date('2024-01-06T10:00:00Z'),
      },
    ],
  });

  console.log('✅ Documents created: 4 verified documents');

  // ============================================================================
  // 9. CREATE READINESS ASSESSMENT
  // ============================================================================

  const assessment = await prisma.readinessAssessment.create({
    data: {
      userId: user.id,
      estateId: estate.id,
      familyId: family.id,
      regime: 'TESTATE',
      religion: 'STATUTORY',
      marriageType: 'MONOGAMOUS',
      targetCourt: 'HIGH_COURT',
      hasWill: true,
      hasMinors: true,
      isPolygamous: false,
      isInsolvent: false,
      requiresGuardian: true,
      overallScore: 85,
      status: 'READY',
      documentScore: 28,
      legalScore: 26,
      familyScore: 18,
      financialScore: 13,
      totalRisks: 2,
      criticalRisks: 0,
      highRisks: 0,
      mediumRisks: 2,
      nextSteps: [
        'Upload Title Deed for Nakuru land',
        'Add alternate executor to Will',
        'Consider life insurance for children',
      ],
      estimatedDaysToReady: 7,
      lastCheckedAt: new Date(),
      checkCount: 3,
    },
  });

  // Risk Flags
  await prisma.riskFlag.createMany({
    data: [
      {
        assessmentId: assessment.id,
        severity: 'MEDIUM',
        category: 'MISSING_DOCUMENT',
        title: 'Missing Title Deed for Nakuru Land',
        description: 'The Nakuru agricultural land does not have a verified title deed uploaded',
        legalBasis: 'S.26 LSA - All land must have title deeds for succession',
        isResolved: false,
        resolutionSteps: ['Upload scanned copy of title deed', 'Request verification from lands office'],
        isBlocking: false,
        affectsScore: 5,
      },
      {
        assessmentId: assessment.id,
        severity: 'MEDIUM',
        category: 'EXECUTOR_ISSUE',
        title: 'No Alternate Executor Named',
        description: 'Will only has one executor (Sarah). Consider naming an alternate',
        legalBasis: 'S.52 LSA - Best practice to have alternate executor',
        isResolved: false,
        resolutionSteps: ['Add alternate executor to will', 'Notify alternate executor of role'],
        isBlocking: false,
        affectsScore: 5,
      },
    ],
  });

  console.log('✅ Readiness assessment created: 85% complete');

  // ============================================================================
  // 10. CREATE EXECUTOR ROADMAP
  // ============================================================================

  const roadmap = await prisma.executorRoadmap.create({
    data: {
      userId: user.id,
      estateId: estate.id,
      assessmentId: assessment.id,
      regime: 'TESTATE',
      religion: 'STATUTORY',
      targetCourt: 'HIGH_COURT',
      currentPhase: 'PRE_FILING',
      overallProgress: 60,
      totalTasks: 15,
      completedTasks: 9,
      availableTasks: 4,
      lockedTasks: 2,
      estimatedDays: 90,
      startedAt: new Date('2024-01-01'),
      estimatedCompletion: new Date('2024-04-01'),
    },
  });

  await prisma.roadmapTask.createMany({
    data: [
      {
        roadmapId: roadmap.id,
        phase: 'PRE_FILING',
        category: 'IDENTITY_VERIFICATION',
        orderIndex: 1,
        title: 'Verify Testator Identity',
        description: 'Upload and verify National ID and KRA PIN',
        status: 'COMPLETED',
        dependsOnTaskIds: [],
        unlocksTaskIds: [],
        whatIsIt: 'Identity verification ensures the will is from the correct person',
        whyNeeded: 'Required by S.11 LSA - Must prove testator identity',
        howToGet: 'Upload scanned copy of National ID',
        estimatedDays: 1,
        completedAt: new Date('2024-01-05'),
      },
      {
        roadmapId: roadmap.id,
        phase: 'PRE_FILING',
        category: 'ASSET_DISCOVERY',
        orderIndex: 2,
        title: 'Complete Asset Inventory',
        description: 'List all assets with estimated values',
        status: 'COMPLETED',
        dependsOnTaskIds: [],
        unlocksTaskIds: [],
        whatIsIt: 'Full list of everything owned by the deceased',
        whyNeeded: 'Required for P&A 12 form',
        howToGet: 'Add assets through the asset management interface',
        estimatedDays: 7,
        completedAt: new Date('2024-01-15'),
      },
      {
        roadmapId: roadmap.id,
        phase: 'PRE_FILING',
        category: 'DOCUMENT_COLLECTION',
        orderIndex: 3,
        title: 'Collect Title Deeds',
        description: 'Gather all land title deeds',
        status: 'IN_PROGRESS',
        dependsOnTaskIds: [],
        unlocksTaskIds: [],
        whatIsIt: 'Original or certified copies of land ownership documents',
        whyNeeded: 'Mandatory for land transfer during succession',
        howToGet: 'Visit Ministry of Lands or request from family safe',
        estimatedDays: 14,
      },
    ],
  });

  console.log('✅ Executor roadmap created: 15 tasks, 60% complete');

  // ============================================================================
  // SUMMARY
  // ============================================================================

  console.log('\n🎉 Seed completed successfully!\n');
  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`👤 User: ${user.email}`);
  console.log(`🏦 Estate Net Worth: KES ${estate.netWorth.toLocaleString()}`);
  console.log(`📦 Assets: 8 items totaling KES 45M`);
  console.log(`   - Land: 2 (KES 20M)`);
  console.log(`   - Vehicles: 2 (KES 4.5M)`);
  console.log(`   - Property: 1 (KES 15M)`);
  console.log(`   - Bank Accounts: 2 (KES 2.5M)`);
  console.log(`   - Investments: 1 (KES 2M)`);
  console.log(`💳 Debts: 2 items totaling KES 5M`);
  console.log(`   - Mortgages: 2 (KES 5M outstanding)`);
  console.log(`👨‍👩‍👧‍👦 Family: 4 members (2 adults, 2 minors)`);
  console.log(`📄 Will: Active with 5 bequests, 2 witnesses`);
  console.log(`📋 Documents: 4 verified documents`);
  console.log(`✅ Readiness: 85% complete`);
  console.log('='.repeat(60));
  console.log('\n✨ Ready for frontend development!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });