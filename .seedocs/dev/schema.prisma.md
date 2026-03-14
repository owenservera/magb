# Universal Blueprint Machine (magB) & AI Contribution Engine (ACE)
## Complete Database Schema

This document contains the complete `schema.prisma` definition synthesizing 100% of the requirements from the provided Opus 4.6 architecture documentation. 

The schema is divided into three major domains:
1. **Core Knowledge Graph (magB)**: The "Universal Blueprint Machine" which categorizes programming languages, file formats, algorithms, and structures from universal concepts down to specific implementation blueprints.
2. **Knowledge Observability**: The "vitality system" tracking the health, accuracy, and decay of the generated knowledge over time.
3. **AI Contribution Engine (ACE)**: The open-source collaborative system tracking contributors, API budgets, AI tasks, and code generation operations.

This schema is designed to run on **PostgreSQL** leveraging the `pgvector` extension for semantic AI search.

```prisma
// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  extensions = [vector] // Enables pgvector for AI semantic search
}

// ============================================================================
// PART 1: CORE KNOWLEDGE GRAPH (magB)
// The "Universal Blueprint Machine"
// ============================================================================

/// UNIVERSAL CONCEPTS
/// Think of this as the "skeleton" of all computer science knowledge.
/// These are ideas that exist across many languages or formats.
/// Example: "Iteration (For Loop)" or "Gaussian Blur".
model Concept {
  id              String   @id // e.g., "iteration.definite"
  name            String   // Human readable, e.g., "Definite Iteration"
  domain          String   // e.g., "control_flow", "compression"
  
  // Hierarchy: A concept can have a parent concept
  parentId        String?
  parent          Concept? @relation("ConceptHierarchy", fields: [parentId], references: [id])
  children        Concept[] @relation("ConceptHierarchy")

  // Multi-resolution content: Different depths for AI context budgeting
  summary         String?  @db.Text // ~50 tokens: ultra-short description
  description     String?  @db.Text // ~300 tokens: standard explanation
  theory          String?  @db.Text // ~1000 tokens: Deep CS theory
  
  prevalence      Float    @default(1.0) // What fraction of targets use this (0.0 to 1.0)
  notableAbsences String[] // Languages/formats that famously DO NOT use this

  metadata        Json     @default("{}") // Extensible structured data
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  entries         Entry[]  // Links to how specific languages implement this concept
}

/// FAMILIES
/// Groupings of technologies that share underlying traits.
/// Example: "C-Family Languages" (C, Java, Rust) or "ZIP-based Formats" (PPTX, DOCX, APK).
model Family {
  id              String   @id // e.g., "c_family"
  name            String   // e.g., "C-Family Languages"
  type            String   // "language_family" or "format_family"
  description     String?  @db.Text
  
  sharedTraits    Json     @default("[]") // Array of {trait, description} inherited by all members
  sharedEntryIds  String[] // Knowledge entries automatically inherited by all members
  metadata        Json     @default("{}")
}

/// TARGETS
/// The actual languages, formats, or software tools we are documenting.
/// Example: "Python", "Rust", "PPTX", "Photoshop".
model Target {
  id               String   @id // e.g., "python", "pptx"
  name             String   // e.g., "Python"
  type             String   // "programming_language", "document_format", etc.
  
  familyIds        String[] // Which families this target belongs to
  traits           Json     @default("{}") // Key classifications: static vs dynamic typing, memory model
  distinguishing   String[] // What makes this specific target unique compared to its family
  similarTo        String[] // Targets it is similar to (used for AI gap analysis)
  
  extensions       String[] // File extensions (e.g., [".py"], [".pptx"])
  mediaTypes       String[] // MIME types
  specUrl          String?  // Link to official documentation/specification
  
  status           String   @default("active") // active, deprecated, historical
  generationStatus String   @default("pending") // pending, generating, complete, failed
  lastGenerated    DateTime?
  metadata         Json     @default("{}")

  versions         TargetVersion[]
  entries          Entry[]
  atoms            Atom[]
  capabilities     Capability[]
  blueprints       Blueprint[]
}

/// TARGET VERSIONS
/// Tracks the history of a target using a "Delta Chain".
/// Instead of saving the whole language again for Python 3.13, we only save what changed since 3.12.
model TargetVersion {
  id              String   @id // e.g., "python_3.12"
  targetId        String
  target          Target   @relation(fields: [targetId], references: [id])
  
  versionString   String   // e.g., "3.12"
  released        DateTime? @db.Date
  status          String?  // "active", "eol", "security_fixes"
  
  // Delta chain relationships
  deltaFromId     String?  
  deltaFrom       TargetVersion?  @relation("VersionDeltas", fields: [deltaFromId], references: [id])
  deltaTo         TargetVersion[] @relation("VersionDeltas")

  // The actual delta (what changed)
  additions       Json     @default("[]") // New features
  changes         Json     @default("[]") // Modified behaviors
  removals        Json     @default("[]") // Removed features
  deprecations    Json     @default("[]") // Things you shouldn't use anymore
  
  specUrl         String?
  changelogUrl    String?
  sortOrder       Int?

  entriesIntroduced Entry[] @relation("IntroducedIn")
  entriesRemoved    Entry[] @relation("RemovedIn")
}

/// KNOWLEDGE ENTRIES
/// The core content. Every fact, feature, or function has an entry here.
/// Includes three "resolutions" so the AI can decide how much detail to read.
model Entry {
  id                String   @id // e.g., "python_for_loop"
  
  conceptId         String?
  concept           Concept? @relation(fields: [conceptId], references: [id])
  targetId          String
  target            Target   @relation(fields: [targetId], references: [id])
  
  path              String   // File-path like structure: "Python/Control Flow/Iteration/for loop"
  entryType         String   // "reference", "atom", "capability", "algorithm"
  
  // Version tracking
  introducedInId    String?
  introducedIn      TargetVersion? @relation("IntroducedIn", fields: [introducedInId], references: [id])
  removedInId       String?
  removedIn         TargetVersion? @relation("RemovedIn", fields: [removedInId], references: [id])
  changedIn         String[] // Version IDs where this specific entry had major updates

  // Multi-resolution content: The AI dynamically picks the size it needs
  contentMicro      String?  @db.Text // ~50 tokens: quick summary
  contentStandard   String?  @db.Text // ~500 tokens: standard explanation
  contentExhaustive String?  @db.Text // ~2000 tokens: deep dive with all edge cases
  
  // Structured data extracted by AI
  syntax            String?  @db.Text // Formal grammar
  parameters        Json     @default("[]") // Array of arguments
  returnValue       String?  @db.Text // Output description
  edgeCases         Json     @default("[]") // What happens when things break
  commonMistakes    Json     @default("[]") // Frequent developer errors
  
  // Pre-computed sizes to help AI plan context window usage
  tokensMicro       Int?
  tokensStandard    Int?
  tokensExhaustive  Int?

  // Origin tracking
  generatedBy       String?  // Which AI model wrote this
  generatedAt       DateTime @default(now())
  validatedBy       String?  // Which AI model double-checked this
  confidence        Float    @default(0.0) // 0.0 to 1.0 AI confidence score
  contentHash       String?  // Used for deduplication
  validationNotes   String?  @db.Text
  metadata          Json     @default("{}")

  examples          Example[]
  atoms             Atom[]

  @@unique([targetId, path])
}

/// CODE EXAMPLES
/// Reusable snippets of code mapped to specific entries.
model Example {
  id              String   @id
  entryId         String?
  entry           Entry?   @relation(fields: [entryId], references: [id])
  
  title           String
  code            String   @db.Text // The actual code snippet
  language        String   // For syntax highlighting (e.g., "python")
  explanation     String?  @db.Text // What the code is doing
  expectedOutput  String?  @db.Text // What prints to the console
  
  complexity      String   @default("basic") // "basic", "intermediate", "advanced"
  
  validFromId     String?  // It works starting in this version
  validUntilId    String?  // It breaks after this version
  
  alsoUsedBy      String[] // Array of other Entry IDs that reference this example
  tokenCount      Int?
  metadata        Json     @default("{}")
}

/// ATOMS (Implementation Layer)
/// Irreducible structural elements. The "periodic table" of file formats.
/// Example: The exact XML tag `<p:sp>` in PPTX, or the binary header of a PNG.
model Atom {
  id               String   @id
  targetId         String
  target           Target   @relation(fields: [targetId], references: [id])
  entryId          String?
  entry            Entry?   @relation(fields: [entryId], references: [id])
  
  atomType         String   // "xml_element", "binary_field", "json_key"
  filePath         String?  // Where to find it inside a ZIP container
  xpath            String?  // Path for XML
  byteOffset       String?  // Path for Binary
  
  elementName      String?
  namespaceUri     String?
  namespacePrefix  String?
  
  structure        Json     @default("{}") // byte_size, endianness, valid_values, constraints
  
  parentAtomId     String?
  parentAtom       Atom?    @relation("AtomHierarchy", fields: [parentAtomId], references: [id])
  childAtoms       Atom[]   @relation("AtomHierarchy")
  
  semanticMeaning  String?  @db.Text
  unitOfMeasure    String?  // "pixels", "EMUs", "twips"
  conversionFormula String? @db.Text // How to convert to a standard unit
  exampleValue     String?  @db.Text
  exampleContext   String?  @db.Text // Seeing the value in-situ
  
  metadata         Json     @default("{}")
}

/// ALGORITHMS (Implementation Layer)
/// Complete computational procedures (e.g., "Gaussian Blur", "DEFLATE compression").
/// Algorithms are often shared across many targets.
model Algorithm {
  id                 String   @id // e.g., "algo_gaussian_blur"
  name               String
  category           String   // e.g., "image_filter", "compression"
  domain             String   // e.g., "graphics_2d"
  purpose            String   @db.Text // What it computes
  
  formula            String?  @db.Text // LaTeX math
  formulaExplanation String?  @db.Text
  pseudocode         String?  @db.Text
  
  summary            String?  @db.Text
  fullSpec           String?  @db.Text
  
  parameters         Json     @default("[]") // {name, type, range, default}
  timeComplexity     String?  // Big-O
  spaceComplexity    String?  // Big-O
  
  optimizations      Json     @default("[]") // {technique, speedup, tradeoff}
  edgeCases          Json     @default("[]")
  testVectors        Json     @default("[]") // Known inputs -> known outputs
  numericalStability Json     @default("{}") // Float precision mitigations
  
  confidence         String   @default("generated") // verified, high, medium, generated
  references         String[] // Links to academic papers or spec sections
  metadata           Json     @default("{}")
}

/// CAPABILITIES (Implementation Layer)
/// User-facing features mapped to implementation steps.
/// Example: "Draw a Rectangle" -> steps combining Atoms + Algorithms.
model Capability {
  id                     String   @id
  targetId               String
  target                 Target   @relation(fields: [targetId], references: [id])
  
  name                   String   // e.g., "Draw Rectangle Shape"
  category               String
  userDescription        String?  @db.Text // What the user experiences
  technicalDescription   String?  @db.Text // Under the hood mechanics
  complexity             String   @default("moderate")
  
  implementationSteps    Json     @default("[]") // Step-by-step: order, description, atom_ids
  referenceImplementations Json   @default("{}") // Code blocks in python, rust, etc.
  minimumWorkingExample  String?  @db.Text
  knownPitfalls          Json     @default("[]")
  
  metadata               Json     @default("{}")
}

/// BLUEPRINTS (Implementation Layer)
/// Composable architectural plans showing how to build full applications.
/// Example: "Complete PDF Generator Engine".
model Blueprint {
  id                     String   @id
  targetId               String?  // Nullable because it can span multiple targets
  target                 Target?  @relation(fields: [targetId], references: [id])
  
  name                   String   // e.g., "PPTX Shape Engine"
  scope                  String   // single_feature, full_module, full_application
  description            String?  @db.Text
  
  capabilityIds          String[] // Which capabilities this blueprint combines
  algorithmIds           String[] // Which algorithms are used
  
  moduleStructure        Json     @default("[]") // Folders, files
  classHierarchy         Json     @default("[]") // OOP architecture
  publicApi              Json     @default("[]") // method signatures
  buildSequence          Json     @default("[]") // Phase 1, Phase 2...
  
  minimalImplementation  Json     @default("{}") // Tiny working skeleton
  extensionPoints        Json     @default("[]") // Where to add plugins
  integrationTests       Json     @default("[]")
  
  metadata               Json     @default("{}")
}

/// GRAPH RELATIONS
/// The explicit, typed edges between any entities in the Knowledge Base.
/// Since Prisma doesn't do generic polymorphism cleanly, we use Strings for IDs.
model Relation {
  id              BigInt   @id @default(autoincrement())
  sourceId        String   // ID of the source entity
  sourceType      String   // "concept", "entry", "atom", "target", etc.
  
  targetId        String   // ID of the destination entity
  targetType      String   
  
  relationType    String   // e.g., "DEPENDS_ON", "TRANSLATES_TO", "IMPLEMENTS"
  strength        Float    @default(1.0) // Weight of relationship (0.0 - 1.0)
  bidirectional   Boolean  @default(false)
  context         String?  @db.Text // Text explaining WHY this relationship exists
  
  discoveredBy    String?  // The AI phase/model that found this link
  confidence      Float    @default(1.0)
  metadata        Json     @default("{}")

  @@index([sourceId, sourceType])
  @@index([targetId, targetType])
  @@index([relationType])
}

/// ARTIFACTS
/// Large, reusable blobs of data (Code files, Schemas, complete implementations).
model Artifact {
  id              String   @id
  type            String   // "code_example", "binary_spec", "schema", "test_vector"
  name            String?
  description     String?  @db.Text
  
  content         String?  @db.Text // Content if small
  contentRef      String?  // S3 or Blob URL if large
  contentHash     String?
  contentSize     Int?     // Size in bytes
  tokenCount      Int?
  
  implementations Json     @default("{}") // Code implementations
  testVectorIds   String[]
  isTested        Boolean  @default(false)
  referencedBy    String[] // Entry IDs that rely on this
  
  metadata        Json     @default("{}")
}

/// GENERATION RUNS
/// Operational tracking for the AI generation campaigns.
model GenerationRun {
  id              String   @id
  targetId        String?
  
  startedAt       DateTime
  completedAt     DateTime?
  status          String   @default("running") // "running", "completed", "failed"
  
  config          Json     // The exact prompt configs/models used
  currentPhase    Int?     // Pipeline phase 1-12
  
  totalApiCalls   Int      @default(0)
  totalTokens     Int      @default(0)
  totalCostUsd    Float    @default(0.0)
  
  nodesCreated    Int      @default(0)
  edgesCreated    Int      @default(0)
  errors          Json     @default("[]")
  completeness    Json     @default("{}") // AI evaluated coverage %
}

/// VALIDATIONS
/// Tracks verification results from cross-checking AI output.
model Validation {
  id              Int      @id @default(autoincrement())
  entityId        String   // ID of validated entity
  entityType      String   // "entry", "atom", etc.
  
  validationType  String?  // "code_execution", "spec_check", "model_review"
  passed          Boolean? 
  confidence      Float?   // 0.0 - 1.0
  details         Json?    // Detailed critique
  
  validatorModel  String?  // e.g., "gpt-4o"
  validatedAt     DateTime @default(now())

  @@index([entityId])
}

/// EMBEDDINGS
/// Decoupled pgvector storage for semantic similarity search.
model Embedding {
  id              Int      @id @default(autoincrement())
  entityId        String   // Canonical ID
  entityType      String   // Node type
  resolution      String   // "micro", "standard", "exhaustive"
  
  // NOTE: Prisma requires Unsupported for PostgreSQL pgvector types
  vector          Unsupported("vector(1536)")? 
  
  model           String?  // Embedding model used
  createdAt       DateTime @default(now())

  @@unique([entityId, resolution])
}

/// SCHEMA METADATA
/// Allows the AI to query the database structure directly to understand the schema without docs.
model SchemaMetadata {
  tableName       String
  columnName      String   // "table" level if this is 'null' or empty string
  
  description     String   @db.Text // AI and Human readable
  aiUsageHint     String?  @db.Text // Specific directions for the LLM
  exampleQuery    String?  @db.Text
  
  @@id([tableName, columnName])
}


// ============================================================================
// PART 2: OBSERVABILITY & KNOWLEDGE VITALITY 
// The "Biological Health System" of the Database
// ============================================================================

/// HEALTH SNAPSHOTS
/// Time-series ledger storing the 5 vital signs at specific moments in time.
model HealthSnapshot {
  id               BigInt   @id @default(autoincrement())
  measuredAt       DateTime @default(now())
  
  scopeType        String   // "entry", "target", "family", "global"
  scopeId          String?  // NULL if global
  
  // The Five Vital Signs (0.0 to 1.0)
  coverage         Float    // Does it exist?
  accuracy         Float    // Is it true?
  freshness        Float    // Is it current?
  depth            Float    // Is it complete? (Atoms + Algorithms)
  coherence        Float    // Does it contradict itself?
  
  overallHealth    Float    // Composite score
  
  // Breakdowns
  coverageDetails  Json     @default("{}")
  accuracyDetails  Json     @default("{}")
  freshnessDetails Json     @default("{}")
  depthDetails     Json     @default("{}")
  coherenceDetails Json     @default("{}")
  
  // Deltas since last check
  coverageDelta    Float?
  accuracyDelta    Float?
  freshnessDelta   Float?
  depthDelta       Float?
  coherenceDelta   Float?
  overallDelta     Float?

  @@index([measuredAt])
  @@index([scopeType, scopeId, measuredAt])
}

/// HEALTH EVENTS
/// Record of things that impacted the health of the knowledge base.
/// E.g., "Python 3.13 Released", "Spec Amended", "Contradiction Found".
model HealthEvent {
  id               BigInt   @id @default(autoincrement())
  detectedAt       DateTime @default(now())
  
  eventType        String   // "version_released", "gap_discovered", "anchor_drift"
  scopeType        String
  scopeId          String?
  severity         String   // "critical", "warning", "info"
  
  title            String
  description      String   @db.Text
  
  triggerSource    String?  // "analyzer", "sensor", "immune_system"
  triggerDetails   Json     @default("{}")
  
  affectedEntries  String[] @default([])
  affectedTargets  String[] @default([])
  estimatedScope   Int?     // How many nodes broke
  
  // Immune system response tracking
  responseStatus   String   @default("pending") // "pending", "resolved"
  responseAction   String?  @db.Text
  resolvedAt       DateTime?
  resolvedBy       String?  // e.g., "immune_system"

  @@index([eventType])
  @@index([severity, detectedAt])
}

/// DECAY LEDGER
/// Tracks the "radioactive decay" of an entry's freshness over time.
model DecayLedger {
  id                 BigInt   @id @default(autoincrement())
  entryId            String   @unique
  
  knowledgeTimestamp DateTime // When it was born
  decayEvents        Json     @default("[]") // External events causing decay
  
  decayScore         Float    @default(0.0) // 0.0 = perfectly fresh, 1.0 = completely stale
  reviewDue          DateTime? 
  
  decayRate          String   @default("normal") // "immortal", "stable", "normal", "volatile"
  lastAssessed       DateTime @default(now())

  @@index([decayScore(sort: Desc)])
}

/// DRIFT EVENTS
/// When external reality diverges from the DB (Sensors pick this up).
model DriftEvent {
  id               Int      @id @default(autoincrement())
  eventType        String   // "version_release", "deprecation"
  severity         String
  targetId         String?
  
  affectedNodes    Json     // Array of node IDs
  description      String   @db.Text
  source           String?  // e.g., "llm_version_probe", "github_release"
  detectedAt       DateTime @default(now())
  
  resolvedAt       DateTime?
  resolution       String?  @db.Text
  
  autoFixable      Boolean  @default(false)
  estimatedCost    Float    @default(0.0) // USD to auto-heal
  priorityScore    Float    @default(0.0)

  @@index([resolvedAt])
}

/// DRIFT CHECKS
/// Periodic verification probes running in the background.
model DriftCheck {
  id               Int      @id @default(autoincrement())
  targetId         String?
  checkType        String
  lastChecked      DateTime @default(now())
  nextCheckDue     DateTime?
  result           Json
}

/// TARGET UNIVERSE
/// A master map of what we know vs what exists in the world.
model TargetUniverse {
  targetName             String   @id
  targetKind             String
  importance             Float    @default(0.5) // Popularity weighting
  documented             Boolean  @default(false) // Do we have it yet?
  estimatedCapabilities  Int?
  documentedCapabilities Int      @default(0)
  coveragePct            Float    @default(0.0)
  lastAssessed           DateTime?
}

/// COVERAGE ASSESSMENTS
/// Historical record of how much of a target we've managed to map.
model CoverageAssessment {
  id                     Int      @id @default(autoincrement())
  targetId               String
  assessedAt             DateTime @default(now())
  totalKnownCapabilities Int?
  documentedCapabilities Int?
  coveragePct            Float?
  missingAreas           Json?
  assessmentMethod       String?  // "llm_probe", "spec_comparison"
}


// ============================================================================
// PART 3: AI CONTRIBUTION ENGINE (ACE)
// The "Compute Donation & Execution System"
// ============================================================================

/// CONTRIBUTORS
/// Developers or sponsors donating AI compute to the project.
model Contributor {
  id                 String   @id @default(uuid())
  githubId           String?  @unique
  email              String   @unique
  displayName        String
  
  role               String   // "owner", "maintainer", "contributor", "sponsor"
  
  // Lifetime stats
  totalTokensDonated Int      @default(0)
  totalCostDonated   Float    @default(0.0)
  tasksCompleted     Int      @default(0)
  
  joinedAt           DateTime @default(now())
  lastActiveAt       DateTime @default(now())

  contributions      AIContribution[]
}

/// AI CONTRIBUTIONS
/// A specific API key or LLM connection donated by a contributor.
model AIContribution {
  id               String   @id @default(nanoid(12))
  contributorId    String
  contributor      Contributor @relation(fields: [contributorId], references: [id])
  
  provider         String   // "openai", "anthropic", "local_llm", etc.
  credentialRef    String   // Vault reference (HashiCorp/SOPS) — DO NOT store raw keys here
  
  // Controls
  budget           Json     // Configuration: maxSpendMonthly, alertThresholds
  preferences      Json     // Allowed tasks, preferred models, active hours
  
  status           String   // "active", "paused", "exhausted", "error"
  healthCheck      Json     // Status, latency, lastCheck
  
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  tasksFunded      Task[]   @relation("TaskFunding")
}

/// PROJECTS
/// Open source repositories utilizing ACE.
model Project {
  id                 String   @id @default(uuid())
  name               String
  repository         String   // e.g. "owner/repo"
  
  taskPolicies       Json     // Priority, max retries, cost approval thresholds
  allocationStrategy String   // "round-robin", "proportional", "cost-optimized"
  qualityGates       Json     // Minimum confidence scores, review requirements
  integrations       Json     // GitHub app config, Slack webhooks
  promptTemplates    Json     // Custom override prompts for this project
  
  tasks              Task[]
}

/// TASKS
/// Work items executed by the Orchestration Engine using pooled API keys.
model Task {
  id                     String   @id @default(nanoid(12))
  projectId              String
  project                Project  @relation(fields: [projectId], references: [id])
  
  type                   String   // "code-generation", "pr-review", "bug-triage"
  title                  String
  description            String   @db.Text
  priority               String   // "critical", "high", "medium", "low"
  
  context                Json     // Repository files, Issue PRs, specific docs needed
  requirements           Json     // Min model tier, requires streaming, confidence threshold
  
  status                 String   // "pending", "running", "completed", "failed", "retrying"
  
  // Execution tracking
  assignedContributionId String?
  assignedContribution   AIContribution? @relation("TaskFunding", fields: [assignedContributionId], references: [id])
  assignedModel          String?
  result                 Json?    // Structured output, success flag, reasoning traces
  
  // Relationships for decomposing massive jobs
  parentTaskId           String?
  parentTask             Task?    @relation("SubTasks", fields: [parentTaskId], references: [id])
  childTasks             Task[]   @relation("SubTasks")
  dependsOn              String[] // Array of Task IDs this depends on
  
  // Retry mechanism
  attemptCount           Int      @default(0)
  maxAttempts            Int      @default(3)
  lastError              String?  @db.Text
  
  // Telemetry
  createdAt              DateTime @default(now())
  startedAt              DateTime?
  completedAt            DateTime?
  
  estimatedTokens        Int      @default(0)
  actualTokens           Int?
  estimatedCostUsd       Float    @default(0.0)
  actualCostUsd          Float?
  
  // Identity
  requestedBy            String   // GitHub username or automation hook
  fundedBy               String?  // Reference to whose API key paid for this
}

/// AUDIT LEDGER
/// Strict ledger tracking exactly where every donated API token was spent.
model AuditEntry {
  id               String   @id @default(uuid())
  timestamp        DateTime @default(now())
  action           String   // e.g. "task.executed", "budget.depleted"
  
  contributorId    String?
  taskId           String?
  
  provider         String
  model            String
  tokensUsed       Int
  costUsd          Float
  
  success          Boolean
  error            String?  @db.Text
  metadata         Json     @default("{}") // Extra telemetry
}
```
