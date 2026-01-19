# TB Awareness System Design

**Build:** 713-717
**Status:** ✅ COMPLETE (All 5 phases shipped)
**Effort:** Medium (phased implementation)
**Priority:** A (Proactive Helper) → B (Self-Debugging) → C (Personalization)

---

## Implementation Status (Build 872)

**All phases from this design have been implemented:**

| Phase | Build | Status | What Shipped |
|-------|-------|--------|--------------|
| 1. Foundation | 713 | ✅ Done | `tbAwareness` object, monitors (updateSession, updateIntegrations, detectDevice), core status injection (~50 tokens), awareness status bar, config with quietMode, localStorage persistence |
| 2. Proactive Helper | 714 | ✅ Done | Tree health monitoring with dirty Set + requestIdleCallback, predictNextAction pattern detection, getUndiscoveredFeatures, conditional system prompt injection (tree health if <80%, tips if not quiet mode) |
| 3. Self-Debugging | 715 | ✅ Done | Tool-grounded confidence (toolsRun, toolsSucceeded, citedSources), recordToolFailure with sliding window, assessHallucinationRisk, confidence guidance injection when <50% |
| 4. Personalization | 716 | ✅ Done | detectUserState with frustration detection (explicit patterns + repetition), Levenshtein similarity, expertise level detection, communication style, frustration injection when >= 2 triggers |
| 5. Polish | 717 | ✅ Done | Expandable awareness bar (click to toggle), collapsed/expanded states, health indicator colors (green/yellow/red), integration badges, session cost tracking |

**Code Location:** `treeplexity.html` lines ~1098-1600 (search for `window.tbAwareness`)

**Key Functions (all window-exposed):**
- `tbAwareness` - Central awareness object
- `updateSession()` - Track messages, tokens, cost
- `updateTreeHealth()` - Tree completeness with sampling
- `predictNextAction()` - Pattern-based prediction
- `assessConfidence()` - Tool-grounded confidence
- `detectUserState()` - Frustration and expertise detection
- `AwarenessInjector.buildAwarenessContext()` - Selective prompt injection

---

## Problem Statement

TreeBeard has access to 340+ commands, multiple AI models, MCP integration, camera, voice, and more—but lacks **self-awareness** about:
- What it can do (solved in Build 712 with Capability Orchestrator)
- Which AI model powers it (solved in Build 712)
- Session context, user state, tree health, and optimization opportunities

**Result:** TB can't proactively help, can't adapt to user frustration, and can't suggest optimizations. Users must discover features manually.

---

## Solution: Unified Awareness Architecture

A central `tbAwareness` object populated by lightweight monitors, used **primarily as an app-side decision engine**. Prompt injection is selective and minimal—only when awareness materially changes the next action.

### Design Principle: App-Side First, Prompts Second

**Anti-pattern:** Injecting all awareness into every prompt (token tax + behavioral coupling)

**Correct pattern:**
- `tbAwareness` drives **app-side decisions** (UI state, tool selection, routing)
- Prompt injection **only when** it changes TB's response behavior
- Example: Inject frustration context only when frustration >= 2 (changes tone)
- Example: DON'T inject session duration (doesn't change behavior)

```
┌─────────────────────────────────────────────────────────────┐
│                     tbAwareness Object                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Session   │  │    Tree     │  │    Predictions      │  │
│  │   Stats     │  │   Health    │  │    & Suggestions    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ Confidence  │  │ Integrations│  │   User State        │  │
│  │ & Failures  │  │   Status    │  │   & Device          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
          ↑                    ↓
    ┌─────────────┐    ┌─────────────────────┐
    │  Monitors   │    │  Injection Layer    │
    │ (event-     │    │  (selective,        │
    │  triggered) │    │   context-aware)    │
    └─────────────┘    └─────────────────────┘
          ↑                    ↓
    ┌─────────────┐    ┌─────────────────────┐
    │ User Actions│    │   System Prompt     │
    │ Tree Changes│    │   + UI Indicators   │
    │ AI Responses│    │                     │
    └─────────────┘    └─────────────────────┘
```

---

## Core Data Structure

```javascript
window.tbAwareness = {
    // ═══════════════════════════════════════════════════════
    // CONFIG: User preferences (PERSISTED to localStorage)
    // ═══════════════════════════════════════════════════════
    config: {
        quietMode: false,           // Disable proactive suggestions
        verbosity: 'normal',        // 'brief' | 'normal' | 'detailed'
        persistSession: true,       // Remember session across reloads
        enableCostTracking: true,   // Show token/cost estimates
    },

    // ═══════════════════════════════════════════════════════
    // TIER 1: PROACTIVE HELPER (Priority A)
    // ═══════════════════════════════════════════════════════
    session: {                      // PARTIALLY PERSISTED
        startTime: Date.now(),
        messageCount: 0,
        commandsExecuted: [],       // History for pattern detection
        lastActivity: Date.now(),
        tokensUsed: 0,
        estimatedCost: 0,           // ~$3/1M tokens (this session)
        cumulativeCost: 0,          // PERSISTED: monthly budgeting
    },
    tree: {
        nodeCount: 0,
        nodesWithoutDescription: [], // IDs of incomplete nodes
        orphanNodes: [],             // Disconnected nodes
        recentlyEdited: [],          // Last 5 min
        completenessScore: 0         // 0-100%
    },
    predictions: {
        likelyNextAction: null,      // "add_child", "switch_view", etc.
        suggestedOptimizations: [],  // "Use batch add for these 5 nodes"
        undiscoveredFeatures: []     // Features user hasn't tried
    },

    // ═══════════════════════════════════════════════════════
    // TIER 2: SELF-DEBUGGING (Priority B)
    // ═══════════════════════════════════════════════════════
    confidence: {                   // NOT PERSISTED (resets each session)
        lastResponseConfidence: 0.8, // 0-1 based on tool-grounded signals
        confidenceSignals: {},       // Debug: toolsRun, toolsSucceeded, etc.
        knowledgeGaps: [],           // ["haven't read transcript node"]
        recentFailures: [],          // Last 10 tool failures
        hallucinationRisk: 'low'     // low/medium/high
    },
    integrations: {
        mcpConnected: false,
        extensionConnected: false,
        availableAPIs: ['claude'],   // Which APIs have keys configured
        cameraAvailable: false
    },

    // ═══════════════════════════════════════════════════════
    // TIER 3: PERSONALIZATION (Priority C)
    // ═══════════════════════════════════════════════════════
    user: {                              // PERSISTED to localStorage
        expertiseLevel: 'intermediate',  // beginner/intermediate/expert
        preferredResponseLength: 'medium',
        frustrationSignals: 0,           // Increments on "??", repeats (decays)
        communicationStyle: 'neutral'    // brief/detailed/technical
    },
    device: {
        isMobile: false,
        isTouch: false,
        screenSize: 'desktop'           // mobile/tablet/desktop
    }
};
```

---

## Awareness Monitors

Event-triggered functions that update `tbAwareness`. No polling, low overhead.

### Tier 1: Proactive Helper Monitors

```javascript
// Runs: After every TB message send
updateSession(message, response) {
    const s = tbAwareness.session;
    s.messageCount++;
    s.lastActivity = Date.now();
    s.commandsExecuted.push(...extractCommands(response));
    s.tokensUsed += estimateTokens(message, response);
    s.estimatedCost = s.tokensUsed * 0.000003;
}

// Tree health uses DIRTY SET + requestIdleCallback for performance at 1k+ nodes
// Full scans on every mutation would stutter the UI

let dirtyNodes = new Set();  // Track specific dirty nodes, not just boolean
let treeHealthScheduled = false;

// Runs: After tree mutations (add/delete/edit node)
// Marks specific node dirty and schedules idle update
function markNodeDirty(nodeId) {
    dirtyNodes.add(nodeId);
    if (!treeHealthScheduled) {
        treeHealthScheduled = true;
        // Use requestIdleCallback to avoid frame drops during typing
        if (window.requestIdleCallback) {
            window.requestIdleCallback(updateTreeHealth, { timeout: 2000 });
        } else {
            setTimeout(updateTreeHealth, 500); // Fallback for Safari
        }
    }
}

// Incremental update: O(k) for small edits, O(n) sampled for large
function updateTreeHealth() {
    treeHealthScheduled = false;
    if (dirtyNodes.size === 0) return;

    const t = tbAwareness.tree;
    const nodes = getAllNodes(capexTree);
    t.nodeCount = nodes.length;

    // Small edit: Only check specific dirty nodes
    if (dirtyNodes.size > 0 && dirtyNodes.size < 50) {
        // O(k) - just update stats for changed nodes
        for (const nodeId of dirtyNodes) {
            const node = findNodeById(nodeId);
            if (node && !node.description?.trim()) {
                t.nodesWithoutDescription++;
            }
        }
        dirtyNodes.clear();
        return;
    }

    // Large tree: Use SPATIAL LOCALITY sampling (not head/tail!)
    // User is most likely to act on what they're currently looking at
    if (nodes.length > 1000) {
        const sample = [];
        // Sample 1: Currently selected node and siblings (high priority)
        const selected = getSelectedNode();
        if (selected) {
            sample.push(selected);
            const siblings = getSiblings(selected);
            sample.push(...siblings.slice(0, 10));
        }
        // Sample 2: Recently edited nodes (high priority)
        const recent = nodes.filter(n => Date.now() - (n.lastModified || 0) < 300000);
        sample.push(...recent.slice(0, 20));
        // Sample 3: Random distribution from the rest
        const remaining = nodes.filter(n => !sample.includes(n));
        for (let i = 0; i < 50 && remaining.length > 0; i++) {
            const idx = Math.floor(Math.random() * remaining.length);
            sample.push(remaining.splice(idx, 1)[0]);
        }

        const sampleMissingDesc = sample.filter(n => !n.description?.trim()).length;
        t.nodesWithoutDescription = Math.round((sampleMissingDesc / sample.length) * nodes.length);
        t.completenessScore = Math.round(100 - (sampleMissingDesc / sample.length) * 100);
    } else {
        // Full scan OK for smaller trees
        t.nodesWithoutDescription = nodes.filter(n => !n.description?.trim()).length;
        t.completenessScore = calculateCompleteness(capexTree);
    }

    t.recentlyEdited = nodes.filter(n =>
        Date.now() - (n.lastModified || 0) < 300000
    ).slice(0, 20);
    t.lastHealthCheck = Date.now();
    dirtyNodes.clear();
}

// Expensive orphan scan: Only run on user request
function requestOrphanScan() {
    const t = tbAwareness.tree;
    t.orphanNodes = findOrphanNodes(capexTree);
    return t.orphanNodes;
}

// Runs: After each user message, before AI call
predictNextAction(message, context) {
    const p = tbAwareness.predictions;
    const patterns = analyzeUserPatterns(tbAwareness.session.commandsExecuted);
    p.likelyNextAction = predictFromHistory(patterns, context);
    p.suggestedOptimizations = findOptimizations(context);
    p.undiscoveredFeatures = getUndiscoveredFeatures(
        tbAwareness.session.commandsExecuted
    );
}
```

### Tier 2: Self-Debugging Monitors

```javascript
// Runs: After AI response received
// NOTE: Confidence is TOOL-GROUNDED, not hedging-language-based
// Hedging detection is noisy, model-dependent, and punishes honest uncertainty
assessConfidence(response, toolResults, context) {
    const c = tbAwareness.confidence;

    // Tool-grounded confidence signals (deterministic)
    const signals = {
        toolsRun: toolResults?.length > 0,
        toolsSucceeded: toolResults?.filter(r => !r.error).length || 0,
        toolsFailed: toolResults?.filter(r => r.error).length || 0,
        citedSources: (response.match(/\[source:|according to|from node|verified:/gi) || []).length,
        usedTreeData: /capexTree|node\s+\d+|children\[/i.test(response),
    };

    // Confidence = weighted sum of grounded signals
    let confidence = 0.5; // baseline
    if (signals.toolsRun) confidence += 0.2;
    if (signals.toolsSucceeded > 0) confidence += 0.15;
    if (signals.toolsFailed > 0) confidence -= 0.2;
    if (signals.citedSources > 0) confidence += 0.1;
    if (signals.usedTreeData) confidence += 0.1;
    c.lastResponseConfidence = Math.max(0.1, Math.min(1.0, confidence));
    c.confidenceSignals = signals; // Store for debugging

    // Track failures
    const failures = toolResults?.filter(r => r.error);
    if (failures?.length) {
        c.recentFailures.push(...failures.map(f => ({
            tool: f.tool,
            error: f.error,
            timestamp: Date.now()
        })));
        c.recentFailures = c.recentFailures.slice(-10);
    }

    // Hallucination risk based on deterministic heuristics
    c.hallucinationRisk = assessHallucinationRisk(signals, context);
}

// Deterministic hallucination risk assessment
function assessHallucinationRisk(signals, context, response) {
    // Check if response contains specific entities (dates, proper nouns, numbers)
    const hasEntities = /\b\d{4}\b|\b[A-Z][a-z]+\s[A-Z][a-z]+\b|\$[\d,]+|\b\d+%/.test(response);
    const isChitChat = /^(hi|hello|hey|thanks|ok|sure|got it)/i.test(context.userMessage);

    // Don't flag chit-chat as high risk even if no tools ran
    if (isChitChat) return 'low';

    // High risk: No tools run, no citations, AND claiming specific facts
    if (!signals.toolsRun && signals.citedSources === 0 && hasEntities) return 'high';
    // Medium risk: Tools failed, or mixed results
    if (signals.toolsFailed > 0) return 'medium';
    // Low risk: Tools succeeded, has citations, or just conversational
    return 'low';
}

// Runs: On page load and when connections change
updateIntegrations() {
    const i = tbAwareness.integrations;
    i.mcpConnected = mcpBridgeState?.client?.isConnected || false;
    i.extensionConnected = !!window._extensionConnected;
    i.availableAPIs = detectAvailableAPIs();
    i.cameraAvailable = !!navigator.mediaDevices?.getUserMedia;
}
```

### Tier 3: Personalization Monitors

```javascript
let lastUserMessages = []; // Track for repetition detection

// Runs: After each user message
detectUserState(message) {
    const u = tbAwareness.user;
    const normalized = message.toLowerCase().trim().replace(/[^\w\s]/g, '');

    // Frustration signal 1: Explicit frustration patterns
    const explicitFrustration = /^\?+$|you (said|told)|again|already|still|why (isn't|won't|can't)/i.test(message);

    // Frustration signal 2: Repetition (same command twice = frustrated)
    // But exclude enthusiastic "What?? That's amazing!" via sentiment
    const isRepeat = lastUserMessages.slice(-3).some(prev =>
        prev === normalized || levenshteinSimilarity(prev, normalized) > 0.8
    );
    const isPositive = /amazing|great|awesome|thanks|perfect|love/i.test(message);

    if (explicitFrustration || (isRepeat && !isPositive)) {
        u.frustrationSignals++;
    } else if (u.frustrationSignals > 0) {
        u.frustrationSignals -= 0.5; // Decay over time
    }

    // Track message history for repetition detection
    lastUserMessages.push(normalized);
    if (lastUserMessages.length > 10) lastUserMessages.shift();

    // Expertise detection
    if (/\b(API|regex|JSON|schema|webhook|MCP|CLI|SDK)\b/i.test(message)) {
        u.expertiseLevel = 'expert';
    }
}

// Runs: On page load
detectDevice() {
    const d = tbAwareness.device;
    d.isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    d.isTouch = 'ontouchstart' in window;
    d.screenSize = window.innerWidth < 768 ? 'mobile' :
                   window.innerWidth < 1200 ? 'tablet' : 'desktop';
}
```

### Monitor Trigger Points

| Monitor | Trigger | Frequency | Notes |
|---------|---------|-----------|-------|
| `updateSession` | After TB send | Every message | Lightweight |
| `markNodeDirty(nodeId)` | After tree mutation | On change | Adds to dirty Set |
| `updateTreeHealth` | `requestIdleCallback` | Coalesced | O(k) for small edits, O(n) sampled for large |
| `requestOrphanScan` | User request only | Manual | Expensive, not automatic |
| `predictNextAction` | Before AI call | Every message | Pattern matching |
| `assessConfidence` | After AI response | Every response | Tool-grounded signals |
| `updateIntegrations` | Page load, connection change | Rare | PERSISTED |
| `detectUserState` | After user message | Every message | Repetition + regex |
| `detectDevice` | Page load | Once | |

---

## Selective Injection Layer

Don't inject everything every time. Match awareness to context.

```javascript
const AwarenessInjector = {

    buildAwarenessContext(message, baseSystemPrompt) {
        const awareness = window.tbAwareness;
        const injections = [];

        // Always inject (~50 tokens)
        injections.push(this.getCoreStatus(awareness));

        // Conditionally inject based on relevance
        if (this.shouldInjectTreeHealth(message, awareness)) {
            injections.push(this.getTreeHealthContext(awareness));
        }
        if (this.shouldInjectProactiveSuggestions(awareness)) {
            injections.push(this.getProactiveSuggestions(awareness));
        }
        if (this.shouldInjectConfidenceGuidance(awareness)) {
            injections.push(this.getConfidenceGuidance(awareness));
        }
        if (awareness.user.frustrationSignals >= 2) {
            injections.push(this.getFrustrationResponse(awareness));
        }

        return baseSystemPrompt + '\n\n' + injections.join('\n\n');
    },

    // Always injected (~50 tokens)
    getCoreStatus(a) {
        return `SESSION: ${a.session.messageCount} msgs | ${formatDuration(a.session.startTime)} | ${a.tree.nodeCount} nodes
INTEGRATIONS: ${a.integrations.mcpConnected ? '✓ MCP' : '✗ MCP'} | ${a.integrations.extensionConnected ? '✓ Extension' : '✗ Extension'} | Camera: ${a.integrations.cameraAvailable ? '✓' : '✗'}
USER: ${a.user.expertiseLevel} | ${a.device.screenSize}`;
    },

    // Injected when tree has issues or user asks about tree (~80 tokens)
    getTreeHealthContext(a) {
        const issues = [];
        if (a.tree.nodesWithoutDescription.length > 0) {
            issues.push(`${a.tree.nodesWithoutDescription.length} nodes lack descriptions`);
        }
        if (a.tree.orphanNodes.length > 0) {
            issues.push(`${a.tree.orphanNodes.length} orphan nodes`);
        }
        return `TREE HEALTH: ${a.tree.completenessScore}% complete
${issues.length ? 'ISSUES: ' + issues.join(', ') : 'No issues'}
PROACTIVE: Offer to help with issues if relevant.`;
    },

    // Injected when predictions available (~100 tokens)
    getProactiveSuggestions(a) {
        const parts = [];
        if (a.predictions.likelyNextAction) {
            parts.push(`Likely next: ${a.predictions.likelyNextAction}`);
        }
        if (a.predictions.suggestedOptimizations.length) {
            parts.push(`Optimizations: ${a.predictions.suggestedOptimizations.slice(0,2).join(', ')}`);
        }
        if (a.predictions.undiscoveredFeatures.length) {
            parts.push(`User hasn't tried: ${a.predictions.undiscoveredFeatures.slice(0,3).join(', ')}`);
        }
        return `PROACTIVE OPPORTUNITIES:\n${parts.join('\n')}
Mention naturally if relevant - don't force.`;
    },

    // Injected when confidence is low (~80 tokens)
    getConfidenceGuidance(a) {
        const parts = [];
        if (a.confidence.recentFailures.length) {
            parts.push(`Recent failures: ${a.confidence.recentFailures.slice(-3).map(f => f.tool).join(', ')}`);
        }
        if (a.confidence.hallucinationRisk !== 'low') {
            parts.push(`Hallucination risk: ${a.confidence.hallucinationRisk}`);
        }
        return `SELF-AWARENESS:\n${parts.join('\n')}
Be careful. Verify before asserting. Use tools to check.`;
    },

    // Injected when frustration detected (~60 tokens)
    getFrustrationResponse(a) {
        return `⚠️ USER FRUSTRATION DETECTED (level: ${a.user.frustrationSignals.toFixed(1)})
- Acknowledge difficulty
- Be more direct and concise
- Don't repeat failed approaches
- Consider: "Let me try differently..."`;
    }
};
```

### Token Budget

| Condition | Context Injected | Tokens |
|-----------|------------------|--------|
| Always | Core status | ~50 |
| Tree issues or tree questions | Tree health | ~80 |
| Have predictions | Proactive suggestions | ~100 |
| Recent failures or low confidence | Confidence guidance | ~80 |
| Frustration >= 2 | Frustration response | ~60 |

**Worst case:** ~370 tokens
**Typical case:** ~100-150 tokens

---

## UI Indicators

Optional status bar below TB input showing awareness state.

```
┌─────────────────────────────────────────────────┐
│ Ask anything or give a command...        📷 ➤  │
├─────────────────────────────────────────────────┤
│ 🧠 12min | 8 msgs | 🟢                     ▼   │  ← Collapsed
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│ 🧠 12min | 8 msgs | 🟢                     ▲   │  ← Expanded
├─────────────────────────────────────────────────┤
│ ✓ MCP  ✓ Extension  ✓ Camera  │ Claude        │
│ 📊 15 commands | ~$0.004 | 42 nodes            │
│ 📝 3 nodes need descriptions                    │
└─────────────────────────────────────────────────┘
```

**Design principles:**
- Collapsed by default (non-intrusive)
- Click to expand for power users
- Color-coded health: 🟢 (>70%) 🟡 (40-70%) 🔴 (<40%)
- Cost transparency builds trust

---

## Implementation Phases

### Phase 1: Foundation (Build 713) ✅ COMPLETE
- [x] Create `tbAwareness` object structure
- [x] Implement `updateSession` monitor
- [x] Implement `updateIntegrations` monitor
- [x] Implement `detectDevice` monitor
- [x] Inject core status into system prompt
- [x] Add basic UI status bar (collapsed only)

### Phase 2: Proactive Helper (Build 714) ✅ COMPLETE
- [x] Implement `updateTreeHealth` monitor
- [x] Implement `predictNextAction` with simple pattern matching
- [x] Implement `getUndiscoveredFeatures`
- [x] Add tree health injection
- [x] Add proactive suggestions injection

### Phase 3: Self-Debugging (Build 715) ✅ COMPLETE
- [x] Implement `assessConfidence` monitor
- [x] Track tool failures
- [x] Implement hallucination risk assessment
- [x] Add confidence guidance injection
- [x] Surface confidence in UI

### Phase 4: Personalization (Build 716) ✅ COMPLETE
- [x] Implement `detectUserState` with frustration detection
- [x] Add expertise level detection
- [x] Add frustration response injection
- [x] Persist user preferences to localStorage

### Phase 5: Polish (Build 717) ✅ COMPLETE
- [x] Expandable UI with full stats
- [x] Cost tracking and display
- [x] Performance tuning
- [x] Documentation

---

## Success Criteria

| Metric | Target |
|--------|--------|
| Token overhead per message | < 200 average |
| Proactive suggestions accepted | > 30% |
| Frustration detection accuracy | > 80% |
| User-reported helpfulness | Increase |
| Feature discovery rate | Increase |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Token overhead too high | Selective injection, monitor budgets |
| Proactive suggestions annoying | "Don't force" instruction, decay |
| Frustration detection false positives | Require threshold >= 2, decay |
| Performance impact | Event-triggered only, no polling |

---

## Open Questions (Resolved)

1. ~~Should awareness persist across sessions (localStorage)?~~
   **RESOLVED:** Yes, partially. Persist: `user`, `config`, `session.cumulativeCost`, `integrations`. Reset: `confidence`, `predictions`, `tree` (tree file might change).

2. ~~Should users be able to disable specific awareness features?~~
   **RESOLVED:** Yes. Added `config.quietMode` to disable proactive suggestions. Power users hate unsolicited advice.

3. ~~How to handle awareness when tree is very large (1000+ nodes)?~~
   **RESOLVED:** Spatial locality sampling (selected node + siblings, recently edited, random) + `requestIdleCallback` + dirty Set pattern.

---

## Review Feedback (2026-01-03)

### GPT Review

GPT review identified three critical issues, now addressed:

| Issue | Original Design | Fix Applied |
|-------|-----------------|-------------|
| **Over-trusts prompts as control plane** | Inject awareness into every prompt | App-side decision engine first; inject only when it materially changes behavior |
| **Hedging-based confidence is noisy** | Count "maybe/perhaps/might" words | Tool-grounded signals: did tools run? succeed? cite sources? |
| **Tree health full scans stutter** | `updateTreeHealth()` on every mutation | Dirty flags + 500ms debounce + sampling for 1k+ nodes |

### Gemini Review

Gemini validated the design as "Green Light" and provided refinements:

| Issue | Original Design | Fix Applied |
|-------|-----------------|-------------|
| **Sampling trap (head/tail)** | Sample first/last 100 nodes | Spatial locality: selected node + siblings, recently edited, random |
| **setTimeout blocks main thread** | 500ms debounce with setTimeout | `requestIdleCallback` with fallback for Safari |
| **Frustration false positives** | Regex only ("What??" = frustrated) | Add repetition detection + positive sentiment filter |
| **Hallucination risk for chit-chat** | "Hi" with no tools = High risk | Check for entity types; chit-chat = Low risk |
| **No persistence** | All state resets on reload | Persist: user, config, cumulativeCost. Reset: confidence, tree |
| **No user control** | No way to disable features | Added `config.quietMode` for power users |
| **Dirty boolean inefficient** | Boolean flag triggers full scan | Dirty Set of node IDs → O(k) for small edits |

### Priority Adjustment (Gemini)

Consider swapping Phase 3 ↔ Phase 4:
- **Personalization** (expertise-based verbosity) may be higher value than **Self-Debugging** (confidence tracking)
- Rationale: "Don't explain JSON to me, I know it" is immediate user value

### Key Architectural Change

```
BEFORE: tbAwareness → Always inject → System prompt → Token tax
AFTER:  tbAwareness → App-side decisions (UI, routing, tool selection)
                    → Inject ONLY when it changes response behavior
```

---

## References

### Prior Art (Pre-Awareness)
- Build 707: Confidence Scoring in Preflight Check
- Build 711: Action Memory & Multi-step Execution
- Build 712: Capability Orchestrator + Model Awareness

### Awareness System Implementation
- Build 713: Foundation - tbAwareness object, monitors, core injection
- Build 714: Proactive Helper - Tree health, predictions, undiscovered features
- Build 715: Self-Debugging - Confidence assessment, failure tracking, hallucination risk
- Build 716: Personalization - Frustration detection, expertise, communication style
- Build 717: Polish - Expandable UI, cost tracking, health indicators

### Related Features (Post-Awareness)
- Build 747: TB Task Orchestration Protocol (uses awareness for capability routing)
- Build 751: Triage Agent (extends awareness patterns for background monitoring)
- Build 754: CC Capability Discovery (integrates with tbAwareness.integrations)

---

*Design completed: 2026-01-03*
*Implementation completed: Builds 713-717*
*Last reviewed: 2026-01-18 (Build 872)*
