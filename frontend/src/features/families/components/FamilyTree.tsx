// FILE: src/features/families/components/FamilyTree.tsx

import ReactFlow, { MiniMap, Controls, Background, Node, Edge } from 'reactflow';
import 'reactflow/dist/style.css'; // Necessary styles for reactflow
import { type Family } from '../../../types';
import { Card } from '../../../components/ui/Card';

interface FamilyTreeProps {
  family: Family;
}

// A custom node component to display user information in the tree
const FamilyMemberNode = ({ data }: { data: any }) => {
  return (
    <Card className="p-4 w-48 text-center">
      <div className="font-bold">{data.user.firstName} {data.user.lastName}</div>
      <div className="text-sm text-muted-foreground">{data.role.replace('_', ' ')}</div>
    </Card>
  );
};

// Define the custom node types for reactflow to use
const nodeTypes = { familyMember: FamilyMemberNode };

export function FamilyTree({ family }: FamilyTreeProps) {
  // --- Data Transformation ---
  // We need to convert our Family data into nodes and edges for reactflow.
  // This is a simple layout algorithm placing the creator at the top.
  const initialNodes: Node[] = [];
  const initialEdges: Edge[] = [];

  if (family) {
    // 1. Add the creator node
    const creator = family.members.find(m => m.userId === family.creatorId);
    if (creator) {
      initialNodes.push({
        id: creator.userId,
        type: 'familyMember',
        data: creator,
        position: { x: 250, y: 25 }, // Centered at the top
      });

      // 2. Add other members and connect them to the creator
      const otherMembers = family.members.filter(m => m.userId !== family.creatorId);
      otherMembers.forEach((member, index) => {
        initialNodes.push({
          id: member.userId,
          type: 'familyMember',
          data: member,
          // Simple positioning logic, can be made much more advanced
          position: { x: index * 250, y: 150 },
        });
        initialEdges.push({
          id: `e-${creator.userId}-${member.userId}`,
          source: creator.userId,
          target: member.userId,
          animated: true, // Optional: makes the edge animated
          style: { stroke: '#6b7280' },
        });
      });
    }
  }

  return (
    <div style={{ height: '500px' }} className="border rounded-lg bg-background">
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        nodeTypes={nodeTypes}
        fitView // Automatically zooms to fit all nodes
        nodesDraggable={false} // Make it read-only for now
        nodesConnectable={false}
      >
        <Controls />
        <MiniMap />
        <Background gap={12} size={1} />
      </ReactFlow>
    </div>
  );
}