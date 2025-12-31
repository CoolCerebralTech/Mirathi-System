import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { 
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
  Popover,
  PopoverContent,
  PopoverTrigger,
  Calendar
} from '../../../components/ui';
import {
  type UploadDocumentResponse
} from '../../../types/document.types';

import { SmartUploader } from '../../../features/documents/components';
import { useAddMember } from '../family.api';
import { 
  AddFamilyMemberRequestSchema, 
  type AddFamilyMemberInput, 
  Gender,
  RelationshipType 
} from '../../../types/family.types';
import { DocumentCategoryEnum } from '../../../types/document.types';
import { cn } from '../../../lib/utils';

interface AddMemberFormProps {
  familyId: string;
  /**
   * If adding a relative relative to someone specific (e.g. "Add Son to John")
   */
  relativeId?: string;
  preselectedRelationship?: RelationshipType;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AddMemberForm: React.FC<AddMemberFormProps> = ({
  familyId,
  relativeId,
  preselectedRelationship,
  onSuccess,
  onCancel,
}) => {
  const [documentId, setDocumentId] = useState<string | null>(null);

  // 1. Setup Form
  const form = useForm<AddFamilyMemberInput>({
    resolver: zodResolver(AddFamilyMemberRequestSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      gender: 'MALE', // Default
      relativeId: relativeId,
      relationshipToRelative: preselectedRelationship,
      dateOfBirthEstimated: false,
    },
  });

  // 2. API Hook
  const { mutate, isPending } = useAddMember(familyId, {
    onSuccess: () => {
      form.reset();
      onSuccess?.();
    },
  });

  // 3. Handlers
  const onSubmit = (data: AddFamilyMemberInput) => {
    // In a real app, we would link the documentId to a DefineRelationship call 
    // or pass it in metadata, but for now we focus on the member creation.
    mutate(data);
  };

  const handleDocumentUploaded = (response: UploadDocumentResponse) => {
    setDocumentId(response.id);
    // OPTIONAL: Here you could call an endpoint to "Extract Data" from the document
    // and form.setValue('firstName', extracted.firstName) etc.
  };

  return (
    <div className="space-y-6">
      
      {/* A. The "Smart" Entry Point */}
      <div className="rounded-lg border bg-muted/30 p-4">
        <h4 className="mb-2 text-sm font-semibold">Fast Entry (Optional)</h4>
        <SmartUploader 
          category={DocumentCategoryEnum.enum.IDENTITY_PROOF}
          label="Upload ID or Birth Certificate"
          description="We'll attach this to the member's profile for verification."
          onUploadComplete={handleDocumentUploaded}
          className="bg-background"
        />
        {documentId && (
            <p className="mt-2 text-xs text-green-600 flex items-center">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" /> 
                Processing document data... (Simulated)
            </p>
        )}
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or Enter Details Manually
          </span>
        </div>
      </div>

      {/* B. The Manual Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
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
                  <FormLabel>Last Name</FormLabel>
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
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={Gender.MALE}>Male</SelectItem>
                      <SelectItem value={Gender.FEMALE}>Female</SelectItem>
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
                  <FormLabel>Date of Birth</FormLabel>
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
            name="nationalId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>National ID / Birth Cert No.</FormLabel>
                <FormControl>
                  <Input placeholder="12345678" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationshipToRelative"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship to {relativeId ? 'Reference Member' : 'Deceased'}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select relationship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(RelationshipType).map((rel) => (
                      <SelectItem key={rel} value={rel}>
                        {rel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Member
            </Button>
          </div>

        </form>
      </Form>
    </div>
  );
};