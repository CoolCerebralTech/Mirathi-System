import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, UserCheck, AlertCircle, Shield } from 'lucide-react';
import { 
  Button, 
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
  Alert,
  AlertDescription,
  AlertTitle
} from '@/components/ui';
import { AddWitnessSchema, type AddWitnessInput } from '@/types/estate.types';
import { useAddWitness } from '@/api/estate/estate.api';

interface AddWitnessDialogProps {
  isOpen: boolean;
  onClose: () => void;
  willId: string;
}

export const AddWitnessDialog: React.FC<AddWitnessDialogProps> = ({ 
  isOpen, 
  onClose, 
  willId 
}) => {
  const form = useForm<AddWitnessInput>({
    resolver: zodResolver(AddWitnessSchema),
    mode: 'onChange',
    defaultValues: {
      fullName: '',
      nationalId: '',
      email: '',
    },
  });

  const { mutate: addWitness, isPending, error } = useAddWitness(willId, {
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  const onSubmit = (data: AddWitnessInput) => {
    addWitness(data);
  };

  const handleClose = () => {
    if (!isPending) {
      form.reset();
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-primary" />
            Nominate Witness
          </DialogTitle>
          <DialogDescription>
            Kenyan law requires at least 2 competent witnesses who must be present when you sign your will.
          </DialogDescription>
        </DialogHeader>

        {/* Legal Requirements Alert */}
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertTitle className="text-sm font-semibold">Legal Requirements (Section 13)</AlertTitle>
          <AlertDescription className="text-xs space-y-1">
            <p>• Witness must be over 18 years of age</p>
            <p>• Witness cannot be a beneficiary in the will</p>
            <p>• Witness must be of sound mind</p>
            <p>• Witness must be present when you sign</p>
          </AlertDescription>
        </Alert>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error.message || 'Failed to add witness. Please try again.'}
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {/* FULL NAME */}
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Legal Name *</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isPending}
                      placeholder="As per National ID or Passport" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* NATIONAL ID & EMAIL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nationalId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>National ID (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        placeholder="12345678" 
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Helps verify identity
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        disabled={isPending}
                        type="email"
                        placeholder="witness@example.com" 
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      For notifications
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* LEGAL CONFIRMATION NOTICE */}
            <Alert className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-900">
                <strong>Important:</strong> By nominating this person as a witness, you confirm that:
                <ul className="list-disc pl-5 mt-1 space-y-0.5">
                  <li>They are over 18 years of age</li>
                  <li>They are NOT a beneficiary in this will</li>
                  <li>They are mentally capable of witnessing</li>
                  <li>They will be present when you sign the will</li>
                </ul>
              </AlertDescription>
            </Alert>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Adding...' : 'Nominate Witness'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};