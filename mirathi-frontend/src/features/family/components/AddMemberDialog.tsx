// mirathi-frontend/src/components/family/AddMemberDialog.tsx

import React from 'react';
import { useForm, type SubmitHandler, type DefaultValues, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { z } from 'zod';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Switch,
  Textarea,
} from '@/components/ui';

import { useAddFamilyMember } from '@/api/family/family.api';
import { 
  AddFamilyMemberSchema, 
  RelationshipType, 
  Gender,
  type AddFamilyMemberInput
} from '@/types/family.types';

// ============================================================================
// 1. EXTENDED FORM SCHEMA
// ============================================================================
// We extend the schema to include UI-only fields (like isAlive) or fields 
// that exist in the form but might be missing from the strict API Input type.
const FormSchema = AddFamilyMemberSchema.extend({
  isAlive: z.boolean().default(true),
  isMentallyCapable: z.boolean().default(true),
  causeOfDeath: z.string().optional(),
  placeOfDeath: z.string().optional(),
  polygamousHouseId: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface AddMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  familyId: string;
}

export const AddMemberDialog: React.FC<AddMemberDialogProps> = ({ 
  isOpen, 
  onClose, 
  familyId 
}) => {
  const form = useForm<FormValues>({
    // Cast resolver to 'unknown' then 'Resolver<FormValues>' to satisfy 
    // TypeScript when Zod outputs optional fields that RHF expects to be strictly typed.
    resolver: zodResolver(FormSchema) as unknown as Resolver<FormValues>,
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      relationship: RelationshipType.CHILD,
      gender: Gender.MALE,
      
      // UI Control
      isAlive: true,
      
      // Booleans
      isAdopted: false,
      hasDisability: false,
      isMentallyCapable: true,
      
      // Strings (Initialize empty to avoid uncontrolled inputs)
      middleName: '',
      maidenName: '',
      nationalId: '',
      birthCertNo: '',
      kraPin: '',
      passportNumber: '',
      phoneNumber: '',
      email: '',
      currentAddress: '',
      disabilityType: '',
      causeOfDeath: '',
      deathCertNo: '',
      placeOfDeath: '',
      polygamousHouseId: '',
      
      // Dates
      dateOfBirth: undefined,
      dateOfDeath: undefined,
      adoptionDate: undefined,
    } as DefaultValues<FormValues>,
  });

  const { mutate: addMember, isPending } = useAddFamilyMember(familyId, {
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  const onSubmit: SubmitHandler<FormValues> = (data) => {
    // 1. Helper to format ISO dates
    const toISO = (dateStr: string | undefined | null): string | undefined => {
      if (!dateStr) return undefined;
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? undefined : date.toISOString();
    };

    // 2. Helper to clean empty strings to undefined
    const cleanStr = (str: string | undefined | null): string | undefined => {
      if (!str || str.trim() === '') return undefined;
      return str;
    };

    // 3. Construct payload strictly matching AddFamilyMemberInput interface.
    // We do NOT use 'any' here.
    const finalPayload: AddFamilyMemberInput = {
      // -- Required Fields --
      firstName: data.firstName,
      lastName: data.lastName,
      relationship: data.relationship,

      // -- Enums & Booleans --
      gender: data.gender,
      isAdopted: data.isAdopted,
      hasDisability: data.hasDisability,

      // -- Cleaned Strings --
      middleName: cleanStr(data.middleName),
      maidenName: cleanStr(data.maidenName),
      nationalId: cleanStr(data.nationalId),
      birthCertNo: cleanStr(data.birthCertNo),
      kraPin: cleanStr(data.kraPin),
      passportNumber: cleanStr(data.passportNumber),
      phoneNumber: cleanStr(data.phoneNumber),
      email: cleanStr(data.email),
      currentAddress: cleanStr(data.currentAddress),
      
      // Note: polygamousHouseId, causeOfDeath, placeOfDeath are excluded 
      // because they are not in AddFamilyMemberInput type definition.

      // -- Dates --
      dateOfBirth: toISO(data.dateOfBirth),

      // -- Conditional Logic: Death Details --
      // Only send if isAlive is false
      dateOfDeath: !data.isAlive ? toISO(data.dateOfDeath) : undefined,
      deathCertNo: !data.isAlive ? cleanStr(data.deathCertNo) : undefined,

      // -- Conditional Logic: Adoption --
      adoptionDate: data.isAdopted ? toISO(data.adoptionDate) : undefined,
      adoptionType: data.isAdopted ? data.adoptionType : undefined,
      biologicalParentIds: data.isAdopted ? data.biologicalParentIds : undefined,

      // -- Conditional Logic: Disability --
      disabilityType: data.hasDisability ? cleanStr(data.disabilityType) : undefined,
    };

    addMember(finalPayload);
  };

  const isAlive = form.watch('isAlive');
  const isAdopted = form.watch('isAdopted');
  const hasDisability = form.watch('hasDisability');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Add a person to your succession plan. Required fields are marked with *.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 pt-2">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              
              {/* --- NAMES --- */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane" {...field} />
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
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="middleName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Middle Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Optional" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maidenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maiden Name</FormLabel>
                      <FormControl>
                        <Input placeholder="For married women" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- RELATIONSHIP & DEMOGRAPHICS --- */}
              <FormField
                control={form.control}
                name="relationship"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relationship to You *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select relationship" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={RelationshipType.SPOUSE}>Spouse</SelectItem>
                        <SelectItem value={RelationshipType.CHILD}>Child</SelectItem>
                        <SelectItem value={RelationshipType.ADOPTED_CHILD}>Adopted Child</SelectItem>
                        <SelectItem value={RelationshipType.FATHER}>Father</SelectItem>
                        <SelectItem value={RelationshipType.MOTHER}>Mother</SelectItem>
                        <SelectItem value={RelationshipType.SIBLING}>Sibling</SelectItem>
                        <SelectItem value={RelationshipType.HALF_SIBLING}>Half Sibling</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Gender.MALE}>Male</SelectItem>
                          <SelectItem value={Gender.FEMALE}>Female</SelectItem>
                          <SelectItem value={Gender.OTHERS}>Others</SelectItem>
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
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value ? String(field.value).split('T')[0] : ''} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* --- CONTACT --- */}
              <div className="space-y-3 rounded-lg border p-4 bg-slate-50">
                <h4 className="text-sm font-medium">Contact Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+254..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="example@mail.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                    control={form.control}
                    name="currentAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Address</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Full address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
              </div>

              {/* --- LIFE STATUS --- */}
              <FormField
                control={form.control}
                name="isAlive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Life Status</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        Is this person alive?
                      </div>
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

              {!isAlive && (
                <div className="space-y-3 rounded-lg border p-4 bg-red-50">
                  <h4 className="text-sm font-medium text-red-900">Death Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dateOfDeath"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Death</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? String(field.value).split('T')[0] : ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="deathCertNo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Death Cert No.</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="causeOfDeath"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cause of Death</FormLabel>
                        <FormControl>
                          <Textarea {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* --- ADOPTION --- */}
              <FormField
                control={form.control}
                name="isAdopted"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Adoption Status</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        Is this child legally adopted?
                      </div>
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

              {isAdopted && (
                <div className="space-y-3 rounded-lg border p-4 bg-blue-50">
                  <h4 className="text-sm font-medium text-blue-900">Adoption Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="adoptionType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="LEGAL">Legal</SelectItem>
                              <SelectItem value="CUSTOMARY">Customary</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="adoptionDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date</FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field} 
                              value={field.value ? String(field.value).split('T')[0] : ''} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}

              {/* --- DISABILITY --- */}
              <FormField
                control={form.control}
                name="hasDisability"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Disability Status</FormLabel>
                      <div className="text-[0.8rem] text-muted-foreground">
                        Has a disability?
                      </div>
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

              {hasDisability && (
                <FormField
                  control={form.control}
                  name="disabilityType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-6 mt-4 border-t sticky bottom-0 bg-background pb-2">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Member
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};