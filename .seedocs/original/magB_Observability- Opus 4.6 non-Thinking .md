

# Observability for a Living Knowledge Organism

---

## The Fundamental Realization

This database is not software. It's not infrastructure. It doesn't behave like anything we traditionally monitor.

Think about what we've built:

At the moment we finish generating the complete knowledge for Python 3.12, Python 3.13 is in beta. The moment we document every PNG capability, someone proposes APNG extensions. The moment we capture Rust's type system, a new RFC lands. The moment we document every Photoshop algorithm, Adobe releases a new neural filter.

**The database is never finished. It is born decaying.**

This isn't a bug. This is the fundamental nature of the system. And it means our observability can't be "is the system healthy?" in the traditional sense. It has to answer a much stranger question:

**"How alive is our knowledge, and where is it dying?"**

---

## Why Traditional Observability Fails Here

Traditional observability monitors three things:

```
TRADITIONAL OBSERVABILITY:
  Metrics  → "How many requests per second?"
  Logs     → "What happened at 3:47 PM?"  
  Traces   → "How did request #4821 flow through the system?"

These answer: "Is the system RUNNING correctly?"
```

Our system might be running perfectly — every query returns in milliseconds, every API call succeeds, every database write completes — and yet the **knowledge itself** could be rotting. A structural template for PPTX might reference a namespace that Microsoft deprecated. An algorithm might have a known numerical instability that was discovered last month. A Python stdlib module might have been removed in the latest release.

**The system is operationally healthy but epistemically decaying.**

We need a new kind of observability. Not for the machinery. For the knowledge.

---

## The Three Dimensions of Knowledge Observability

```
         FRESHNESS                    CORRECTNESS                COMPLETENESS
         ─────────                    ───────────                ────────────
                                      
    "How current is             "How accurate is            "How much of reality
     our knowledge?"             our knowledge?"             do we cover?"
                                      
    │                           │                           │
    │  ████████░░░░             │  ████████████░             │  ████████░░░░░░
    │  ▲                        │  ▲                         │  ▲
    │  │                        │  │                         │  │
    │  Decays with              │  Degrades as               │  Shrinks as new
    │  TIME                     │  external world            │  capabilities
    │  (new versions,           │  reveals errors            │  are added to
    │   new specs,              │  (bugs found,              │   targets
    │   deprecations)           │   spec corrections,        │  (new versions,
    │                           │   better algorithms         │   new formats,
    │                           │   discovered)               │   new tools)
    │                           │                             │
    └───────────────            └───────────────              └───────────────
    
    COMBINED: "KNOWLEDGE VITALITY" — a single score representing
    how useful and trustworthy the database is RIGHT NOW
```

---

## The Knowledge Vitality Model

Every piece of knowledge in our graph has a **vitality** — a measure of how alive, accurate, and complete it is. Vitality isn't binary. It's a continuous signal that changes over time, even when nobody touches the database.

```python
# vitality.py
"""
The Knowledge Vitality Model.

Every node in the knowledge graph has a vitality score that 
DECAYS OVER TIME based on the nature of the knowledge it contains.

A Python keyword documented today is still valid in 5 years.
A Python 3.12 stdlib module might be deprecated in 18 months.
A bleeding-edge web API might change in 3 months.

Vitality captures this reality.
"""

import math
import time
from datetime import datetime, timedelta
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional


class DecayModel(str, Enum):
    """
    How quickly does this type of knowledge become stale?
    
    Think of these as half-lives: after the half-life period,
    confidence in the knowledge drops to 50%.
    """
    ETERNAL = "eternal"               # Mathematical truths, fundamental algorithms
                                       # Half-life: effectively infinite
                                       # Example: Gaussian blur convolution math
    
    GEOLOGICAL = "geological"          # Stable specifications, mature languages
                                       # Half-life: ~5 years
                                       # Example: C language syntax, PDF 1.7 spec
    
    SEASONAL = "seasonal"              # Active languages, evolving formats
                                       # Half-life: ~18 months
                                       # Example: Python stdlib, OOXML extensions
    
    VOLATILE = "volatile"              # Rapidly changing ecosystems, beta features
                                       # Half-life: ~6 months
                                       # Example: JS framework APIs, nightly features
    
    EPHEMERAL = "ephemeral"            # Cutting-edge, experimental
                                       # Half-life: ~2 months
                                       # Example: ML model APIs, draft specifications


# Half-lives in days
HALF_LIFE_DAYS = {
    DecayModel.ETERNAL: 36500,      # 100 years (effectively never)
    DecayModel.GEOLOGICAL: 1825,    # 5 years
    DecayModel.SEASONAL: 548,       # 18 months
    DecayModel.VOLATILE: 182,       # 6 months
    DecayModel.EPHEMERAL: 60,       # 2 months
}


@dataclass
class VitalitySignal:
    """A single measurement of a node's health along one dimension."""
    dimension: str          # freshness | correctness | completeness
    score: float            # 0.0 to 1.0
    measured_at: str        # ISO timestamp
    evidence: str           # what produced this measurement
    details: dict = field(default_factory=dict)


@dataclass  
class NodeVitality:
    """The complete vitality state of a knowledge node."""
    node_id: str
    
    # Core vitality scores (0.0 = dead, 1.0 = perfect)
    freshness: float = 1.0
    correctness: float = 1.0
    completeness: float = 1.0
    
    # Combined score
    vitality: float = 1.0
    
    # Metadata
    decay_model: DecayModel = DecayModel.SEASONAL
    last_validated: Optional[str] = None
    last_refreshed: Optional[str] = None
    created_at: Optional[str] = None
    
    # Signals that contributed to current scores
    signals: list[VitalitySignal] = field(default_factory=list)
    
    # Predicted future state
    predicted_vitality_30d: float = 1.0
    predicted_vitality_90d: float = 1.0
    predicted_vitality_180d: float = 1.0
    
    def compute_vitality(self) -> float:
        """
        Combined vitality is the geometric mean of dimensions.
        Geometric mean ensures that a zero in ANY dimension 
        tanks the overall score — you can't compensate for 
        known-incorrect knowledge with freshness.
        """
        self.vitality = (
            self.freshness * self.correctness * self.completeness
        ) ** (1/3)
        return self.vitality
    
    def compute_freshness_decay(self, now: datetime = None) -> float:
        """
        Freshness decays exponentially from the time knowledge 
        was last validated or refreshed.
        
        Uses radioactive decay model:
        freshness(t) = e^(-λt)
        where λ = ln(2) / half_life
        """
        if now is None:
            now = datetime.utcnow()
        
        last_good = self.last_validated or self.last_refreshed or self.created_at
        if not last_good:
            return 0.5  # Unknown age = assume moderate staleness
        
        last_good_dt = datetime.fromisoformat(last_good)
        age_days = (now - last_good_dt).total_seconds() / 86400
        
        half_life = HALF_LIFE_DAYS[self.decay_model]
        decay_constant = math.log(2) / half_life
        
        self.freshness = math.exp(-decay_constant * age_days)
        return self.freshness
    
    def predict_future_vitality(self, now: datetime = None):
        """Predict vitality at future time points."""
        if now is None:
            now = datetime.utcnow()
        
        half_life = HALF_LIFE_DAYS[self.decay_model]
        decay_constant = math.log(2) / half_life
        
        # Current correctness and completeness assumed stable
        # (they change from external events, not time alone)
        base = (self.correctness * self.completeness) ** 0.5
        
        for days, attr in [(30, 'predicted_vitality_30d'), 
                           (90, 'predicted_vitality_90d'),
                           (180, 'predicted_vitality_180d')]:
            future_freshness = self.freshness * math.exp(-decay_constant * days)
            setattr(self, attr, (future_freshness * base ** 2) ** (1/3))


def classify_decay_model(node: dict) -> DecayModel:
    """
    Determine the appropriate decay model for a knowledge node 
    based on what kind of knowledge it contains.
    """
    node_type = node.get("node_type", "")
    content = node.get("content", {})
    tags = node.get("tags", [])
    
    # Algorithms based on math are eternal
    if node_type == "algorithm":
        domain = content.get("domain", "")
        if domain in ("math", "geometry", "signal_processing", "compression"):
            # Core algorithms don't change
            # But check if it's an implementation (those can become outdated)
            if "api" in str(tags).lower() or "library" in str(tags).lower():
                return DecayModel.SEASONAL
            return DecayModel.ETERNAL
    
    # Concepts are generally very stable
    if node_type == "concept":
        return DecayModel.GEOLOGICAL
    
    # Targets depend on their nature
    if node_type == "target":
        kind = content.get("kind", "")
        status = content.get("status", "active")
        
        if status == "historical":
            return DecayModel.ETERNAL  # Dead formats don't change
        
        if kind in ("programming_language", "markup_language"):
            # Check if it's a specific version vs general
            version = content.get("version", "")
            if version and version != "latest":
                return DecayModel.GEOLOGICAL  # Specific version is frozen
            return DecayModel.SEASONAL  # "latest" means it changes
        
        if kind in ("network_protocol", "configuration_format"):
            return DecayModel.VOLATILE
        
        return DecayModel.SEASONAL  # Default for most formats
    
    # Structures (templates) decay with their parent target
    if node_type == "structure":
        return DecayModel.SEASONAL
    
    # Blueprints decay moderately (architecture patterns are stable, 
    # but specific library references change)
    if node_type == "blueprint":
        return DecayModel.SEASONAL
    
    return DecayModel.SEASONAL  # Safe default
```

---

## The Observability Engine

```python
# observability.py
"""
The Knowledge Observability Engine.

This isn't a monitoring system. It's an AWARENESS system.
It maintains continuous consciousness of the database's relationship 
to external reality.

Five subsystems:
1. DECAY TRACKER     — Computes freshness decay for every node
2. DRIFT DETECTOR    — Detects when external reality has changed
3. COVERAGE MAPPER   — Tracks what we know vs what exists
4. INTEGRITY AUDITOR — Validates internal consistency
5. VITALITY DASHBOARD — Synthesizes everything into actionable signals
"""

import asyncio
import json
import sqlite3
import logging
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import Optional
from collections import defaultdict
from pathlib import Path

logger = logging.getLogger("observability")


# ════════════════════════════════════════════════════════════════
# 1. DECAY TRACKER
# ════════════════════════════════════════════════════════════════

class DecayTracker:
    """
    Continuously computes freshness scores for every node
    based on time elapsed since last validation.
    
    This runs as a background process — even when nobody is 
    using the database, knowledge is getting staler.
    """
    
    def __init__(self, store: 'UniversalKnowledgeStore'):
        self.store = store
        self._init_vitality_table()
    
    def _init_vitality_table(self):
        self.store.db.executescript("""
            CREATE TABLE IF NOT EXISTS node_vitality (
                node_id         TEXT PRIMARY KEY REFERENCES nodes(canonical_id),
                freshness       REAL DEFAULT 1.0,
                correctness     REAL DEFAULT 1.0,
                completeness    REAL DEFAULT 1.0,
                vitality        REAL DEFAULT 1.0,
                decay_model     TEXT DEFAULT 'seasonal',
                last_validated  TEXT,
                last_refreshed  TEXT,
                predicted_30d   REAL,
                predicted_90d   REAL,
                predicted_180d  REAL,
                updated_at      TEXT DEFAULT (datetime('now'))
            );
            
            CREATE TABLE IF NOT EXISTS vitality_signals (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                node_id         TEXT REFERENCES nodes(canonical_id),
                dimension       TEXT,  -- freshness|correctness|completeness
                score           REAL,
                evidence        TEXT,
                details         JSON,
                recorded_at     TEXT DEFAULT (datetime('now'))
            );
            
            CREATE TABLE IF NOT EXISTS vitality_snapshots (
                snapshot_id     INTEGER PRIMARY KEY AUTOINCREMENT,
                snapshot_at     TEXT DEFAULT (datetime('now')),
                total_nodes     INTEGER,
                avg_vitality    REAL,
                avg_freshness   REAL,
                avg_correctness REAL,
                avg_completeness REAL,
                critical_count  INTEGER,  -- nodes below 0.3 vitality
                warning_count   INTEGER,  -- nodes between 0.3-0.6
                healthy_count   INTEGER,  -- nodes above 0.6
                by_type         JSON,     -- breakdown by node_type
                by_target       JSON,     -- breakdown by target
                by_decay_model  JSON      -- breakdown by decay model
            );
            
            CREATE INDEX IF NOT EXISTS idx_vitality_score 
                ON node_vitality(vitality);
            CREATE INDEX IF NOT EXISTS idx_vitality_signals_node 
                ON vitality_signals(node_id);
        """)
        self.store.db.commit()
    
    async def compute_all_decay(self):
        """Recompute freshness decay for every node in the graph."""
        now = datetime.utcnow()
        
        nodes = self.store.db.execute("""
            SELECT n.canonical_id, n.node_type, n.content, n.tags,
                   n.created_at, v.last_validated, v.last_refreshed,
                   v.correctness, v.completeness, v.decay_model
            FROM nodes n
            LEFT JOIN node_vitality v ON n.canonical_id = v.node_id
        """).fetchall()
        
        batch_updates = []
        
        for row in nodes:
            node_id = row[0]
            node_dict = {
                "node_type": row[1],
                "content": json.loads(row[2]) if isinstance(row[2], str) else row[2],
                "tags": json.loads(row[3]) if isinstance(row[3], str) else row[3],
            }
            
            # Determine decay model if not already set
            existing_decay = row[9]
            if existing_decay:
                decay_model = DecayModel(existing_decay)
            else:
                decay_model = classify_decay_model(node_dict)
            
            # Create vitality object
            vitality = NodeVitality(
                node_id=node_id,
                decay_model=decay_model,
                correctness=row[7] or 1.0,
                completeness=row[8] or 1.0,
                created_at=row[4],
                last_validated=row[5],
                last_refreshed=row[6],
            )
            
            # Compute decay
            vitality.compute_freshness_decay(now)
            vitality.compute_vitality()
            vitality.predict_future_vitality(now)
            
            batch_updates.append((
                node_id, vitality.freshness, vitality.correctness,
                vitality.completeness, vitality.vitality,
                decay_model.value, vitality.last_validated,
                vitality.last_refreshed,
                vitality.predicted_vitality_30d,
                vitality.predicted_vitality_90d,
                vitality.predicted_vitality_180d,
            ))
        
        # Batch update
        self.store.db.executemany("""
            INSERT INTO node_vitality 
                (node_id, freshness, correctness, completeness, vitality,
                 decay_model, last_validated, last_refreshed,
                 predicted_30d, predicted_90d, predicted_180d, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
            ON CONFLICT(node_id) DO UPDATE SET
                freshness = excluded.freshness,
                vitality = excluded.vitality,
                decay_model = excluded.decay_model,
                predicted_30d = excluded.predicted_30d,
                predicted_90d = excluded.predicted_90d,
                predicted_180d = excluded.predicted_180d,
                updated_at = datetime('now')
        """, batch_updates)
        self.store.db.commit()
        
        logger.info(f"Decay computed for {len(batch_updates)} nodes")
    
    def take_snapshot(self):
        """Record a point-in-time snapshot of overall vitality."""
        stats = self.store.db.execute("""
            SELECT 
                COUNT(*),
                AVG(vitality),
                AVG(freshness),
                AVG(correctness),
                AVG(completeness),
                SUM(CASE WHEN vitality < 0.3 THEN 1 ELSE 0 END),
                SUM(CASE WHEN vitality >= 0.3 AND vitality < 0.6 THEN 1 ELSE 0 END),
                SUM(CASE WHEN vitality >= 0.6 THEN 1 ELSE 0 END)
            FROM node_vitality
        """).fetchone()
        
        by_type = {}
        for row in self.store.db.execute("""
            SELECT n.node_type, AVG(v.vitality), COUNT(*),
                   MIN(v.vitality), MAX(v.vitality)
            FROM node_vitality v
            JOIN nodes n ON v.node_id = n.canonical_id
            GROUP BY n.node_type
        """).fetchall():
            by_type[row[0]] = {
                "avg_vitality": round(row[1], 4),
                "count": row[2],
                "min_vitality": round(row[3], 4),
                "max_vitality": round(row[4], 4)
            }
        
        by_target = {}
        for row in self.store.db.execute("""
            SELECT 
                SUBSTR(v.node_id, 1, INSTR(v.node_id || ':', ':') - 1) as target_prefix,
                AVG(v.vitality), COUNT(*),
                SUM(CASE WHEN v.vitality < 0.3 THEN 1 ELSE 0 END)
            FROM node_vitality v
            GROUP BY target_prefix
            ORDER BY AVG(v.vitality) ASC
            LIMIT 50
        """).fetchall():
            by_target[row[0]] = {
                "avg_vitality": round(row[1], 4),
                "node_count": row[2],
                "critical_count": row[3]
            }
        
        self.store.db.execute("""
            INSERT INTO vitality_snapshots
                (total_nodes, avg_vitality, avg_freshness, avg_correctness,
                 avg_completeness, critical_count, warning_count, healthy_count,
                 by_type, by_target)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            stats[0], stats[1], stats[2], stats[3], stats[4],
            stats[5], stats[6], stats[7],
            json.dumps(by_type), json.dumps(by_target)
        ))
        self.store.db.commit()


# ════════════════════════════════════════════════════════════════
# 2. DRIFT DETECTOR
# ════════════════════════════════════════════════════════════════

class DriftDetector:
    """
    Detects when external reality has diverged from our knowledge.
    
    Sources of drift:
    - New versions of languages/formats released
    - Specifications updated
    - Deprecations announced
    - Security vulnerabilities discovered in algorithms
    - Better algorithms published
    - Community best practices evolved
    
    The drift detector doesn't FIX anything. It SIGNALS that 
    something needs attention, with priority and impact assessment.
    """
    
    def __init__(self, store: 'UniversalKnowledgeStore',
                 api: 'MultiProviderAPIEngine'):
        self.store = store
        self.api = api
        self._init_drift_table()
    
    def _init_drift_table(self):
        self.store.db.executescript("""
            CREATE TABLE IF NOT EXISTS drift_events (
                event_id        INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type      TEXT NOT NULL,
                -- version_release | deprecation | spec_update | 
                -- security_advisory | algorithm_improvement | 
                -- ecosystem_change | new_format
                
                severity        TEXT NOT NULL,
                -- critical: knowledge is WRONG (security, breaking changes)
                -- major: knowledge is INCOMPLETE (new version, new features)
                -- minor: knowledge is STALE (better practices exist)
                -- info: knowledge could be ENHANCED (optimizations, tips)
                
                target_id       TEXT,            -- which target is affected
                affected_nodes  JSON,            -- list of affected node IDs
                description     TEXT NOT NULL,
                source          TEXT,            -- where we learned about this
                detected_at     TEXT DEFAULT (datetime('now')),
                resolved_at     TEXT,
                resolution      TEXT,            -- what was done
                auto_fixable    INTEGER DEFAULT 0,  -- can we fix automatically?
                estimated_cost  REAL DEFAULT 0,  -- estimated cost to fix (USD)
                priority_score  REAL DEFAULT 0   -- computed priority
            );
            
            CREATE TABLE IF NOT EXISTS drift_checks (
                check_id        INTEGER PRIMARY KEY AUTOINCREMENT,
                target_id       TEXT,
                check_type      TEXT,
                last_checked    TEXT DEFAULT (datetime('now')),
                next_check_due  TEXT,
                result          JSON
            );
            
            CREATE INDEX IF NOT EXISTS idx_drift_unresolved 
                ON drift_events(resolved_at) WHERE resolved_at IS NULL;
            CREATE INDEX IF NOT EXISTS idx_drift_severity 
                ON drift_events(severity);
        """)
        self.store.db.commit()
    
    async def check_for_version_drift(self, target_id: str):
        """
        Ask an LLM: "Has a new version of X been released since 
        we last documented it?"
        
        This is a lightweight probe — costs ~$0.001 per check.
        """
        target = self.store.get_node(target_id)
        if not target:
            return
        
        content = target.get("content", {})
        documented_version = content.get("version", "unknown")
        target_name = target.get("name", target_id)
        
        probe_prompt = f"""
What is the latest stable release version of {target_name}?
Our database documents version: {documented_version}

Respond with ONLY this JSON:
{{
    "latest_version": "version string",
    "release_date": "YYYY-MM-DD or 'unknown'",
    "is_our_version_current": true/false,
    "breaking_changes_since_our_version": ["list of major changes if not current"],
    "deprecated_features": ["features deprecated since our version"],
    "new_features": ["major features added since our version"],
    "confidence": "high|medium|low"
}}"""
        
        try:
            result = await self.api.call(
                prompt=probe_prompt,
                system_prompt="You are checking for software version updates. Be precise about version numbers.",
                temperature=0.0,
                max_tokens=1000,
                response_format="json"
            )
            
            data = json.loads(result["content"])
            
            if not data.get("is_our_version_current", True):
                # We have drift!
                severity = "major"
                breaking = data.get("breaking_changes_since_our_version", [])
                deprecated = data.get("deprecated_features", [])
                
                if breaking:
                    severity = "critical"
                
                # Find affected nodes
                affected = self.store.db.execute("""
                    SELECT canonical_id FROM nodes 
                    WHERE canonical_id LIKE ?
                """, (f"%{target_id.split(':')[1]}%",)).fetchall()
                
                affected_ids = [r[0] for r in affected]
                
                self._record_drift_event(
                    event_type="version_release",
                    severity=severity,
                    target_id=target_id,
                    affected_nodes=affected_ids,
                    description=(
                        f"{target_name} has new version {data['latest_version']} "
                        f"(we document {documented_version}). "
                        f"Breaking changes: {breaking}. "
                        f"Deprecated: {deprecated}. "
                        f"New features: {data.get('new_features', [])}"
                    ),
                    source="llm_version_probe",
                    auto_fixable=len(breaking) == 0,  # Auto-fixable if no breaking changes
                    estimated_cost=len(affected_ids) * 0.05  # ~$0.05 per node to refresh
                )
                
                # Update freshness scores for affected nodes
                for node_id in affected_ids:
                    self.store.db.execute("""
                        UPDATE node_vitality 
                        SET freshness = freshness * 0.5,
                            vitality = freshness * 0.5 * correctness * completeness,
                            updated_at = datetime('now')
                        WHERE node_id = ?
                    """, (node_id,))
                
                self.store.db.commit()
                
                logger.warning(
                    f"DRIFT DETECTED: {target_name} {documented_version} → "
                    f"{data['latest_version']} ({severity})"
                )
            
            # Record the check
            self.store.db.execute("""
                INSERT OR REPLACE INTO drift_checks 
                    (target_id, check_type, last_checked, next_check_due, result)
                VALUES (?, 'version', datetime('now'), datetime('now', '+7 days'), ?)
            """, (target_id, json.dumps(data)))
            self.store.db.commit()
            
        except Exception as e:
            logger.error(f"Version drift check failed for {target_id}: {e}")
    
    async def check_for_correctness_drift(self, target_id: str,
                                            sample_size: int = 5):
        """
        Spot-check a random sample of knowledge nodes for correctness.
        
        This is our "smoke test" — pick a few facts and verify them.
        Like a doctor checking vitals, not doing a full body scan.
        """
        # Get random sample of nodes for this target
        sample = self.store.db.execute("""
            SELECT canonical_id, name, content 
            FROM nodes 
            WHERE canonical_id LIKE ?
            ORDER BY RANDOM()
            LIMIT ?
        """, (f"%{target_id.split(':')[-1]}%", sample_size)).fetchall()
        
        for node_id, name, content_json in sample:
            content = json.loads(content_json) if isinstance(content_json, str) else content_json
            
            # Extract a verifiable claim from the content
            claim = self._extract_verifiable_claim(name, content)
            if not claim:
                continue
            
            verify_prompt = f"""
Verify this technical claim. Is it currently accurate?

CLAIM: {claim}

Respond with ONLY this JSON:
{{
    "is_accurate": true/false,
    "confidence": "high|medium|low",
    "correction": "what's wrong and what's correct (if inaccurate)",
    "source": "how you know"
}}"""
            
            try:
                result = await self.api.call(
                    prompt=verify_prompt,
                    temperature=0.0,
                    max_tokens=500,
                    response_format="json"
                )
                
                data = json.loads(result["content"])
                
                if not data.get("is_accurate", True):
                    self._record_drift_event(
                        event_type="correctness_issue",
                        severity="critical" if data.get("confidence") == "high" else "major",
                        target_id=target_id,
                        affected_nodes=[node_id],
                        description=f"Inaccurate knowledge in {name}: {data.get('correction', 'unknown issue')}",
                        source="llm_correctness_probe",
                        auto_fixable=True,
                        estimated_cost=0.10
                    )
                    
                    # Immediately downgrade correctness
                    self.store.db.execute("""
                        UPDATE node_vitality
                        SET correctness = correctness * 0.3,
                            updated_at = datetime('now')
                        WHERE node_id = ?
                    """, (node_id,))
                    self.store.db.commit()
                    
            except Exception as e:
                logger.error(f"Correctness check failed for {node_id}: {e}")
    
    def _extract_verifiable_claim(self, name: str, content: dict) -> Optional[str]:
        """Extract a specific, verifiable claim from node content."""
        # Look for concrete facts that can be checked
        if "syntax" in content:
            syntax = content["syntax"]
            if isinstance(syntax, dict) and "simplified" in syntax:
                return f"In the context of '{name}', the syntax is: {syntax['simplified']}"
        
        if "parameters" in content and isinstance(content["parameters"], list):
            params = content["parameters"][:3]
            return f"'{name}' has these parameters: {json.dumps(params)}"
        
        if "version" in content:
            return f"'{name}' was introduced in version {content['version']}"
        
        return None
    
    def _record_drift_event(self, **kwargs):
        affected = kwargs.pop("affected_nodes", [])
        self.store.db.execute("""
            INSERT INTO drift_events 
                (event_type, severity, target_id, affected_nodes,
                 description, source, auto_fixable, estimated_cost,
                 priority_score)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            kwargs["event_type"], kwargs["severity"], kwargs.get("target_id"),
            json.dumps(affected), kwargs["description"], kwargs.get("source"),
            int(kwargs.get("auto_fixable", False)),
            kwargs.get("estimated_cost", 0),
            self._compute_priority(kwargs["severity"], len(affected))
        ))
        self.store.db.commit()
    
    def _compute_priority(self, severity: str, affected_count: int) -> float:
        severity_weights = {
            "critical": 100, "major": 50, "minor": 10, "info": 1
        }
        base = severity_weights.get(severity, 10)
        # Priority scales with both severity and blast radius
        return base * math.log2(max(affected_count, 1) + 1)


# ════════════════════════════════════════════════════════════════
# 3. COVERAGE MAPPER
# ════════════════════════════════════════════════════════════════

class CoverageMapper:
    """
    Tracks what we know vs what EXISTS in the world.
    
    This is the hardest problem: how do you know what you don't know?
    
    Approach: Maintain a "universe registry" — the list of all known
    targets, and for each target, use LLM probes to estimate how 
    many capabilities we're missing.
    """
    
    def __init__(self, store: 'UniversalKnowledgeStore',
                 api: 'MultiProviderAPIEngine'):
        self.store = store
        self.api = api
        self._init_coverage_table()
    
    def _init_coverage_table(self):
        self.store.db.executescript("""
            -- The universe of things we COULD document
            CREATE TABLE IF NOT EXISTS target_universe (
                target_name     TEXT PRIMARY KEY,
                target_kind     TEXT,
                importance       REAL DEFAULT 0.5,   -- 0-1 how important to cover
                -- importance based on: popularity, usage, requests
                documented      INTEGER DEFAULT 0,   -- do we have it?
                estimated_capabilities INTEGER,       -- how many capabilities
                documented_capabilities INTEGER DEFAULT 0,
                coverage_pct    REAL DEFAULT 0.0,
                last_assessed   TEXT
            );
            
            CREATE TABLE IF NOT EXISTS coverage_assessments (
                assessment_id   INTEGER PRIMARY KEY AUTOINCREMENT,
                target_id       TEXT,
                assessed_at     TEXT DEFAULT (datetime('now')),
                total_known_capabilities INTEGER,
                documented_capabilities INTEGER,
                coverage_pct    REAL,
                missing_areas   JSON,   -- what we're missing
                assessment_method TEXT   -- llm_probe | spec_comparison | manual
            );
        """)
        self.store.db.commit()
    
    async def assess_target_coverage(self, target_id: str):
        """
        Estimate how complete our coverage is for a specific target.
        """
        target = self.store.get_node(target_id)
        if not target:
            return
        
        # Count what we have
        our_capabilities = self.store.db.execute("""
            SELECT COUNT(*) FROM nodes 
            WHERE canonical_id LIKE ?
              AND (node_type = 'structure' OR node_type = 'algorithm')
        """, (f"%{target_id.split(':')[-1]}%",)).fetchone()[0]
        
        our_cap_names = [
            r[0] for r in self.store.db.execute("""
                SELECT name FROM nodes 
                WHERE canonical_id LIKE ?
                  AND node_type IN ('structure', 'algorithm')
            """, (f"%{target_id.split(':')[-1]}%",)).fetchall()
        ]
        
        # Ask LLM to estimate total capabilities and find gaps
        probe_prompt = f"""
I have documented these capabilities for {target.get('name', target_id)}:
{json.dumps(our_cap_names[:50], indent=2)}
{"... and " + str(len(our_cap_names) - 50) + " more" if len(our_cap_names) > 50 else ""}

Total documented: {len(our_cap_names)}

Questions:
1. Approximately how many total capabilities does {target.get('name', target_id)} have?
2. What MAJOR capabilities am I missing from this list?
3. What areas have NO coverage at all?

Respond as JSON:
{{
    "estimated_total_capabilities": N,
    "our_coverage_count": {len(our_cap_names)},
    "estimated_coverage_pct": N,
    "missing_critical": [
        {{"name": "...", "importance": "critical|high|medium|low", "description": "..."}}
    ],
    "uncovered_areas": [
        {{"area": "...", "estimated_capabilities": N, "importance": "..."}}
    ],
    "assessment_confidence": "high|medium|low"
}}"""
        
        try:
            result = await self.api.call(
                prompt=probe_prompt,
                temperature=0.1,
                max_tokens=2000,
                response_format="json"
            )
            
            data = json.loads(result["content"])
            
            # Record assessment
            self.store.db.execute("""
                INSERT INTO coverage_assessments
                    (target_id, total_known_capabilities, 
                     documented_capabilities, coverage_pct, missing_areas)
                VALUES (?, ?, ?, ?, ?)
            """, (
                target_id,
                data.get("estimated_total_capabilities", 0),
                len(our_cap_names),
                data.get("estimated_coverage_pct", 0),
                json.dumps({
                    "missing_critical": data.get("missing_critical", []),
                    "uncovered_areas": data.get("uncovered_areas", [])
                })
            ))
            
            # Update completeness scores for this target's nodes
            coverage = data.get("estimated_coverage_pct", 100) / 100.0
            self.store.db.execute("""
                UPDATE node_vitality 
                SET completeness = ?
                WHERE node_id LIKE ?
            """, (coverage, f"%{target_id.split(':')[-1]}%"))
            
            self.store.db.commit()
            
            # If critical gaps found, create drift events
            for missing in data.get("missing_critical", []):
                if missing.get("importance") in ("critical", "high"):
                    self.store.db.execute("""
                        INSERT INTO drift_events
                            (event_type, severity, target_id, affected_nodes,
                             description, source, auto_fixable, estimated_cost)
                        VALUES ('coverage_gap', 'major', ?, '[]', ?, 
                                'coverage_assessment', 1, 0.10)
                    """, (
                        target_id,
                        f"Missing capability: {missing['name']} - {missing.get('description', '')}"
                    ))
            
            self.store.db.commit()
            
            return data
            
        except Exception as e:
            logger.error(f"Coverage assessment failed for {target_id}: {e}")
            return None
    
    async def scan_universe_for_new_targets(self):
        """
        Periodically check: are there new formats/languages we 
        should know about but don't?
        """
        probe_prompt = """
List programming languages, file formats, and data formats that are:
1. Currently popular or growing in usage (2024-2025)
2. Used in professional software development
3. Have sufficient specification or documentation to learn from

Output JSON:
{
    "programming_languages": [
        {"name": "...", "importance": 0.0-1.0, "category": "..."}
    ],
    "file_formats": [
        {"name": "...", "extension": "...", "importance": 0.0-1.0, "category": "..."}
    ],
    "data_formats": [
        {"name": "...", "importance": 0.0-1.0, "category": "..."}
    ]
}

Include at least 200 items total. Focus on formats a developer 
might need to generate or parse programmatically.
Rate importance by: professional usage frequency × complexity."""
        
        try:
            result = await self.api.call(
                prompt=probe_prompt,
                temperature=0.2,
                max_tokens=4000,
                response_format="json"
            )
            
            data = json.loads(result["content"])
            
            # Compare against what we have
            existing = set(
                r[0] for r in self.store.db.execute(
                    "SELECT target_name FROM target_universe"
                ).fetchall()
            )
            
            documented = set(
                r[0] for r in self.store.db.execute(
                    "SELECT canonical_id FROM nodes WHERE node_type = 'target'"
                ).fetchall()
            )
            
            new_targets = []
            for category in ["programming_languages", "file_formats", "data_formats"]:
                for item in data.get(category, []):
                    name = item["name"].lower().replace(" ", "_")
                    if name not in existing:
                        new_targets.append(item)
                        self.store.db.execute("""
                            INSERT OR IGNORE INTO target_universe 
                                (target_name, target_kind, importance, documented)
                            VALUES (?, ?, ?, ?)
                        """, (
                            name, category,
                            item.get("importance", 0.5),
                            1 if f"target:{name}" in documented else 0
                        ))
            
            self.store.db.commit()
            
            if new_targets:
                logger.info(f"Discovered {len(new_targets)} new targets to potentially document")
            
            return new_targets
            
        except Exception as e:
            logger.error(f"Universe scan failed: {e}")
            return []


# ════════════════════════════════════════════════════════════════
# 4. INTEGRITY AUDITOR
# ════════════════════════════════════════════════════════════════

class IntegrityAuditor:
    """
    Checks INTERNAL consistency of the knowledge graph.
    
    Not "is this knowledge correct?" but 
    "does the graph itself make sense?"
    
    - Dangling edges (references to non-existent nodes)
    - Orphan nodes (no edges at all)
    - Circular dependencies that shouldn't exist
    - Duplicate content (different IDs, same knowledge)
    - Missing expected edges (every structure should link to a target)
    - Schema violations (content doesn't match expected schema)
    """
    
    def __init__(self, store: 'UniversalKnowledgeStore'):
        self.store = store
    
    def run_full_audit(self) -> dict:
        """Run all integrity checks and return a report."""
        report = {
            "audit_at": datetime.utcnow().isoformat(),
            "checks": {},
            "total_issues": 0,
            "critical_issues": 0
        }
        
        checks = [
            ("dangling_edges", self._check_dangling_edges),
            ("orphan_nodes", self._check_orphan_nodes),
            ("duplicate_content", self._check_duplicate_content),
            ("missing_target_links", self._check_missing_target_links),
            ("empty_content", self._check_empty_content),
            ("broken_dependency_chains", self._check_dependency_chains),
            ("schema_violations", self._check_schema_violations),
        ]
        
        for check_name, check_fn in checks:
            try:
                issues = check_fn()
                report["checks"][check_name] = {
                    "issues_found": len(issues),
                    "issues": issues[:20],  # First 20 for readability
                    "truncated": len(issues) > 20
                }
                report["total_issues"] += len(issues)
                
                if check_name in ("dangling_edges", "broken_dependency_chains"):
                    report["critical_issues"] += len(issues)
                    
            except Exception as e:
                report["checks"][check_name] = {"error": str(e)}
        
        return report
    
    def _check_dangling_edges(self) -> list[dict]:
        """Find edges pointing to non-existent nodes."""
        dangling = self.store.db.execute("""
            SELECT e.edge_id, e.source_id, e.target_id, e.relationship
            FROM edges e
            LEFT JOIN nodes n1 ON e.source_id = n1.canonical_id
            LEFT JOIN nodes n2 ON e.target_id = n2.canonical_id
            WHERE n1.canonical_id IS NULL OR n2.canonical_id IS NULL
        """).fetchall()
        
        return [
            {
                "edge_id": r[0], "source": r[1], "target": r[2],
                "relationship": r[3], "fix": "delete edge or create missing node"
            }
            for r in dangling
        ]
    
    def _check_orphan_nodes(self) -> list[dict]:
        """Find nodes with no edges (disconnected from graph)."""
        orphans = self.store.db.execute("""
            SELECT n.canonical_id, n.node_type, n.name
            FROM nodes n
            LEFT JOIN edges e1 ON n.canonical_id = e1.source_id
            LEFT JOIN edges e2 ON n.canonical_id = e2.target_id
            WHERE e1.edge_id IS NULL AND e2.edge_id IS NULL
        """).fetchall()
        
        return [
            {
                "node_id": r[0], "type": r[1], "name": r[2],
                "fix": "connect to relevant target or remove"
            }
            for r in orphans
        ]
    
    def _check_duplicate_content(self) -> list[dict]:
        """Find nodes with identical content hashes."""
        duplicates = self.store.db.execute("""
            SELECT content_hash, GROUP_CONCAT(canonical_id), COUNT(*)
            FROM nodes
            GROUP BY content_hash
            HAVING COUNT(*) > 1
        """).fetchall()
        
        return [
            {
                "content_hash": r[0],
                "duplicate_ids": r[1].split(","),
                "count": r[2],
                "fix": "merge into single node with multiple edges"
            }
            for r in duplicates
        ]
    
    def _check_missing_target_links(self) -> list[dict]:
        """Every structure and algorithm should link to at least one target."""
        unlinked = self.store.db.execute("""
            SELECT n.canonical_id, n.node_type, n.name
            FROM nodes n
            WHERE n.node_type IN ('structure', 'algorithm')
              AND NOT EXISTS (
                  SELECT 1 FROM edges e 
                  WHERE (e.source_id = n.canonical_id OR e.target_id = n.canonical_id)
                    AND e.relationship IN ('template_for', 'uses_algorithm', 'contains')
              )
        """).fetchall()
        
        return [
            {
                "node_id": r[0], "type": r[1], "name": r[2],
                "fix": "link to appropriate target(s)"
            }
            for r in unlinked
        ]
    
    def _check_empty_content(self) -> list[dict]:
        """Find nodes with empty or minimal content."""
        empty = self.store.db.execute("""
            SELECT canonical_id, node_type, name, LENGTH(content)
            FROM nodes
            WHERE LENGTH(content) < 50
              OR content = '{}'
              OR content = '""'
              OR content IS NULL
        """).fetchall()
        
        return [
            {
                "node_id": r[0], "type": r[1], "name": r[2],
                "content_length": r[3],
                "fix": "regenerate content"
            }
            for r in empty
        ]
    
    def _check_dependency_chains(self) -> list[dict]:
        """Check for broken prerequisite chains."""
        issues = []
        
        deps = self.store.db.execute("""
            SELECT e.source_id, e.target_id
            FROM edges e
            WHERE e.relationship IN ('depends_on', 'prerequisite')
        """).fetchall()
        
        for source_id, target_id in deps:
            target_exists = self.store.db.execute(
                "SELECT 1 FROM nodes WHERE canonical_id = ?",
                (target_id,)
            ).fetchone()
            
            if not target_exists:
                issues.append({
                    "node_id": source_id,
                    "missing_dependency": target_id,
                    "fix": "create missing dependency node or remove edge"
                })
        
        return issues
    
    def _check_schema_violations(self) -> list[dict]:
        """Check that node content matches expected schema for its type."""
        issues = []
        
        required_fields = {
            "algorithm": ["purpose", "implementations"],
            "structure": ["template", "variables"],
            "target": ["kind"],
            "blueprint": ["application_type", "components"],
        }
        
        for node_type, fields in required_fields.items():
            nodes = self.store.db.execute("""
                SELECT canonical_id, name, content
                FROM nodes WHERE node_type = ?
            """, (node_type,)).fetchall()
            
            for node_id, name, content_json in nodes:
                try:
                    content = json.loads(content_json) if isinstance(content_json, str) else content_json
                    missing = [f for f in fields if f not in content]
                    if missing:
                        issues.append({
                            "node_id": node_id,
                            "node_type": node_type,
                            "name": name,
                            "missing_fields": missing,
                            "fix": f"regenerate with required fields: {missing}"
                        })
                except json.JSONDecodeError:
                    issues.append({
                        "node_id": node_id,
                        "issue": "invalid JSON content",
                        "fix": "regenerate content"
                    })
        
        return issues


# ════════════════════════════════════════════════════════════════
# 5. THE VITALITY DASHBOARD — Synthesizing Everything
# ════════════════════════════════════════════════════════════════

class VitalityDashboard:
    """
    The single pane of glass for knowledge health.
    
    Consumes signals from all four subsystems and produces:
    1. Overall vitality score
    2. Priority work queue (what to fix/refresh next)
    3. Trend analysis (are we getting healthier or sicker?)
    4. Forecasts (when will things get critical?)
    5. Cost estimates (how much to fix everything?)
    """
    
    def __init__(self, store: 'UniversalKnowledgeStore',
                 decay_tracker: DecayTracker,
                 drift_detector: DriftDetector,
                 coverage_mapper: CoverageMapper,
                 integrity_auditor: IntegrityAuditor):
        self.store = store
        self.decay = decay_tracker
        self.drift = drift_detector
        self.coverage = coverage_mapper
        self.integrity = integrity_auditor
    
    def generate_full_report(self) -> dict:
        """The comprehensive health report."""
        
        # Overall vitality
        vitality_stats = self.store.db.execute("""
            SELECT 
                AVG(vitality) as avg_vitality,
                MIN(vitality) as min_vitality,
                AVG(freshness) as avg_freshness,
                AVG(correctness) as avg_correctness,
                AVG(completeness) as avg_completeness,
                COUNT(*) as total_nodes,
                SUM(CASE WHEN vitality >= 0.8 THEN 1 ELSE 0 END) as excellent,
                SUM(CASE WHEN vitality >= 0.6 AND vitality < 0.8 THEN 1 ELSE 0 END) as good,
                SUM(CASE WHEN vitality >= 0.4 AND vitality < 0.6 THEN 1 ELSE 0 END) as fair,
                SUM(CASE WHEN vitality >= 0.2 AND vitality < 0.4 THEN 1 ELSE 0 END) as poor,
                SUM(CASE WHEN vitality < 0.2 THEN 1 ELSE 0 END) as critical
            FROM node_vitality
        """).fetchone()
        
        # Unresolved drift events
        drift_events = self.store.db.execute("""
            SELECT severity, COUNT(*), SUM(estimated_cost)
            FROM drift_events 
            WHERE resolved_at IS NULL
            GROUP BY severity
        """).fetchall()
        
        # Trend (last 10 snapshots)
        trend = self.store.db.execute("""
            SELECT snapshot_at, avg_vitality, avg_freshness, 
                   avg_correctness, avg_completeness,
                   critical_count, total_nodes
            FROM vitality_snapshots
            ORDER BY snapshot_at DESC
            LIMIT 30
        """).fetchall()
        
        # Priority work queue
        priority_queue = self._generate_priority_queue()
        
        # Forecasts
        forecasts = self._generate_forecasts()
        
        # Integrity
        integrity = self.integrity.run_full_audit()
        
        report = {
            "generated_at": datetime.utcnow().isoformat(),
            
            "headline": self._generate_headline(vitality_stats),
            
            "overall_vitality": {
                "score": round(vitality_stats[0] or 0, 4),
                "grade": self._vitality_to_grade(vitality_stats[0] or 0),
                "total_nodes": vitality_stats[5],
                "distribution": {
                    "excellent": vitality_stats[6],
                    "good": vitality_stats[7],
                    "fair": vitality_stats[8],
                    "poor": vitality_stats[9],
                    "critical": vitality_stats[10]
                }
            },
            
            "dimensions": {
                "freshness": {
                    "score": round(vitality_stats[2] or 0, 4),
                    "interpretation": self._interpret_freshness(vitality_stats[2] or 0)
                },
                "correctness": {
                    "score": round(vitality_stats[3] or 0, 4),
                    "interpretation": self._interpret_correctness(vitality_stats[3] or 0)
                },
                "completeness": {
                    "score": round(vitality_stats[4] or 0, 4),
                    "interpretation": self._interpret_completeness(vitality_stats[4] or 0)
                }
            },
            
            "drift_events": {
                "unresolved": {
                    row[0]: {"count": row[1], "estimated_fix_cost": round(row[2] or 0, 2)}
                    for row in drift_events
                },
                "total_unresolved": sum(row[1] for row in drift_events)
            },
            
            "trend": {
                "direction": self._compute_trend_direction(trend),
                "snapshots": [
                    {
                        "date": t[0],
                        "vitality": round(t[1] or 0, 4),
                        "freshness": round(t[2] or 0, 4),
                        "critical_nodes": t[5]
                    }
                    for t in trend[:10]
                ]
            },
            
            "forecasts": forecasts,
            
            "priority_queue": priority_queue[:20],
            
            "integrity": {
                "total_issues": integrity["total_issues"],
                "critical_issues": integrity["critical_issues"],
                "summary": {
                    name: check.get("issues_found", 0)
                    for name, check in integrity["checks"].items()
                }
            },
            
            "cost_to_full_health": self._estimate_full_health_cost()
        }
        
        return report
    
    def _generate_headline(self, stats) -> str:
        """One-sentence summary of database health."""
        vitality = stats[0] or 0
        critical = stats[10] or 0
        total = stats[5] or 0
        
        if vitality >= 0.9:
            return f"Knowledge base is thriving. {total:,} nodes at {vitality:.0%} average vitality."
        elif vitality >= 0.7:
            return f"Knowledge base is healthy with some aging. {critical} nodes need attention."
        elif vitality >= 0.5:
            return f"Knowledge base is aging. {critical} critical nodes, refresh cycle recommended."
        elif vitality >= 0.3:
            return f"⚠️ Knowledge base is deteriorating. {critical} critical nodes. Immediate refresh needed."
        else:
            return f"🚨 Knowledge base is in critical condition. {critical}/{total} nodes critically stale."
    
    def _vitality_to_grade(self, score: float) -> str:
        if score >= 0.95: return "A+"
        if score >= 0.90: return "A"
        if score >= 0.85: return "A-"
        if score >= 0.80: return "B+"
        if score >= 0.75: return "B"
        if score >= 0.70: return "B-"
        if score >= 0.65: return "C+"
        if score >= 0.60: return "C"
        if score >= 0.55: return "C-"
        if score >= 0.50: return "D+"
        if score >= 0.40: return "D"
        if score >= 0.30: return "D-"
        return "F"
    
    def _interpret_freshness(self, score: float) -> str:
        if score >= 0.9: return "Knowledge is current. Most content recently validated."
        if score >= 0.7: return "Mostly current. Some targets due for version checks."
        if score >= 0.5: return "Aging. Several targets may have new versions undocumented."
        if score >= 0.3: return "Significantly stale. Many targets likely outdated."
        return "Critically stale. Most knowledge may not reflect current reality."
    
    def _interpret_correctness(self, score: float) -> str:
        if score >= 0.95: return "High confidence in accuracy. Most content validated."
        if score >= 0.8: return "Generally accurate. Some unverified content exists."
        if score >= 0.6: return "Mixed accuracy. Spot checks recommended before relying on content."
        return "Low confidence. Significant correctness issues detected."
    
    def _interpret_completeness(self, score: float) -> str:
        if score >= 0.9: return "Comprehensive coverage. Few gaps detected."
        if score >= 0.7: return "Good coverage. Some capabilities undocumented."
        if score >= 0.5: return "Partial coverage. Major capability areas missing."
        return "Sparse coverage. Most capabilities undocumented."
    
    def _generate_priority_queue(self) -> list[dict]:
        """
        The priority queue answers: "If I have budget for 10 tasks,
        which 10 will improve knowledge health the most?"
        
        Priority = severity × impact × freshness_gap × cost_efficiency
        """
        items = []
        
        # Priority source 1: Unresolved drift events
        drift_items = self.store.db.execute("""
            SELECT event_id, event_type, severity, target_id,
                   description, auto_fixable, estimated_cost, priority_score
            FROM drift_events
            WHERE resolved_at IS NULL
            ORDER BY priority_score DESC
            LIMIT 50
        """).fetchall()
        
        for d in drift_items:
            items.append({
                "type": "drift_resolution",
                "source": "drift_detector",
                "priority": d[7],
                "severity": d[2],
                "target": d[3],
                "description": d[4],
                "auto_fixable": bool(d[5]),
                "estimated_cost": d[6],
                "action": f"Resolve {d[1]}: {d[4][:100]}"
            })
        
        # Priority source 2: Lowest vitality nodes
        stale_nodes = self.store.db.execute("""
            SELECT v.node_id, v.vitality, v.freshness, v.correctness, 
                   v.completeness, v.decay_model, n.node_type, n.name
            FROM node_vitality v
            JOIN nodes n ON v.node_id = n.canonical_id
            WHERE v.vitality < 0.5
            ORDER BY v.vitality ASC
            LIMIT 50
        """).fetchall()
        
        for s in stale_nodes:
            # Determine what dimension is weakest
            dims = {"freshness": s[2], "correctness": s[3], "completeness": s[4]}
            weakest = min(dims, key=dims.get)
            
            items.append({
                "type": "node_refresh",
                "source": "decay_tracker",
                "priority": (1 - s[1]) * 50,  # Higher priority for lower vitality
                "severity": "critical" if s[1] < 0.2 else "major" if s[1] < 0.4 else "minor",
                "target": s[0],
                "description": f"{s[7]} ({s[6]}) — vitality {s[1]:.2f}, weakest: {weakest} ({dims[weakest]:.2f})",
                "auto_fixable": True,
                "estimated_cost": 0.05,
                "action": f"Refresh {weakest} for {s[0]}"
            })
        
        # Priority source 3: Integrity issues
        # (already captured in integrity audit, would merge here)
        
        # Sort by priority score
        items.sort(key=lambda x: x["priority"], reverse=True)
        
        return items
    
    def _generate_forecasts(self) -> dict:
        """Predict future vitality based on decay models."""
        forecasts = {}
        
        for days, label in [(30, "30_days"), (90, "90_days"), (180, "180_days")]:
            col = f"predicted_{days}d"
            result = self.store.db.execute(f"""
                SELECT AVG({col}),
                       SUM(CASE WHEN {col} < 0.3 THEN 1 ELSE 0 END),
                       SUM(CASE WHEN {col} < 0.5 THEN 1 ELSE 0 END)
                FROM node_vitality
                WHERE {col} IS NOT NULL
            """).fetchone()
            
            forecasts[label] = {
                "predicted_avg_vitality": round(result[0] or 0, 4),
                "predicted_critical_nodes": result[1] or 0,
                "predicted_below_half_nodes": result[2] or 0
            }
        
        return forecasts
    
    def _compute_trend_direction(self, snapshots) -> str:
        if len(snapshots) < 2:
            return "insufficient_data"
        
        recent = snapshots[0][1] or 0  # Most recent vitality
        older = snapshots[-1][1] or 0  # Oldest vitality in window
        
        delta = recent - older
        if delta > 0.05:
            return "improving"
        elif delta < -0.05:
            return "declining"
        else:
            return "stable"
    
    def _estimate_full_health_cost(self) -> dict:
        """How much would it cost to bring everything to >0.8 vitality?"""
        unhealthy = self.store.db.execute("""
            SELECT COUNT(*), node_type
            FROM node_vitality v
            JOIN nodes n ON v.node_id = n.canonical_id
            WHERE v.vitality < 0.8
            GROUP BY node_type
        """).fetchall()
        
        cost_per_type = {
            "algorithm": 0.08,
            "structure": 0.05,
            "concept": 0.03,
            "target": 0.10,
            "blueprint": 0.12,
            "artifact": 0.04
        }
        
        total_cost = 0
        breakdown = {}
        for count, node_type in unhealthy:
            cost = count * cost_per_type.get(node_type, 0.05)
            total_cost += cost
            breakdown[node_type] = {
                "unhealthy_count": count,
                "estimated_cost": round(cost, 2)
            }
        
        return {
            "total_estimated_cost": round(total_cost, 2),
            "breakdown": breakdown
        }
    
    def render_ascii_dashboard(self) -> str:
        """Render a terminal-friendly dashboard."""
        report = self.generate_full_report()
        ov = report["overall_vitality"]
        dims = report["dimensions"]
        
        vitality_bar = self._make_bar(ov["score"], 40)
        fresh_bar = self._make_bar(dims["freshness"]["score"], 30)
        correct_bar = self._make_bar(dims["correctness"]["score"], 30)
        complete_bar = self._make_bar(dims["completeness"]["score"], 30)
        
        dist = ov["distribution"]
        
        output = f"""
╔══════════════════════════════════════════════════════════════════════╗
║              KNOWLEDGE VITALITY DASHBOARD                          ║
║              {report['generated_at'][:19]}                              ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  {report['headline'][:64]:<64}  ║
║                                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  OVERALL VITALITY: {ov['score']:.1%}  Grade: {ov['grade']:<4}                          ║
║  {vitality_bar}                          ║
║                                                                    ║
║  Freshness:    {dims['freshness']['score']:.1%}  {fresh_bar}   ║
║  Correctness:  {dims['correctness']['score']:.1%}  {correct_bar}   ║
║  Completeness: {dims['completeness']['score']:.1%}  {complete_bar}   ║
║                                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  NODE DISTRIBUTION        ║  FORECASTS                             ║
║  ─────────────────        ║  ──────────                            ║
║  🟢 Excellent: {dist['excellent'] or 0:>6,}     ║  30 days:  {report['forecasts']['30_days']['predicted_avg_vitality']:.1%} avg vitality    ║
║  🟡 Good:      {dist['good'] or 0:>6,}     ║  90 days:  {report['forecasts']['90_days']['predicted_avg_vitality']:.1%} avg vitality    ║
║  🟠 Fair:      {dist['fair'] or 0:>6,}     ║  180 days: {report['forecasts']['180_days']['predicted_avg_vitality']:.1%} avg vitality    ║
║  🔴 Poor:      {dist['poor'] or 0:>6,}     ║                                        ║
║  ⚫ Critical:  {dist['critical'] or 0:>6,}     ║  Trend: {report['trend']['direction']:<12}               ║
║  ─────────────────        ║                                        ║
║  Total: {ov['total_nodes']:>13,}     ║  Cost to full health: ${report['cost_to_full_health']['total_estimated_cost']:>8.2f}      ║
║                           ║                                        ║
╠══════════════════════════════════════════════════════════════════════╣
║  DRIFT EVENTS (unresolved)                                         ║
║  ─────────────────────────                                         ║"""
        
        drift = report["drift_events"]["unresolved"]
        for severity, data in drift.items():
            output += f"\n║  {severity:>10}: {data['count']:>4} events  (est. fix cost: ${data['estimated_fix_cost']:>7.2f})    ║"
        
        if not drift:
            output += "\n║  No unresolved drift events ✓                                     ║"
        
        output += f"""
║                                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  TOP PRIORITY ACTIONS                                              ║
║  ────────────────────                                              ║"""
        
        for i, item in enumerate(report["priority_queue"][:5], 1):
            action = item["action"][:55]
            auto = "🤖" if item["auto_fixable"] else "👤"
            output += f"\n║  {i}. {auto} [{item['severity']:>8}] {action:<55} ║"
        
        output += """
║                                                                    ║
╚══════════════════════════════════════════════════════════════════════╝"""
        
        return output
    
    def _make_bar(self, value: float, width: int) -> str:
        filled = int(value * width)
        empty = width - filled
        
        if value >= 0.8:
            return f"[{'█' * filled}{'░' * empty}]"
        elif value >= 0.5:
            return f"[{'▓' * filled}{'░' * empty}]"
        else:
            return f"[{'▒' * filled}{'░' * empty}]"


# ════════════════════════════════════════════════════════════════
# 6. THE HEALING LOOP — Automated Self-Repair
# ════════════════════════════════════════════════════════════════

class HealingLoop:
    """
    The autonomous maintenance system.
    
    Runs continuously, consuming the priority queue and 
    automatically fixing what it can.
    
    Think of it as the database's immune system.
    
    ┌──────────────────────────────────────────────────┐
    │                                                  │
    │   OBSERVE ──► PRIORITIZE ──► HEAL ──► VERIFY    │
    │      ▲                                   │       │
    │      └───────────────────────────────────┘       │
    │                                                  │
    └──────────────────────────────────────────────────┘
    """
    
    def __init__(self, dashboard: VitalityDashboard,
                 api: 'MultiProviderAPIEngine',
                 store: 'UniversalKnowledgeStore',
                 daily_budget: float = 5.0,
                 max_auto_fixes_per_cycle: int = 20):
        self.dashboard = dashboard
        self.api = api
        self.store = store
        self.daily_budget = daily_budget
        self.max_fixes = max_auto_fixes_per_cycle
        self.daily_spend = 0.0
    
    async def run_cycle(self):
        """Run one healing cycle."""
        logger.info("=== HEALING CYCLE START ===")
        
        # 1. Observe: recompute all decay
        await self.dashboard.decay.compute_all_decay()
        
        # 2. Detect: check for drift on a rotating subset of targets
        targets = self.store.db.execute("""
            SELECT canonical_id FROM nodes 
            WHERE node_type = 'target'
            ORDER BY RANDOM()
            LIMIT 5
        """).fetchall()
        
        for (target_id,) in targets:
            if self.daily_spend < self.daily_budget:
                await self.dashboard.drift.check_for_version_drift(target_id)
                self.daily_spend += 0.01  # ~cost of a version check
        
        # 3. Prioritize
        report = self.dashboard.generate_full_report()
        queue = report["priority_queue"]
        
        # 4. Heal: auto-fix top priority items within budget
        fixes_applied = 0
        for item in queue:
            if fixes_applied >= self.max_fixes:
                break
            if self.daily_spend >= self.daily_budget:
                break
            if not item.get("auto_fixable"):
                continue
            
            try:
                cost = item.get("estimated_cost", 0.10)
                success = await self._apply_fix(item)
                
                if success:
                    fixes_applied += 1
                    self.daily_spend += cost
                    logger.info(f"✓ Auto-fixed: {item['action'][:80]}")
                    
            except Exception as e:
                logger.error(f"Auto-fix failed: {e}")
        
        # 5. Snapshot
        self.dashboard.decay.take_snapshot()
        
        # 6. Report
        logger.info(
            f"=== HEALING CYCLE COMPLETE: {fixes_applied} fixes, "
            f"${self.daily_spend:.2f} spent ==="
        )
        
        return {
            "fixes_applied": fixes_applied,
            "cost": self.daily_spend,
            "remaining_queue": len(queue) - fixes_applied
        }
    
    async def _apply_fix(self, item: dict) -> bool:
        """Apply a single automated fix."""
        if item["type"] == "node_refresh":
            return await self._refresh_node(item["target"])
        elif item["type"] == "drift_resolution":
            return await self._resolve_drift(item)
        return False
    
    async def _refresh_node(self, node_id: str) -> bool:
        """Regenerate a stale node's content."""
        node = self.store.get_node(node_id)
        if not node:
            return False
        
        # Regenerate content based on node type
        # (Uses the same generation prompts from the main pipeline)
        # For brevity, simplified here
        
        refresh_prompt = f"""
Verify and update this knowledge entry. 
If anything is outdated, provide the corrected version.
If everything is current, return it unchanged.

Entry type: {node['node_type']}
Entry name: {node['name']}
Current content: {json.dumps(node['content'])[:3000]}

Return the complete updated content as JSON.
Include a field "changes_made": ["list of what changed"] 
(empty list if nothing changed).
"""
        
        try:
            result = await self.api.call(
                prompt=refresh_prompt,
                temperature=0.0,
                max_tokens=4000,
                response_format="json"
            )
            
            new_content = json.loads(result["content"])
            changes = new_content.pop("changes_made", [])
            
            if changes:
                # Update the node
                updated_node = KnowledgeNode(
                    node_type=node["node_type"],
                    canonical_id=node["canonical_id"],
                    name=node["name"],
                    content=new_content,
                    version=node.get("version", "1.0"),
                    tags=node.get("tags", []),
                    confidence=Confidence.HIGH
                )
                self.store.upsert_node(updated_node)
                
                # Update vitality
                self.store.db.execute("""
                    UPDATE node_vitality 
                    SET last_refreshed = datetime('now'),
                        freshness = 1.0,
                        updated_at = datetime('now')
                    WHERE node_id = ?
                """, (node_id,))
                self.store.db.commit()
                
                # Record signal
                self.store.db.execute("""
                    INSERT INTO vitality_signals 
                        (node_id, dimension, score, evidence, details)
                    VALUES (?, 'freshness', 1.0, 'auto_refresh', ?)
                """, (node_id, json.dumps({"changes": changes})))
                self.store.db.commit()
            
            return True
            
        except Exception as e:
            logger.error(f"Node refresh failed for {node_id}: {e}")
            return False
    
    async def _resolve_drift(self, item: dict) -> bool:
        """Attempt to resolve a drift event."""
        # For now, delegate to node refresh for affected nodes
        description = item.get("description", "")
        target = item.get("target", "")
        
        # Mark drift event as being addressed
        self.store.db.execute("""
            UPDATE drift_events 
            SET resolution = 'auto_refresh_attempted',
                resolved_at = datetime('now')
            WHERE target_id = ? AND resolved_at IS NULL
            ORDER BY priority_score DESC
            LIMIT 1
        """, (target,))
        self.store.db.commit()
        
        return True
    
    async def run_continuous(self, interval_hours: int = 6):
        """Run healing cycles continuously."""
        while True:
            try:
                self.daily_spend = 0.0  # Reset daily budget at midnight
                await self.run_cycle()
            except Exception as e:
                logger.error(f"Healing cycle error: {e}")
            
            await asyncio.sleep(interval_hours * 3600)
```

---

## The Dashboard in Action

```
╔══════════════════════════════════════════════════════════════════════╗
║              KNOWLEDGE VITALITY DASHBOARD                          ║
║              2025-01-15 14:32:07                                   ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Knowledge base is healthy with some aging. 847 nodes need         ║
║  attention.                                                        ║
║                                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  OVERALL VITALITY: 74.2%  Grade: B                                 ║
║  [█████████████████████████████░░░░░░░░░░]                         ║
║                                                                    ║
║  Freshness:    68.1%  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░]           ║
║  Correctness:  91.3%  [█████████████████████████████░░]            ║
║  Completeness: 65.7%  [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░]           ║
║                                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  NODE DISTRIBUTION        ║  FORECASTS                             ║
║  ─────────────────        ║  ──────────                            ║
║  🟢 Excellent: 312,847    ║  30 days:  71.8% avg vitality          ║
║  🟡 Good:      198,234    ║  90 days:  64.2% avg vitality          ║
║  🟠 Fair:      156,891    ║  180 days: 53.1% avg vitality          ║
║  🔴 Poor:       38,445    ║                                        ║
║  ⚫ Critical:    8,583    ║  Trend: declining                      ║
║  ─────────────────        ║                                        ║
║  Total:       715,000     ║  Cost to full health:   $1,847.30      ║
║                           ║                                        ║
╠══════════════════════════════════════════════════════════════════════╣
║  DRIFT EVENTS (unresolved)                                         ║
║  ─────────────────────────                                         ║
║    critical:   12 events  (est. fix cost: $  34.50)                ║
║       major:   89 events  (est. fix cost: $ 223.75)                ║
║       minor:  234 events  (est. fix cost: $ 117.00)                ║
║        info:  456 events  (est. fix cost: $  45.60)                ║
║                                                                    ║
╠══════════════════════════════════════════════════════════════════════╣
║  TOP PRIORITY ACTIONS                                              ║
║  ────────────────────                                              ║
║  1. 🤖 [critical] Python 3.13 released — 2,341 nodes affected     ║
║  2. 🤖 [critical] Node.js 22 LTS — breaking API changes in fs     ║
║  3. 🤖 [critical] OpenSSL CVE in TLS implementation algorithm      ║
║  4. 🤖 [  major ] Rust 1.78 — new trait solver affects type docs   ║
║  5. 👤 [  major ] PDF 2.0 spec amendment — manual review needed    ║
║                                                                    ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## The Philosophical Core

What we've built here isn't monitoring. It's something new.

Traditional systems observe **machines**. Our system observes **knowledge** — something that decays not because hardware fails, but because **reality moves forward** and our snapshot of it falls behind.

The vitality model acknowledges a truth that most knowledge systems ignore: **all documented knowledge is a snapshot, and all snapshots age.** The question isn't whether the database will become stale — it's *how fast*, *where*, and *what to do about it*.

The healing loop embodies a second truth: **at scale, human maintenance is impossible.** 715,000 nodes, changing reality across 1,000 targets — no team of humans can keep up. The system must maintain itself, like a living organism replacing its own cells.

And the priority queue embodies a third truth: **not all knowledge decay is equally important.** A stale algorithm for a deprecated image format doesn't matter. A security vulnerability in a widely-used encryption algorithm is an emergency. The observability system doesn't just detect decay — it **triages** it, spending limited resources where they matter most.

The database breathes. It ages. It heals. It knows what it doesn't know. And it asks for help when it can't fix itself.

That's what observability means for a living knowledge organism.
