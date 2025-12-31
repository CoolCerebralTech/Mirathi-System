// FILE: src/features/family/components/EstablishHouseForm.tsx

import React, { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Loader2, 
  Home, 
  Users,
  Scale,
  BookOpen,
  AlertTriangle,
  Crown,
  MapPin,
  Hash,
  Calculator,
  Info,
  UserCheck,
  Shield} from 'lucide-react';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Separator,
  Alert,
  AlertDescription,
  AlertTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui';

import { useEstablishHouse } from '../family.api';
import {
  EstablishPolygamousHouseRequestSchema,
  type EstablishPolygamousHouseInput,
  type FamilyMemberResponse,
  KenyanCounty} from '@/types/family.types';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface EstablishHouseFormProps {
  familyId: string;
  members: FamilyMemberResponse[];
  existingHouses?: Array<{
    houseOrder: number;
    houseName?: string;
    headOfHouse: string;
  }>;
  deceasedMemberId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

const ESTABLISHMENT_TYPES = [
  { value: 'CUSTOMARY', label: 'Customary Marriage', description: 'Traditional African marriage' },
  { value: 'ISLAMIC', label: 'Islamic Marriage', description: 'Under Islamic law (Nikah)' },
  { value: 'TRADITIONAL', label: 'Traditional', description: 'Cultural traditional marriage' },
  { value: 'COURT_RECOGNIZED', label: 'Court Recognized', description: 'Officially recognized by court' },
] as const;

// Kenyan Counties for selection
const KENYAN_COUNTIES = Object.entries(KenyanCounty).map(([key, value]) => ({
  value,
  label: key.replace('_', ' ')
}));

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface HouseMemberPreviewProps {
  wife: FamilyMemberResponse;
  members: FamilyMemberResponse[];
  houseOrder: number;
}

const HouseMemberPreview: React.FC<HouseMemberPreviewProps> = ({ 
  wife, 
  members, 
  houseOrder 
}) => {
  // Find children of this wife (based on relationships)
  const children = members.filter(member => {
    // In a real app, this would check kinship relationships
    return member.kinship.parents.some(parent => parent.id === wife.id);
  });

  const totalMembers = children.length + 1; // Wife + children
  
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-600" />
          <span className="font-medium">House #{houseOrder} Preview</span>
        </div>
        <Badge variant="outline">{totalMembers} members</Badge>
      </div>
      
      {/* Matriarch */}
      <div className="rounded-lg border bg-amber-50/50 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
            <Crown className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-medium">{wife.identity.fullName}</div>
            <div className="text-xs text-muted-foreground">Matriarch (Head of House)</div>
          </div>
          <div className="text-xs">
            {wife.identity.age ? `${wife.identity.age}y` : 'Age unknown'}
          </div>
        </div>
      </div>
      
      {/* Children */}
      {children.length > 0 && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="text-sm font-medium">Children in House</div>
            {children.map(child => (
              <div 
                key={child.id} 
                className="flex items-center justify-between rounded-lg border p-2"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                    <Users className="h-3 w-3 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{child.identity.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {child.identity.gender} • {child.identity.age ? `${child.identity.age}y` : ''}
                    </div>
                  </div>
                </div>
                {child.legalStatus.isMinor && (
                  <Badge variant="warning" className="text-xs">
                    Minor
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const EstablishHouseForm: React.FC<EstablishHouseFormProps> = ({
  familyId,
  members,
  existingHouses = [],
  onSuccess,
  onCancel,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'details' | 'preview'>('details');
  const [selectedWifeId, setSelectedWifeId] = useState<string>('');
  
  const form = useForm<EstablishPolygamousHouseInput>({
    resolver: zodResolver(EstablishPolygamousHouseRequestSchema),
    defaultValues: {
      houseOrder: existingHouses.length + 1,
      distributionWeight: 1.0,
      establishmentType: 'CUSTOMARY',
      residentialCounty: 'NAIROBI',
      houseName: `House ${existingHouses.length + 1}`,
    },
  });

  const { mutate, isPending } = useEstablishHouse(familyId, {
    onSuccess: () => {
      form.reset();
      onSuccess?.();
    },
  });

  const onSubmit = (data: EstablishPolygamousHouseInput) => {
    mutate(data);
  };

  // Filter for potential wives (female members without existing house assignments)
  const potentialWives = useMemo(() => {
    return members.filter(member => {
      // Female members
      if (member.identity.gender !== 'FEMALE') return false;
      
      // Check if already assigned to a house
      if (member.polygamyContext?.belongsToHouseId) return false;
      
      return true;
    });
  }, [members]);

  
  // Get selected wife for preview
  const selectedWife = potentialWives.find(w => w.id === selectedWifeId);

  // Calculate distribution implications
  const totalHouses = existingHouses.length + 1;
  const sharePercentage = (1 / totalHouses) * 100;
  const distributionWeight = form.watch('distributionWeight') || 1.0;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Legal Context */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-purple-100 p-2">
            <Scale className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Establish Polygamous House</h3>
            <p className="text-sm text-muted-foreground">
              Section 40 of Kenyan Law of Succession Act
            </p>
          </div>
        </div>
        
        <Alert className="border-blue-200 bg-blue-50">
          <BookOpen className="h-4 w-4 text-blue-600" />
          <AlertTitle>Section 40 - Polygamous Succession</AlertTitle>
          <AlertDescription>
            Estates are divided equally among houses. Each house receives an equal share.
          </AlertDescription>
        </Alert>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'details' | 'preview')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details" className="gap-2">
            <Home className="h-4 w-4" />
            House Details
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2" disabled={!selectedWife}>
            <Users className="h-4 w-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* House Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Existing Houses Warning */}
              {existingHouses.length > 0 && (
                <Alert variant="warning" className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Existing Houses Detected</AlertTitle>
                  <AlertDescription>
                    This family already has {existingHouses.length} house(s). 
                    New house will receive equal share of estate.
                  </AlertDescription>
                </Alert>
              )}

              {/* Matriarch Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-amber-600" />
                    Matriarch Selection
                  </CardTitle>
                  <CardDescription>
                    Select the wife who will head this polygamous house
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="originalWifeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Head of House (Matriarch) *
                          {field.value && (
                            <Badge variant="outline" className="ml-2">
                              House #{form.getValues('houseOrder')}
                            </Badge>
                          )}
                        </FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            field.onChange(value);
                            setSelectedWifeId(value);
                          }} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select wife/matriarch" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {potentialWives.length === 0 ? (
                              <SelectItem value="none" disabled>
                                No eligible wives available
                              </SelectItem>
                            ) : (
                              potentialWives.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  <div className="flex items-center justify-between">
                                    <span>{member.identity.fullName}</span>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      {member.identity.age && (
                                        <span>{member.identity.age}y</span>
                                      )}
                                      {member.legalStatus.isMinor && (
                                        <Badge variant="destructive" className="text-[10px]">
                                          Minor
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        {potentialWives.length === 0 && (
                          <div className="text-sm text-destructive mt-2">
                            No female members available to head a house. 
                            Add female family members first.
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* House Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-primary" />
                    House Configuration
                  </CardTitle>
                  <CardDescription>
                    Define the house structure and legal recognition
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="houseName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>House Name</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={`e.g., ${selectedWife?.identity.last || "First"} House`} 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Optional display name for the house
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="houseOrder"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <div className="flex items-center gap-2">
                              <Hash className="h-4 w-4" />
                              House Order
                            </div>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1}
                              max={10}
                              {...field} 
                              onChange={e => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Order in polygamous hierarchy (1 = first/senior)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="establishmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Marriage Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select marriage type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ESTABLISHMENT_TYPES.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {type.description}
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Legal basis for the marriage
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="residentialCounty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              Residential County
                            </div>
                          </FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select county" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="max-h-60">
                              {KENYAN_COUNTIES.map((county) => (
                                <SelectItem key={county.value} value={county.value}>
                                  {county.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Where the house is primarily located
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="distributionWeight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          <div className="flex items-center gap-2">
                            <Calculator className="h-4 w-4" />
                            Distribution Weight
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 text-muted-foreground" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                Weight affects share calculation. Default is 1.0 for equal shares.
                                Adjust for special circumstances (e.g., disabled dependents).
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-3">
                            <Input 
                              type="number" 
                              step="0.1"
                              min="0.1"
                              max="5"
                              {...field} 
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              className="w-32"
                            />
                            <div className="text-sm text-muted-foreground">
                              Default: 1.0 (Equal share)
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Adjust if this house should receive a different share (e.g., 1.5 = 50% more)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* House Head Selection (Optional) */}
              <Accordion type="single" collapsible>
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <UserCheck className="h-4 w-4" />
                      Advanced Options
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="houseHeadId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>House Head (Optional)</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select house head (if different)" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="same">Same as Matriarch</SelectItem>
                              {members.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                  {member.identity.fullName}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Person responsible for managing house affairs (defaults to matriarch)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Distribution Summary */}
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Calculator className="h-4 w-4" />
                    Distribution Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Houses After Creation:</span>
                      <span className="font-bold">{totalHouses}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Estimated Share Per House:</span>
                      <span className="font-bold">{sharePercentage.toFixed(1)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">This House Weight:</span>
                      <span className="font-bold">{distributionWeight.toFixed(1)}x</span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between text-green-700">
                      <span className="font-medium">Adjusted Share:</span>
                      <span className="text-lg font-bold">
                        {((sharePercentage * distributionWeight) / totalHouses).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    if (selectedWife) {
                      setActiveTab('preview');
                    }
                  }}
                  disabled={!selectedWife || isPending}
                >
                  Preview House
                </Button>
                
                <div className="flex gap-3">
                  {onCancel && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={onCancel}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  )}
                  <Button 
                    type="submit" 
                    disabled={isPending || potentialWives.length === 0}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Establishing House...
                      </>
                    ) : (
                      <>
                        <Scale className="mr-2 h-4 w-4" />
                        Establish House (S.40)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          {selectedWife && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    House Preview
                  </CardTitle>
                  <CardDescription>
                    Review the polygamous house structure before creating
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* House Summary */}
                    <div className="rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <div className="text-lg font-bold">
                            {form.getValues('houseName') || `House ${form.getValues('houseOrder')}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Order #{form.getValues('houseOrder')} • {form.getValues('establishmentType')}
                          </div>
                        </div>
                        <Badge variant="default" className="text-sm">
                          {sharePercentage.toFixed(1)}% Share
                        </Badge>
                      </div>
                      
                      <HouseMemberPreview
                        wife={selectedWife}
                        members={members}
                        houseOrder={form.getValues('houseOrder')}
                      />
                    </div>

                    {/* Legal Implications */}
                    <Alert className="border-amber-200 bg-amber-50">
                      <Shield className="h-4 w-4 text-amber-600" />
                      <AlertTitle>Legal Implications</AlertTitle>
                      <AlertDescription>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li>• This house will receive equal share of estate under Section 40</li>
                          <li>• All children in this house inherit through their mother</li>
                          <li>• House structure cannot be changed after court filing</li>
                          <li>• Ensure all marriages are legally documented</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setActiveTab('details')}
                      >
                        Back to Details
                      </Button>
                      
                      <div className="flex gap-3">
                        {onCancel && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={onCancel}
                          >
                            Cancel
                          </Button>
                        )}
                        <Button 
                          onClick={() => form.handleSubmit(onSubmit)()}
                          disabled={isPending}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          {isPending ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Establishing House...
                            </>
                          ) : (
                            <>
                              <Scale className="mr-2 h-4 w-4" />
                              Confirm & Establish House
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Section 40 Explanation */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-blue-600" />
            Understanding Section 40
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Section 40 of Kenyan Law of Succession Act</strong> governs 
              distribution of estates in polygamous families.
            </p>
            <p>
              The estate is divided <strong>equally among the houses</strong> of each wife, 
              regardless of the number of children in each house.
            </p>
            <p className="font-medium text-blue-800">
              Key Principle: Each house receives an equal share, which is then 
              distributed to the beneficiaries within that house.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ============================================================================
// QUICK HOUSE CREATION MODAL
// ============================================================================

interface QuickEstablishHouseProps extends Omit<EstablishHouseFormProps, 'onCancel' | 'className'> {
  trigger?: React.ReactNode;
}

export const QuickEstablishHouse: React.FC<QuickEstablishHouseProps> = ({
  trigger,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button 
          onClick={() => setIsOpen(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Home className="mr-2 h-4 w-4" />
          New Polygamous House
        </Button>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-lg">
            <EstablishHouseForm
              {...props}
              onCancel={() => setIsOpen(false)}
              onSuccess={() => setIsOpen(false)}
              className="p-6"
            />
          </div>
        </div>
      )}
    </>
  );
};