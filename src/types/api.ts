// API Response Types

export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  meta?: {
    total?: number;
    limit?: number;
    offset?: number;
  };
}

export interface ApiError {
  detail: string;
  status: number;
}

// Target Types
export interface Target {
  id: string;
  name: string;
  kind: string;
  version?: string;
  extensions?: string[];
  media_types?: string[];
  description?: string;
  capability_count: number;
  vitality?: VitalityScore;
  capabilities: Capability[];
}

// Capability Types
export interface Capability {
  id: string;
  name: string;
  description: string;
  complexity: ComplexityLevel;
  vitality?: VitalityScore;
}

export type ComplexityLevel = 'trivial' | 'basic' | 'intermediate' | 'advanced' | 'expert';

// Algorithm Types
export interface Algorithm {
  id: string;
  name: string;
  purpose: string;
  content?: AlgorithmContent;
  preferred_implementation?: Implementation;
}

export interface AlgorithmContent {
  name: string;
  purpose: string;
  mathematical_foundation?: MathematicalFoundation;
  implementations: Record<string, Implementation>;
  parameters?: Parameter[];
  test_vectors?: TestVector[];
  edge_cases?: EdgeCase[];
  optimizations?: Optimization[];
  complexity?: ComplexityMetrics;
}

export interface MathematicalFoundation {
  description: string;
  formulas: Formula[];
}

export interface Formula {
  name: string;
  formula: string;
  formula_text?: string;
  variables?: Record<string, string>;
}

export interface Implementation {
  code: string;
  language: string;
  usage_example?: string;
}

export interface Parameter {
  name: string;
  type: string;
  range?: { min: number; max: number };
  default?: number | string;
  effect: string;
}

export interface TestVector {
  description: string;
  input: unknown;
  expected_output: unknown;
  tolerance?: number;
}

export interface EdgeCase {
  case: string;
  problem: string;
  solution: string;
  code?: string;
}

export interface Optimization {
  name: string;
  tradeoff: string;
  implementation?: string;
  speedup_factor?: number;
}

export interface ComplexityMetrics {
  time: string;
  space: string;
}

// Structure Template Types
export interface StructureTemplate {
  id: string;
  name: string;
  purpose: string;
  content?: StructureTemplateContent;
}

export interface StructureTemplateContent {
  purpose: string;
  template: string;
  variables?: TemplateVariable[];
  assembly_code?: {
    code: string;
    language: string;
  };
}

export interface TemplateVariable {
  name: string;
  description: string;
  default?: string;
}

// Coordinate System Types
export interface CoordinateSystem {
  id: string;
  name: string;
  description: string;
  units: string;
  axes: Axis[];
  conversion_formulas?: ConversionFormula[];
}

export interface Axis {
  name: string;
  description: string;
  range?: { min: number; max: number };
}

export interface ConversionFormula {
  name: string;
  from_unit: string;
  to_unit: string;
  formula: string;
}

// Composition Rule Types
export interface CompositionRule {
  id: string;
  rule_type: string;
  description: string;
  correct_implementation?: string;
}

// Bundle Types
export interface CapabilityBundle {
  capability: Capability;
  structural_templates: StructureTemplate[];
  algorithms: Algorithm[];
  coordinate_system?: CoordinateSystem;
  composition_rules: CompositionRule[];
  prerequisites: Prerequisite[];
}

export interface Prerequisite {
  id: string;
  name: string;
}

// Vitality Types
export interface VitalityScore {
  overall: number;
  freshness: number;
  correctness: number;
  completeness: number;
}

export interface VitalityOverview {
  overall_vitality: number;
  freshness: number;
  correctness: number;
  completeness: number;
  healthy_nodes: number;
  critical_nodes: number;
  total_nodes: number;
}

export interface DriftEvent {
  event_id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  affected_nodes: number;
  created_at: string;
  target_id?: string;
}

// Graph Types
export interface GraphNode {
  id: string;
  type: string;
  name: string;
  vitality?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

// Search Types
export interface SearchResult {
  id: string;
  type: string;
  name: string;
  snippet: string;
  target_id?: string;
}

// Statistics Types
export interface Statistics {
  targets_documented: number;
  nodes_algorithm: { total: number };
  nodes_structure: { total: number };
  nodes_blueprint: { total: number };
}

// Assemble Types
export interface AssembleRequest {
  target: string;
  task: string;
  implementation_language?: string;
  include_tests?: boolean;
  include_edge_cases?: boolean;
  max_context_tokens?: number;
}

export interface AssembleResponse {
  usage_guide?: string;
  structural_templates: StructureTemplate[];
  algorithms: Algorithm[];
  coordinate_system?: CoordinateSystem;
}

// Blueprint Types
export interface Blueprint {
  id: string;
  name: string;
  description: string;
  architecture_diagram?: string;
  components: BlueprintComponent[];
  build_sequence: BuildPhase[];
}

export interface BlueprintComponent {
  name: string;
  responsibility: string;
  algorithms?: string[];
}

export interface BuildPhase {
  phase: number;
  name: string;
  components: string[];
}

// Concept Types
export interface Concept {
  id: string;
  name: string;
  domain: string;
  description: string;
  manifestations: ConceptManifestation[];
}

export interface ConceptManifestation {
  target_id: string;
  target_name: string;
  implementation_details: string;
}
