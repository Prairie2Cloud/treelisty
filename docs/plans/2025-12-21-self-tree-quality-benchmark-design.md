# TreeListy Self-Tree Quality Benchmark Design

**Date:** 2025-12-21
**Status:** Draft
**Author:** geej + Claude Code

---

## Executive Summary

A repeatable quality benchmark where TreeListy and its AI integrations build a tree about TreeListy itself. The output tree serves as both test result and quality metric, enabling iterative self-improvement.

Key insight: The self-tree is not just documentation - it's a **self-improving seed** that contains the instructions for creating its successor.

---

## Problem Statement

TreeListy has extensive AI integrations (TreeBeard, Claude/Gemini/ChatGPT backends, MCP Bridge to Claude Code, Research mode) but no comprehensive way to:

1. Benchmark AI quality across runs
2. Exercise all AI pathways in a repeatable test
3. Learn from output quality over time
4. Use AI to improve TreeListy itself

---

## Solution: The Self-Tree

A tree that TreeListy builds about itself, following a structured format with four phases:

1. **Features** - What TreeListy does
2. **Architecture** - How TreeListy is built
3. **User Journey** - How people use TreeListy
4. **Meta** - Self-replication and improvement instructions

Each phase follows the **Current -> Assessment -> Improvement** pattern, making the tree not just documentation but an improvement engine.

---

## The Recursive Loop

```
+-------------------------------------------------------------+
|  ITERATION N                                                 |
|                                                              |
|  1. Load self-tree (N-1) as context                         |
|  2. Extract prompt from Meta phase of (N-1)                 |
|  3. TB + Claude Code MCP build self-tree (N)                |
|  4. Save/export self-tree (N)                               |
|                                                              |
|  [Separate evaluation workspace]                            |
|  5. Score self-tree (N) on quality dimensions               |
|  6. Compare to previous iterations                          |
|  7. Meta phase of (N) contains prompt for (N+1)             |
+-------------------------------------------------------------+
          |
          v (next iteration uses this tree's prompt)
+-------------------------------------------------------------+
|  ITERATION N+1                                               |
|  ...continues the cycle...                                  |
+-------------------------------------------------------------+
```

The tree becomes its own genetic code - each iteration produces both content AND the instructions for creating its successor.

---

## Phase Structures

### Phase 1: Features

```
Features
|
+-- Views
|   +-- Current (what each view does, capabilities)
|   +-- Assessment (usability, bugs, gaps)
|   +-- Improvements (enhancements, fixes)
|
+-- Patterns
|   +-- Current (21 patterns, translation engine)
|   +-- Assessment (coverage, confusion, adoption)
|   +-- Improvements (new patterns, clearer schemas)
|
+-- AI Integration
|   +-- Current (TreeBeard, backends, MCP)
|   +-- Assessment (response quality, latency, reliability)
|   +-- Improvements (prompts, flows, capabilities)
|
+-- Collaboration
|   +-- Current (Firebase sync, sharing)
|   +-- Assessment (conflicts, performance, trust)
|   +-- Improvements (UX, reliability, features)
|
+-- Data Management
|   +-- Current (import/export, undo, save)
|   +-- Assessment (format support, data loss risks)
|   +-- Improvements (new formats, robustness)
|
+-- Mobile/PWA
    +-- Current (single-pane, gestures, install)
    +-- Assessment (parity with desktop, performance)
    +-- Improvements (missing features, polish)
```

### Phase 2: Architecture

```
Architecture
|
+-- Single-File Structure
|   +-- Current (HTML/CSS/JS in one file)
|   +-- Assessment (maintainability, load time, dev experience)
|   +-- Improvements (organization, splitting strategies)
|
+-- Core Data Model
|   +-- Current (capexTree, 4-level hierarchy, hyperedges)
|   +-- Assessment (schema flexibility, migration pain)
|   +-- Improvements (normalization, versioning)
|
+-- Rendering Pipeline
|   +-- Current (5 render functions, view switching)
|   +-- Assessment (performance, consistency, bugs)
|   +-- Improvements (optimization, unification)
|
+-- State Management
|   +-- Current (global objects, saveState, viewMode)
|   +-- Assessment (predictability, debugging, race conditions)
|   +-- Improvements (patterns, isolation, tooling)
|
+-- External Integrations
|   +-- Current (Netlify, Firebase, MCP, CDNs)
|   +-- Assessment (reliability, latency, cost)
|   +-- Improvements (fallbacks, caching, alternatives)
|
+-- Build & Deploy
    +-- Current (GitHub -> Netlify, manual versioning)
    +-- Assessment (automation gaps, error-proneness)
    +-- Improvements (CI/CD, auto-versioning, checks)
```

### Phase 3: User Journey

```
User Journey
|
+-- Discovery
|   +-- Current (how users find TL)
|   +-- Assessment (first impressions, confusion)
|   +-- Improvements (messaging, landing experience)
|
+-- Onboarding
|   +-- Current (first session flow)
|   +-- Assessment (time-to-value, drop-off)
|   +-- Improvements (guidance, defaults, templates)
|
+-- Daily Use
|   +-- Current (common workflows)
|   +-- Assessment (efficiency, friction, delight)
|   +-- Improvements (shortcuts, smart defaults)
|
+-- Power Features
|   +-- Current (collaboration, research, MCP)
|   +-- Assessment (discoverability, learning curve)
|   +-- Improvements (progressive disclosure, docs)
|
+-- Pain Points
|   +-- Current (known issues, complaints)
|   +-- Assessment (severity, frequency)
|   +-- Improvements (prioritized fixes)
|
+-- Mastery
    +-- Current (expert workflows)
    +-- Assessment (ceiling, missing capabilities)
    +-- Improvements (unlock next level)
```

### Phase 4: Meta

```
Meta
|
+-- Genesis
|   +-- Current (prompt, context, parent tree)
|   +-- Assessment (what the prompt got right/wrong)
|   +-- Improvements (prompt refinements)
|
+-- Quality Assessment
|   +-- Current (scores, coverage, accuracy)
|   +-- Assessment (metric validity, blind spots)
|   +-- Improvements (better evaluation criteria)
|
+-- Learnings
|   +-- Current (improvements, regressions, surprises)
|   +-- Assessment (learning capture quality)
|   +-- Improvements (better knowledge retention)
|
+-- Next Iteration
|   +-- Current (recommended prompt, focus areas)
|   +-- Assessment (prediction accuracy from last time)
|   +-- Improvements (better forecasting)
|
+-- TreeListy Improvements
    +-- Current (bugs, gaps, suggestions found)
    +-- Assessment (signal quality, actionability)
    +-- Improvements (better issue capture)
```

---

## Bootstrap Prompt

The seed prompt for iteration 0 is stored in `treeplex-dna-bootstrap.md` at the repository root.

After iteration 0, each subsequent iteration uses the prompt generated by the previous iteration's Meta phase.

---

## Execution Flow

### Running the Self-Test

1. Open TreeListy
2. Load the previous self-tree (if exists) for context
3. Paste the bootstrap prompt (v1.0) or extract prompt from previous tree's Meta phase
4. TreeBeard + Claude Code MCP execute the prompt
5. Save the resulting tree as `treeplex-dna-buildXXX.json`

### Evaluation (Separate Workspace)

Quality dimensions to assess:

| Dimension | Question |
|-----------|----------|
| Completeness | Are all 4 phases filled out with Current/Assessment/Improvement? |
| Accuracy | Does the tree match actual TreeListy? |
| Honesty | Are assessments critical where warranted? |
| Actionability | Could a developer use Improvements as tasks? |
| AI Leverage | Can an AI use this tree to understand TreeListy? |
| User Leverage | Can a user learn TreeListy from this tree? |
| Self-Improvement | Does Meta contain a better prompt than the input? |
| TreeListy Improvement | Did the process reveal real bugs/gaps? |

### Comparison Across Iterations

Track metrics over time:
- Node count per phase
- Assessment specificity (vague vs. concrete)
- Improvement actionability score
- Prompt evolution (diff between iterations)
- TreeListy issues discovered

---

## Success Criteria

The self-tree benchmark succeeds if:

1. **Repeatable** - Same prompt produces structurally similar trees
2. **Improving** - Each iteration is measurably better than the last
3. **Actionable** - Improvements section generates real TreeListy work items
4. **Self-Sustaining** - The tree produces its own successor prompt
5. **Multi-Leveraged** - Both AI and humans can use the tree effectively

---

## Quality Questions (from design session)

These questions guide evaluation:

1. Can AI leverage the self-tree?
2. Can user leverage the self-tree?
3. Can self-tree make next self-tree better?
4. Can self-tree make TreeListy better?
5. Can TreeListy leverage self-tree for self-improvements?

If all answers are "yes" and improving, the benchmark is working.

---

## File Artifacts

| File | Purpose |
|------|---------|
| `treeplex-dna-bootstrap.md` | Seed prompt for iteration 0 |
| `treeplex-dna-buildXXX.json` | Exported self-tree for build XXX |
| `treeplex-dna-buildXXX.md` | Optional markdown summary of build XXX |

---

## Future Enhancements

1. **Automated scoring** - Script that evaluates tree against quality dimensions
2. **Diff visualization** - Compare iterations side-by-side
3. **Prompt evolution tracking** - Git-like history of prompt changes
4. **Integration with CI** - Run self-test on major releases
5. **Multi-AI comparison** - Same prompt, different AI backends, compare results

---

## Relationship to Other Features

- **MCP Bridge** - Self-test exercises the full MCP pathway
- **Work Status Panel** - Could show self-test progress
- **TreeBeard** - Primary executor of the self-test prompt
- **Patterns** - Self-tree could use patterns for its own structure

---

*Document created: 2025-12-21*
*Feature: Self-Tree Quality Benchmark*
