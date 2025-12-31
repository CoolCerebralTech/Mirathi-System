import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter
} from '@/components/ui';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui';
import { Button, Textarea } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';
import { useRevokeWill } from '../will.api';
import { RevokeWillRequestSchema, type RevokeWillInput, RevocationMethod } from '@/types/will.types';

interface RevokeWillDialogProps {
  willId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RevokeWillDialog: React.FC<RevokeWillDialogProps> = ({ 
  willId, 
  open, 
  onOpenChange 
}) => {
  const mutation = useRevokeWill(willId, {
    onSuccess: () => {
      onOpenChange(false);
    }
  });

  const form = useForm<RevokeWillInput>({
    resolver: zodResolver(RevokeWillRequestSchema),
    defaultValues: {
      method: RevocationMethod.DESTRUCTION,
      reason: ''
    }
  });

  const handleSubmit = (data: RevokeWillInput) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md border-red-200">
        <DialogHeader>
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="h-5 w-5" />
            <DialogTitle>Revoke Will</DialogTitle>
          </div>
          <DialogDescription>
            Are you sure you want to revoke this Will? This action cannot be undone. 
            The Will will be marked as invalid in the system.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Method of Revocation</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={RevocationMethod.DESTRUCTION}>Physical Destruction (S.18)</SelectItem>
                      <SelectItem value={RevocationMethod.NEW_WILL}>Making a New Will (S.18)</SelectItem>
                      <SelectItem value={RevocationMethod.MARRIAGE}>Subsequent Marriage (S.19)</SelectItem>
                      <SelectItem value={RevocationMethod.COURT_ORDER}>Court Order</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Why is this will being revoked?" 
                      className="resize-none"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive" 
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Revoking...' : 'Confirm Revocation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};