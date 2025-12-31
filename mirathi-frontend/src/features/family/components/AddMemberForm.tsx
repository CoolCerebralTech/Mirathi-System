// FILE: src/features/family/components/AddMemberForm.tsx

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  CalendarIcon, 
  Loader2, 
  UserPlus,
  Baby,
  Shield,
  AlertTriangle,
  FileText,
  User,
  FileCheck,
  UserCheck,
  Sparkles,
  ChevronRight,
  X,
  HelpCircle,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Switch,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui';

import { SmartUploader } from '@/features/documents/components';
import { useAddMember } from '../family.api';
import { 
  AddFamilyMemberRequestSchema, 
  type AddFamilyMemberInput, 
  Gender,
  RelationshipType,
  KenyanCounty
} from '@/types/family.types';
import { DocumentCategoryEnum, type UploadDocumentResponse } from '@/types/document.types';
import { cn } from '@/lib/utils';

// Kenyan tribes for dropdown
const KENYAN_TRIBES = [
  'Kikuyu', 'Luhya', 'Luo', 'Kalenjin', 'Kamba', 'Kisii', 'Meru', 'Maasai',
  'Turkana', 'Mijikenda', 'Samburu', 'Somali', 'Taita', 'Embu', 'Tharaka',
  'Pokomo', 'Borana', 'Rendille', 'Swahili', 'Other'
];

// ============================================================================
// PROPS & TYPES
// ============================================================================

interface AddMemberFormProps {
  familyId: string;
  /**
   * Deceased member ID for succession context
   */
  deceasedId?: string;
  /**
   * If adding a relative to someone specific
   */
  relativeId?: string;
  preselectedRelationship?: RelationshipType;
  /**
   * Context: Is this a minor being added?
   */
  isMinorContext?: boolean;
  /**
   * Estate ID for document linking
   */
  estateId?: string;
  /**
   * Is this a critical succession member? (Spouse, Child of deceased)
   */
  isCriticalSuccessionMember?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AddMemberForm: React.FC<AddMemberFormProps> = ({
  familyId,
  deceasedId,
  relativeId,
  preselectedRelationship,
  isMinorContext = false,
  estateId,
  isCriticalSuccessionMember = false,
  onSuccess,
  onCancel,
  className,
}) => {
  const [activeTab, setActiveTab] = useState<'quick' | 'manual'>('quick');
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadDocumentResponse[]>([]);
  const [isMinor, setIsMinor] = useState<boolean>(isMinorContext);
  const [extractedData, setExtractedData] = useState<{
    firstName?: string;
    lastName?: string;
    nationalId?: string;
    dateOfBirth?: string;
  } | null>(null);
  // 1. Setup Form
  const form = useForm<AddFamilyMemberInput>({
    resolver: zodResolver(AddFamilyMemberRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      middleName: '',
      gender: 'MALE',
      relativeId: relativeId,
      relationshipToRelative: preselectedRelationship,
      dateOfBirthEstimated: false,
      placeOfBirth: '',
      tribe: '',
    },
  });

  // 2. API Hook
  const { mutate: addMember, isPending } = useAddMember(familyId, {
    onSuccess: () => {
      toast.success('Family member added', {
        description: isMinor 
          ? 'Minor added. Remember to assign a guardian for succession.'
          : 'Member profile created successfully.',
      });
      form.reset();
      setUploadedDocuments([]);
      setExtractedData(null);
      onSuccess?.();
    },
  });

  // 3. Handlers
  const onSubmit = (data: AddFamilyMemberInput) => {
    // Add document IDs to metadata
    const metadata = {
      uploadedDocumentIds: uploadedDocuments.map(doc => doc.id),
      extractedData,
      estateId,
      isCriticalSuccessionMember,
      isMinor,
      addedAt: new Date().toISOString(),
    };

    // Calculate if minor based on date of birth
    const dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (dateOfBirth) {
      const age = new Date().getFullYear() - dateOfBirth.getFullYear();
      if (age < 18) {
        metadata.isMinor = true;
      }
    }

    // Submit with enhanced data
    addMember({
      ...data,
      // Add metadata if backend supports it
    });
  };

  const handleDocumentUploaded = (response: UploadDocumentResponse) => {
    setUploadedDocuments(prev => [...prev, response]);
    
    // Simulate data extraction (in real app, this would be API call)
    if (response.category === DocumentCategoryEnum.enum.IDENTITY_PROOF) {
      setTimeout(() => {
        const mockExtractedData = {
          firstName: 'John',
          lastName: 'Kamau',
          nationalId: '12345678',
          dateOfBirth: '1980-01-15',
        };
        setExtractedData(mockExtractedData);
        
        // Auto-fill form with extracted data
        form.setValue('firstName', mockExtractedData.firstName);
        form.setValue('lastName', mockExtractedData.lastName);
        form.setValue('nationalId', mockExtractedData.nationalId);
        form.setValue('dateOfBirth', mockExtractedData.dateOfBirth);
        
        toast.success('Data extracted from document', {
          description: 'Form auto-filled with extracted information',
        });
      }, 1500);
    }
    
    toast.success('Document uploaded', {
      description: `Identity proof attached to member profile`,
    });
  };

  const handleRemoveDocument = (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const calculateAge = (dateString?: string): number | null => {
    if (!dateString) return null;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formAge = calculateAge(form.watch('dateOfBirth'));
  const isFormMinor = formAge !== null && formAge < 18;

  // Update minor status when date changes
  useEffect(() => {
    if (formAge !== null) {
      setIsMinor(formAge < 18);
    }
  }, [formAge]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header with Succession Context */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className={cn(
            "rounded-full p-2",
            isCriticalSuccessionMember 
              ? "bg-amber-100 text-amber-600" 
              : "bg-primary/10 text-primary"
          )}>
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Add Family Member</h3>
            <p className="text-sm text-muted-foreground">
              {isCriticalSuccessionMember 
                ? "Critical succession member - Requires verification"
                : "Create digital twin for succession planning"}
            </p>
          </div>
        </div>
        
        {isCriticalSuccessionMember && (
          <Alert variant="warning" className="border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Critical Succession Member</AlertTitle>
            <AlertDescription>
              This member's identity must be verified for court proceedings.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Succession Context Badges */}
      <div className="flex flex-wrap gap-2">
        {isCriticalSuccessionMember && (
          <Badge variant="destructive" className="gap-1">
            <Shield className="h-3 w-3" />
            Critical for Succession
          </Badge>
        )}
        {deceasedId && (
          <Badge variant="outline" className="gap-1">
            <User className="h-3 w-3" />
            Relative of Deceased
          </Badge>
        )}
        {isMinor && (
          <Badge variant="warning" className="gap-1">
            <Baby className="h-3 w-3" />
            Minor {isCriticalSuccessionMember && '(Requires Guardian)'}
          </Badge>
        )}
        {estateId && (
          <Badge variant="secondary" className="gap-1">
            <Users className="h-3 w-3" />
            Linked to Estate
          </Badge>
        )}
      </div>

      {/* Tabs for Quick/Manual Entry */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'quick' | 'manual')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="quick" className="gap-2">
            <FileCheck className="h-4 w-4" />
            Quick Entry (Digital Twin)
          </TabsTrigger>
          <TabsTrigger value="manual" className="gap-2">
            <User className="h-4 w-4" />
            Manual Entry
          </TabsTrigger>
        </TabsList>

        {/* Quick Entry Tab - Digital Twin Pattern */}
        <TabsContent value="quick" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create Digital Twin
              </CardTitle>
              <CardDescription>
                Upload identity documents to automatically create member profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Critical Documents */}
              {isCriticalSuccessionMember && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertTriangle className="h-4 w-4 text-amber-600" />
                  <AlertTitle>Verification Required</AlertTitle>
                  <AlertDescription>
                    Upload National ID or Birth Certificate for succession verification
                  </AlertDescription>
                </Alert>
              )}

              {/* Document Upload Section */}
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <SmartUploader
                    category={DocumentCategoryEnum.enum.IDENTITY_PROOF}
                    label="National ID / Passport"
                    description="Upload front and back for verification"
                    onUploadComplete={handleDocumentUploaded}
                    estateId={estateId}
                    identityForUserId={deceasedId}
                    isCritical={isCriticalSuccessionMember}
                  />
                  
                  <SmartUploader
                    category={DocumentCategoryEnum.enum.IDENTITY_PROOF}
                    label="Birth Certificate"
                    description="Required for minors and age verification"
                    onUploadComplete={handleDocumentUploaded}
                    estateId={estateId}
                    identityForUserId={deceasedId}
                    isCritical={isMinor}
                  />
                </div>

                {/* Uploaded Documents */}
                {uploadedDocuments.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Uploaded Documents</span>
                      <span className="text-xs text-muted-foreground">
                        {uploadedDocuments.length} attached
                      </span>
                    </div>
                    <div className="space-y-2">
                      {uploadedDocuments.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 rounded-lg border bg-muted/20"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-primary" />
                            <div>
                              <div className="text-sm font-medium">{doc.fileName}</div>
                              <div className="text-xs text-muted-foreground">
                                {(doc.sizeBytes / 1024).toFixed(0)} KB • Uploaded
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRemoveDocument(doc.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Extracted Data Preview */}
                {extractedData && (
                  <Card className="border-green-200 bg-green-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-green-600" />
                        Extracted Data
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3">
                        {extractedData.firstName && (
                          <div>
                            <div className="text-xs text-muted-foreground">First Name</div>
                            <div className="font-medium">{extractedData.firstName}</div>
                          </div>
                        )}
                        {extractedData.lastName && (
                          <div>
                            <div className="text-xs text-muted-foreground">Last Name</div>
                            <div className="font-medium">{extractedData.lastName}</div>
                          </div>
                        )}
                        {extractedData.nationalId && (
                          <div>
                            <div className="text-xs text-muted-foreground">National ID</div>
                            <div className="font-medium">{extractedData.nationalId}</div>
                          </div>
                        )}
                        {extractedData.dateOfBirth && (
                          <div>
                            <div className="text-xs text-muted-foreground">Date of Birth</div>
                            <div className="font-medium">
                              {format(new Date(extractedData.dateOfBirth), 'PPP')}
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Continue to Manual Form Button */}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setActiveTab('manual');
                  if (extractedData) {
                    toast.info('Form pre-filled', {
                      description: 'Review and complete remaining information',
                    });
                  }
                }}
              >
                <ChevronRight className="mr-2 h-4 w-4" />
                Continue to Detailed Form
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Manual Entry Tab */}
        <TabsContent value="manual" className="space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Personal Information</CardTitle>
                  <CardDescription>
                    Core identity details for succession records
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="middleName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Middle Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Kipchoge" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Kamau" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="gender"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gender *</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={Gender.MALE}>Male</SelectItem>
                              <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                              <SelectItem value={Gender.OTHER}>Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>
                            Date of Birth
                            {formAge !== null && (
                              <span className={cn(
                                "ml-2 text-xs font-medium",
                                isFormMinor ? "text-amber-600" : "text-green-600"
                              )}>
                                ({formAge} years {isFormMinor && '• Minor'})
                              </span>
                            )}
                          </FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(new Date(field.value), "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value ? new Date(field.value) : undefined}
                                onSelect={(date) => field.onChange(date?.toISOString())}
                                disabled={(date) =>
                                  date > new Date() || date < new Date("1900-01-01")
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="dateOfBirthEstimated"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Estimated Date of Birth
                          </FormLabel>
                          <FormDescription>
                            Check if the date of birth is approximate
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Kenyan Identity Information */}
              <Accordion type="single" collapsible>
                <AccordionItem value="identity">
                  <AccordionTrigger className="text-lg font-medium">
                    Kenyan Identity Details
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="nationalId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              National ID / Birth Certificate No.
                              {isCriticalSuccessionMember && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="12345678" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="tribe"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tribe</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select tribe" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {KENYAN_TRIBES.map(tribe => (
                                  <SelectItem key={tribe} value={tribe}>
                                    {tribe}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="placeOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Place of Birth</FormLabel>
                            <FormControl>
                              <Input placeholder="Nairobi" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="homeCounty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Home County</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select county" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {Object.values(KenyanCounty).map(county => (
                                  <SelectItem key={county} value={county}>
                                    {county.replace('_', ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Relationship Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Family Relationship</CardTitle>
                  <CardDescription>
                    Define kinship for succession inheritance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="relationshipToRelative"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Relationship to {relativeId ? 'Family Member' : 'Deceased'}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <HelpCircle className="ml-2 h-4 w-4 inline text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              This determines inheritance rights under Kenyan succession law
                            </TooltipContent>
                          </Tooltip>
                        </FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select relationship" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={RelationshipType.SPOUSE}>Spouse</SelectItem>
                            <SelectItem value={RelationshipType.CHILD}>Child</SelectItem>
                            <SelectItem value={RelationshipType.PARENT}>Parent</SelectItem>
                            <SelectItem value={RelationshipType.SIBLING}>Sibling</SelectItem>
                            <SelectItem value={RelationshipType.GRANDCHILD}>Grandchild</SelectItem>
                            <SelectItem value={RelationshipType.GRANDPARENT}>Grandparent</SelectItem>
                            <SelectItem value={RelationshipType.OTHER}>Other Relative</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('relationshipToRelative') === RelationshipType.CHILD && isFormMinor && (
                    <Alert variant="warning" className="border-amber-200 bg-amber-50">
                      <Baby className="h-4 w-4 text-amber-600" />
                      <AlertTitle>Minor Child Detected</AlertTitle>
                      <AlertDescription>
                        This child will require a legal guardian for succession proceedings.
                        Please ensure guardianship is established.
                      </AlertDescription>
                    </Alert>
                  )}

                  {form.watch('relationshipToRelative') === RelationshipType.SPOUSE && (
                    <Alert variant="info" className="border-blue-200 bg-blue-50">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <AlertTitle>Spousal Rights</AlertTitle>
                      <AlertDescription>
                        Under Kenyan law, spouses have priority inheritance rights.
                        Ensure marriage documentation is uploaded.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* Succession Status Summary */}
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg">Succession Status Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Identity Status</div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          uploadedDocuments.length > 0 ? "bg-green-500" : "bg-gray-300"
                        )} />
                        <span className="text-sm">
                          {uploadedDocuments.length > 0 ? 'Documents Uploaded' : 'No Documents'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Age Category</div>
                      <Badge variant={isFormMinor ? "warning" : "default"}>
                        {isFormMinor ? 'Minor (<18)' : 'Adult (≥18)'}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="text-sm font-medium">Succession Priority</div>
                      <Badge variant={
                        isCriticalSuccessionMember ? "destructive" : 
                        isFormMinor ? "warning" : "default"
                      }>
                        {isCriticalSuccessionMember ? 'High Priority' : 
                         isFormMinor ? 'Requires Guardian' : 'Standard'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Form Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                <div className="flex-1 space-y-2">
                  {isFormMinor && isCriticalSuccessionMember && (
                    <p className="text-sm text-amber-600">
                      ⚠️ Minor child of deceased - Guardian must be assigned before court filing
                    </p>
                  )}
                  {uploadedDocuments.length === 0 && isCriticalSuccessionMember && (
                    <p className="text-sm text-red-600">
                      ⚠️ Identity documents required for succession verification
                    </p>
                  )}
                </div>
                
                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isPending}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isPending}
                    className={cn(
                      isCriticalSuccessionMember && "bg-amber-600 hover:bg-amber-700"
                    )}
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Member...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Add Family Member
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ============================================================================
// QUICK ADD MODAL VERSION
// ============================================================================

interface QuickAddMemberFormProps extends Omit<AddMemberFormProps, 'onCancel' | 'className'> {
  trigger?: React.ReactNode;
}

export const QuickAddMemberForm: React.FC<QuickAddMemberFormProps> = ({
  trigger,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>{trigger}</div>
      ) : (
        <Button onClick={() => setIsOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Quick Add Member
        </Button>
      )}
      
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background rounded-lg shadow-lg">
            <AddMemberForm
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