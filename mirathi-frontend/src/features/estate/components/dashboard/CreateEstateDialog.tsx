// ============================================================================
// FILE: CreateEstateDialog.tsx
// ============================================================================

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

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
  Button,
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui';

import { CreateEstateSchema, type CreateEstateInput } from '@/types/estate.types';
import { useCreateEstate } from '@/api/estate/estate.api';

interface CreateEstateDialogProps {
  isOpen: boolean;
  userId: string; 
  userName: string;
  onSuccess?: () => void;
}

export const CreateEstateDialog: React.FC<CreateEstateDialogProps> = ({ 
  isOpen, 
  userId, 
  userName,
  onSuccess 
}) => {
  const form = useForm<CreateEstateInput>({
    resolver: zodResolver(CreateEstateSchema),
    mode: 'onChange',
    defaultValues: {
      userId,
      userName,
      kraPin: '',
    },
  });

  const { mutate: createEstate, isPending, error } = useCreateEstate({
    onSuccess: () => {
      // We don't reset userId/userName here to prevent UI flicker before parent updates
      onSuccess?.();
    }
  });

  const onSubmit = (data: CreateEstateInput) => {
    createEstate(data);
  };

  return (
    // We lock the dialog (no onOpenChange) so the user MUST complete this to proceed
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
        <DialogHeader className="text-center">
          <div className="mx-auto bg-gradient-to-br from-blue-50 to-purple-50 p-4 rounded-full mb-3 border-2 border-blue-100">
            <ShieldCheck className="w-10 h-10 text-blue-600" />
          </div>
          <DialogTitle className="text-2xl">Initialize Your Estate</DialogTitle>
          <DialogDescription className="text-base">
            Welcome to Mirathi, your Digital Succession Lawyer. Create your estate ledger 
            to begin managing your assets and planning for succession under Kenyan law.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Failed to create estate. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 mt-2">
            
            {/* ESTATE OWNER NAME */}
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estate Owner / Testator Name *</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      disabled={isPending} // Or readOnly if you don't want them changing it
                      className="bg-muted"
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    This is your full legal name as it will appear in legal documents
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* KRA PIN */}
            <FormField
              control={form.control}
              name="kraPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KRA PIN *</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isPending}
                      placeholder="A000000000Z" 
                      maxLength={11} 
                      autoComplete="off"
                      className="uppercase font-mono placeholder:normal-case placeholder:font-sans"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground">
                    Format: Letter + 9 digits + Letter (e.g., A123456789B)
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* LEGAL NOTICE */}
            <Alert className="bg-blue-50 border-blue-200">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-900 text-sm font-semibold">
                Legal Framework
              </AlertTitle>
              <AlertDescription className="text-xs text-blue-800 space-y-1">
                <p>
                  By creating this estate, you are establishing a digital ledger for:
                </p>
                <ul className="list-disc pl-5 space-y-0.5 mt-1">
                  <li>Assets inventory (Section 40, Law of Succession Act)</li>
                  <li>Liabilities tracking (Section 45, Law of Succession Act)</li>
                  <li>Net worth calculation for succession planning</li>
                  <li>Will creation and beneficiary designation</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* WHY KRA PIN INFO */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>Why KRA PIN?</strong> Used to generate accurate tax compliance reports 
                required by the High Court during estate administration.
              </AlertDescription>
            </Alert>

            {/* SUBMIT BUTTON */}
            <Button 
              type="submit" 
              className="w-full" 
              size="lg" 
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Estate Ledger...
                </>
              ) : (
                <>
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Create Estate Ledger
                </>
              )}
            </Button>

            {/* DISCLAIMER */}
            <p className="text-xs text-center text-muted-foreground">
              Your data is encrypted and stored securely. You can update or delete 
              your estate information at any time.
            </p>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};