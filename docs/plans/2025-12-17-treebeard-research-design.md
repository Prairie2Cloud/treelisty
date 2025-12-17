# Treebeard Research Mode Design

**Date**: 2025-12-17
**Status**: Draft
**Target Build**: 441+

---

## Overview

Add external research capabilities to Treebeard using existing AI providers' built-in web search, requiring zero new vendors or API keys.

---

## Problem

Treebeard can only analyze the current tree. When users ask research questions ("find competitors to my SaaS idea", "what year did Joan of Arc die?"), Treebeard either:
- Misunderstands and offers to analyze tree data
- Correctly admits it can't access external information

Users expect an AI assistant to help with research, not just tree manipulation.

---

## Solution

Enable Gemini and ChatGPT's native web search capabilities for research tasks:

| Provider | Web Search | How to Enable |
|----------|-----------|---------------|
| Claude | No | N/A (knowledge cutoff only) |
| Gemini | Yes | `tools: [{ googleSearch: {} }]` |
| ChatGPT | Yes | Enable browsing in API call |

Route research requests to web-capable providers with pattern-aware prompts.

---

## User Experience

### Interaction Flow

1. User asks Treebeard: "Research competitors to Notion"
2. Treebeard detects research intent
3. Routes to Gemini/ChatGPT with web search enabled
4. Streams progress:
   ```
   🔍 Searching for Notion competitors...
   📄 Found sources: TechCrunch, G2, Capterra...
   📝 Analyzing findings...
   ```
5. Returns structured results with sources
6. Offers to create nodes from findings

### Background Mode (Optional)

For longer research tasks:
- User clicks "Run in background"
- Toast: "Research running... I'll notify you when done"
- User continues working
- Notification + results panel when complete

---

## Research Modes

### 1. Direct Research (User-Initiated)

User explicitly asks for research:
- "Research X"
- "Find information about Y"
- "What do sources say about Z"

### 2. Context Enrichment (Node-Triggered)

User selects a node, clicks "Enrich with Research":
- Treebeard searches for relevant external info
- Suggests additions to description, notes, or child nodes
- User approves before changes apply

---

## Pattern-Aware Prompts

Research prompts adapt to current pattern:

| Pattern | Research Focus |
|---------|---------------|
| Generic | General web search, summarize findings |
| CAPEX | Costs, vendors, lead times, risks, market data |
| Philosophy | Scholarly sources, author citations, counter-arguments |
| Sales | Company info, funding, decision makers, competitors |
| LifeTree | Biographical facts, dates, locations, source verification |
| Film/Veo3/Sora2 | Visual references, technique breakdowns, examples |
| Thesis | Academic papers, citations, methodology comparisons |

### Example System Prompt (CAPEX)

```
You are researching for a CAPEX (capital expenditure) project.

Focus on:
- Vendor options and pricing
- Lead times and delivery schedules
- Risk factors and mitigation strategies
- Market conditions and trends
- Total cost of ownership

Return findings as structured JSON:
{
  "summary": "Brief overview",
  "findings": [
    { "topic": "...", "detail": "...", "source": "..." }
  ],
  "suggestedNodes": [
    { "name": "...", "description": "...", "type": "item" }
  ],
  "sources": [
    { "title": "...", "url": "...", "relevance": "..." }
  ]
}
```

---

## Intent Detection

Treebeard determines if a message is a research request:

**Research indicators:**
- Keywords: "research", "find", "search", "look up", "what is", "who is", "when did"
- Questions about external facts (not tree structure)
- Requests for competitive analysis, market data, biographical info

**Non-research (existing behavior):**
- Tree manipulation: "add a phase", "delete this node"
- Tree analysis: "which items have the most children"
- UI actions: "switch to canvas view", "enable dark mode"

### Fallback

If intent is ambiguous, Treebeard asks:
> "Would you like me to search the web for this, or analyze your current tree?"

---

## Provider Selection

When research is detected:

1. Check available providers (user's configured API keys)
2. Prefer Gemini (fastest, best search integration)
3. Fall back to ChatGPT if Gemini unavailable
4. If only Claude available, explain limitation and offer alternatives

```javascript
function selectResearchProvider() {
  if (hasGeminiKey()) return 'gemini';
  if (hasChatGPTKey()) return 'chatgpt';
  return null; // Will show "research requires Gemini or ChatGPT" message
}
```

---

## Streaming Implementation

### Gemini with Search Grounding

```javascript
const response = await fetch(GEMINI_ENDPOINT, {
  method: 'POST',
  body: JSON.stringify({
    contents: [{
      role: 'user',
      parts: [{ text: researchPrompt }]
    }],
    tools: [{
      googleSearch: {}
    }],
    generationConfig: {
      temperature: 0.7
    }
  })
});

// Stream response chunks to UI
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  updateResearchProgress(decode(value));
}
```

### Progress UI

```html
<div id="research-progress" class="research-panel">
  <div class="research-status">
    <span class="spinner"></span>
    <span id="research-stage">Searching...</span>
  </div>
  <div id="research-stream" class="research-content">
    <!-- Streamed content appears here -->
  </div>
  <div class="research-actions">
    <button onclick="runInBackground()">Run in Background</button>
    <button onclick="cancelResearch()">Cancel</button>
  </div>
</div>
```

---

## Output Format

### Structured Research Results

```json
{
  "summary": "Notion's main competitors include Coda, Obsidian, and Roam Research...",
  "findings": [
    {
      "topic": "Coda",
      "detail": "Doc-based workspace, strong on tables and automation. $10/user/mo.",
      "source": "https://coda.io/pricing"
    },
    {
      "topic": "Obsidian",
      "detail": "Local-first markdown, plugin ecosystem. Free for personal use.",
      "source": "https://obsidian.md"
    }
  ],
  "suggestedNodes": [
    {
      "name": "Coda",
      "description": "Doc-based workspace competitor. $10/user/mo.",
      "type": "item",
      "fields": { "cost": "$10/user/mo" }
    }
  ],
  "sources": [
    { "title": "G2 Notion Alternatives", "url": "https://g2.com/...", "relevance": "high" }
  ]
}
```

### Display in Chat

```
📊 Research Complete: Notion Competitors

**Summary**
Notion's main competitors include Coda, Obsidian, and Roam Research...

**Key Findings**
• **Coda** - Doc-based workspace, strong on tables. $10/user/mo
• **Obsidian** - Local-first markdown, plugin ecosystem. Free personal.
• **Roam Research** - Networked thought, backlinks. $15/mo

**Sources**
[G2 Notion Alternatives](https://g2.com/...) • [TechCrunch](https://...)

[➕ Add findings to tree]  [🔄 Research more]
```

---

## Auto-Create Nodes (Reuses Existing Append Infrastructure)

**Key insight**: TreeListy already has robust append/merge logic in `importAnalyzedTree()` (Build 319). We reuse it entirely.

### Existing Functions to Leverage

| Function | Location | What it does |
|----------|----------|--------------|
| `importAnalyzedTree(treeData, pattern, appendMode)` | Line ~41002 | Master append logic |
| `findSemanticDuplicate(items, newItem, threshold)` | Line ~40920 | Detects if finding already exists (60% similarity) |
| `mergeItemUpdates(existing, new)` | Line ~40970 | Enriches existing node with new research data |

### Implementation

When user clicks "Add findings to tree":

1. Format research results as tree structure:
```javascript
const researchTree = {
  projectName: capexTree.name,
  phases: [{
    name: targetPhase?.name || "Research Findings",
    items: response.suggestedNodes.map(node => ({
      name: node.name,
      description: node.description,
      notes: `Source: ${node.source}\nResearched: ${new Date().toISOString()}`,
      ...node.fields
    }))
  }]
};
```

2. Call existing append function:
```javascript
importAnalyzedTree(researchTree, currentPattern, true); // appendMode = true
```

3. Existing infrastructure handles:
   - Semantic deduplication (won't duplicate existing nodes)
   - Merging updates into existing items
   - Proper re-IDing of new nodes
   - Undo state saving
   - Stats display ("3 added, 1 updated")

**Lines of new code: ~20 (down from ~100)**

*Credit: User caught this reuse opportunity during design review.*

---

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| No web-capable provider configured | Show message: "Research requires Gemini or ChatGPT API key" with link to settings |
| Provider rate limited | Retry with exponential backoff, then suggest trying later |
| Research returns no results | "I couldn't find relevant information. Try rephrasing or being more specific." |
| User cancels mid-research | Stop stream, show partial results if available |
| Very long research (>60s) | Auto-switch to background mode, notify when done |
| Offline | "Research requires internet connection" |

---

## Settings

Add to AI Settings modal:

```
Research Settings
├── [x] Enable web research (requires Gemini or ChatGPT)
├── Preferred provider: [Gemini ▼]
├── [x] Auto-suggest adding findings to tree
└── [x] Show sources with results
```

Store in localStorage with existing AI settings.

---

## Commands

Add to Treebeard's COMMAND_REGISTRY:

```javascript
'research': (query) => {
  // Trigger research mode with query
  initiateResearch(query);
  return '🔍 Starting research...';
},

'enrich_node': () => {
  // Research based on selected node's content
  if (!selectedItemElement) return '⚠️ Select a node first';
  const nodeContent = getSelectedNodeContent();
  initiateResearch(`Find more information about: ${nodeContent}`);
  return '🔍 Researching node context...';
}
```

Update command vocabulary:
```
GLOBAL (work anytime):
• research:{query} - Search the web for information
• enrich_node - Research context for selected node
```

---

## Implementation Phases

### Phase 1: Core Research (MVP)
- Research intent detection
- Gemini Google Search integration
- Streaming progress UI
- Structured output display
- ~200 lines

### Phase 2: Pattern-Aware Prompts
- Pattern-specific research prompts
- Improved structured output
- Source citations
- ~100 lines

### Phase 3: Auto-Create Nodes
- "Add to tree" button in research results
- Format results for `importAnalyzedTree()`
- Reuses existing append/merge infrastructure
- ~20 lines (reduced from ~100 thanks to reuse)

### Phase 4: Context Enrichment
- "Enrich node" command
- Right-click menu integration
- ~80 lines

### Phase 5: Background Mode
- Run in background option
- Notification on completion
- Results panel
- ~100 lines

**Total estimate: ~500 lines** (down from ~580)

---

## Success Metrics

- Research queries answered without "I can't access external information"
- <10 seconds for initial results to stream
- >80% of suggested nodes are useful (user accepts them)
- Zero new API costs for users with existing Gemini/ChatGPT keys

---

## What This Doesn't Include

Explicitly out of scope (would require new infrastructure):

- Real-time precision data (stock tickers, live scores)
- PDF/document parsing
- Private data sources (company wikis, internal APIs)
- Code execution for data processing
- Full Claude Agent SDK integration

These could be Phase 2 of a larger "Research+" feature if demand exists.

---

## Design Decisions

1. **Research persistence**: Research results are appended directly into tree nodes as directed by the user. No separate "research history" - the tree IS the history.

2. **No quota warnings**: Users manage their own API costs via BYOK model.

3. **All views supported**: Research works in Tree, Canvas, and 3D views - Treebeard is view-agnostic.
