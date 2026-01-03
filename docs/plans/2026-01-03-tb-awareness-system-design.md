# TB Awareness System Design

**Build:** 713+
**Effort:** Medium (phased implementation)
**Priority:** A (Proactive Helper) → B (Self-Debugging) → C (Personalization)

---

## Problem Statement

TreeBeard has access to 340+ commands, multiple AI models, MCP integration, camera, voice, and more—but lacks **self-awareness** about:
- What it can do (solved in Build 712 with Capability Orchestrator)
- Which AI model powers it (solved in Build 712)
- Session context, user state, tree health, and optimization opportunities

**Result:** TB can't proactively help, can't adapt to user frustration, and can't suggest optimizations. Users must discover features manually.

---

## Solution: Unified Awareness Architecture

A central `tbAwareness` object populated by lightweight monitors, with selective injection into system prompts based on relevance.

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
    // TIER 1: PROACTIVE HELPER (Priority A)
    // ═══════════════════════════════════════════════════════
    session: {
        startTime: Date.now(),
        messageCount: 0,
        commandsExecuted: [],       // History for pattern detection
        lastActivity: Date.now(),
        tokensUsed: 0,
        estimatedCost: 0            // ~$3/1M tokens
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
    confidence: {
        lastResponseConfidence: 0.8, // 0-1 based on hedging language
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
    user: {
        expertiseLevel: 'intermediate', // beginner/intermediate/expert
        preferredResponseLength: 'medium',
        frustrationSignals: 0,          // Increments on "??", repeats
        communicationStyle: 'neutral'   // brief/detailed/technical
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

// Runs: After tree mutations (add/delete/edit node)
updateTreeHealth() {
    const t = tbAwareness.tree;
    const nodes = getAllNodes(capexTree);
    t.nodeCount = nodes.length;
    t.nodesWithoutDescription = nodes.filter(n => !n.description?.trim());
    t.orphanNodes = findOrphanNodes(capexTree);
    t.completenessScore = calculateCompleteness(capexTree);
    t.recentlyEdited = nodes.filter(n =>
        Date.now() - (n.lastModified || 0) < 300000
    );
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
assessConfidence(response, toolResults) {
    const c = tbAwareness.confidence;

    // Check for hedging language
    const hedges = (response.match(/maybe|perhaps|might|not sure|I think/gi) || []).length;
    c.lastResponseConfidence = Math.max(0.3, 1 - (hedges * 0.15));

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

    c.hallucinationRisk = assessHallucinationRisk(response, context);
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
// Runs: After each user message
detectUserState(message) {
    const u = tbAwareness.user;

    // Frustration signals
    if (/^\?+$|^what\?|you (said|told)|again|already|still|why (isn't|won't|can't)/i.test(message)) {
        u.frustrationSignals++;
    } else if (u.frustrationSignals > 0) {
        u.frustrationSignals -= 0.5; // Decay over time
    }

    // Expertise detection
    if (/\b(API|regex|JSON|schema|webhook|MCP)\b/i.test(message)) {
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

| Monitor | Trigger | Frequency |
|---------|---------|-----------|
| `updateSession` | After TB send | Every message |
| `updateTreeHealth` | After tree mutation | On change |
| `predictNextAction` | Before AI call | Every message |
| `assessConfidence` | After AI response | Every response |
| `updateIntegrations` | Page load, connection change | Rare |
| `detectUserState` | After user message | Every message |
| `detectDevice` | Page load | Once |

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

### Phase 1: Foundation (Build 713)
- [ ] Create `tbAwareness` object structure
- [ ] Implement `updateSession` monitor
- [ ] Implement `updateIntegrations` monitor
- [ ] Implement `detectDevice` monitor
- [ ] Inject core status into system prompt
- [ ] Add basic UI status bar (collapsed only)

### Phase 2: Proactive Helper (Build 714)
- [ ] Implement `updateTreeHealth` monitor
- [ ] Implement `predictNextAction` with simple pattern matching
- [ ] Implement `getUndiscoveredFeatures`
- [ ] Add tree health injection
- [ ] Add proactive suggestions injection

### Phase 3: Self-Debugging (Build 715)
- [ ] Implement `assessConfidence` monitor
- [ ] Track tool failures
- [ ] Implement hallucination risk assessment
- [ ] Add confidence guidance injection
- [ ] Surface confidence in UI

### Phase 4: Personalization (Build 716)
- [ ] Implement `detectUserState` with frustration detection
- [ ] Add expertise level detection
- [ ] Add frustration response injection
- [ ] Persist user preferences to localStorage

### Phase 5: Polish (Build 717)
- [ ] Expandable UI with full stats
- [ ] Cost tracking and display
- [ ] Performance tuning
- [ ] Documentation

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

## Open Questions

1. Should awareness persist across sessions (localStorage)?
2. Should users be able to disable specific awareness features?
3. How to handle awareness when tree is very large (1000+ nodes)?

---

## References

- Build 712: Capability Orchestrator + Model Awareness
- Build 707: Confidence Scoring in Preflight Check
- Build 711: Action Memory & Multi-step Execution
