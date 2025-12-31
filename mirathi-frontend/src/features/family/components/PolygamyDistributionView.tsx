// FILE: src/features/family/components/PolygamyDistributionView.tsx

import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, 
  Users, 
  Home, 
  PieChart,
  Calculator,
  Scale,
  TrendingUp,
  UserCheck,
  UserX,
  Baby,
  Shield,
  Divide,
  Award,
  ChevronDown,
  ChevronUp,
  Info,
  Banknote,
  FileText,
  Crown
} from 'lucide-react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  CardFooter,
  Badge,
  Progress,
  Button,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui';
import { usePolygamyStatus } from '../family.api';
import { LoadingSpinner, EmptyState } from '@/components/common';
import { cn } from '@/lib/utils';
import { type HouseGroup } from '@/types/family.types';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const calculateHouseDistribution = (houses: HouseGroup[], totalEstate: number = 10000000) => {
  return houses.map(house => ({
    ...house,
    estimatedShare: Math.floor((house.theoreticalSharePercentage / 100) * totalEstate),
    sharePerCapita: Math.floor(((house.theoreticalSharePercentage / 100) * totalEstate) / house.memberCount) || 0,
    sharePerMinor: Math.floor(((house.theoreticalSharePercentage / 100) * totalEstate) / (house.minorCount || 1)) || 0,
  }));
};

const getHouseColor = (index: number): string => {
  const colors = [
    'border-l-blue-500 bg-blue-50/50',
    'border-l-green-500 bg-green-50/50',
    'border-l-purple-500 bg-purple-50/50',
    'border-l-amber-500 bg-amber-50/50',
    'border-l-pink-500 bg-pink-50/50',
    'border-l-indigo-500 bg-indigo-50/50',
  ];
  return colors[index % colors.length];
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface DistributionChartProps {
  houses: Array<HouseGroup & { estimatedShare: number }>;
  totalEstate: number;
}

const DistributionChart: React.FC<DistributionChartProps> = ({ houses, totalEstate }) => {
  const [selectedHouse, setSelectedHouse] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PieChart className="h-5 w-5 text-primary" />
          <h4 className="font-medium">Estate Distribution (S.40)</h4>
        </div>
        <Badge variant="outline">
          {formatCurrency(totalEstate)} Total
        </Badge>
      </div>

      {/* Visual Distribution Bars */}
      <div className="space-y-2">
        {houses.map((house, idx) => {
          const percentage = house.theoreticalSharePercentage;
          const shareAmount = house.estimatedShare;
          const isSelected = selectedHouse === house.houseId;
          
          return (
            <Tooltip key={house.houseId}>
              <TooltipTrigger asChild>
                <div 
                  className={cn(
                    "group relative h-10 rounded-lg transition-all cursor-pointer",
                    getHouseColor(idx),
                    isSelected && "ring-2 ring-primary ring-offset-2"
                  )}
                  style={{ width: `${percentage}%` }}
                  onClick={() => setSelectedHouse(house.houseId)}
                  onMouseEnter={() => setSelectedHouse(house.houseId)}
                  onMouseLeave={() => setSelectedHouse(null)}
                >
                  <div className="absolute inset-0 flex items-center justify-between px-3">
                    <span className="text-sm font-medium truncate">
                      {house.houseName}
                    </span>
                    <span className="text-sm font-bold">
                      {percentage}%
                    </span>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="z-50">
                <div className="space-y-2">
                  <div className="font-medium">{house.houseName}</div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Share:</span>
                      <span className="font-medium">{percentage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Amount:</span>
                      <span className="font-medium">{formatCurrency(shareAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Members:</span>
                      <span>{house.memberCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minors:</span>
                      <span className="text-amber-600">{house.minorCount}</span>
                    </div>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {houses.map((house, idx) => (
          <div key={house.houseId} className="flex items-center gap-2">
            <div className={cn("h-3 w-3 rounded", getHouseColor(idx).replace('border-l-', 'bg-').split(' ')[0])} />
            <span className="text-xs">{house.houseName}</span>
            <span className="text-xs font-medium">{house.theoreticalSharePercentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};

interface HouseDetailViewProps {
  house: HouseGroup & { 
    estimatedShare: number;
    sharePerCapita: number;
    sharePerMinor: number;
  };
  index: number;
  distributionMethod: 'PER_STIRPES' | 'PER_CAPITA';
}

const HouseDetailView: React.FC<HouseDetailViewProps> = ({ 
  house, 
  index,
  distributionMethod 
}) => {
  const [showMembers, setShowMembers] = useState(false);
  
  const eligibleBeneficiaries = house.members.filter(m => m.isEligibleBeneficiary);
  const students = house.members.filter(m => m.isStudent);
  const disabled = house.members.filter(m => m.hasDisability);
  
  return (
    <Card className={cn("overflow-hidden", getHouseColor(index))}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Home className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">{house.houseName}</CardTitle>
              <Badge variant="outline">House {house.order}</Badge>
              {house.order === 1 && (
                <Badge variant="default" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Senior
                </Badge>
              )}
            </div>
            <CardDescription>
              Headed by {house.headOfHouse.name}
            </CardDescription>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {house.theoreticalSharePercentage}%
            </div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(house.estimatedShare)}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* House Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold">{house.memberCount}</div>
            <div className="text-xs text-muted-foreground">Members</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-amber-600">{house.minorCount}</div>
            <div className="text-xs text-muted-foreground">Minors</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold">{eligibleBeneficiaries.length}</div>
            <div className="text-xs text-muted-foreground">Eligible</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold">
              {distributionMethod === 'PER_CAPITA' 
                ? formatCurrency(house.sharePerCapita)
                : formatCurrency(house.sharePerMinor)}
            </div>
            <div className="text-xs text-muted-foreground">
              {distributionMethod === 'PER_CAPITA' ? 'Per Capita' : 'Per Minor'}
            </div>
          </div>
        </div>
        
        {/* Special Categories */}
        {(students.length > 0 || disabled.length > 0) && (
          <div className="mb-4 space-y-2">
            <div className="text-sm font-medium">Special Considerations</div>
            <div className="flex flex-wrap gap-2">
              {students.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {students.length} Student{students.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {disabled.length > 0 && (
                <Badge variant="outline" className="gap-1">
                  <Shield className="h-3 w-3" />
                  {disabled.length} with Disability
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Member List */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-between mb-2"
          onClick={() => setShowMembers(!showMembers)}
        >
          <span>House Members</span>
          {showMembers ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
        
        {showMembers && (
          <div className="space-y-2">
            {house.members.map(member => (
              <div 
                key={member.memberId}
                className="flex items-center justify-between p-2 rounded-lg border bg-white/50"
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "h-2 w-2 rounded-full",
                    member.isMinor ? "bg-amber-500" : "bg-green-500"
                  )} />
                  <span className="text-sm">{member.name}</span>
                </div>
                <div className="flex gap-2">
                  {member.isMinor && (
                    <Baby className="h-3 w-3 text-amber-500" />
                  )}
                  {member.isStudent && (
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                  )}
                  {member.hasDisability && (
                    <Shield className="h-3 w-3 text-purple-500" />
                  )}
                  {member.isEligibleBeneficiary && (
                    <UserCheck className="h-3 w-3 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
      
      <CardFooter className="border-t bg-white/50">
        <div className="w-full">
          <div className="flex items-center justify-between text-sm mb-1">
            <span>House Share</span>
            <span className="font-medium">{house.theoreticalSharePercentage}%</span>
          </div>
          <Progress 
            value={house.theoreticalSharePercentage} 
            className="h-2"
          />
        </div>
      </CardFooter>
    </Card>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface PolygamyDistributionViewProps {
  familyId: string;
  estateValue?: number; // Optional estate value for calculations
  className?: string;
}

export const PolygamyDistributionView: React.FC<PolygamyDistributionViewProps> = ({ 
  familyId, 
  estateValue = 10000000, // Default 10M KES
  className 
}) => {
  const { data, isLoading, isError, refetch } = usePolygamyStatus(familyId);
  const [activeTab, setActiveTab] = useState<'overview' | 'houses' | 'calculation'>('overview');
  
  // Calculate distribution with estate value
  const housesWithDistribution = useMemo(() => {
    if (!data?.houses) return [];
    return calculateHouseDistribution(data.houses, estateValue);
  }, [data, estateValue]);
  
  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <LoadingSpinner text="Analyzing polygamous family structure..." />
      </div>
    );
  }
  
  if (isError) {
        return (
        <EmptyState
            icon={AlertTriangle}
            title="Analysis Failed"
            description="Unable to load polygamy distribution analysis"
            action={{
            label: "Retry Analysis",
            onClick: () => refetch()
            }}
        />
        );
    }
  
  if (!data) {
    return (
      <EmptyState
        icon={Users}
        title="No Polygamy Analysis"
        description="Polygamy distribution analysis not available for this family"
      />
    );
  }
  
  // If not polygamous, show monogamous message
  if (!data.isPolygamous) {
    return (
      <Card className={cn("border-green-200 bg-green-50/50", className)}>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-green-100 p-2">
              <Home className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle>Monogamous Family Structure</CardTitle>
              <CardDescription>
                This family is monogamous. Section 40 (polygamy) distribution does not apply.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-green-200 bg-white p-4">
            <div className="flex items-center gap-2 text-green-700">
              <Scale className="h-4 w-4" />
              <span className="font-medium">Standard Distribution Applies</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Since this is a monogamous family, the estate will be distributed according to 
              standard succession rules under the Law of Succession Act (Cap. 160).
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const totalUnassigned = data.unassignedMembers.length;
  const totalMinors = data.houses.reduce((sum, house) => sum + house.minorCount, 0);
  const totalEligibleBeneficiaries = data.houses.reduce(
    (sum, house) => sum + house.members.filter(m => m.isEligibleBeneficiary).length, 
    0
  );
  
  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-purple-100 p-2">
              <Scale className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Polygamous Distribution (S.40)</h2>
              <p className="text-muted-foreground">
                Estate division among {data.totalHouses} houses according to Kenyan Law
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <Divide className="h-3 w-3" />
            {data.distributionMethod.replace('_', ' ')}
          </Badge>
          <Badge variant={data.hasUnassignedRisks ? "destructive" : "default"} className="gap-1">
            {data.hasUnassignedRisks ? (
              <>
                <AlertTriangle className="h-3 w-3" />
                Unassigned Members
              </>
            ) : (
              <>
                <UserCheck className="h-3 w-3" />
                All Members Assigned
              </>
            )}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Calculator className="h-3 w-3" />
            {formatCurrency(estateValue)}
          </Badge>
        </div>
      </div>
      
      {/* Tabs */}
        <Tabs 
            value={activeTab} 
            onValueChange={(v) => setActiveTab(v as 'overview' | 'houses' | 'calculation')}
        >
            <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="gap-2">
            <PieChart className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="houses" className="gap-2">
            <Home className="h-4 w-4" />
            Houses ({data.houses.length})
          </TabsTrigger>
          <TabsTrigger value="calculation" className="gap-2">
            <Calculator className="h-4 w-4" />
            Calculations
          </TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{data.totalHouses}</div>
                  <p className="text-sm text-muted-foreground">Polygamous Houses</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-amber-600">{totalMinors}</div>
                  <p className="text-sm text-muted-foreground">Total Minors</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{totalEligibleBeneficiaries}</div>
                  <p className="text-sm text-muted-foreground">Eligible Beneficiaries</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{totalUnassigned}</div>
                  <p className="text-sm text-muted-foreground">Unassigned Members</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Distribution Chart */}
          <Card>
            <CardContent className="pt-6">
              <DistributionChart 
                houses={housesWithDistribution} 
                totalEstate={estateValue} 
              />
            </CardContent>
          </Card>
          
          {/* S.40 Explanation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Section 40 - Law of Succession Act
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>
                  <strong>Section 40</strong> of the Kenyan Law of Succession Act governs 
                  the distribution of estates in polygamous families.
                </p>
                <p>
                  The estate is divided equally among the houses of each wife, regardless 
                  of the number of children in each house.
                </p>
                <p className="font-medium">
                  Key Principle: Each house receives an equal share, which is then 
                  distributed to the beneficiaries within that house.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Houses Tab */}
        <TabsContent value="houses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {housesWithDistribution.map((house, idx) => (
              <HouseDetailView
                key={house.houseId}
                house={house}
                index={idx}
                distributionMethod={data.distributionMethod}
              />
            ))}
          </div>
          
          {/* Unassigned Members */}
          {totalUnassigned > 0 && (
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-red-700">Unassigned Members</CardTitle>
                </div>
                <CardDescription>
                  These {totalUnassigned} members are not assigned to any house and must be addressed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.unassignedMembers.map(member => (
                    <div 
                      key={member.memberId}
                      className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <UserX className="h-4 w-4 text-red-500" />
                        <div>
                          <div className="font-medium">{member.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {member.relationshipToHead} • {member.age ? `${member.age} years` : 'Age unknown'}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {member.isMinor && (
                          <Badge variant="destructive">Minor</Badge>
                        )}
                        {member.isEligibleBeneficiary && (
                          <Badge variant="outline">Eligible</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full">
                  Assign Unassigned Members
                </Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
        
        {/* Calculations Tab */}
        <TabsContent value="calculation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Distribution Calculations
              </CardTitle>
              <CardDescription>
                Based on Section 40 of the Law of Succession Act
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Calculation Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>House</TableHead>
                    <TableHead>Share %</TableHead>
                    <TableHead>Estimated Share</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Per Capita</TableHead>
                    <TableHead>Minors</TableHead>
                    <TableHead>Per Minor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {housesWithDistribution.map((house) => (
                    <TableRow key={house.houseId}>
                      <TableCell className="font-medium">{house.houseName}</TableCell>
                      <TableCell>{house.theoreticalSharePercentage}%</TableCell>
                      <TableCell>{formatCurrency(house.estimatedShare)}</TableCell>
                      <TableCell>{house.memberCount}</TableCell>
                      <TableCell>{formatCurrency(house.sharePerCapita)}</TableCell>
                      <TableCell>{house.minorCount}</TableCell>
                      <TableCell>{formatCurrency(house.sharePerMinor)}</TableCell>
                    </TableRow>
                  ))}
                  {housesWithDistribution.length > 1 && (
                    <TableRow className="font-bold bg-muted/50">
                      <TableCell>TOTAL</TableCell>
                      <TableCell>100%</TableCell>
                      <TableCell>{formatCurrency(estateValue)}</TableCell>
                      <TableCell>
                        {housesWithDistribution.reduce((sum, h) => sum + h.memberCount, 0)}
                      </TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>
                        {housesWithDistribution.reduce((sum, h) => sum + h.minorCount, 0)}
                      </TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              
              {/* Calculation Explanation */}
              <div className="mt-6 p-4 border rounded-lg bg-blue-50">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-medium text-blue-800">How Distribution is Calculated</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>1. Estate value is divided equally among all houses</li>
                      <li>2. Each house receives: Estate Value ÷ Number of Houses</li>
                      <li>3. Within each house, distribution follows {data.distributionMethod.replace('_', ' ')} rules</li>
                      <li>4. Minors and special needs are given priority consideration</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Legal Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Legal Considerations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 border rounded-lg">
                <div className="font-medium mb-1">Equal Distribution Among Houses</div>
                <p>
                  Section 40 mandates equal division among houses, regardless of the number 
                  of children in each house. This protects the interests of all wives and their descendants.
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-medium mb-1">Protection of Minors</div>
                <p>
                  The court may appoint guardians for minors and ensure their share is 
                  properly managed until they reach adulthood.
                </p>
              </div>
              <div className="p-3 border rounded-lg">
                <div className="font-medium mb-1">Unassigned Members Risk</div>
                <p>
                  Members not assigned to any house may be disinherited. It's crucial to 
                  properly assign all family members to houses.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Estate Value Input (Optional) */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Estate Value for Calculations</div>
              <div className="text-sm text-muted-foreground">
                Adjust the estate value to see updated distribution amounts
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Banknote className="h-4 w-4 text-muted-foreground" />
              <span className="text-lg font-bold">{formatCurrency(estateValue)}</span>
            </div>
          </div>
          <div className="mt-4">
            <input
              type="range"
              min="100000"
              max="100000000"
              step="100000"
              value={estateValue}
              onChange={(e) => {
                // In a real app, this would update state
                console.log('Estate value changed:', e.target.value);
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>100K</span>
              <span>50M</span>
              <span>100M</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// SIMPLIFIED VERSION FOR DASHBOARDS
// ============================================================================

interface CompactPolygamyViewProps {
  familyId: string;
  className?: string;
}

export const CompactPolygamyView: React.FC<CompactPolygamyViewProps> = ({ 
  familyId, 
  className 
}) => {
  const { data, isLoading } = usePolygamyStatus(familyId);

  if (isLoading || !data) {
    return (
      <div className={cn("rounded-lg border p-4", className)}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!data.isPolygamous) {
    return (
      <div className={cn("rounded-lg border border-green-200 bg-green-50/50 p-4", className)}>
        <div className="flex items-center gap-2">
          <Home className="h-4 w-4 text-green-600" />
          <span className="font-medium">Monogamous Family</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Section 40 does not apply
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-lg border border-purple-200 bg-purple-50/50 p-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-purple-600" />
            <span className="font-medium">Polygamous Family</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {data.totalHouses} houses • {data.distributionMethod.replace('_', ' ')}
          </p>
        </div>
        <div className="text-right">
          {data.hasUnassignedRisks ? (
            <Badge variant="destructive" className="text-xs">
              {data.unassignedMembers.length} unassigned
            </Badge>
          ) : (
            <Badge variant="default" className="text-xs">
              All assigned
            </Badge>
          )}
        </div>
      </div>
      
      {/* Mini distribution visualization */}
      <div className="mt-3 flex h-2 rounded-full overflow-hidden">
        {data.houses.map((house, idx) => (
          <div
            key={house.houseId}
            className={getHouseColor(idx).split(' ')[0].replace('border-l-', 'bg-')}
            style={{ width: `${house.theoreticalSharePercentage}%` }}
            title={`${house.houseName}: ${house.theoreticalSharePercentage}%`}
          />
        ))}
      </div>
    </div>
  );
};