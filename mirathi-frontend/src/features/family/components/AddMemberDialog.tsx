// FILE: src/components/family/AddMemberDialog.tsx

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
} from '@/components/ui';

import { useAddFamilyMember } from '@/api/family/family.api';
import { 
  AddFamilyMemberSchema, 
  RelationshipType, 
  Gender,
  type AddFamilyMemberInput
} from '@/types/family.types';

// ============================================================================
// 1. FORM SCHEMA (Strictly matches Backend DTO)
// ============================================================================
// We don't need to extend the schema for UI fields like 'isAlive' 
// because the backend assumes everyone is alive upon creation.
const FormSchema = AddFamilyMemberSchema;

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
    resolver: zodResolver(FormSchema) as unknown as Resolver<FormValues>,
    mode: 'onTouched',
    defaultValues: {
      firstName: '',
      lastName: '',
      relationship: RelationshipType.CHILD,
      gender: Gender.MALE,
      
      // Booleans
      isAdopted: false,
      
      // Strings (Initialize empty to avoid uncontrolled inputs)
      middleName: '',
      maidenName: '',
      nationalId: '',
      phoneNumber: '',
      email: '',
      polygamousHouseId: '',
      
      // Dates
      dateOfBirth: undefined,
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

    // 3. Construct payload strictly matching AddFamilyMemberDto
    const finalPayload: AddFamilyMemberInput = {
      // -- Required Fields --
      firstName: data.firstName,
      lastName: data.lastName,
      relationship: data.relationship,

      // -- Enums & Booleans --
      gender: data.gender,
      isAdopted: data.isAdopted,

      // -- Cleaned Strings --
      middleName: cleanStr(data.middleName),
      maidenName: cleanStr(data.maidenName),
      nationalId: cleanStr(data.nationalId),
      phoneNumber: cleanStr(data.phoneNumber),
      email: cleanStr(data.email),
      
      // -- Dates --
      dateOfBirth: toISO(data.dateOfBirth),
      adoptionDate: data.isAdopted ? toISO(data.adoptionDate) : undefined,
      
      // -- Polygamy --
      polygamousHouseId: cleanStr(data.polygamousHouseId),
    };

    addMember(finalPayload);
  };

  const isAdopted = form.watch('isAdopted');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Add Family Member</DialogTitle>
          <DialogDescription>
            Add a living person to your succession plan. 
            <br />
            <span className="text-xs text-slate-500 italic">
              (To report a death, add the member first, then use the 'Report Death' action).
            </span>
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
                  name="nationalId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>National ID No.</FormLabel>
                      <FormControl>
                         <Input placeholder="ID Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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