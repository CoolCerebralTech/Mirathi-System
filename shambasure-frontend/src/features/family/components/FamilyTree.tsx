import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { MoreHorizontal, Edit, Trash2, User, AlertTriangle, Baby, Crown } from 'lucide-react';
import { toast } from 'sonner';

import { useFamilyTree, useCreateFamilyMember } from '../family.api'; // Assuming you have a hook for generic create/update
import { FamilyMemberResponse, RelationshipType } from '../family.types';
import { useAuthStore } from '../../../store/auth.store';

import { Avatar } from '../../../components/common/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/DropdownMenu';
import { Card } from '../../../components/ui/Card';
import { LoadingSpinner } from '../../../components/common/LoadingSpinner';
import { FamilyMemberCard } from './FamilyMemberCard'; // We use the card we built earlier

// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// COMPONENT
// =-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

export function FamilyTree() {
  const { t } = useTranslation();
  // Fetch the graph data (assuming the API returns nodes/edges or a structured tree)
  // For this component, we will assume we are fetching the current user's *Details* which includes kinship
  const currentUser = useAuthStore((state) => state.user);
  
  // Note: We need a specific hook that gets the "Me + Relatives" view. 
  // If useFamilyTree returns the graph, we process it here.
  // For simplicity, let's assume useFamilyTree returns the "FamilyTreeResponse" with nodes.
  const { data: treeData, isLoading, isError } = useFamilyTree(currentUser?.id || '', undefined);

  if (isLoading) {
    return <div className="flex h-96 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  if (isError || !treeData) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-destructive">
        <AlertTriangle className="h-8 w-8" />
        <p className="mt-2 font-medium">Unable to load family structure.</p>
      </div>
    );
  }

  // LOGIC: Group Nodes by Generation / Type
  // This is a simplified view. A real graph visualization (D3/ReactFlow) would be phase 2.
  // For Phase 1 (Investors), a "Grouped List" is cleaner.
  
  const nodes = treeData.nodes; // From FamilyTreeResponse
  
  // Helper to find nodes based on the graph edges would go here.
  // For now, let's render the nodes based on the API response structure if it groups them,
  // or simply render all nodes. 
  
  // Since our previous DTO `FamilyTreeResponse` returns `nodes` (flat list) and `edges`,
  // We will map them for display.

  return (
    <div className="space-y-8">
      
      {/* 1. Heads of Family / Parents */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
           <Crown className="h-4 w-4" /> Heads of House & Parents
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.filter(n => n.data.generationLevel === -1 || n.data.isHeadOfFamily).map(node => (
             <SimpleMemberNode key={node.id} node={node} />
          ))}
        </div>
      </section>

      {/* 2. Current Generation (Siblings/Spouses) */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
           <User className="h-4 w-4" /> Current Generation
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.filter(n => n.data.generationLevel === 0).map(node => (
             <SimpleMemberNode key={node.id} node={node} />
          ))}
        </div>
      </section>

      {/* 3. Next Generation (Children) */}
      <section>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-2">
           <Baby className="h-4 w-4" /> Children & Dependents
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {nodes.filter(n => (!n.data.generationLevel || n.data.generationLevel > 0)).map(node => (
             <SimpleMemberNode key={node.id} node={node} />
          ))}
        </div>
      </section>

      {nodes.length === 0 && (
         <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-lg">
            <User className="h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Family Tree Empty</h3>
            <p className="mt-1 text-sm text-muted-foreground">Start by adding your spouse or parents.</p>
         </div>
      )}
    </div>
  );
}

// A lighter version of the card for the Tree View
function SimpleMemberNode({ node }: { node: any }) {
  const isGhost = node.type === 'GHOST'; // Placeholder for missing people
  
  return (
    <Card className={`p-4 transition-all hover:shadow-md ${isGhost ? 'border-dashed opacity-70 bg-slate-50' : ''}`}>
      <div className="flex items-center gap-4">
        <Avatar fallback={node.data.fullName[0]} className="h-10 w-10" src={node.data.photoUrl} />
        <div className="min-w-0">
          <p className="font-medium truncate text-sm">{node.data.fullName}</p>
          <div className="flex gap-2 text-xs text-muted-foreground">
             <span>{node.data.gender}</span>
             {node.data.houseId && <Badge variant="outline" className="text-[10px] h-4">House Member</Badge>}
          </div>
        </div>
      </div>
    </Card>
  );
}