// FILE: src/pages/family/MemberProfilePage.tsx

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  ShieldAlert, 
  FileText, 
  Edit 
} from 'lucide-react';
import { format } from 'date-fns';

import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge
} from '../../components/ui';
import { LoadingSpinner } from '../../components/common';
import { SmartUploader } from '../../features/documents/components';
import { KinshipLinks, LegalStatusBadge } from '../../features/family/components';

import { useFamilyMember, useVerifyIdentity } from '../../features/family/family.api';

import { 
  DocumentCategoryEnum, 
  type UploadDocumentResponse 
} from '../../types/document.types';

export const MemberProfilePage: React.FC = () => {
  const { familyId, memberId } = useParams<{ familyId: string; memberId: string }>();
  const navigate = useNavigate();

  // 1. Fetch Member Data
  const { data: member, isLoading } = useFamilyMember(familyId!, memberId!);
  
  // 2. Verification Hook
  const { mutate: verify } = useVerifyIdentity(familyId!, memberId!);

  if (isLoading || !member) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading digital twin..." />
      </div>
    );
  }

  // Handlers
  // TYPE FIX: We now use the exact type returned by the upload API schema
  const handleDocumentUploaded = (docResponse: UploadDocumentResponse) => {
    // In a real flow, this would trigger an auto-verification process
    // For now, we manually trigger the verification status update
    verify({
      isValid: true,
      verificationMethod: 'MANUAL_DOCUMENT_REVIEW',
      documentId: docResponse.id, // This is safe because UploadDocumentResponse has an 'id'
      notes: 'Document uploaded via profile page.'
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      
      {/* 1. Navigation & Header */}
      <div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="mb-4 pl-0 hover:bg-transparent hover:text-primary"
          onClick={() => navigate(`/dashboard/family/${familyId}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Estate Dashboard
        </Button>
        
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
             <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-200 text-2xl font-bold text-slate-500">
                {member.identity.first[0]}{member.identity.last[0]}
             </div>
             <div>
                <h1 className="text-2xl font-bold tracking-tight">{member.identity.fullName}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <span>{member.identity.gender}</span>
                    <span>•</span>
                    <span>{member.identity.age ? `${member.identity.age} years old` : 'Age unknown'}</span>
                    {!member.vitalStatus.isAlive && (
                        <Badge variant="secondary" className="ml-2">Deceased</Badge>
                    )}
                </div>
             </div>
          </div>

          <div className="flex items-center gap-2">
             <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
             </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        
        {/* 2. Left Column: Details & Kinship */}
        <div className="space-y-6 md:col-span-8">
            
            {/* Identity Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Personal Details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Legal Name</span>
                        <p className="font-medium">{member.identity.officialName}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">National ID</span>
                        <p className="font-medium">{member.identity.nationalId || 'Not Recorded'}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Date of Birth</span>
                        <p className="font-medium">
                            {member.identity.dateOfBirth 
                                ? format(new Date(member.identity.dateOfBirth), 'PPP') 
                                : 'Unknown'}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">Legal Status</span>
                        <div className="flex">
                            <LegalStatusBadge status={member.legalStatus} />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Relationships */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Family Relationships</CardTitle>
                </CardHeader>
                <CardContent>
                    <KinshipLinks 
                        kinship={member.kinship} 
                        onNavigate={(id) => navigate(`/dashboard/family/${familyId}/member/${id}`)}
                    />
                </CardContent>
            </Card>

        </div>

        {/* 3. Right Column: Verification & Documents */}
        <div className="space-y-6 md:col-span-4">
            
            {/* Verification Status Widget */}
            <Card className={member.verification.isVerified ? "border-green-200 bg-green-50/30" : "border-amber-200 bg-amber-50/30"}>
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        {member.verification.isVerified ? (
                            <ShieldCheck className="h-5 w-5 text-green-600" />
                        ) : (
                            <ShieldAlert className="h-5 w-5 text-amber-600" />
                        )}
                        Identity Verification
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                        {member.verification.isVerified 
                            ? `Verified via ${member.verification.method?.replace(/_/g, ' ') || 'Document Review'}`
                            : "This member has not been verified yet. Upload an ID or Birth Certificate to verify."
                        }
                    </p>
                    {!member.verification.isVerified && (
                         <div className="rounded-lg border bg-white p-3">
                            <SmartUploader 
                                category={DocumentCategoryEnum.enum.IDENTITY_PROOF}
                                label="Upload ID Document"
                                identityForUserId={member.id} 
                                onUploadComplete={handleDocumentUploaded}
                            />
                         </div>
                    )}
                </CardContent>
            </Card>

            {/* Document List Placeholder */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                        <FileText className="h-4 w-4" />
                        Attached Documents
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-6 text-center text-xs text-muted-foreground">
                        <p>No other documents found.</p>
                    </div>
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
};