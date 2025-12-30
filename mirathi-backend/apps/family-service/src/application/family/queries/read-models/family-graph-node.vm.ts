import { Gender } from '../../../../domain/value-objects/family-enums.vo';

/**
 * View Model optimized for Graph Visualization Libraries.
 * (Compatible with React Flow, D3.js, Cytoscape).
 */
export interface FamilyGraphVM {
  familyId: string;

  // Graph Metadata
  stats: {
    nodesCount: number;
    edgesCount: number;
    generations: number;
  };

  // The Entities (People)
  nodes: GraphNode[];

  // The Relationships (Lines)
  edges: GraphEdge[];
}

export interface GraphNode {
  id: string;
  type: 'MEMBER' | 'GHOST'; // Ghost = Referenced but not fully created

  data: {
    fullName: string;
    gender: Gender;
    dateOfBirth?: string; // ISO Date
    isAlive: boolean;
    photoUrl?: string;

    // Visual Cues
    isHeadOfFamily: boolean;
    isVerified: boolean;
    hasMissingData: boolean; // Triggers UI warning (Red border)

    // Polygamy Visualization
    houseId?: string; // To group nodes visually
    houseColor?: string; // e.g., House 1 = Blue, House 2 = Green
  };

  // Layout Hints
  generationLevel?: number; // 0 (Founder), 1 (Children), 2 (Grandchildren)
  position?: { x: number; y: number }; // Optional pre-calculated layout
}

export interface GraphEdge {
  id: string;
  source: string; // Member ID
  target: string; // Member ID
  type: 'PARENT_CHILD' | 'SPOUSE' | 'SIBLING' | 'COHABITATION';

  data: {
    isBiological: boolean;
    isLegal: boolean; // Adoption flag
    isVerified: boolean;
    label?: string; // e.g. "Married 2010"
  };

  style?: {
    stroke?: string; // Dotted (#ccc) for unverified, Solid (#000) for verified
    strokeWidth?: number;
    strokeDasharray?: string; // "5,5" for dotted
    animated?: boolean; // True for active cohabitation/monitoring
  };
}
