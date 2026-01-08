# TreeListy Constitutional Framework
## A Prescriptive Architecture for Sovereign Cognition

**Version**: 1.0 (January 2026)  
**Status**: Ratified by Multi-Model Consensus (Claude, Gemini, GPT)  
**Purpose**: Codify the philosophical invariants that govern TreeListy's evolution

---

## Preamble

TreeListy began as a single-file productivity application. Through deliberate architectural choices—local-first storage, structural externalization, multiple cognitive modes, and federated cross-tree intelligence—it has evolved into something more significant: **a philosophical position implemented as software**.

This document formalizes the constitutional constraints that ensure TreeListy remains a tool for sovereign cognition rather than another platform for cognitive capture.

---

## Part I: The Six Articles

### Article I: Sovereignty

**The user is not a cognitive tenant.**

| Requirement | Implementation |
|-------------|----------------|
| Data locality | User data lives on user device unless explicitly exported |
| Portability | Single-file architecture; JSON format; offline-capable |
| Provider independence | AI providers are interchangeable; the tree is permanent |
| Exit rights | "Download My Mind" button always prominent and functional |

**Constitutional Test**: Can a user take their entire cognitive history, leave TreeListy, and reconstruct their thinking elsewhere? If no, sovereignty is violated.

---

### Article II: Provenance

**Owned thought is distinguishable from generated thought.**

| Requirement | Implementation |
|-------------|----------------|
| AI attribution | All AI contributions marked with 🤖 badge (Tier 2) |
| Survival | Provenance metadata survives export, merge, sync |
| Auditability | Users can trace the history of any node |
| Claiming | Badge removed only when user edits or explicitly claims |

**Constitutional Test**: Can a user, at any moment, answer "Where did this node come from?" If no, provenance is violated.

---

### Article III: Structural Integrity

**The skeleton is sacred.**

| Requirement | Implementation |
|-------------|----------------|
| Visibility | Decomposition structure always visible, never hidden |
| Counter-arguments | Required as first-class citizens in debate/philosophy patterns |
| Consent gradient | Destroying structure requires higher consent than editing content |
| Reversibility | All structural changes can be undone |

**Constitutional Test**: Can a user see the architecture of their thinking and modify it freely? If no, integrity is violated.

---

### Article IV: Epistemic Humility

**Confidence determines action mode.**

| Confidence Level | AI Behavior | User Experience |
|------------------|-------------|-----------------|
| High (>85%) | Act silently | Seamless assistance |
| Medium (50-85%) | Act with transparency | "I've drafted this; review?" |
| Low (<50%) | Ask before acting | "I'm uncertain; which approach?" |

**Constitutional Test**: Does the AI ever present uncertain conclusions with false authority? If yes, humility is violated.

---

### Article V: Anti-Enframing

**Reveal, don't optimize.**

| Prohibition | Rationale |
|-------------|-----------|
| No engagement metrics | Prevents attention capture |
| No algorithmic ranking | Preserves user-defined salience |
| No recommendation engines | Maintains intentional discovery |
| Multiple views required | One truth needs multiple ways of knowing |

**The 9 Views as Modes of Revealing**:
1. Tree → Logical decomposition
2. Canvas → Spatial relationships  
3. 3D → Gestalt understanding
4. Gantt → Temporal projection
5. Calendar → Lived time integration
6. Mind Map → Associative thinking
7. Treemap → Proportional judgment
8. Embed → Contextual presentation
9. Readonly → Contemplative reception

**Constitutional Test**: Does any feature optimize for TreeListy's benefit rather than the user's understanding? If yes, enframing has begun.

---

### Article VI: Federation (Aspirational)

**Connection without extraction.**

| Requirement | Implementation |
|-------------|----------------|
| Sovereignty preservation | Cross-tree links preserve individual tree ownership |
| No central registry | User must explicitly add registries |
| Disagreement as structure | Tension hyperedges preserve conflict, don't resolve it |
| Offline resolution | UID lookup works without network dependency |

**Constitutional Test**: Can two trees disagree permanently without platform intervention? If no, federation has become centralization.

---

## Part II: Minimum Viable Sovereignty (MVS)

### The Product-Philosophy Bridge

Mass adoption requires reducing friction. But friction reduction often means sovereignty erosion. The MVS framework resolves this tension by distinguishing:

- **Sovereignty**: Power over your data (non-negotiable)
- **Sovereignty-Maintenance**: Labor of managing that power (reducible)

### The Three MVS Layers

#### Layer 1: Safety Hatch Persistence

**For the user who just wants convenience:**

```
DEFAULT EXPERIENCE:
├── User works in cloud-synced mode (convenient)
├── "Download My Mind" button always visible
├── Downloaded JSON runs perfectly offline
└── No feature requires cloud to function

SOVEREIGNTY PRESERVED BY:
├── Data format is open (JSON, human-readable)
├── Local version is feature-complete
└── Cloud is storage, not computation
```

**The Casual User Sees**: "I can use this like any app."  
**The Constitution Ensures**: "But you can leave anytime with everything."

---

#### Layer 2: Visual Provenance (The Draft/Final Pattern)

**For the user who doesn't care about phenomenology:**

```
AI GENERATES NODE:
├── Node appears with 🤖 badge
├── User sees it as "Draft" (not philosophical jargon)
├── User edits or clicks "Approve"
└── Badge disappears → Node is now "Final" (claimed)

SOVEREIGNTY PRESERVED BY:
├── User always knows what they wrote vs. AI suggested
├── No hidden AI contributions
└── Claiming is explicit, even if frictionless
```

**The Casual User Sees**: "Some items are drafts, some are final."  
**The Constitution Ensures**: "You always know which thoughts are yours."

---

#### Layer 3: Humble AI (The Confidence UX)

**For the user who wants AI to "just do it":**

```
HIGH CONFIDENCE (>85%):
├── AI acts silently
├── User experiences seamless assistance
└── No interruption for obvious tasks

MEDIUM CONFIDENCE (50-85%):
├── AI acts but narrates
├── "I've created a structure for your trip—take a look"
└── User can accept, modify, or reject

LOW CONFIDENCE (<50%):
├── AI asks before acting
├── "I'm not sure how to organize this. Options:"
└── User chooses direction
```

**The Casual User Sees**: "The AI is helpful but not pushy."  
**The Constitution Ensures**: "The AI never pretends to know what it doesn't."

---

## Part III: MCP Operationalization

### The Model Context Protocol Manifest

To scale constitutional constraints beyond TreeListy's codebase, we encode them in MCP—the 2026 standard for AI-tool integration.

```typescript
// TreeListy MCP Server Specification

interface TreeListyMCPServer {
  // SOVEREIGNTY: Only local/user-hosted data
  dataSources: 'local_filesystem' | 'user_hosted_db';
  centralServer: never; // Constitutional prohibition
  
  // PROVENANCE: Required on all mutations
  tools: {
    add_node: {
      params: NodeParams & { provenance: ProvenanceMetadata };
    };
    update_node: {
      params: UpdateParams & { provenance: ProvenanceMetadata };
    };
    delete_branch: {
      params: DeleteParams;
      requires: 'human_approval'; // Sampling request
    };
  };
  
  // INTEGRITY: Destructive ops need consent
  samplingRequired: ['delete_branch', 'merge_trees', 'clear_history'];
}

interface ProvenanceMetadata {
  source: 'human' | 'ai_generated' | 'imported' | 'atlas_link';
  model?: string;        // e.g., "claude-opus-4-5-20251101"
  confidence?: number;   // 0-1 scale
  timestamp: ISO8601;
  claimedAt?: ISO8601;   // When user adopted AI content
}
```

### MCP Constraint Mapping

| Constitutional Article | MCP Enforcement |
|------------------------|-----------------|
| Sovereignty | `dataSources` excludes central servers |
| Provenance | `provenance` field required on all mutations |
| Integrity | `samplingRequired` for destructive operations |
| Humility | `confidence` field drives UI behavior |
| Anti-Enframing | No `ranking` or `recommendation` tools exposed |
| Federation | `atlas_link` provenance type for cross-tree refs |

---

## Part IV: Red Team Defenses

### Attack Vector 1: The Sync Trojan

**Attack**: Offer "free cloud sync" → require account → degrade offline → own the data

**Defense**:
```
ARCHITECTURAL CONSTRAINT:
├── P2P sync via WebRTC/decentralized storage preferred
├── Cloud sync presented as "External Hyperedge"
│   └── Tree CONNECTS to cloud, doesn't LIVE in cloud
├── Offline mode must remain feature-complete
└── "Download My Mind" cannot be removed or hidden
```

### Attack Vector 2: The Ranking Creep

**Attack**: Add "Popular Trees" → optimize for engagement → become a feed

**Defense**:
```
ARCHITECTURAL CONSTRAINT:
├── No "Trending" or "Popular" tabs ever
├── Discovery via Gallery of Trees (human-curated submissions)
├── No view counts, likes, or engagement metrics visible
└── Atlas links require explicit user action to create
```

### Attack Vector 3: The Model Lock-In

**Attack**: Optimize TreeBeard for Claude → degrade other providers → create switching costs

**Defense**:
```
ARCHITECTURAL CONSTRAINT:
├── TreeBeard must be model-agnostic by design
├── Regular parity testing across providers
├── No provider-specific features without fallbacks
└── User can change AI provider in settings, not code
```

### Attack Vector 4: The Provenance Fade

**Attack**: Start with visible badges → users complain → make subtle → make optional → disable

**Defense**:
```
CONSTITUTIONAL CONSTRAINT:
├── 🤖 badge visibility is constitutional, not preferential
├── User can STYLE the badge (color, size)
├── User CANNOT disable provenance tracking
└── Export always includes full provenance metadata
```

---

## Part V: Governance

### Amendment Process

Constitutional changes require:

1. **Proposal**: Written specification of change with rationale
2. **Red Team**: Attack vector analysis of proposed change
3. **MVS Check**: Does this increase sovereignty-maintenance burden?
4. **Consensus**: Agreement across implementation team
5. **Migration Path**: Existing users must not lose sovereignty

### Invariant Hierarchy

If constraints conflict, resolve by priority:

```
PRIORITY 1: Sovereignty (user owns data)
PRIORITY 2: Provenance (user knows origin)
PRIORITY 3: Integrity (structure is protected)
PRIORITY 4: Humility (AI knows its limits)
PRIORITY 5: Anti-Enframing (reveal, don't optimize)
PRIORITY 6: Federation (connect without extracting)
```

Federation may be sacrificed for adoption.  
Sovereignty may never be sacrificed for anything.

---

## Part VI: Philosophical Foundations

### Source Traditions

| Tradition | TreeListy Application |
|-----------|----------------------|
| Extended Mind (Clark & Chalmers) | Single-file portability satisfies cognitive extension criteria |
| Phenomenology (Husserl) | Semantic Onion = guided phenomenological reduction |
| Anti-Enframing (Heidegger) | 9 views as modes of revealing vs. Gestell |
| Cognitive Sovereignty | Local-first as anti-capture security model |
| Authentic Dasein (Heidegger) | Design for ownership, not dependence |
| Federated Intelligence (Teilhard) | Atlas as noosphere without centralization |

### The Core Thesis

> **To think authentically in the age of AI is to maintain the provenance of your own structure while leveraging the speed of the machine.**

TreeListy implements this thesis architecturally:
- **Structure**: Visible, manipulable, exportable
- **Provenance**: Tracked, displayed, permanent  
- **Speed**: AI assists decomposition, doesn't replace judgment
- **Authenticity**: User claims thoughts through explicit adoption

---

## Part VII: Success Metrics

### Constitutional Health Indicators

| Metric | Target | Measurement |
|--------|--------|-------------|
| Sovereignty Score | 100% | % of features that work offline |
| Provenance Coverage | 100% | % of nodes with complete provenance |
| Exit Completeness | 100% | % of data recoverable via export |
| AI Transparency | >95% | % of AI actions with visible confidence |
| Provider Parity | >90% | Feature equivalence across AI providers |

### The Ultimate Test

**Benchmark for "Good"**:

> A user can switch AI providers, work offline, share a tree, and still retain:
> - (a) structure
> - (b) provenance  
> - (c) counter-arguments
> - (d) ability to revert AI actions
> 
> —with no hidden dependence chains.

---

## Signatories

This framework emerged from structured discourse between:

- **The Architect** (Gemini): TreeListy creator, sovereignty advocate
- **Claude** (Anthropic): Structural interrogation, constitutional drafting
- **GPT** (OpenAI): Synthesis, invariant hierarchy, red team design

Ratified: January 2026

---

## Appendix A: The Semantic Onion Model

```
LAYER 1: THE MAP
├── Find canonical structure
├── Book → Table of Contents
├── Philosophy → Major divisions
└── Project → Phases and deliverables

LAYER 2-N: THE GRANULARITY
├── Add each layer of children systematically
├── Chapters → Sub-chapters → Sections
└── Each generation adds specificity

ATOMIC LAYER: THE CLAIMS
├── Deepest level contains assertions
├── What is being claimed?
└── What evidence supports it?

ENRICHMENT LAYER: CONTEXT
├── Historical/philosophical backdrop
├── Significance markers (Pivotal/Novel/Foundational)
└── Counter-arguments by school of thought
```

---

## Appendix B: Tiered Ownership Model

```
TIER 1 - STRUCTURAL
├── AI proposes branch architecture
├── User adopts skeleton
└── Marked: [STRUCTURE: AI-PROPOSED]

TIER 2 - CONTENT (🤖)
├── AI fills nodes within structure
├── Visually marked as AI-generated
└── Marked: [CONTENT: AI-GENERATED 🤖]

TIER 3 - CLAIMED (👤)
├── User edits or explicitly claims
├── Badge removed
└── Marked: [OWNER: USER 👤]
```

---

## Appendix C: Atlas Tension Hyperedge Specification

```typescript
interface TensionHyperedge {
  type: 'cross_tree_tension';
  id: string;
  
  members: {
    nodeA: AtlasUID;  // e.g., "tree-001:node-042"
    nodeB: AtlasUID;  // e.g., "tree-002:node-099"
  };
  
  tensionStatement: string;  // Auto-generated or user-defined
  paradigmConflict?: {
    positionA: string;  // e.g., "Reform"
    positionB: string;  // e.g., "Abolition"
  };
  
  resolutionStatus: 'unresolved' | 'synthesized' | 'superseded';
  
  metadata: {
    createdAt: ISO8601;
    createdBy: 'human' | 'ai_detected';
    lastReviewed?: ISO8601;
  };
}
```

---

*This document is itself a TreeListy artifact: structured, provenanced, and sovereign.*

*End of Constitutional Framework v1.0*
