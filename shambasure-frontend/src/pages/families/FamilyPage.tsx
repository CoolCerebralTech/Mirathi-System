// FILE: src/pages/FamilyPage.tsx

import { useState } from 'react';
import { PageHeader } from '../components/common/PageHeader';
import { Button } from '../components/ui/Button';
import { PlusCircle } from 'lucide-react';
import { useMyFamilies } from '../features/families/families.api';
import { FamilyTree } from '../features/families/components/FamilyTree';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/Select';
import { Card, CardContent } from '../components/ui/Card';

export function FamilyPage() {
  const { data: families, isLoading } = useMyFamilies();
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  // If there's only one family, select it by default.
  // Or if a family was selected but is no longer in the list, reset.
  if (families && !selectedFamilyId && families.length > 0) {
      setSelectedFamilyId(families[0].id);
  } else if (families && selectedFamilyId && !families.find(f => f.id === selectedFamilyId)) {
      setSelectedFamilyId(families.length > 0 ? families[0].id : null);
  }

  const selectedFamily = families?.find(f => f.id === selectedFamilyId);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Family (HeirLink™)"
        description="Visualize and manage your family structure for succession planning."
        actions={
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create New Family
          </Button>
        }
      />

      {isLoading && <div className="flex justify-center p-8"><LoadingSpinner size="lg" /></div>}

      {!isLoading && !families?.length && (
          <div className="text-center p-8 border-2 border-dashed rounded-lg">
              <p className="text-muted-foreground">You haven't created or joined any families yet.</p>
              <Button className="mt-4">Create Your First Family</Button>
          </div>
      )}

      {families && families.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-4">
            {/* Family Selector */}
            {families.length > 1 && (
                <div className="max-w-xs">
                    <Select onValueChange={setSelectedFamilyId} value={selectedFamilyId || ''}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a family to view..." />
                        </SelectTrigger>
                        <SelectContent>
                            {families.map(family => (
                                <SelectItem key={family.id} value={family.id}>{family.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}
            
            {/* Family Tree Display */}
            {selectedFamily ? (
              <FamilyTree family={selectedFamily} />
            ) : (
                <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                    Please select a family to view the tree.
                </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}