import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, FileCheck, Upload } from 'lucide-react';

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
} from '@/components/ui';

import { 
  VerifyAssetSchema,
  type VerifyAssetInput 
} from '@/types/estate.types';

import { useVerifyAsset } from '../../estate.api';

interface VerifyAssetDialogProps {
  isOpen: boolean;
  onClose: () => void;
  assetId: string;
}

export const VerifyAssetDialog: React.FC<VerifyAssetDialogProps> = ({ 
  isOpen, 
  onClose, 
  assetId 
}) => {
  const form = useForm<VerifyAssetInput>({
    resolver: zodResolver(VerifyAssetSchema),
    defaultValues: {
      proofDocumentUrl: '',
    },
  });

  const { mutate: verifyAsset, isPending } = useVerifyAsset({
    onSuccess: () => {
      form.reset();
      onClose();
    },
  });

  const onSubmit = (data: VerifyAssetInput) => {
    verifyAsset({ assetId, data });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileCheck className="h-5 w-5 text-primary" />
            Verify Asset Ownership
          </DialogTitle>
          <DialogDescription>
            Upload proof of ownership documentation to verify this asset. This strengthens your succession plan.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Upload className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Accepted Documents:</strong> Title deeds, bank statements, vehicle logbooks, 
            purchase receipts, or any official ownership documentation.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="proofDocumentUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document URL *</FormLabel>
                  <FormControl>
                    <Input 
                      disabled={isPending}
                      type="url"
                      placeholder="https://example.com/document.pdf"
                      autoFocus
                      {...field} 
                    />
                  </FormControl>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your document to a secure cloud storage (Google Drive, Dropbox, etc.) 
                    and paste the shareable link here.
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isPending ? 'Verifying...' : 'Verify Asset'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};