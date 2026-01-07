// ============================================================================
// FILE 3: src/pages/family/GuardianshipListPage.tsx
// Manage all guardianships in the family
// ============================================================================

import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ShieldCheck, 
  Baby, 
  Plus,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Alert,
  AlertDescription,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { GuardianshipManager } from '@/features/family/components';
import { useFamilyTree, useMyFamily } from '@/features/family/family.api';

export const GuardianshipListPage: React.FC = () => {
  const { familyId } = useParams<{ familyId?: string }>();
  const navigate = useNavigate();
  
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null);

  const { data: myFamily } = useMyFamily();
  const effectiveFamilyId = familyId || myFamily?.id || '';
  
  const { data: tree, isLoading } = useFamilyTree(effectiveFamilyId, {
    enabled: !!effectiveFamilyId
  });

  // Get all minors from tree
  const minors = tree?.children?.filter(child => child.isMinor) || [];

  if (!effectiveFamilyId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No family data available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard/family')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Guardianship Management</h1>
                <p className="text-sm text-muted-foreground">
                  Manage guardians for minors in your family
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 container mx-auto p-6 space-y-6">
        
        {/* Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Total Minors</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{minors.length}</div>
              <p className="text-xs text-muted-foreground">Requiring guardianship</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Active Guardians</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">Currently assigned</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="outline">Pending</Badge>
              <p className="text-xs text-muted-foreground mt-1">Action required</p>
            </CardContent>
          </Card>
        </div>

        {/* Legal Notice */}
        <Alert className="bg-blue-50 border-blue-200">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Legal Requirement:</strong> Under Section 70 of the Children Act,
            minors must have appointed testamentary guardians in your will to ensure
            proper care and protection.
          </AlertDescription>
        </Alert>

        {/* Minors List */}
        {minors.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Baby className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No Minors in Family Tree</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add children under 18 to manage their guardianship
              </p>
              <Button onClick={() => navigate('/dashboard/family')}>
                Go to Family Tree
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Minors Requiring Guardianship</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {minors.map((minor) => (
                  <div
                    key={minor.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <Baby className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium">{minor.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {minor.role || 'Child'}
                          </Badge>
                          {minor.age && (
                            <span className="text-xs text-muted-foreground">
                              {minor.age} years old
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          No Guardian
                        </Badge>
                      </div>
                      <Button
                        onClick={() => setSelectedWardId(minor.id)}
                      >
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        Assign Guardian
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Guardianship Assignment Dialog */}
      <Dialog 
        open={!!selectedWardId} 
        onOpenChange={() => setSelectedWardId(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Assign Guardian</DialogTitle>
          </DialogHeader>
          {selectedWardId && (
            <GuardianshipManager
              familyId={effectiveFamilyId}
              wardId={selectedWardId}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};