// FILE: src/features/family/components/FamilyTree.tsx

import React, { useState, useMemo, useCallback } from 'react';
import { 
  GitBranch, 
  User, 
  Users, 
  Heart, 
  Shield, 
  ChevronDown,
  ChevronRight,
  Crown,
  Sparkles,
  AlertCircle,
  UserCheck,
  UserX,
  Baby,
  HeartHandshake
} from 'lucide-react';
import { useFamilyGraph } from '../family.api';
import { LoadingSpinner, EmptyState } from '@/components/common';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button,
  Badge,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ScrollArea
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { 
  Gender, 
  type FamilyTreeResponse, 
  type GraphNode 
} from '@/types/family.types';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

interface TreeNode extends GraphNode {
  children: TreeNode[];
  spouses: TreeNode[];
  parents: TreeNode[];
  siblings: TreeNode[];
  depth: number;
  isExpanded?: boolean;
}

type TreeLayout = 'horizontal' | 'vertical' | 'radial';
type TreeFocus = 'deceased' | 'spouses' | 'children' | 'full';

// Kenyan succession-specific node colors
const NODE_COLORS = {
  MALE: 'bg-blue-100 border-blue-300 text-blue-800',
  FEMALE: 'bg-pink-100 border-pink-300 text-pink-800',
  OTHER: 'bg-gray-100 border-gray-300 text-gray-800',
  DECEASED: 'bg-gray-200 border-gray-400 text-gray-800',
  HOUSE_HEAD: 'bg-amber-100 border-amber-400 text-amber-900',
  MINOR: 'bg-purple-50 border-purple-200 text-purple-700',
  DEPENDENT: 'bg-red-50 border-red-200 text-red-700',
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const buildTreeHierarchy = (data: FamilyTreeResponse): TreeNode[] => {
  const nodeMap = new Map<string, TreeNode>();
  const edges = data.edges || [];
  
  // Create initial nodes
  data.nodes.forEach(node => {
    nodeMap.set(node.id, {
      ...node,
      children: [],
      spouses: [],
      parents: [],
      siblings: [],
      depth: 0,
      isExpanded: true,
    });
  });
  
  // Build relationships
  edges.forEach(edge => {
    const sourceNode = nodeMap.get(edge.source);
    const targetNode = nodeMap.get(edge.target);
    
    if (!sourceNode || !targetNode) return;
    
    switch (edge.type) {
      case 'PARENT_CHILD':
        if (edge.data?.label?.includes('parent')) {
          // source is parent, target is child
          sourceNode.children.push(targetNode);
          targetNode.parents.push(sourceNode);
        } else {
          // source is child, target is parent
          targetNode.children.push(sourceNode);
          sourceNode.parents.push(targetNode);
        }
        break;
        
      case 'SPOUSE':
        sourceNode.spouses.push(targetNode);
        targetNode.spouses.push(sourceNode);
        break;
        
      case 'SIBLING':
        sourceNode.siblings.push(targetNode);
        targetNode.siblings.push(sourceNode);
        break;
    }
  });
  
  // Find roots (nodes without parents or with minimal parents)
  const roots: TreeNode[] = [];
  nodeMap.forEach(node => {
    if (node.parents.length === 0 || (node.parents.length === 1 && node.parents[0]?.data?.isHeadOfFamily)) {
      // Calculate depth
      const calculateDepth = (currentNode: TreeNode, visited = new Set<string>()): number => {
        if (visited.has(currentNode.id)) return 0;
        visited.add(currentNode.id);
        
        if (currentNode.parents.length === 0) return 0;
        
        return 1 + Math.max(...currentNode.parents.map(p => calculateDepth(p, visited)));
      };
      
      node.depth = calculateDepth(node);
      roots.push(node);
    }
  });
  
  return roots;
};

const getNodeColor = (node: TreeNode): string => {
  if (!node.data.isAlive) return NODE_COLORS.DECEASED;
  if (node.data.isHeadOfFamily) return NODE_COLORS.HOUSE_HEAD;
  if (node.data.hasMissingData) return 'bg-yellow-50 border-yellow-300 text-yellow-800';
  
  const age = node.data.dateOfBirth ? 
    new Date().getFullYear() - new Date(node.data.dateOfBirth).getFullYear() : 0;
  
  if (age < 18) return NODE_COLORS.MINOR;
  
  switch (node.data.gender) {
    case Gender.MALE: return NODE_COLORS.MALE;
    case Gender.FEMALE: return NODE_COLORS.FEMALE;
    default: return NODE_COLORS.OTHER;
  }
};

const getNodeIcon = (node: TreeNode) => {
  if (!node.data.isAlive) return <UserX className="h-3 w-3" />;
  if (node.data.isHeadOfFamily) return <Crown className="h-3 w-3" />;
  if (node.data.isVerified) return <UserCheck className="h-3 w-3" />;
  if (node.data.hasMissingData) return <AlertCircle className="h-3 w-3" />;
  
  const age = node.data.dateOfBirth ? 
    new Date().getFullYear() - new Date(node.data.dateOfBirth).getFullYear() : 0;
  
  if (age < 5) return <Baby className="h-3 w-3" />;
  
  switch (node.data.gender) {
    case Gender.MALE: return <User className="h-3 w-3" />;
    case Gender.FEMALE: return <User className="h-3 w-3" />;
    default: return <User className="h-3 w-3" />;
  }
};

// ============================================================================
// COMPONENTS
// ============================================================================

interface TreeNodeComponentProps {
  node: TreeNode;
  level: number;
  onToggle: (nodeId: string) => void;
  layout: TreeLayout;
}

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = ({ 
  node, 
  level, 
  onToggle,
  layout 
}) => {
  const hasChildren = node.children.length > 0;
  const hasSpouses = node.spouses.length > 0;
  const isPolygamous = node.spouses.length > 1;
  
  const handleClick = useCallback(() => {
    onToggle(node.id);
  }, [node.id, onToggle]);
  
  const nodeColor = getNodeColor(node);
  const nodeIcon = getNodeIcon(node);
  
  // Calculate age for display
  const age = node.data.dateOfBirth ? 
    new Date().getFullYear() - new Date(node.data.dateOfBirth).getFullYear() : null;
  
  return (
    <div className={cn(
      "flex",
      layout === 'horizontal' ? 'flex-col items-start' : 'flex-row items-start',
      "transition-all duration-200"
    )}>
      {/* Node Container */}
      <div className={cn(
        "relative group",
        layout === 'horizontal' ? 'mb-4' : 'mr-4'
      )}>
        {/* Connection Line (Parent to Child) */}
        {level > 0 && (
          <div className={cn(
            "absolute border-l-2 border-t-2 border-muted-foreground/30",
            layout === 'horizontal' 
              ? "w-4 h-6 -top-6 -left-2" 
              : "h-4 w-6 -left-6 top-4"
          )} />
        )}
        
        {/* The Node Card */}
        <Card className={cn(
          "min-w-[200px] transition-all duration-200 hover:shadow-md border-2",
          nodeColor,
          "group-hover:scale-105 group-hover:z-10",
          isPolygamous && "ring-2 ring-amber-300"
        )}>
          <CardContent className="p-3">
            {/* Node Header */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-full",
                  node.data.isVerified ? "bg-green-100" : "bg-gray-100"
                )}>
                  {nodeIcon}
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="font-medium text-sm truncate max-w-[120px]">
                      {node.data.fullName.split(' ')[0]}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-1">
                      <p className="font-medium">{node.data.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {node.data.gender} • {age ? `${age} years` : 'Age unknown'}
                      </p>
                      {!node.data.isAlive && (
                        <p className="text-xs text-red-600">Deceased</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </div>
              
              {hasChildren && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={handleClick}
                >
                  {node.isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
            
            {/* Node Details */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="capitalize">{node.data.gender?.toLowerCase()}</span>
                {age && <span>{age}y</span>}
              </div>
              
              {/* Status Badges */}
              <div className="flex flex-wrap gap-1 mt-2">
                {!node.data.isAlive && (
                  <Badge variant="destructive" className="text-[10px] px-1">
                    Deceased
                  </Badge>
                )}
                {node.data.isVerified && (
                  <Badge variant="default" className="text-[10px] px-1 bg-green-100 text-green-800">
                    Verified
                  </Badge>
                )}
                {node.data.isHeadOfFamily && (
                  <Badge variant="outline" className="text-[10px] px-1 border-amber-300 text-amber-700">
                    Head
                  </Badge>
                )}
                {isPolygamous && (
                  <Badge variant="outline" className="text-[10px] px-1 border-purple-300 text-purple-700">
                    Polygamous
                  </Badge>
                )}
              </div>
              
              {/* House Indicator */}
              {node.data.houseColor && (
                <div className="flex items-center gap-1 mt-2">
                  <div 
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: node.data.houseColor }}
                  />
                  <span className="text-xs text-muted-foreground">
                    House {node.data.houseId?.split('-').pop()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        {/* Spouse Connectors */}
        {hasSpouses && (
          <div className={cn(
            "absolute flex items-center justify-center",
            layout === 'horizontal' 
              ? "bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4" 
              : "right-0 top-1/2 transform -translate-y-1/2 translate-x-4"
          )}>
            <div className="flex items-center">
              <Heart className="h-4 w-4 text-pink-500" />
              {isPolygamous && (
                <span className="ml-1 text-xs font-medium text-pink-700">
                  +{node.spouses.length - 1}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Children Container */}
      {hasChildren && node.isExpanded && (
        <div className={cn(
          "flex",
          layout === 'horizontal' 
            ? "flex-row flex-wrap gap-4 pl-8 border-l-2 border-muted-foreground/30" 
            : "flex-col gap-4 pt-8 border-t-2 border-muted-foreground/30",
          "ml-4 mt-4"
        )}>
          {node.children.map(child => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              level={level + 1}
              onToggle={onToggle}
              layout={layout}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

interface FamilyTreeProps {
  familyId: string;
  className?: string;
}

export const FamilyTree: React.FC<FamilyTreeProps> = ({ familyId, className }) => {
  const { data, isLoading, error, refetch } = useFamilyGraph(familyId);
  const [layout, setLayout] = useState<TreeLayout>('horizontal');
  const [focus, setFocus] = useState<TreeFocus>('full');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  
  // Build tree hierarchy from graph data
  const treeRoots = useMemo(() => {
    if (!data) return [];
    
    const roots = buildTreeHierarchy(data);
    
    // Apply focus filter
    if (focus === 'deceased') {
      return roots.filter(root => !root.data.isAlive);
    } else if (focus === 'spouses') {
      return roots.filter(root => root.spouses.length > 0);
    } else if (focus === 'children') {
      return roots.flatMap(root => 
        root.children.filter(child => child.data.isAlive)
      );
    }
    
    return roots;
  }, [data, focus]);
  
  // Apply expanded state
  const processedRoots = useMemo(() => {
    const applyExpansion = (node: TreeNode): TreeNode => {
      return {
        ...node,
        isExpanded: expandedNodes.has(node.id),
        children: node.children.map(applyExpansion),
      };
    };
    
    return treeRoots.map(applyExpansion);
  }, [treeRoots, expandedNodes]);
  
  const handleToggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);
  
  const handleExpandAll = useCallback(() => {
    if (!data) return;
    
    const allNodeIds = data.nodes.map(node => node.id);
    setExpandedNodes(new Set(allNodeIds));
  }, [data]);
  
  const handleCollapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);
  
  const findDeceased = useMemo(() => {
    if (!data) return null;
    return data.nodes.find(node => !node.data.isAlive);
  }, [data]);
  
  if (isLoading) {
    return (
      <div className="flex h-[600px] items-center justify-center">
        <LoadingSpinner 
          size="lg" 
          text="Mapping kinship relationships for succession analysis..." 
        />
      </div>
    );
  }
  
  if (error) {
      return (
        <EmptyState
          icon={AlertCircle}
          title="Family Tree Unavailable"
          description="Unable to load the family graph. This may affect succession analysis."
          action={{
            label: 'Retry Loading',
            onClick: () => refetch(),
          }}
        />
      );
    }

  
  if (!data || data.nodes.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No Family Members"
        description="Start by adding family members to build the kinship tree."
        className="h-[600px]"
      />
    );
  }
  
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5 text-primary" />
                Kinship Tree
                <Badge variant="outline" className="ml-2">
                  S.29 & S.40 Analysis
                </Badge>
              </CardTitle>
              <CardDescription>
                Visual representation of kinship relationships for Kenyan succession
              </CardDescription>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Select value={layout} onValueChange={(value) => setLayout(value as TreeLayout)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="horizontal">Horizontal</SelectItem>
                    <SelectItem value="vertical">Vertical</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={focus} onValueChange={(value) => setFocus(value as TreeFocus)}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Focus" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full">All Members</SelectItem>
                    <SelectItem value="deceased">Deceased Only</SelectItem>
                    <SelectItem value="spouses">Spouses</SelectItem>
                    <SelectItem value="children">Children</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExpandAll}>
                  Expand All
                </Button>
                <Button variant="outline" size="sm" onClick={handleCollapseAll}>
                  Collapse All
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Stats Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-3 bg-muted/50 rounded-lg">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{data.stats.nodesCount}</strong> Family Members
                </span>
              </div>
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{data.stats.generations}</strong> Generations
                </span>
              </div>
              <div className="flex items-center gap-2">
                <HeartHandshake className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  <strong>{data.stats.edgesCount}</strong> Relationships
                </span>
              </div>
            </div>
            
            {findDeceased && (
              <Badge variant="destructive" className="gap-1">
                <Shield className="h-3 w-3" />
                Deceased: {findDeceased.data.fullName}
              </Badge>
            )}
          </div>
          
          {/* Legend */}
          <div className="flex flex-wrap gap-3 mb-6 p-3 border rounded-lg">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-100 border border-blue-300" />
              <span className="text-xs">Male</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-pink-100 border border-pink-300" />
              <span className="text-xs">Female</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-200 border border-gray-400" />
              <span className="text-xs">Deceased</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-100 border border-amber-400" />
              <span className="text-xs">House Head</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-purple-50 border border-purple-200" />
              <span className="text-xs">Minor</span>
            </div>
          </div>
          
          {/* Tree Visualization */}
          <ScrollArea className="h-[500px] w-full p-4 border rounded-lg bg-gradient-to-br from-slate-50 to-white">
            <div className={cn(
              "p-4",
              layout === 'horizontal' ? "flex flex-col items-start" : "flex flex-row flex-wrap"
            )}>
              {processedRoots.map(root => (
                <TreeNodeComponent
                  key={root.id}
                  node={root}
                  level={0}
                  onToggle={handleToggleNode}
                  layout={layout}
                />
              ))}
            </div>
          </ScrollArea>
          
          {/* Succession Insights */}
          <div className="mt-6 p-4 border rounded-lg bg-green-50">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-800">Succession Insights</h4>
                <ul className="mt-2 space-y-1 text-sm text-green-700">
                  <li>• The kinship tree determines inheritance under Kenyan Law of Succession</li>
                  <li>• Polygamous families (S.40) are identified by multiple spouse connections</li>
                  <li>• Minors (under 18) require guardians for succession proceedings</li>
                  <li>• All living spouses and children are primary dependents under S.29</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};