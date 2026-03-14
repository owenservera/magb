-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "TargetKind" AS ENUM ('PROGRAMMING_LANGUAGE', 'MARKUP_LANGUAGE', 'QUERY_LANGUAGE', 'FILE_FORMAT', 'DATA_FORMAT', 'CONFIG_FORMAT', 'PROTOCOL', 'SHELL');

-- CreateEnum
CREATE TYPE "TargetStatus" AS ENUM ('ACTIVE', 'DEPRECATED', 'EXPERIMENTAL', 'HISTORICAL');

-- CreateEnum
CREATE TYPE "GenerationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'STALE');

-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('CURRENT', 'SUPPORTED', 'END_OF_LIFE', 'PRERELEASE');

-- CreateEnum
CREATE TYPE "EntryType" AS ENUM ('TOPIC', 'FUNCTION', 'CLASS', 'MODULE', 'TYPE', 'OPERATOR', 'KEYWORD', 'ELEMENT', 'ATTRIBUTE', 'RULE', 'CONCEPT', 'DIRECTIVE', 'PATTERN', 'CONSTANT', 'EXCEPTION', 'PROTOCOL_ENTRY', 'STATEMENT', 'EXPRESSION');

-- CreateEnum
CREATE TYPE "AtomType" AS ENUM ('XML_ELEMENT', 'XML_ATTRIBUTE', 'BINARY_FIELD', 'JSON_KEY', 'COORDINATE_SYSTEM', 'ENUM_VALUE', 'NAMESPACE', 'PROTOCOL_FIELD', 'SYNTAX_RULE', 'GRAMMAR_PRODUCTION');

-- CreateEnum
CREATE TYPE "BlueprintScope" AS ENUM ('SINGLE_FEATURE', 'FEATURE_GROUP', 'FULL_MODULE', 'FULL_APPLICATION');

-- CreateEnum
CREATE TYPE "RelationType" AS ENUM ('IMPLEMENTS', 'REQUIRES', 'ANALOGOUS_IN', 'CHILD_OF', 'COMPOSED_OF', 'EXTENDS', 'ALTERNATIVE_TO', 'RELATED_TO', 'DEPENDS_ON', 'ANTI_PATTERN_OF', 'EVOLVED_FROM', 'DEPRECATES', 'TESTED_BY', 'DOCUMENTED_BY', 'SUPERSEDES', 'VARIANT_OF');

-- CreateEnum
CREATE TYPE "ComplexityLevel" AS ENUM ('MINIMAL', 'BASIC', 'MODERATE', 'ADVANCED', 'EXPERT');

-- CreateEnum
CREATE TYPE "ValidationResult" AS ENUM ('PENDING', 'PASSED', 'FAILED', 'NEEDS_REVIEW');

-- CreateEnum
CREATE TYPE "GenerationRunStatus" AS ENUM ('RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED', 'PAUSED');

-- CreateEnum
CREATE TYPE "GenerationPhase" AS ENUM ('DECOMPOSE', 'ENUMERATE', 'GENERATE', 'GAP_ANALYZE', 'FILL', 'VALIDATE');

-- CreateEnum
CREATE TYPE "EmbeddingResolution" AS ENUM ('MICRO', 'STANDARD', 'EXHAUSTIVE', 'COMBINED');

-- CreateEnum
CREATE TYPE "ScopeType" AS ENUM ('ENTRY', 'TARGET', 'FAMILY', 'GLOBAL');

-- CreateEnum
CREATE TYPE "HealthSeverity" AS ENUM ('CRITICAL', 'WARNING', 'INFO');

-- CreateEnum
CREATE TYPE "HealthEventType" AS ENUM ('VERSION_RELEASED', 'SPEC_AMENDED', 'ENTRY_DECAYED', 'GAP_DISCOVERED', 'CONTRADICTION_FOUND', 'ACCURACY_DROP', 'DEPTH_INCOMPLETE', 'ORPHAN_DETECTED', 'ANCHOR_DRIFT', 'EXTERNAL_SIGNAL', 'REGENERATION_COMPLETED', 'VALIDATION_COMPLETED');

-- CreateEnum
CREATE TYPE "ResponseStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'ACCEPTED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "DecayRate" AS ENUM ('IMMORTAL', 'STABLE', 'NORMAL', 'FAST', 'VOLATILE');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('CODE_EXAMPLE', 'ALGORITHM_IMPL', 'FILE_TEMPLATE', 'BINARY_SPEC', 'SCHEMA', 'TEST_VECTOR', 'MIGRATION_GUIDE', 'BENCHMARK', 'REFERENCE_IMPL');

-- CreateEnum
CREATE TYPE "ValidationType" AS ENUM ('LLM_REVIEW', 'CODE_EXECUTION', 'SCHEMA_VALIDATION', 'CROSS_REFERENCE', 'HUMAN_REVIEW', 'ANCHOR_CHECK', 'PEER_COMPARISON');

-- CreateTable
CREATE TABLE "concepts" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "parent_id" TEXT,
    "summary" TEXT,
    "description" TEXT,
    "theory" TEXT,
    "prevalence" TEXT,
    "notable_absences" TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "concepts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "families" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "shared_traits" JSONB NOT NULL DEFAULT '{}',
    "shared_entry_ids" TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "targets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kind" "TargetKind" NOT NULL,
    "family_id" TEXT,
    "description" TEXT,
    "traits" JSONB NOT NULL DEFAULT '{}',
    "distinguishing" TEXT[],
    "similar_to" TEXT[],
    "extensions" TEXT[],
    "media_types" TEXT[],
    "magic_bytes" TEXT,
    "spec_url" TEXT,
    "status" "TargetStatus" NOT NULL DEFAULT 'ACTIVE',
    "generation_status" "GenerationStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "last_generated" TIMESTAMP(3),
    "tier" INTEGER NOT NULL DEFAULT 3,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "targets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "target_versions" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "version_string" TEXT NOT NULL,
    "released" TIMESTAMP(3),
    "status" "VersionStatus" NOT NULL DEFAULT 'CURRENT',
    "delta_from" TEXT,
    "additions" JSONB NOT NULL DEFAULT '[]',
    "changes" JSONB NOT NULL DEFAULT '[]',
    "removals" JSONB NOT NULL DEFAULT '[]',
    "deprecations" JSONB NOT NULL DEFAULT '[]',
    "spec_url" TEXT,
    "changelog_url" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "target_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entries" (
    "id" TEXT NOT NULL,
    "concept_id" TEXT,
    "target_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "entry_type" "EntryType" NOT NULL,
    "introduced_in" TEXT,
    "removed_in" TEXT,
    "changed_in" TEXT[],
    "content_micro" TEXT,
    "content_standard" TEXT,
    "content_exhaustive" TEXT,
    "syntax" TEXT,
    "parameters" JSONB NOT NULL DEFAULT '[]',
    "return_value" TEXT,
    "edge_cases" JSONB NOT NULL DEFAULT '[]',
    "common_mistakes" JSONB NOT NULL DEFAULT '[]',
    "tokens_micro" INTEGER,
    "tokens_standard" INTEGER,
    "tokens_exhaustive" INTEGER,
    "generated_by" TEXT,
    "generated_at" TIMESTAMP(3),
    "validated_by" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "content_hash" TEXT,
    "validation_notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "examples" (
    "id" TEXT NOT NULL,
    "entry_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "explanation" TEXT,
    "expected_output" TEXT,
    "complexity" "ComplexityLevel" NOT NULL DEFAULT 'BASIC',
    "valid_from" TEXT,
    "valid_until" TEXT,
    "also_used_by" TEXT[],
    "token_count" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "examples_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "atoms" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "entry_id" TEXT,
    "atom_type" "AtomType" NOT NULL,
    "file_path" TEXT,
    "xpath" TEXT,
    "byte_offset" INTEGER,
    "element_name" TEXT NOT NULL,
    "namespace_uri" TEXT,
    "namespace_prefix" TEXT,
    "structure" JSONB NOT NULL DEFAULT '{}',
    "parent_atom_id" TEXT,
    "semantic_meaning" TEXT,
    "unit_of_measure" TEXT,
    "conversion_formula" TEXT,
    "example_value" TEXT,
    "example_context" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "atoms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "algorithms" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "purpose" TEXT,
    "formula" TEXT,
    "formula_explanation" TEXT,
    "summary" TEXT,
    "full_spec" TEXT,
    "pseudocode" TEXT,
    "parameters" JSONB NOT NULL DEFAULT '[]',
    "time_complexity" TEXT,
    "space_complexity" TEXT,
    "optimizations" JSONB NOT NULL DEFAULT '[]',
    "algorithm_edge_cases" JSONB NOT NULL DEFAULT '[]',
    "test_vectors" JSONB NOT NULL DEFAULT '[]',
    "numerical_stability" JSONB NOT NULL DEFAULT '{}',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "references" TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "algorithms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capabilities" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "user_description" TEXT,
    "technical_description" TEXT,
    "complexity" "ComplexityLevel" NOT NULL DEFAULT 'MODERATE',
    "implementation_steps" JSONB NOT NULL DEFAULT '[]',
    "reference_implementations" JSONB NOT NULL DEFAULT '{}',
    "minimum_working_example" TEXT,
    "known_pitfalls" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capabilities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blueprints" (
    "id" TEXT NOT NULL,
    "target_id" TEXT,
    "name" TEXT NOT NULL,
    "scope" "BlueprintScope" NOT NULL,
    "description" TEXT,
    "capability_ids" TEXT[],
    "algorithm_ids" TEXT[],
    "module_structure" JSONB NOT NULL DEFAULT '[]',
    "class_hierarchy" JSONB NOT NULL DEFAULT '[]',
    "public_api" JSONB NOT NULL DEFAULT '[]',
    "build_sequence" JSONB NOT NULL DEFAULT '[]',
    "minimal_implementation" JSONB NOT NULL DEFAULT '{}',
    "extension_points" JSONB NOT NULL DEFAULT '[]',
    "initialization_sequence" JSONB NOT NULL DEFAULT '[]',
    "integration_tests" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blueprints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artifacts" (
    "id" TEXT NOT NULL,
    "artifact_type" "ArtifactType" NOT NULL,
    "name" TEXT,
    "description" TEXT,
    "content" TEXT,
    "content_ref" TEXT,
    "content_hash" TEXT,
    "content_size" INTEGER,
    "token_count" INTEGER,
    "implementations" JSONB NOT NULL DEFAULT '{}',
    "test_vector_ids" TEXT[],
    "is_tested" BOOLEAN NOT NULL DEFAULT false,
    "referenced_by" TEXT[],
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artifacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relations" (
    "id" BIGSERIAL NOT NULL,
    "source_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "rel_target_id" TEXT NOT NULL,
    "rel_target_type" TEXT NOT NULL,
    "relation_type" "RelationType" NOT NULL,
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "bidirectional" BOOLEAN NOT NULL DEFAULT false,
    "context" TEXT,
    "discovered_by" TEXT,
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_runs" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "status" "GenerationRunStatus" NOT NULL DEFAULT 'RUNNING',
    "config" JSONB NOT NULL DEFAULT '{}',
    "current_phase" "GenerationPhase",
    "total_api_calls" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_cost_usd" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "nodes_created" INTEGER NOT NULL DEFAULT 0,
    "edges_created" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB NOT NULL DEFAULT '[]',
    "completeness" JSONB NOT NULL DEFAULT '{}',
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "generation_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "validations" (
    "id" BIGSERIAL NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "validation_type" "ValidationType" NOT NULL,
    "result" "ValidationResult" NOT NULL DEFAULT 'PENDING',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "details" JSONB NOT NULL DEFAULT '{}',
    "validator_model" TEXT,
    "validated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "embeddings" (
    "id" BIGSERIAL NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "resolution" "EmbeddingResolution" NOT NULL,
    "vector" vector(1536),
    "model" TEXT NOT NULL DEFAULT 'text-embedding-ada-002',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "embeddings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "schema_metadata" (
    "table_name" TEXT NOT NULL,
    "column_name" TEXT NOT NULL DEFAULT '__table__',
    "description" TEXT NOT NULL,
    "ai_usage_hint" TEXT,
    "example_query" TEXT,

    CONSTRAINT "schema_metadata_pkey" PRIMARY KEY ("table_name","column_name")
);

-- CreateTable
CREATE TABLE "health_snapshots" (
    "id" BIGSERIAL NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scope_type" "ScopeType" NOT NULL,
    "scope_id" TEXT,
    "coverage" DOUBLE PRECISION NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "freshness" DOUBLE PRECISION NOT NULL,
    "depth" DOUBLE PRECISION NOT NULL,
    "coherence" DOUBLE PRECISION NOT NULL,
    "overall_health" DOUBLE PRECISION NOT NULL,
    "coverage_details" JSONB,
    "accuracy_details" JSONB,
    "freshness_details" JSONB,
    "depth_details" JSONB,
    "coherence_details" JSONB,
    "coverage_delta" DOUBLE PRECISION,
    "accuracy_delta" DOUBLE PRECISION,
    "freshness_delta" DOUBLE PRECISION,
    "depth_delta" DOUBLE PRECISION,
    "coherence_delta" DOUBLE PRECISION,
    "overall_delta" DOUBLE PRECISION,

    CONSTRAINT "health_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "health_events" (
    "id" BIGSERIAL NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "event_type" "HealthEventType" NOT NULL,
    "scope_type" "ScopeType" NOT NULL,
    "scope_id" TEXT,
    "severity" "HealthSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "trigger_source" TEXT,
    "trigger_details" JSONB NOT NULL DEFAULT '{}',
    "affected_entries" TEXT[],
    "affected_targets" TEXT[],
    "estimated_scope" INTEGER,
    "response_status" "ResponseStatus" NOT NULL DEFAULT 'PENDING',
    "response_action" TEXT,
    "resolved_at" TIMESTAMP(3),
    "resolved_by" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "health_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "decay_ledger" (
    "id" BIGSERIAL NOT NULL,
    "entry_id" TEXT NOT NULL,
    "knowledge_timestamp" TIMESTAMP(3) NOT NULL,
    "decay_events" JSONB NOT NULL DEFAULT '[]',
    "decay_score" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "review_due" TIMESTAMP(3),
    "decay_rate" "DecayRate" NOT NULL DEFAULT 'NORMAL',
    "last_assessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "decay_ledger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "completeness_anchors" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "anchor_type" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "total_count" INTEGER NOT NULL,
    "covered_count" INTEGER NOT NULL DEFAULT 0,
    "missing_items" JSONB NOT NULL DEFAULT '[]',
    "generated_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "completeness_anchors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topic_nodes" (
    "id" TEXT NOT NULL,
    "target_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "node_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "path" TEXT NOT NULL DEFAULT '',
    "depth" INTEGER NOT NULL DEFAULT 0,
    "is_generated" BOOLEAN NOT NULL DEFAULT false,
    "is_validated" BOOLEAN NOT NULL DEFAULT false,
    "estimated_subtopic_count" INTEGER NOT NULL DEFAULT 0,
    "entry_id" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "topic_nodes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "concepts_domain_idx" ON "concepts"("domain");

-- CreateIndex
CREATE INDEX "concepts_parent_id_idx" ON "concepts"("parent_id");

-- CreateIndex
CREATE INDEX "targets_kind_idx" ON "targets"("kind");

-- CreateIndex
CREATE INDEX "targets_family_id_idx" ON "targets"("family_id");

-- CreateIndex
CREATE INDEX "targets_status_generation_status_idx" ON "targets"("status", "generation_status");

-- CreateIndex
CREATE INDEX "targets_tier_idx" ON "targets"("tier");

-- CreateIndex
CREATE INDEX "target_versions_target_id_idx" ON "target_versions"("target_id");

-- CreateIndex
CREATE INDEX "target_versions_delta_from_idx" ON "target_versions"("delta_from");

-- CreateIndex
CREATE UNIQUE INDEX "target_versions_target_id_version_string_key" ON "target_versions"("target_id", "version_string");

-- CreateIndex
CREATE INDEX "entries_target_id_path_idx" ON "entries"("target_id", "path");

-- CreateIndex
CREATE INDEX "entries_concept_id_idx" ON "entries"("concept_id");

-- CreateIndex
CREATE INDEX "entries_target_id_entry_type_idx" ON "entries"("target_id", "entry_type");

-- CreateIndex
CREATE INDEX "entries_content_hash_idx" ON "entries"("content_hash");

-- CreateIndex
CREATE UNIQUE INDEX "entries_target_id_path_key" ON "entries"("target_id", "path");

-- CreateIndex
CREATE INDEX "examples_entry_id_idx" ON "examples"("entry_id");

-- CreateIndex
CREATE INDEX "examples_complexity_idx" ON "examples"("complexity");

-- CreateIndex
CREATE INDEX "atoms_target_id_idx" ON "atoms"("target_id");

-- CreateIndex
CREATE INDEX "atoms_parent_atom_id_idx" ON "atoms"("parent_atom_id");

-- CreateIndex
CREATE INDEX "atoms_element_name_idx" ON "atoms"("element_name");

-- CreateIndex
CREATE INDEX "algorithms_category_idx" ON "algorithms"("category");

-- CreateIndex
CREATE INDEX "algorithms_domain_idx" ON "algorithms"("domain");

-- CreateIndex
CREATE INDEX "capabilities_target_id_idx" ON "capabilities"("target_id");

-- CreateIndex
CREATE INDEX "capabilities_category_idx" ON "capabilities"("category");

-- CreateIndex
CREATE INDEX "blueprints_target_id_idx" ON "blueprints"("target_id");

-- CreateIndex
CREATE INDEX "blueprints_scope_idx" ON "blueprints"("scope");

-- CreateIndex
CREATE INDEX "artifacts_artifact_type_idx" ON "artifacts"("artifact_type");

-- CreateIndex
CREATE INDEX "artifacts_content_hash_idx" ON "artifacts"("content_hash");

-- CreateIndex
CREATE INDEX "relations_source_id_source_type_idx" ON "relations"("source_id", "source_type");

-- CreateIndex
CREATE INDEX "relations_rel_target_id_rel_target_type_idx" ON "relations"("rel_target_id", "rel_target_type");

-- CreateIndex
CREATE INDEX "relations_relation_type_idx" ON "relations"("relation_type");

-- CreateIndex
CREATE INDEX "relations_source_id_relation_type_idx" ON "relations"("source_id", "relation_type");

-- CreateIndex
CREATE INDEX "generation_runs_target_id_idx" ON "generation_runs"("target_id");

-- CreateIndex
CREATE INDEX "generation_runs_status_idx" ON "generation_runs"("status");

-- CreateIndex
CREATE INDEX "validations_entity_id_entity_type_idx" ON "validations"("entity_id", "entity_type");

-- CreateIndex
CREATE INDEX "validations_result_idx" ON "validations"("result");

-- CreateIndex
CREATE INDEX "validations_validated_at_idx" ON "validations"("validated_at");

-- CreateIndex
CREATE INDEX "embeddings_entity_type_idx" ON "embeddings"("entity_type");

-- CreateIndex
CREATE UNIQUE INDEX "embeddings_entity_id_entity_type_resolution_model_key" ON "embeddings"("entity_id", "entity_type", "resolution", "model");

-- CreateIndex
CREATE INDEX "health_snapshots_measured_at_idx" ON "health_snapshots"("measured_at");

-- CreateIndex
CREATE INDEX "health_snapshots_scope_type_scope_id_measured_at_idx" ON "health_snapshots"("scope_type", "scope_id", "measured_at");

-- CreateIndex
CREATE INDEX "health_events_event_type_idx" ON "health_events"("event_type");

-- CreateIndex
CREATE INDEX "health_events_severity_detected_at_idx" ON "health_events"("severity", "detected_at");

-- CreateIndex
CREATE INDEX "health_events_scope_type_scope_id_idx" ON "health_events"("scope_type", "scope_id");

-- CreateIndex
CREATE INDEX "health_events_response_status_idx" ON "health_events"("response_status");

-- CreateIndex
CREATE INDEX "decay_ledger_decay_score_idx" ON "decay_ledger"("decay_score" DESC);

-- CreateIndex
CREATE INDEX "decay_ledger_review_due_idx" ON "decay_ledger"("review_due");

-- CreateIndex
CREATE INDEX "decay_ledger_entry_id_idx" ON "decay_ledger"("entry_id");

-- CreateIndex
CREATE INDEX "completeness_anchors_target_id_idx" ON "completeness_anchors"("target_id");

-- CreateIndex
CREATE UNIQUE INDEX "completeness_anchors_target_id_anchor_type_key" ON "completeness_anchors"("target_id", "anchor_type");

-- CreateIndex
CREATE INDEX "topic_nodes_target_id_idx" ON "topic_nodes"("target_id");

-- CreateIndex
CREATE INDEX "topic_nodes_parent_id_idx" ON "topic_nodes"("parent_id");

-- CreateIndex
CREATE INDEX "topic_nodes_target_id_path_idx" ON "topic_nodes"("target_id", "path");

-- AddForeignKey
ALTER TABLE "concepts" ADD CONSTRAINT "concepts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "targets" ADD CONSTRAINT "targets_family_id_fkey" FOREIGN KEY ("family_id") REFERENCES "families"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_versions" ADD CONSTRAINT "target_versions_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "target_versions" ADD CONSTRAINT "target_versions_delta_from_fkey" FOREIGN KEY ("delta_from") REFERENCES "target_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "concepts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_introduced_in_fkey" FOREIGN KEY ("introduced_in") REFERENCES "target_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entries" ADD CONSTRAINT "entries_removed_in_fkey" FOREIGN KEY ("removed_in") REFERENCES "target_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examples" ADD CONSTRAINT "examples_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examples" ADD CONSTRAINT "examples_valid_from_fkey" FOREIGN KEY ("valid_from") REFERENCES "target_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "examples" ADD CONSTRAINT "examples_valid_until_fkey" FOREIGN KEY ("valid_until") REFERENCES "target_versions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atoms" ADD CONSTRAINT "atoms_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atoms" ADD CONSTRAINT "atoms_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atoms" ADD CONSTRAINT "atoms_parent_atom_id_fkey" FOREIGN KEY ("parent_atom_id") REFERENCES "atoms"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "capabilities" ADD CONSTRAINT "capabilities_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blueprints" ADD CONSTRAINT "blueprints_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_runs" ADD CONSTRAINT "generation_runs_target_id_fkey" FOREIGN KEY ("target_id") REFERENCES "targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "decay_ledger" ADD CONSTRAINT "decay_ledger_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entries"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_nodes" ADD CONSTRAINT "topic_nodes_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "topic_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
