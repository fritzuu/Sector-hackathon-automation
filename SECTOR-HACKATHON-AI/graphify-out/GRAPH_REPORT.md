# Graph Report - SECTOR-HACKATHON-AI  (2026-09-12)

## Corpus Check
- Corpus is ~7,190 words - fits in a single context window. You may not need a graph.

## Summary
- 24 nodes · 21 edges · 6 communities (5 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 12,000 input · 2,500 output

## Community Hubs (Navigation)
- SIBA Agent Workflow & Quality Gates
- Deterministic Core & Replay Engine
- Watchtower Product & Telegram Delivery
- Sectors API & Budget Guardrail
- Case Timeline & Persistence Lifecycle
- Frontend Stack & UI Design Standards

## God Nodes (most connected - your core abstractions)
1. `Watchtower IDX Monitor` - 5 edges
2. `Deterministic Rule Engine` - 3 edges
3. `Case Timeline System` - 3 edges
4. `Sectors API Integration` - 3 edges
5. `Pure TypeScript Core Architecture` - 3 edges
6. `Telegram Notification Channel` - 2 edges
7. `Structured Correlation Logging` - 2 edges
8. `Verifiable Test Evidence Gate` - 2 edges
9. `SIBA Core Rules` - 2 edges
10. `Backlog Phased Slices` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Pure TypeScript Core Architecture` --implements--> `Deterministic Rule Engine`  [EXTRACTED]
  DECISIONS.md → PRD.md
- `Deduplication & Idempotency` --conceptually_related_to--> `Deterministic Rule Engine`  [EXTRACTED]
  references/domain.md → PRD.md
- `Supabase Postgres & Cron` --shares_data_with--> `Case Timeline System`  [EXTRACTED]
  DECISIONS.md → PRD.md
- `Case Lifecycle State Machine` --implements--> `Case Timeline System`  [EXTRACTED]
  references/domain.md → PRD.md
- `1000 API Credits Budget Guardrail` --rationale_for--> `Sectors API Integration`  [EXTRACTED]
  DECISIONS.md → PRD.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Deterministic Follow-up Pipeline** — prd_watchtower_idx_monitor, prd_deterministic_engine, references_domain_case_lifecycle, references_domain_idempotency_dedup, prd_case_timeline [EXTRACTED 0.95]
- **SIBA Agent Customization System** — rules_siba_core, skills_siba_build, skills_siba_data, skills_siba_debug, skills_siba_review [EXTRACTED 0.95]
- **Quality and Acceptance Gates** — references_quality_security_acceptance, references_quality_structured_logging, references_quality_ui_guidelines, references_quality_test_evidence [EXTRACTED 0.95]

## Communities (6 total, 1 thin omitted)

### Community 0 - "SIBA Agent Workflow & Quality Gates"
Cohesion: 0.33
Nodes (6): Backlog Phased Slices, Verifiable Test Evidence Gate, SIBA Core Rules, SIBA Build Skill, SIBA Review Skill, Current State & Handoff

### Community 1 - "Deterministic Core & Replay Engine"
Cohesion: 0.33
Nodes (6): Pure TypeScript Core Architecture, Deterministic Rule Engine, Deduplication & Idempotency, Historical Replay & Simulation, Structured Correlation Logging, SIBA Debug Skill

### Community 2 - "Watchtower Product & Telegram Delivery"
Cohesion: 0.50
Nodes (4): Telegram Notification Channel, Track 02 Automation & Workflows, Watchtower IDX Monitor, Security Acceptance Standard

### Community 3 - "Sectors API & Budget Guardrail"
Cohesion: 0.67
Nodes (3): 1000 API Credits Budget Guardrail, Sectors API Integration, SIBA Data Skill

### Community 4 - "Case Timeline & Persistence Lifecycle"
Cohesion: 0.67
Nodes (3): Supabase Postgres & Cron, Case Timeline System, Case Lifecycle State Machine

## Knowledge Gaps
- **11 isolated node(s):** `Track 02 Automation & Workflows`, `Supabase Postgres & Cron`, `Security Acceptance Standard`, `UI Design Guidelines`, `Case Lifecycle State Machine` (+6 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Watchtower IDX Monitor` connect `Watchtower Product & Telegram Delivery` to `Deterministic Core & Replay Engine`, `Sectors API & Budget Guardrail`, `Case Timeline & Persistence Lifecycle`?**
  _High betweenness centrality (0.328) - this node is a cross-community bridge._
- **Why does `Deterministic Rule Engine` connect `Deterministic Core & Replay Engine` to `Watchtower Product & Telegram Delivery`?**
  _High betweenness centrality (0.213) - this node is a cross-community bridge._
- **What connects `Track 02 Automation & Workflows`, `Supabase Postgres & Cron`, `Security Acceptance Standard` to the rest of the system?**
  _11 weakly-connected nodes found - possible documentation gaps or missing edges._