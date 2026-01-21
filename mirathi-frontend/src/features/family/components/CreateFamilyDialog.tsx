// FILE: src/components/family/CreateFamilyDialog.tsx

import React from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Users } from 'lucide-react';
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
  Textarea,
  Button,
} from '@/components/ui';

import { useCreateFamily } from '@/api/family/family.api';
import { 
  CreateFamilySchema, 
  type CreateFamilyInput,
} from '@/types/family.types';

interface CreateFamilyDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateFamilyDialog: React.FC<CreateFamilyDialogProps> = ({ 
  isOpen, 
  onClose 
}) => {
  const form = useForm<CreateFamilyInput>({
    resolver: zodResolver(CreateFamilySchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const { mutate: createFamily, isPending } = useCreateFamily({
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  const onSubmit: SubmitHandler<CreateFamilyInput> = (data) => {
    // Clean empty description to undefined
    const cleanStr = (str: string | undefined | null) => 
      (!str || str.trim() === '') ? undefined : str;

    const payload: CreateFamilyInput = {
      name: data.name,
      description: cleanStr(data.description),
    };

    createFamily(payload);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Create Family Tree
          </DialogTitle>
          <DialogDescription>
            Start your digital succession plan by creating your family tree.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* Family Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Family Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="The Kamau Family" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Brief description of your family..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Family Tree
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};