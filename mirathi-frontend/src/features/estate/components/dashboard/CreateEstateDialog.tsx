import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, ShieldCheck } from 'lucide-react';
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
  AlertDescription
} from '@/components/ui';
import { CreateEstateSchema, type CreateEstateInput } from '@/types/estate.types';
import { useCreateEstate } from '../../estate.api';

// In a real app, you get this from your Auth Context
// For now, we accept it as a prop
interface CreateEstateDialogProps {
  isOpen: boolean;
  userId: string; 
  userName: string; // Pre-fill from Auth
}

export const CreateEstateDialog: React.FC<CreateEstateDialogProps> = ({ 
  isOpen, 
  userId, 
  userName 
}) => {
  const form = useForm<CreateEstateInput>({
    resolver: zodResolver(CreateEstateSchema),
    defaultValues: {
      userId,
      userName,
      kraPin: '',
    },
  });

  // We don't close this dialog manually; it closes when data exists (handled by parent page)
  const { mutate: createEstate, isPending } = useCreateEstate();

  const onSubmit = (data: CreateEstateInput) => {
    createEstate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[450px] [&>button]:hidden">
        <DialogHeader>
          <div className="mx-auto bg-blue-50 p-3 rounded-full mb-2">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <DialogTitle className="text-center text-xl">Initialize Your Estate</DialogTitle>
          <DialogDescription className="text-center">
            Welcome to the Digital Lawyer. To begin managing your assets and succession plan, 
            we need to initialize your estate ledger.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
            
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estate Owner Name</FormLabel>
                  <FormControl>
                    <Input {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="kraPin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>KRA PIN (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="A000000000Z" 
                      maxLength={11} 
                      className="uppercase placeholder:normal-case"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-muted-foreground">
                    Required for generating accurate tax compliance reports.
                  </p>
                </FormItem>
              )}
            />

            <Alert className="bg-blue-50 border-blue-100 text-blue-800">
              <AlertDescription className="text-xs">
                By creating this estate, you are establishing a digital ledger for your 
                assets (S.40) and liabilities (S.45) under the Law of Succession Act.
              </AlertDescription>
            </Alert>

            <Button type="submit" className="w-full" size="lg" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Create Estate Ledger'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};