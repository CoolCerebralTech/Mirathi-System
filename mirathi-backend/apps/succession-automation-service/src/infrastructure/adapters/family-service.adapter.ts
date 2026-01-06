export interface FamilyData {
  id: string;
  religion: string;
  numberOfSpouses: number;
  numberOfChildren: number;
  numberOfMinors: number;
  isPolygamous: boolean;
  hasGuardianForMinors: boolean;
  members: Array<{
    id: string;
    firstName: string;
    lastName: string;
    relationship: string;
    isMinor: boolean;
    isAlive: boolean;
  }>;
}

@Injectable()
export class FamilyServiceAdapter {
  constructor(private readonly prisma: PrismaService) {}

  async getFamilyData(userId: string): Promise<FamilyData> {
    const family = await this.prisma.family.findFirst({
      where: { creatorId: userId },
      include: {
        members: true,
        marriages: true,
        guardianships: true,
      },
    });

    if (!family) {
      // Return empty family data
      return {
        id: '',
        religion: 'STATUTORY',
        numberOfSpouses: 0,
        numberOfChildren: 0,
        numberOfMinors: 0,
        isPolygamous: false,
        hasGuardianForMinors: false,
        members: [],
      };
    }

    const spouses = family.members.filter(m => 
      m.relationship === 'SPOUSE' && m.isAlive
    );

    const children = family.members.filter(m => 
      m.relationship === 'CHILD' && m.isAlive
    );

    const minors = children.filter(c => c.isMinor);

    return {
      id: family.id,
      religion: 'STATUTORY', // TODO: Get from family settings
      numberOfSpouses: spouses.length,
      numberOfChildren: children.length,
      numberOfMinors: minors.length,
      isPolygamous: family.isPolygamous,
      hasGuardianForMinors: minors.length > 0 && family.guardianships.length > 0,
      members: family.members.map(m => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
        relationship: m.relationship,
        isMinor: m.isMinor,
        isAlive: m.isAlive,
      })),
    };
  }
}