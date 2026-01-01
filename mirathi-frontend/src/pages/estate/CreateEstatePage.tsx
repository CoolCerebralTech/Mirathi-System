// pages/estate/CreateEstatePage.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/ui';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui';
import { Alert, AlertDescription } from '@/components/ui';
import { EstateForm } from '@/features/estate/forms';

export const CreateEstatePage: React.FC = () => {
  const navigate = useNavigate();

  const handleSuccess = (data: { id: string }) => {
    navigate(`/estates/${data.id}`);
  };

  const handleCancel = () => {
    navigate('/estates');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/estates')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Estates
            </Button>
          </div>
          <div className="mt-4">
            <h1 className="text-3xl font-bold text-slate-900">Create New Estate</h1>
            <p className="text-slate-600 mt-1">
              Initialize a new estate administration ledger
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Info Alert */}
        <Alert className="mb-6 border-blue-200 bg-blue-50">
          <FileText className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Getting Started:</strong> You'll need the deceased's personal information, 
            KRA PIN, and death certificate details. You can add assets, debts, and other 
            information after creating the estate.
          </AlertDescription>
        </Alert>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <CardTitle>Estate Information</CardTitle>
            <CardDescription>
              Enter the details of the deceased and the executor managing this estate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EstateForm
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6 border-slate-200">
          <CardHeader>
            <CardTitle className="text-base">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-slate-600 space-y-2">
            <p>
              <strong>KRA PIN Format:</strong> The KRA PIN should be in the format A123456789Z 
              (one letter, nine digits, one letter).
            </p>
            <p>
              <strong>Executor ID:</strong> This should be the user ID of the person who will 
              manage this estate in the system.
            </p>
            <p>
              <strong>Court Case Number:</strong> If probate or letters of administration have 
              been granted, enter the court case reference number here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};