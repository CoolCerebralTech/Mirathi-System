// ============================================================================
// FILE 2: FamilyTreeViz.tsx - UPDATED
// ============================================================================

import React from 'react';
import { User, Baby, Heart, AlertCircle } from 'lucide-react';
import { 
  Card, 
  CardContent, 
  Button, 
  Badge, 
  Skeleton,
  Alert,
  AlertDescription,
} from '@/components/ui';
import { useMyFamilyTree } from '../family.api';
import { Gender } from '@/types/family.types';
import { cn } from '@/lib/utils';

interface FamilyTreeVizProps {
  onNodeClick: (memberId: string) => void;
  onAddClick: () => void;
}

interface VisualNode {
  id: string;
  name: string;
  role: string;
  isAlive: boolean;
  isMinor: boolean;
  gender?: Gender;
  highlight?: boolean;
  houseName?: string;
}

export const FamilyTreeViz: React.FC<FamilyTreeVizProps> = ({ 
  onNodeClick, 
  onAddClick 
}) => {
  const { data: tree, isLoading, isError, error } = useMyFamilyTree();

  if (isLoading) return <TreeSkeleton />;
  
  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load family tree: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }
  
  if (!tree) {
    return <EmptyState onAddClick={onAddClick} />;
  }

  // Transform API data to VisualNode format
  const rootNode: VisualNode = {
    id: tree.id,
    name: tree.name,
    role: tree.role || 'Me',
    isAlive: tree.isAlive ?? true,
    isMinor: tree.isMinor ?? false,
    gender: tree.gender,
    highlight: true,
  };

  const spouseNodes: VisualNode[] = (tree.spouses || []).map((spouse) => ({
    id: spouse.id,
    name: spouse.name,
    role: spouse.role || 'Spouse',
    isAlive: spouse.isAlive ?? true,
    isMinor: false,
    gender: spouse.gender,
    houseName: spouse.houseName || undefined,
  }));

  const childNodes: VisualNode[] = (tree.children || []).map((child) => ({
    id: child.id,
    name: child.name,
    role: child.role || 'Child',
    isAlive: child.isAlive ?? true,
    isMinor: child.isMinor,
    gender: child.gender,
    houseName: child.houseId ? `House ${child.houseId}` : undefined,
  }));

  const parentNodes: VisualNode[] = (tree.parents || []).map((parent) => ({
    id: parent.id,
    name: parent.name,
    role: parent.role,
    isAlive: parent.isAlive ?? true,
    isMinor: false,
    gender: parent.gender,
  }));

  return (
    <div className="flex flex-col items-center space-y-8 p-4">
      {/* Stats Display */}
      {tree.stats && (
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div>Total Members: <span className="font-medium">{tree.stats.totalMembers}</span></div>
          {tree.stats.totalMinors > 0 && (
            <div className="text-amber-600">
              Minors: <span className="font-medium">{tree.stats.totalMinors}</span>
            </div>
          )}
          {tree.stats.isPolygamous && (
            <Badge variant="secondary">Polygamous Family</Badge>
          )}
        </div>
      )}

      {/* Parents Level */}
      {parentNodes.length > 0 && (
        <div className="relative flex flex-col items-center">
          <div className="flex gap-6">
            {parentNodes.map((parent) => (
              <NodeCard 
                key={parent.id}
                node={parent} 
                onClick={() => onNodeClick(parent.id)} 
              />
            ))}
          </div>
          <div className="h-8 w-0.5 bg-border" />
        </div>
      )}

      {/* Ego Level (Me + Spouses) */}
      <div className="relative flex items-center gap-8">
        <NodeCard 
          node={rootNode} 
          onClick={() => onNodeClick(rootNode.id)} 
        />

        {spouseNodes.map((spouse) => (
          <div key={spouse.id} className="relative flex items-center">
            <div className="absolute right-full top-1/2 h-0.5 w-8 -translate-y-1/2 bg-primary/20" />
            <div className="absolute right-full top-1/2 -ml-4 -mt-3">
              <Heart className="h-6 w-6 fill-red-100 text-red-500" />
            </div>
            
            <NodeCard 
              node={spouse} 
              onClick={() => onNodeClick(spouse.id)} 
            />
          </div>
        ))}
      </div>

      {/* Children Level */}
      {childNodes.length > 0 ? (
        <div className="relative flex flex-col items-center">
          <div className="h-8 w-0.5 bg-border" />
          
          <div className="relative mb-8 h-0.5 w-[90%] bg-border">
            <div className="absolute left-1/2 top-0 h-4 w-0.5 -translate-x-1/2 bg-border" />
          </div>

          <div className="flex flex-wrap justify-center gap-6">
            {childNodes.map((child) => (
              <div key={child.id} className="relative flex flex-col items-center">
                <div className="absolute bottom-full left-1/2 h-8 w-0.5 -translate-x-1/2 bg-border" />
                <NodeCard 
                  node={child} 
                  onClick={() => onNodeClick(child.id)} 
                />
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col items-center gap-2 text-muted-foreground">
          <div className="h-8 w-0.5 bg-border/50" />
          <Button variant="ghost" size="sm" onClick={onAddClick} className="gap-2">
            <Baby className="h-4 w-4" />
            Add Children
          </Button>
        </div>
      )}
    </div>
  );
};

// NodeCard Component
const NodeCard: React.FC<{ node: VisualNode; onClick: () => void }> = ({ 
  node, 
  onClick 
}) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = () => {
    if (!node.isAlive) return "bg-gray-200 text-gray-500";
    if (node.gender === Gender.FEMALE) return "bg-pink-100 text-pink-600";
    if (node.gender === Gender.MALE) return "bg-blue-100 text-blue-600";
    return "bg-slate-100 text-slate-600";
  };

  return (
    <Card 
      className={cn(
        "relative w-48 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md",
        node.highlight && "border-primary/50 bg-primary/5 ring-2 ring-primary/20",
        !node.isAlive && "opacity-70 grayscale"
      )}
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center p-4 text-center">
        <div className={cn(
          "mb-3 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-sm",
          getAvatarColor()
        )}>
          {getInitials(node.name)}
        </div>
        
        <h4 className="line-clamp-1 w-full font-semibold text-sm" title={node.name}>
          {node.name}
        </h4>
        
        <div className="mt-2 flex flex-wrap gap-1 justify-center">
          <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
            {node.role}
          </Badge>
          
          {node.houseName && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5">
              {node.houseName}
            </Badge>
          )}
          
          {node.isMinor && (
            <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-amber-300 bg-amber-50 text-amber-700">
              Minor
            </Badge>
          )}
          
          {!node.isAlive && (
            <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
              Deceased
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const EmptyState: React.FC<{ onAddClick: () => void }> = ({ onAddClick }) => (
  <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center animate-in fade-in-50">
    <User className="mb-4 h-10 w-10 text-muted-foreground" />
    <h3 className="text-lg font-semibold">Start Your Family Tree</h3>
    <p className="mb-4 text-sm text-muted-foreground max-w-md">
      Create your digital twin to begin succession planning. Add family members to see potential heirs and manage guardianship.
    </p>
    <Button onClick={onAddClick}>Create My Profile</Button>
  </div>
);

const TreeSkeleton: React.FC = () => (
  <div className="flex flex-col items-center space-y-8 p-8">
    <Skeleton className="h-32 w-48 rounded-xl" />
    <div className="h-8 w-0.5 bg-muted" />
    <div className="flex gap-6">
      <Skeleton className="h-32 w-48 rounded-xl" />
      <Skeleton className="h-32 w-48 rounded-xl" />
    </div>
  </div>
);