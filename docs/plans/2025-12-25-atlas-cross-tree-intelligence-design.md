# Atlas: Cross-Tree Intelligence Layer Design

**Date:** 2025-12-25
**Status:** Draft - Revised with Lead Dev Feedback
**Priority:** Strategic Feature
**Replaces:** TreeListy OS Dashboard (premature OS/Kernel approach)
**Revision:** v3 - Incorporates Gemini + OpenAI architecture feedback

---

## Executive Summary

Atlas is a lightweight cross-tree intelligence layer that enables search, backlinks, and unified task management across multiple TreeListy trees. It trades the premature complexity of a "TreeListy OS" for a focused feature set that creates immediate user stickiness.

**The Strategic Insight:**
> If Atlas works, the OS is inevitable. If Atlas fails, the OS wouldn't have saved you.

Atlas positions TreeListy as a "thinking environment" competing with Roam, Obsidian, and Notion in the PKM (Personal Knowledge Management) space, while maintaining our core strength in hierarchical decomposition.

---

## Critical Analysis

### Why Atlas Over "TreeListy OS"?

| Aspect | TreeListy OS (Rejected) | Atlas (Proposed) |
|--------|-------------------------|------------------|
| Scope | Full dashboard, service integrations | Cross-tree intelligence only |
| Dependencies | Chrome extension, MCP, multiple services | Self-contained, single-file compatible |
| Risk | High (many moving parts) | Low (derivative cache pattern) |
| Time to value | Months | Weeks |
| User friction | High (setup required) | Zero (works with existing trees) |
| Failure mode | Everything breaks | Just loses index, data safe |

### What Atlas Gets Right

1. **Index as Derivative Cache** - The trees remain the source of truth. Atlas index is disposable and reconstructible. This is architecturally sound.

2. **Lazy Reconciliation** - Startup doesn't block on full re-index. Smart timestamp checking means warm cache for unchanged trees.

3. **Flat Entry Model** - `AtlasEntry` is denormalized for query speed. Avoids tree traversal for every search.

4. **Graph Adjacency Lists** - Unified graph model merging hyperedges + backlinks for O(1) lookups.

5. **Lens Metaphor** - "Views, not apps" keeps cognitive overhead low. Overlays manipulate focus without context switching.

### Single-File Architecture Constraints (Critical)

TreeListy is a **monolithic single-file HTML application**. This creates unique challenges:

| Constraint | Impact | Solution |
|------------|--------|----------|
| No external JS imports | Can't `import MiniSearch` | Vendor library inline or Blob URL |
| User owns the file | Can't deploy updates | Quine self-injection pattern |
| DOM-heavy rendering | Main thread contention | Web Workers via Inline Blob |
| File identity fragile | Rename breaks links | Immutable internal UUID |
| Canvas view complexity | Z-index/event conflicts | Dedicated overlay layer |

---

## Phase-0: Identity Lockdown (CRITICAL PRE-REQUISITE)

**This must be completed before any Atlas work begins.**

The entire Atlas system depends on stable, permanent identifiers. Without this foundation, backlinks will "ghost" and user trust collapses.

### Tree Identity: Immutable `treeId`

```javascript
// capexTree root - REQUIRED SCHEMA UPDATE
{
  id: "root",
  treeId: "tree_a1b2c3d4", // Immutable, generated ONCE on tree creation
  uuid: "tree_a1b2c3d4-e5f6-7890-abcd-ef1234567890", // Full UUID for cross-device
  name: "Project Alpha", // Display name (can change)
  // ... rest of tree
}
```

**Rules:**
- `treeId` is generated once, persists forever
- Never derive identity from filename or `name`
- Migration: existing trees get `treeId = 'tree_' + crypto.randomUUID().slice(0,8)`

### Node Identity: Stable `nodeGuid`

**Problem:** Current node IDs like `item-0-1-3` are positional and change when nodes move.

```javascript
// CURRENT (fragile)
{ id: "item-0-1-3", name: "My Task" }

// REQUIRED (stable)
{
  id: "item-0-1-3", // Keep for backwards compat, but don't use for Atlas
  nodeGuid: "n_8f3a2b1c", // Stable, generated once, never changes
  name: "My Task"
}
```

**Migration Strategy:**
```javascript
function migrateNodeIdentity(node) {
  if (!node.nodeGuid) {
    // Generate stable GUID
    node.nodeGuid = `n_${crypto.randomUUID().slice(0, 8)}`;
  }
  return node;
}

// Apply recursively on tree load
function migrateTreeIdentity(tree) {
  if (!tree.treeId) {
    tree.treeId = `tree_${crypto.randomUUID().slice(0, 8)}`;
  }
  traverseTree(tree.children, migrateNodeIdentity);
  return tree;
}
```

### Canonical Link Format: UID-First

**The spec now mandates UID-based links as canonical storage format.**

```javascript
// CANONICAL (stored in node.description)
"See [[uid:tree_abc123:n_def456]] for details"

// USER-FRIENDLY (rendered in UI)
"See [[Project Alpha/My Task]] for details"

// SOFT LINK (user types this, resolved at save-time)
"See [[My Task]] for details"
```

**Resolution Logic:**
```javascript
function resolveSoftLink(linkText, currentTreeId, atlasIndex) {
  // 1. Search for exact title match in current tree
  const localMatches = atlasIndex.search(linkText, { treeId: currentTreeId, exact: true });

  // 2. If single match, auto-resolve
  if (localMatches.length === 1) {
    return {
      uid: `${localMatches[0].treeId}:${localMatches[0].nodeGuid}`,
      resolved: true
    };
  }

  // 3. If multiple matches, show disambiguation picker
  if (localMatches.length > 1) {
    return {
      candidates: localMatches,
      resolved: false,
      requiresUserChoice: true
    };
  }

  // 4. Search all trees
  const globalMatches = atlasIndex.search(linkText, { exact: true });
  if (globalMatches.length === 1) {
    return { uid: `${globalMatches[0].treeId}:${globalMatches[0].nodeGuid}`, resolved: true };
  }

  // 5. Unresolved - keep as soft link, warn user
  return { resolved: false, orphan: true };
}
```

**Why UID-First:**
- Title-based resolution creates "Schrödinger links" when titles collide
- Renames become safe (UID doesn't change)
- Cross-tree links work reliably
- Redirect maps handle edge cases (deleted nodes → tombstone)

---

## Technical Architecture (Revised)

### Critical Decision: Immutable Tree UUID

**Problem:** If user renames `ProjectAlpha.html` to `ProjectBeta.html`, Atlas treats it as a new tree.

**Solution:** Every tree has an immutable `uuid` in the root `capexTree` object.

```javascript
// capexTree root object - REQUIRED field
{
  id: "root",
  uuid: "tree_a1b2c3d4-e5f6-7890-abcd-ef1234567890", // Immutable, generated on tree creation
  name: "Project Alpha",
  // ... rest of tree
}
```

**Identity Resolution Logic:**

```javascript
function resolveTreeIdentity(treeData, filename) {
  const treeUuid = treeData.uuid;
  const existingEntry = atlasRegistry.findByUuid(treeUuid);

  if (existingEntry) {
    // Tree exists - check if filename changed (rename detection)
    if (existingEntry.filename !== filename) {
      console.log(`[Atlas] Tree renamed: ${existingEntry.filename} -> ${filename}`);
      existingEntry.filename = filename;
      existingEntry.displayName = treeData.name || filename;
    }
    return existingEntry.treeId; // Return existing ID
  } else {
    // New tree - register it
    return atlasRegistry.register(treeUuid, filename, treeData.name);
  }
}
```

**Migration for Existing Trees:**
```javascript
// On tree load, if uuid missing, generate and persist
if (!capexTree.uuid) {
  capexTree.uuid = `tree_${crypto.randomUUID()}`;
  saveState('Atlas: Added tree UUID');
}
```

### Critical Decision: Web Workers in Phase 1

**Problem:** Tokenization, stemming, and serialization on main thread causes UI jank during `loadTree` and startup reconciliation.

**Solution:** Inline Web Worker via Blob URL (maintains single-file portability).

```javascript
// ═══════════════════════════════════════════════════════════════
// ATLAS WEB WORKER (Inline Blob Pattern)
// Runs indexing off-main-thread to prevent UI freezes
// ═══════════════════════════════════════════════════════════════

const ATLAS_WORKER_CODE = `
// MiniSearch vendored inline (minified)
${MINISEARCH_VENDORED_SOURCE}

let searchIndex = null;
let entries = {};

self.onmessage = function(e) {
  const { type, payload, requestId } = e.data;

  switch (type) {
    case 'INIT':
      searchIndex = new MiniSearch({
        fields: ['title', 'contentSnippet', 'tags'],
        storeFields: ['uid', 'title', 'treeName', 'type', 'status'],
        searchOptions: { boost: { title: 2 }, fuzzy: 0.2, prefix: true }
      });
      self.postMessage({ type: 'INIT_COMPLETE', requestId });
      break;

    case 'INDEX_TREE':
      const { treeId, nodes } = payload;
      const newEntries = [];

      // Remove old entries for this tree
      Object.keys(entries).forEach(uid => {
        if (uid.startsWith(treeId + ':')) {
          searchIndex.remove(entries[uid]);
          delete entries[uid];
        }
      });

      // Index new nodes (chunked for responsiveness)
      nodes.forEach(node => {
        const entry = transformNodeToEntry(node, treeId);
        entries[entry.uid] = entry;
        searchIndex.add(entry);
        newEntries.push(entry);
      });

      self.postMessage({
        type: 'INDEX_COMPLETE',
        payload: { treeId, entryCount: newEntries.length },
        requestId
      });
      break;

    case 'SEARCH':
      const results = searchIndex.search(payload.query, payload.options);
      self.postMessage({
        type: 'SEARCH_RESULTS',
        payload: results.map(r => entries[r.id]),
        requestId
      });
      break;

    case 'GET_SERIALIZED':
      self.postMessage({
        type: 'SERIALIZED_INDEX',
        payload: {
          searchIndexJSON: JSON.stringify(searchIndex),
          entries: entries
        },
        requestId
      });
      break;

    case 'LOAD_SERIALIZED':
      searchIndex = MiniSearch.loadJSON(payload.searchIndexJSON, {
        fields: ['title', 'contentSnippet', 'tags'],
        storeFields: ['uid', 'title', 'treeName', 'type', 'status']
      });
      entries = payload.entries;
      self.postMessage({ type: 'LOAD_COMPLETE', requestId });
      break;
  }
};

function transformNodeToEntry(node, treeId) {
  return {
    uid: treeId + ':' + node.id,
    id: treeId + ':' + node.id, // MiniSearch requires 'id' field
    treeId: treeId,
    nodeId: node.id,
    title: node.name || '',
    contentSnippet: (node.description || '').substring(0, 200),
    type: inferNodeType(node),
    status: node.pmStatus || null,
    tags: extractTags(node),
    updatedAt: node.updatedAt || Date.now()
  };
}

function inferNodeType(node) {
  if (node.pmStatus) return 'task';
  if (node.type === 'decision') return 'decision';
  if (node.name?.includes('?')) return 'question';
  return 'note';
}

function extractTags(node) {
  const tags = [];
  if (node.pattern?.key) tags.push(node.pattern.key);
  // Extract #hashtags from description
  const hashtagMatch = (node.description || '').match(/#[\\w-]+/g);
  if (hashtagMatch) tags.push(...hashtagMatch.map(t => t.slice(1)));
  return tags;
}
`;

// Create worker from Blob URL
let atlasWorker = null;
let workerRequestId = 0;
const pendingWorkerRequests = new Map();

function initAtlasWorker() {
  const blob = new Blob([ATLAS_WORKER_CODE], { type: 'application/javascript' });
  atlasWorker = new Worker(URL.createObjectURL(blob));

  atlasWorker.onmessage = function(e) {
    const { type, payload, requestId } = e.data;
    const pending = pendingWorkerRequests.get(requestId);
    if (pending) {
      pending.resolve({ type, payload });
      pendingWorkerRequests.delete(requestId);
    }
  };

  atlasWorker.onerror = function(e) {
    console.error('[Atlas Worker] Error:', e.message);
  };

  return sendWorkerMessage('INIT');
}

function sendWorkerMessage(type, payload = {}) {
  return new Promise((resolve, reject) => {
    const requestId = ++workerRequestId;
    pendingWorkerRequests.set(requestId, { resolve, reject });
    atlasWorker.postMessage({ type, payload, requestId });
  });
}
```

**Why Phase 1:** The "Philosophy" pattern trees can have 2000+ nodes with long text. Without workers, startup freezes for 500ms+ which is unacceptable.

### Critical Decision: Debounced Idle Indexer

**Problem:** Reindexing the whole tree on every `saveState()` punishes fast typists with lag.

**Solution:** Debounced idle indexer with frequency cap.

```javascript
// ═══════════════════════════════════════════════════════════════
// ATLAS IDLE INDEXER
// Debounces rebuilds to avoid punishing fast typists
// ═══════════════════════════════════════════════════════════════

const ATLAS_INDEXER_CONFIG = {
  debounceMs: 750,      // Wait for typing to stop
  minIntervalMs: 5000,  // At most one rebuild per 5 seconds per tree
  maxPendingMs: 30000   // Force rebuild after 30s of continuous activity
};

let indexerState = {
  dirty: new Map(),           // treeId -> timestamp marked dirty
  lastRebuild: new Map(),     // treeId -> timestamp of last rebuild
  debounceTimer: null,
  forcePendingTimer: null
};

// Called from saveState() - marks tree dirty but doesn't rebuild
function atlasMarkDirty(treeId) {
  const now = Date.now();

  if (!indexerState.dirty.has(treeId)) {
    indexerState.dirty.set(treeId, now);
  }

  // Clear existing debounce
  if (indexerState.debounceTimer) {
    clearTimeout(indexerState.debounceTimer);
  }

  // Set new debounce
  indexerState.debounceTimer = setTimeout(() => {
    atlasProcessDirtyTrees();
  }, ATLAS_INDEXER_CONFIG.debounceMs);

  // Set force-pending timer if not set (handles continuous typing)
  if (!indexerState.forcePendingTimer) {
    indexerState.forcePendingTimer = setTimeout(() => {
      atlasProcessDirtyTrees();
      indexerState.forcePendingTimer = null;
    }, ATLAS_INDEXER_CONFIG.maxPendingMs);
  }
}

// Process all dirty trees (respecting min interval)
async function atlasProcessDirtyTrees() {
  const now = Date.now();

  for (const [treeId, dirtyTime] of indexerState.dirty) {
    const lastRebuild = indexerState.lastRebuild.get(treeId) || 0;
    const timeSinceRebuild = now - lastRebuild;

    if (timeSinceRebuild >= ATLAS_INDEXER_CONFIG.minIntervalMs) {
      // Safe to rebuild
      await atlasRebuildTree(treeId);
      indexerState.dirty.delete(treeId);
      indexerState.lastRebuild.set(treeId, now);
    } else {
      // Too soon - schedule for later
      const delay = ATLAS_INDEXER_CONFIG.minIntervalMs - timeSinceRebuild;
      setTimeout(() => atlasProcessDirtyTrees(), delay);
      break;
    }
  }

  // Clear force timer if all trees processed
  if (indexerState.dirty.size === 0 && indexerState.forcePendingTimer) {
    clearTimeout(indexerState.forcePendingTimer);
    indexerState.forcePendingTimer = null;
  }
}

// Explicit triggers (bypass debounce)
function atlasTriggerRebuildNow(treeId) {
  indexerState.dirty.set(treeId, Date.now());
  atlasProcessDirtyTrees();
}

// Called on tree switch - ensure index is fresh
function atlasOnTreeSwitch(fromTreeId, toTreeId) {
  if (indexerState.dirty.has(fromTreeId)) {
    atlasRebuildTree(fromTreeId); // Flush before switch
  }
  // Load/validate index for new tree
  atlasEnsureTreeIndexed(toTreeId);
}
```

**Trigger Points:**
- `saveState()` → `atlasMarkDirty(currentTreeId)`
- Tree switch → Flush pending, load new
- Cmd+K opened → Flush all pending (user expects fresh results)
- Explicit "Rebuild Atlas" button → Force immediate

### Critical Decision: Graph Edge Cleanup (Correctness)

**Problem:** The skeleton removes entries but doesn't purge edges. Backlinks will ghost.

**Solution:** Per-tree UID tracking with complete edge cleanup.

```javascript
// Track UIDs per tree for efficient purging
const treeUidSets = new Map(); // treeId -> Set<uid>

function atlasRemoveTreeFromGraph(treeId, graph) {
  const uidsToRemove = treeUidSets.get(treeId) || new Set();

  for (const uid of uidsToRemove) {
    // 1. Remove outbound edges from this node
    delete graph.edges[uid];

    // 2. Remove from reverse edges (this node as target)
    delete graph.reverseEdges[uid];

    // 3. CRITICAL: Prune this uid from OTHER nodes' reverse edges
    // (where this node was a source linking TO them)
    for (const [targetUid, sources] of Object.entries(graph.reverseEdges)) {
      graph.reverseEdges[targetUid] = sources.filter(s => s.sourceUid !== uid);
      if (graph.reverseEdges[targetUid].length === 0) {
        delete graph.reverseEdges[targetUid];
      }
    }

    // 4. Prune this uid from OTHER nodes' edges
    // (where other nodes linked TO this node)
    for (const [sourceUid, targets] of Object.entries(graph.edges)) {
      graph.edges[sourceUid] = targets.filter(t => t.targetUid !== uid);
      if (graph.edges[sourceUid].length === 0) {
        delete graph.edges[sourceUid];
      }
    }
  }

  // Clear the UID set for this tree
  treeUidSets.delete(treeId);
}

// Optimized version using index
function atlasRemoveTreeFromGraphOptimized(treeId, graph) {
  const uidsToRemove = treeUidSets.get(treeId) || new Set();

  // Build reverse lookup: which UIDs link TO each of our UIDs
  const incomingLinks = new Map(); // our uid -> [source uids]
  for (const uid of uidsToRemove) {
    incomingLinks.set(uid, graph.reverseEdges[uid]?.map(s => s.sourceUid) || []);
  }

  // Purge
  for (const uid of uidsToRemove) {
    // Remove our outbound edges
    delete graph.edges[uid];
    delete graph.reverseEdges[uid];

    // Remove references TO us from other nodes' edges
    const incomingSources = incomingLinks.get(uid) || [];
    for (const sourceUid of incomingSources) {
      if (!uidsToRemove.has(sourceUid) && graph.edges[sourceUid]) {
        graph.edges[sourceUid] = graph.edges[sourceUid].filter(t => t.targetUid !== uid);
      }
    }
  }

  treeUidSets.delete(treeId);
}
```

### Critical Decision: Link Contexts at Index Time

**Problem:** Computing "sentence containing the link" at render time is slow for many backlinks.

**Solution:** Capture link contexts during indexing, store in AtlasEntry.

```javascript
// Enhanced AtlasEntry with link contexts
interface AtlasEntry {
  // ... existing fields ...

  // Link contexts (captured at index time)
  linkContexts: LinkContext[];
}

interface LinkContext {
  targetUid: string;
  targetTitle: string; // For display without lookup
  excerpt: string; // ±60 chars around the link
  field: 'description' | 'name' | 'notes';
  charOffset: number; // Position in source text
}

// Extract links with context during indexing
function extractLinksWithContext(text, field = 'description') {
  const LINK_PATTERN = /\[\[([^\]]+)\]\]/g;
  const CONTEXT_CHARS = 60;
  const contexts = [];

  let match;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    const linkText = match[1];
    const startIdx = match.index;
    const endIdx = startIdx + match[0].length;

    // Extract surrounding context
    const excerptStart = Math.max(0, startIdx - CONTEXT_CHARS);
    const excerptEnd = Math.min(text.length, endIdx + CONTEXT_CHARS);
    let excerpt = text.slice(excerptStart, excerptEnd);

    // Add ellipsis if truncated
    if (excerptStart > 0) excerpt = '...' + excerpt;
    if (excerptEnd < text.length) excerpt = excerpt + '...';

    contexts.push({
      linkText,
      excerpt,
      field,
      charOffset: startIdx,
      // targetUid resolved later after link resolution
      targetUid: null,
      targetTitle: linkText
    });
  }

  return contexts;
}

// In worker: transform node to entry with contexts
function transformNodeToEntry(node, treeId, treeData) {
  const linkContexts = [];

  // Extract from description
  if (node.description) {
    linkContexts.push(...extractLinksWithContext(node.description, 'description'));
  }

  // Extract from notes (if pattern has notes field)
  if (node.notes) {
    linkContexts.push(...extractLinksWithContext(node.notes, 'notes'));
  }

  return {
    uid: `${treeId}:${node.nodeGuid}`,
    id: `${treeId}:${node.nodeGuid}`,
    // ... other fields ...
    linkContexts
  };
}
```

**Backlinks Pane Now Shows:**
```
📁 Project Alpha (2 backlinks)
  ├─ Meeting Notes Dec 20
  │  "...discussed the **Client X decision** with stakeholders..."
  │
  └─ Risk Assessment
     "...this depends on [[Client X Decision]] being finalized..."
```

### Critical Decision: Pattern-Aware Type Inference

**Problem:** Hardcoded type inference doesn't work across TreeListy's 21 patterns.

**Solution:** Per-pattern inference functions with user override.

```javascript
// Pattern-specific Atlas inference
const ATLAS_PATTERN_INFER = {
  'capex': (node) => ({
    type: node.cost > 0 ? 'task' : 'note',
    status: node.pmStatus || (node.approved ? 'done' : 'todo'),
    tags: [node.vendor, node.category].filter(Boolean)
  }),

  'philosophy': (node) => ({
    type: node.argumentType === 'claim' ? 'claim' :
          node.argumentType === 'objection' ? 'question' : 'note',
    status: null, // Philosophy nodes don't have status
    tags: [node.philosopher, node.era, node.school].filter(Boolean)
  }),

  'gmail': (node) => ({
    type: 'note',
    status: node.unread ? 'todo' : 'done',
    tags: (node.labels || []).filter(l => l !== 'inbox')
  }),

  'sales': (node) => ({
    type: 'task',
    status: node.stage === 'Closed Won' ? 'done' :
            node.stage === 'Closed Lost' ? 'blocked' : 'in_progress',
    tags: [node.stage, node.industry].filter(Boolean)
  }),

  'generic': (node) => ({
    type: node.pmStatus ? 'task' : 'note',
    status: node.pmStatus || null,
    tags: []
  }),

  // Fallback for unknown patterns
  '_default': (node) => ({
    type: 'note',
    status: node.pmStatus || null,
    tags: []
  })
};

function inferAtlasMetadata(node, patternKey) {
  // 1. Check for user override (stored in node)
  if (node.atlasOverride) {
    return {
      type: node.atlasOverride.type || 'note',
      status: node.atlasOverride.status || null,
      tags: node.atlasOverride.tags || []
    };
  }

  // 2. Use pattern-specific inference
  const inferFn = ATLAS_PATTERN_INFER[patternKey] || ATLAS_PATTERN_INFER['_default'];
  return inferFn(node);
}

// In info panel: allow user to override
function renderAtlasOverrideUI(node) {
  return `
    <div class="atlas-override-section">
      <label>Atlas Type Override:</label>
      <select onchange="setAtlasOverride('${node.id}', 'type', this.value)">
        <option value="">Auto-detect</option>
        <option value="note">Note</option>
        <option value="task">Task</option>
        <option value="decision">Decision</option>
        <option value="question">Question</option>
        <option value="claim">Claim</option>
      </select>
    </div>
  `;
}
```

### Critical Decision: Multi-Tab Coordination via BroadcastChannel

**Problem:** Multiple tabs rebuilding index simultaneously wastes resources and causes conflicts.

**Solution:** Lightweight coordination using BroadcastChannel.

```javascript
// ═══════════════════════════════════════════════════════════════
// ATLAS MULTI-TAB COORDINATION
// Prevents simultaneous rebuilds, keeps tabs in sync
// ═══════════════════════════════════════════════════════════════

const TAB_ID = `tab_${crypto.randomUUID().slice(0, 8)}`;
const atlasChannel = new BroadcastChannel('treelisty-atlas');

let coordinationState = {
  rebuildsInProgress: new Map(), // treeId -> tabId claiming it
  indexVersions: new Map()       // treeId -> version stamp
};

// Announce rebuild start
function atlasAnnounceRebuildStart(treeId) {
  atlasChannel.postMessage({
    type: 'REBUILD_START',
    treeId,
    tabId: TAB_ID,
    timestamp: Date.now()
  });
  coordinationState.rebuildsInProgress.set(treeId, TAB_ID);
}

// Announce rebuild complete
function atlasAnnounceRebuildComplete(treeId, version) {
  atlasChannel.postMessage({
    type: 'REBUILD_COMPLETE',
    treeId,
    tabId: TAB_ID,
    version,
    timestamp: Date.now()
  });
  coordinationState.rebuildsInProgress.delete(treeId);
  coordinationState.indexVersions.set(treeId, version);
}

// Listen for messages from other tabs
atlasChannel.onmessage = (event) => {
  const { type, treeId, tabId, version, timestamp } = event.data;

  switch (type) {
    case 'REBUILD_START':
      if (tabId !== TAB_ID) {
        // Another tab is rebuilding - don't duplicate
        coordinationState.rebuildsInProgress.set(treeId, tabId);
        console.log(`[Atlas] Tab ${tabId} is rebuilding ${treeId}, we'll wait`);
      }
      break;

    case 'REBUILD_COMPLETE':
      if (tabId !== TAB_ID) {
        // Another tab finished - reload from IndexedDB
        coordinationState.rebuildsInProgress.delete(treeId);
        coordinationState.indexVersions.set(treeId, version);
        atlasReloadFromStorage(treeId);
        console.log(`[Atlas] Tab ${tabId} finished ${treeId}, reloading`);
      }
      break;

    case 'REQUEST_REBUILD':
      // Another tab is asking if anyone has a fresh index
      if (coordinationState.indexVersions.has(treeId)) {
        atlasChannel.postMessage({
          type: 'INDEX_AVAILABLE',
          treeId,
          tabId: TAB_ID,
          version: coordinationState.indexVersions.get(treeId)
        });
      }
      break;
  }
};

// Check if we should rebuild or wait
async function atlasShouldRebuild(treeId) {
  // Check if another tab is already rebuilding
  if (coordinationState.rebuildsInProgress.has(treeId)) {
    const claimingTab = coordinationState.rebuildsInProgress.get(treeId);
    if (claimingTab !== TAB_ID) {
      console.log(`[Atlas] Skipping rebuild for ${treeId}, tab ${claimingTab} is handling it`);
      return false;
    }
  }
  return true;
}

// Wrapped rebuild function
async function atlasRebuildTree(treeId) {
  if (!await atlasShouldRebuild(treeId)) {
    return; // Another tab is handling it
  }

  atlasAnnounceRebuildStart(treeId);

  try {
    // Actual rebuild logic
    await sendWorkerMessage('INDEX_TREE', {
      treeId,
      nodes: flattenTree(getTreeById(treeId))
    });

    const version = Date.now();
    await atlasPeristToIndexedDB(treeId, version);
    atlasAnnounceRebuildComplete(treeId, version);

  } catch (e) {
    // Failed - release claim
    coordinationState.rebuildsInProgress.delete(treeId);
    throw e;
  }
}
```

### Critical Decision: Quine Distribution Pattern

**Problem:** How do users get Atlas updates? They own the HTML file.

**Solution:** Self-modifying save with version detection.

```javascript
// ═══════════════════════════════════════════════════════════════
// ATLAS VERSION MANAGEMENT (Quine Pattern)
// Detects outdated Atlas code and offers upgrade path
// ═══════════════════════════════════════════════════════════════

const ATLAS_VERSION = {
  major: 1,
  minor: 0,
  patch: 0,
  build: 573
};

// On app load, check if there's a newer Atlas version available
async function checkAtlasVersion() {
  // Only check if online and user opted in
  if (!navigator.onLine || !atlasSettings.autoUpdate) return;

  try {
    const response = await fetch('https://treelisty.netlify.app/atlas-version.json');
    const latest = await response.json();

    if (latest.build > ATLAS_VERSION.build) {
      showToast(`Atlas update available (Build ${latest.build})`, 'info');
      atlasState.updateAvailable = latest;
    }
  } catch (e) {
    // Offline or fetch failed - continue with current version
  }
}

// When user triggers update (explicit action required)
async function upgradeAtlasInPlace() {
  if (!atlasState.updateAvailable) return;

  try {
    // Fetch latest Atlas code block
    const response = await fetch('https://treelisty.netlify.app/atlas-module.js');
    const newAtlasCode = await response.text();

    // Inject into current document (dangerous - requires user confirmation)
    const confirmed = await showConfirmDialog(
      'Update Atlas?',
      'This will update the Atlas intelligence layer in your file. Your data is safe.'
    );

    if (confirmed) {
      // Find and replace Atlas code block in document
      // This is handled by the existing saveTreeToHTML mechanism
      atlasState.pendingCodeUpdate = newAtlasCode;
      saveState('Atlas: Upgraded to build ' + atlasState.updateAvailable.build);
      showToast('Atlas upgraded! Reload to activate.', 'success');
    }
  } catch (e) {
    showToast('Update failed: ' + e.message, 'error');
  }
}
```

**Conservative Approach:** Updates are opt-in and require explicit user action. The file remains fully functional offline with whatever Atlas version it has.

### Critical Decision: Unified Graph Model (Hyperedges + Backlinks)

**Problem:** TreeListy has `capexTree.hyperedges[]` for within-tree groupings. Atlas proposes a separate `AtlasGraph`. Two graph sources of truth is fragile.

**Solution:** Single unified graph that treats hyperedges as "strong links" and text mentions as "weak links".

```typescript
// Unified Graph Model
interface AtlasGraph {
  // All edges in one structure
  edges: {
    [sourceUid: string]: EdgeTarget[];
  };
  reverseEdges: {
    [targetUid: string]: EdgeSource[];
  };
}

interface EdgeTarget {
  targetUid: string;
  type: 'hyperedge' | 'mention' | 'dependency';
  strength: 'strong' | 'weak';
  hyperedgeId?: string; // If type is 'hyperedge'
  context?: string; // Surrounding text for 'mention' type
}

interface EdgeSource {
  sourceUid: string;
  type: 'hyperedge' | 'mention' | 'dependency';
  strength: 'strong' | 'weak';
  hyperedgeId?: string;
  context?: string;
}
```

**Indexing Logic:**

```javascript
function buildUnifiedGraph(treeId, treeData) {
  const graph = { edges: {}, reverseEdges: {} };

  // 1. Index hyperedges as strong links
  (treeData.hyperedges || []).forEach(he => {
    const nodeUids = he.nodeIds.map(nid => `${treeId}:${nid}`);

    // Hyperedge creates bidirectional strong links between all members
    nodeUids.forEach(sourceUid => {
      nodeUids.forEach(targetUid => {
        if (sourceUid !== targetUid) {
          addEdge(graph, sourceUid, {
            targetUid,
            type: 'hyperedge',
            strength: 'strong',
            hyperedgeId: he.id
          });
        }
      });
    });
  });

  // 2. Index dependencies as strong links
  traverseTree(treeData.children, (node) => {
    const sourceUid = `${treeId}:${node.id}`;
    (node.dependencies || []).forEach(dep => {
      const targetUid = `${treeId}:${dep.nodeId}`;
      addEdge(graph, sourceUid, {
        targetUid,
        type: 'dependency',
        strength: 'strong'
      });
    });
  });

  // 3. Index [[wiki-links]] as weak links
  traverseTree(treeData.children, (node) => {
    const sourceUid = `${treeId}:${node.id}`;
    const links = extractWikiLinks(node.description || '');

    links.forEach(link => {
      const targetUid = resolveLink(link, treeId);
      if (targetUid) {
        addEdge(graph, sourceUid, {
          targetUid,
          type: 'mention',
          strength: 'weak',
          context: link.surroundingText
        });
      }
    });
  });

  return graph;
}

function addEdge(graph, sourceUid, edge) {
  if (!graph.edges[sourceUid]) graph.edges[sourceUid] = [];
  graph.edges[sourceUid].push(edge);

  // Reverse edge for backlink lookups
  if (!graph.reverseEdges[edge.targetUid]) graph.reverseEdges[edge.targetUid] = [];
  graph.reverseEdges[edge.targetUid].push({
    sourceUid,
    type: edge.type,
    strength: edge.strength,
    hyperedgeId: edge.hyperedgeId,
    context: edge.context
  });
}
```

**Backlinks Pane Benefits:**
- Shows hyperedge memberships ("Part of 'Q1 Planning' group")
- Shows dependency relationships ("Blocks 'Phase 2 Start'")
- Shows text mentions ("Referenced in 'Meeting Notes'")
- All in one unified view

### Critical Decision: Overlay Architecture for Mobile/Canvas

**Problem:** Canvas view uses custom transforms and event handlers. Atlas overlays (Omni-bar, Backlinks pane) could fight for z-index and events.

**Solution:** Dedicated overlay container with strict event isolation.

```html
<!-- Atlas Overlay Layer - sits above ALL view content -->
<div id="atlas-overlay-layer" style="display: none;">
  <!-- Omni-bar Modal -->
  <div id="atlas-omnibar" class="atlas-modal">
    <input type="text" id="atlas-search-input" placeholder="Search across all trees...">
    <div id="atlas-search-results"></div>
    <div id="atlas-search-preview"></div>
  </div>

  <!-- Open Loops Modal -->
  <div id="atlas-openloops" class="atlas-modal">
    <!-- Table view content -->
  </div>
</div>

<!-- Backlinks Pane - integrates with info panel -->
<div id="atlas-backlinks-pane" class="atlas-sidebar">
  <!-- Collapsible backlinks content -->
</div>

<style>
#atlas-overlay-layer {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 99999; /* Above everything including canvas transforms */
  pointer-events: none; /* Pass through when inactive */
}

#atlas-overlay-layer.active {
  pointer-events: auto;
  background: rgba(0, 0, 0, 0.5);
}

.atlas-modal {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 800px;
  width: 90vw;
  max-height: 80vh;
  overflow: hidden;
}

/* Mobile: Full-screen modals */
@media (max-width: 768px) {
  .atlas-modal {
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    transform: none;
    max-width: 100vw;
    width: 100vw;
    max-height: 100vh;
    border-radius: 0;
  }
}
</style>
```

**Event Isolation:**

```javascript
// Strict event trapping when Atlas overlay is active
function activateAtlasOverlay(modalId) {
  const overlay = document.getElementById('atlas-overlay-layer');
  overlay.style.display = 'block';
  overlay.classList.add('active');

  // Trap all keyboard events
  document.addEventListener('keydown', atlasKeyboardTrap, true); // Capture phase

  // Focus the input
  const input = document.getElementById('atlas-search-input');
  if (input) input.focus();
}

function deactivateAtlasOverlay() {
  const overlay = document.getElementById('atlas-overlay-layer');
  overlay.style.display = 'none';
  overlay.classList.remove('active');

  document.removeEventListener('keydown', atlasKeyboardTrap, true);
}

function atlasKeyboardTrap(e) {
  // Allow Escape to close
  if (e.key === 'Escape') {
    deactivateAtlasOverlay();
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  // Allow navigation keys within Atlas
  if (['ArrowUp', 'ArrowDown', 'Enter', 'Tab'].includes(e.key)) {
    // Handle within Atlas - don't let canvas see these
    e.stopPropagation();
    handleAtlasNavigation(e);
    return;
  }

  // Block spacebar (canvas uses for panning)
  if (e.key === ' ' && e.target.tagName !== 'INPUT') {
    e.stopPropagation();
  }
}

// Global shortcut registration (respects overlay state)
document.addEventListener('keydown', (e) => {
  // Cmd+K or Ctrl+K - Open Omni-bar
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if (document.getElementById('atlas-overlay-layer').classList.contains('active')) {
      deactivateAtlasOverlay();
    } else {
      activateAtlasOverlay('atlas-omnibar');
    }
  }

  // Cmd+Shift+L - Open Loops
  if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'l') {
    e.preventDefault();
    activateAtlasOverlay('atlas-openloops');
  }
});
```

---

## Data Model (Revised)

```typescript
// Tree Registry - tracks mounted trees by immutable UUID
interface TreeRegistry {
  [treeUuid: string]: {
    treeId: string; // Short ID for composite UIDs
    uuid: string; // Immutable tree UUID
    filename: string; // Current filename (may change)
    displayName: string; // User-facing name
    rootNodeId: string;
    lastSyncedAt: number;
    nodeCount: number;
    contentHash: string; // For dirty detection
  };
}

// Atlas Entry - flattened node for query speed
interface AtlasEntry {
  // Composite ID (globally unique across trees)
  uid: string; // `${treeId}:${nodeId}`
  id: string; // Same as uid (MiniSearch requirement)

  // Provenance
  treeId: string;
  treeUuid: string; // Immutable reference
  nodeId: string;
  treeName: string; // Denormalized for display

  // Searchable Content
  title: string;
  contentSnippet: string; // First 200 chars
  tokens: string[]; // Pre-processed keywords

  // Semantic Metadata
  type: 'note' | 'task' | 'decision' | 'claim' | 'question' | 'item';
  status?: 'todo' | 'done' | 'waiting' | 'blocked' | 'in_progress';
  pattern?: string; // Pattern key (capex, philosophy, gmail, etc.)
  tags: string[];

  // Temporal
  createdAt?: number;
  updatedAt: number;

  // Structural
  parentUid: string | null;
  depth: number;
  hasChildren: boolean;
  icon?: string;
}

// Unified Graph (Hyperedges + Mentions + Dependencies)
interface AtlasGraph {
  edges: Record<string, EdgeTarget[]>;
  reverseEdges: Record<string, EdgeSource[]>;
}

interface EdgeTarget {
  targetUid: string;
  type: 'hyperedge' | 'mention' | 'dependency';
  strength: 'strong' | 'weak';
  hyperedgeId?: string;
  context?: string;
}

interface EdgeSource {
  sourceUid: string;
  type: 'hyperedge' | 'mention' | 'dependency';
  strength: 'strong' | 'weak';
  hyperedgeId?: string;
  context?: string;
}

// Persistence wrapper
interface AtlasStore {
  version: number;
  schemaVersion: number;
  lastUpdated: number;
  registry: TreeRegistry;
  // entries and searchIndex live in Web Worker
  graph: AtlasGraph;
}
```

---

## Library Selection (Revised)

### Search: MiniSearch (Vendored)

**Critical:** MiniSearch must be vendored inline, not fetched from CDN.

```javascript
// Option 1: Inline the minified source directly
const MINISEARCH_VENDORED_SOURCE = `/* MiniSearch v7.0.0 - minified */...`;

// Option 2: Lazy-load on first Atlas activation (with offline fallback)
let miniSearchLoaded = false;
async function ensureMiniSearchLoaded() {
  if (miniSearchLoaded) return;

  // Try inline version first
  if (typeof MiniSearch !== 'undefined') {
    miniSearchLoaded = true;
    return;
  }

  // Fallback: fetch from CDN (requires online)
  if (navigator.onLine) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/minisearch@7.0.0/dist/minisearch.min.js';
    await new Promise((resolve, reject) => {
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    miniSearchLoaded = true;
  } else {
    throw new Error('Atlas requires MiniSearch but offline and not vendored');
  }
}
```

**Recommendation:** Vendor MiniSearch inline. The 8KB gzipped cost is worth guaranteed offline functionality.

---

## Implementation Phases (Revised)

### Phase-0: Identity Lockdown (Build 573) - CRITICAL PREREQUISITE

**Goal:** Lock down stable identifiers before any Atlas work begins.

| Task | Description | Complexity | Priority |
|------|-------------|------------|----------|
| Add `treeId` to root | Immutable tree identifier | Low | **BLOCKER** |
| Add `nodeGuid` to nodes | Stable node identifier | Medium | **BLOCKER** |
| Migration function | Auto-upgrade existing trees | Medium | **BLOCKER** |
| UID link format | Define `[[uid:treeId:nodeGuid]]` canonical format | Low | High |
| Soft link resolver | Resolve `[[Title]]` to UID with disambiguation | Medium | High |

**Deliverables:**
- All trees have immutable `treeId`
- All nodes have stable `nodeGuid`
- Link format spec finalized
- Migration runs transparently on tree load

**Phase-0 Success Criteria:**
- Rename a tree file → Atlas still recognizes it
- Move a node → Links to it still work
- Title collision → Disambiguation picker appears

**Phase-0 Validation Results (2025-12-27):**

All identity stability tests passed. Validated via `test/atlas-phase0-validation.py`:

| Test | Result | Evidence |
|------|--------|----------|
| Move node preserves nodeGuid | ✅ PASS | Item moved between phases, nodeGuid unchanged |
| Export/import preserves treeId | ✅ PASS | Tree exported to JSON, reimported, treeId preserved |
| Duplicate creates new nodeGuid | ✅ PASS | Copy of node gets new unique nodeGuid |
| Migration adds IDs to legacy trees | ✅ PASS | Legacy tree (no IDs) gets treeId + nodeGuids after migration |
| Tree rename preserves IDs | ✅ PASS | Renaming tree name doesn't affect treeId or nodeGuids |

**Phase-0 Status:** ✅ **COMPLETE** - Identity foundation is solid. Ready for Phase-1.

**Why This Must Be First:**
> "If you ship backlinks on title-based resolution → users rename stuff → trust collapses ('your graph lies')."

---

### Phase 1: Foundation with Workers (Builds 574-577)

**Goal:** Core infrastructure with non-blocking indexing from day one.

| Task | Description | Complexity | Priority |
|------|-------------|------------|----------|
| Inline Web Worker | Blob URL pattern with MiniSearch | High | **Critical** |
| Debounced idle indexer | 750ms debounce, 5s min interval, 30s force | Medium | **Critical** |
| Graph edge cleanup | Per-tree UID tracking, complete edge purge | Medium | **Critical** |
| AtlasStore class | IndexedDB CRUD, versioning | Medium | High |
| Worker message protocol | Request/response with requestId | Medium | High |
| Dirty checking | Content hash comparison | Low | Medium |
| Vendor MiniSearch | Inline or lazy-load with fallback | Low | High |
| Link context extraction | Store excerpts at index time | Medium | High |
| Multi-tab coordination | BroadcastChannel for rebuild coordination | Medium | Medium |
| Pattern-aware inference | Per-pattern type/status inference | Medium | Medium |

**Deliverables:**
- Web Worker indexes trees off-main-thread
- Debounced indexing (no lag during typing)
- Complete graph edge cleanup (no ghost backlinks)
- Link contexts captured at index time
- Multi-tab coordination prevents duplicate rebuilds

**Phase 1 Success Criteria:**
- 2000-node tree indexes in <100ms (worker time)
- UI remains at 60fps during indexing
- Index rebuild never happens more than once per 5 seconds
- No ghost backlinks after node deletion

### Phase 2: Multi-Tree Registry (Builds 578-580)

**Goal:** Track and index multiple trees with rename detection.

| Task | Description | Complexity |
|------|-------------|------------|
| TreeRegistry management | Register/unregister by UUID | Medium |
| Rename detection | UUID match + filename diff | Low |
| Lazy reconciler | Startup dirty checking via hash | Medium |
| Cross-tree link resolution | `[[tree/node]]` to UID | Medium |
| Unified graph builder | Hyperedges + mentions + dependencies | High |

**Deliverables:**
- Trees tracked across sessions by UUID
- File renames handled gracefully
- Unified graph with all edge types

### Phase 3: Global Search Lens (Builds 581-583)

**Goal:** Cmd+K omni-bar with proper event isolation.

| Task | Description | Complexity |
|------|-------------|------------|
| Overlay layer | z-index 99999, event trapping | Medium |
| Omni-bar UI | Modal with input, results, preview | Medium |
| Query parser | `type:`, `in:`, `status:` filters | Medium |
| Result ranking | Recency + relevance + backlink count | Low |
| Jump-to-node | Load tree if needed, select node | Medium |
| Mobile adaptation | Full-screen modal, touch-friendly | Medium |

**Deliverables:**
- Working Cmd+K search across all indexed trees
- Doesn't interfere with Canvas view
- Works on mobile

### Phase 4: Backlinks Pane (Builds 584-586)

**Goal:** Contextual backlinks showing all edge types.

| Task | Description | Complexity |
|------|-------------|------------|
| Backlinks panel UI | Collapsible in info panel | Medium |
| Edge type display | Hyperedge vs mention vs dependency | Medium |
| Context extraction | Sentence surrounding link | Medium |
| Group by tree | Organized display | Low |
| Click-to-navigate | Jump to source node | Low |

**Deliverables:**
- Backlinks visible for any selected node
- Shows hyperedge memberships
- Shows dependency relationships
- Shows text mentions with context

### Phase 5: Open Loops Matrix (Builds 587-589)

**Goal:** Cross-tree task management view.

| Task | Description | Complexity |
|------|-------------|------------|
| Table view UI | Full-screen overlay | Medium |
| Query: incomplete items | `status != done/archived` | Low |
| Sorting | By age, status, tree | Low |
| Peep modal | Edit-in-place without tree switch | Medium |
| Export | Markdown, CSV | Low |

**Deliverables:**
- All open tasks visible in one view
- Edit without context switching
- Export for external tools

### Phase 6: Polish & Distribution (Builds 590-592)

| Task | Description | Complexity |
|------|-------------|------------|
| Version checking | Check for Atlas updates | Low |
| Quine upgrade | Self-inject new Atlas code | High |
| Virtual scrolling | Large result sets | Medium |
| Orphan detection | UI for broken links | Low |
| Settings | Enable/disable lenses, shortcuts | Low |

---

## Success Metrics (Revised)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Index build time (1000 nodes) | < 100ms (worker) | Performance.now() in worker |
| UI frame drops during indexing | 0 | DevTools Performance |
| Search latency | < 20ms | Time to first result |
| IndexedDB size (10 trees, 5000 nodes) | < 5MB | StorageManager API |
| Cmd+K activation to result click | < 3 seconds | User testing |
| Backlink lookup | < 5ms | Graph adjacency |
| Tree rename handled correctly | 100% | Automated test |
| Offline functionality | Full | Manual test |

---

## Risk Register (Revised)

### High Risk: Main Thread Blocking (MITIGATED)

**Original Risk:** Indexing blocks UI, causes jank.

**Mitigation:** Web Workers in Phase 1. Inline Blob pattern maintains single-file portability.

**Residual Risk:** Worker initialization adds ~50ms on first load.

### High Risk: Tree Identity Fragmentation (MITIGATED)

**Original Risk:** File renames create duplicate trees in index.

**Mitigation:** Immutable UUID in capexTree root. Registry matches by UUID, updates filename on mismatch.

**Residual Risk:** Very old trees without UUID need migration path.

### Medium Risk: IndexedDB Quota

**Trigger:** User has many large trees, quota exceeded.

**Contingency:**
1. LRU eviction of oldest tree entries
2. Compress content snippets
3. Reduce token count per entry
4. Show warning, offer export

### Medium Risk: Quine Update Failures

**Trigger:** Self-injection fails, corrupts file.

**Contingency:**
1. Always backup before injection
2. Validate new code before writing
3. Offer manual download as fallback
4. Version locked to known-good if injection fails

### Low Risk: Canvas Event Conflicts (MITIGATED)

**Original Risk:** Atlas overlays fight with Canvas for events.

**Mitigation:** Dedicated overlay layer at z-index 99999 with capture-phase event trapping.

**Residual Risk:** Complex gesture interactions on mobile.

---

## Decision Log (Revised)

| Date | Decision | Rationale | Source |
|------|----------|-----------|--------|
| 2025-12-25 | Choose Atlas over TreeListy OS | Reduce scope, faster value delivery | Original |
| 2025-12-25 | Use MiniSearch | Best balance of features and size | Original |
| 2025-12-25 | IndexedDB for persistence | Avoids HTML bloat, clean invalidation | Original |
| 2025-12-25 | Lens metaphor | Consistent with TreeListy's view philosophy | Original |
| 2025-12-25 | **Web Workers in Phase 1** | Non-negotiable for UX quality (main thread trap) | Gemini |
| 2025-12-25 | **Immutable Tree UUID** | File identity must survive renames | Gemini |
| 2025-12-25 | **Vendor MiniSearch inline** | Offline-first, single-file philosophy | Gemini |
| 2025-12-25 | **Unified Graph Model** | Single source of truth for all edge types | Gemini |
| 2025-12-25 | **Quine update pattern** | User-owned files need self-update mechanism | Gemini |
| 2025-12-25 | **Overlay z-index 99999** | Prevent Canvas view event conflicts | Gemini |
| 2025-12-25 | **Phase-0 identity lockdown** | Foundation must be solid before Atlas | OpenAI |
| 2025-12-25 | **Stable nodeGuid per node** | Positional IDs break on move | OpenAI |
| 2025-12-25 | **UID-first canonical links** | Title collisions create Schrödinger links | OpenAI |
| 2025-12-25 | **Debounced idle indexer** | Don't punish fast typists (750ms debounce) | OpenAI |
| 2025-12-25 | **Complete graph edge cleanup** | Backlinks will ghost without proper purge | OpenAI |
| 2025-12-25 | **Link contexts at index time** | Render-time context extraction is slow | OpenAI |
| 2025-12-25 | **Pattern-aware type inference** | 21 patterns need custom inference | OpenAI |
| 2025-12-25 | **BroadcastChannel coordination** | Prevent multi-tab rebuild conflicts | OpenAI |
| 2025-12-25 | **Soft link → UID resolution** | Disambiguate at save-time, store UID | OpenAI |
| 2025-12-25 | **Quine marker tags** | Explicit `<!-- ATLAS_CORE_START -->` markers | Gemini Final |
| 2025-12-25 | **Opportunistic link hardening** | Write UID back on browse, not bulk replace | Gemini Final |
| 2025-12-25 | **Robust link regex with aliases** | Handle `[[uid:x|Alias]]` format | Gemini Final |
| 2025-12-25 | **Zombie tab timeout (15s)** | Steal stale BroadcastChannel locks | Gemini Final |
| 2025-12-25 | **Single `uidOf()` helper** | Enforce nodeGuid everywhere, not node.id | OpenAI Final |
| 2025-12-25 | **Hyperedge-as-entity** | Avoid O(k²) clique edges | OpenAI Final |
| 2025-12-25 | **MiniSearch proper API** | Use `toJSON()`/`loadJSON()` not stringify | OpenAI Final |
| 2025-12-25 | **Worker chunking with yield** | Prevent long tasks on big trees | OpenAI Final |
| 2025-12-25 | **Tree clone/fork detection** | Detect duplicate UUIDs, offer fork | OpenAI Final |
| 2025-12-25 | **Content-only dirty detection** | Don't rebuild for view/layout changes | OpenAI Final |
| 2025-12-25 | **Download-first update** | Quine injection as advanced option | OpenAI Final |

---

## Appendix A: Implementation Safeguards (Final Review)

These safeguards address edge cases identified in the final architecture review.

### Safeguard 1: Quine Injection with Marker Tags

**Risk:** Regex-based code replacement is fragile. Whitespace changes could corrupt the file.

**Solution:** Use explicit, immutable marker comments.

```html
<!-- ATLAS_CORE_START v1 -->
<script id="atlas-core">
  // Atlas code here...
</script>
<!-- ATLAS_CORE_END -->
```

**Upgrade Logic:**
```javascript
async function upgradeAtlasInPlace(newCode) {
  const START_MARKER = '<!-- ATLAS_CORE_START';
  const END_MARKER = '<!-- ATLAS_CORE_END -->';

  const html = document.documentElement.outerHTML;
  const startIdx = html.indexOf(START_MARKER);
  const endIdx = html.indexOf(END_MARKER);

  // SAFETY CHECK: Abort if markers missing
  if (startIdx === -1 || endIdx === -1) {
    showToast('Atlas update failed: markers not found. File unchanged.', 'error');
    console.error('[Atlas] Cannot upgrade: missing ATLAS_CORE markers');
    return false;
  }

  // Find the actual end (after the closing marker)
  const actualEnd = endIdx + END_MARKER.length;

  // Build new HTML with version bump in marker
  const newVersion = ATLAS_VERSION.build + 1;
  const newBlock = `<!-- ATLAS_CORE_START v${newVersion} -->\n${newCode}\n<!-- ATLAS_CORE_END -->`;

  const newHtml = html.substring(0, startIdx) + newBlock + html.substring(actualEnd);

  // Validate before writing
  if (!newHtml.includes('ATLAS_CORE_START') || !newHtml.includes('function atlasInit')) {
    showToast('Atlas update validation failed. File unchanged.', 'error');
    return false;
  }

  // Proceed with save
  return newHtml;
}
```

### Safeguard 2: Opportunistic Link Hardening

**Risk:** Soft links `[[My Task]]` break when nodes are renamed. Read-time resolution isn't enough.

**Solution:** Harden links as users browse (write UID back to source text).

```javascript
// When user views a node, opportunistically harden soft links
async function hardenSoftLinksOnView(node) {
  if (!node.description) return;

  const SOFT_LINK_PATTERN = /\[\[([^\]|:]+)\]\]/g; // Matches [[Text]] but not [[uid:...]]
  let modified = false;
  let newDescription = node.description;

  let match;
  while ((match = SOFT_LINK_PATTERN.exec(node.description)) !== null) {
    const linkText = match[1];
    const resolved = resolveSoftLink(linkText, currentTreeId, atlasIndex);

    if (resolved.resolved && resolved.uid) {
      // Single unique match - harden it!
      const hardLink = `[[uid:${resolved.uid}|${linkText}]]`;
      newDescription = newDescription.replace(match[0], hardLink);
      modified = true;
      console.log(`[Atlas] Hardened link: "${linkText}" → ${resolved.uid}`);
    }
    // If ambiguous or unresolved, leave as soft link
  }

  if (modified) {
    node.description = newDescription;
    // Mark dirty but don't trigger full undo state (silent migration)
    atlasMarkDirty(currentTreeId);
  }
}

// Call when node is selected/viewed
function onNodeSelected(nodeId) {
  const node = getNodeById(nodeId);
  hardenSoftLinksOnView(node); // Async, non-blocking
  // ... rest of selection logic
}
```

**Benefits:**
- Graph hardens gradually as users browse
- No risky bulk regex-replace across entire file
- Users see valid links immediately, UID written silently

### Safeguard 3: Robust Link Pattern with Aliases

**Risk:** Simple regex breaks on piped aliases `[[uid:123|My Alias]]` and nested brackets.

**Solution:** Updated pattern handling all link formats.

```javascript
// Comprehensive link pattern
// Matches: [[text]], [[uid:tree:node]], [[uid:tree:node|Alias]]
const LINK_PATTERN = /\[\[((?:uid:[^|\]]+|[^|\]]+)(?:\|[^\]]+)?)\]\]/g;

function parseLink(match) {
  const content = match[1];

  // Check for UID format
  if (content.startsWith('uid:')) {
    const pipeIdx = content.indexOf('|');
    if (pipeIdx > -1) {
      // Has alias: [[uid:tree:node|Display Text]]
      return {
        type: 'uid',
        uid: content.substring(4, pipeIdx), // "tree:node"
        displayText: content.substring(pipeIdx + 1),
        raw: content
      };
    } else {
      // No alias: [[uid:tree:node]]
      const uid = content.substring(4);
      return {
        type: 'uid',
        uid: uid,
        displayText: null, // Will lookup from index
        raw: content
      };
    }
  } else {
    // Soft link: [[Some Title]]
    const pipeIdx = content.indexOf('|');
    if (pipeIdx > -1) {
      return {
        type: 'soft',
        searchText: content.substring(0, pipeIdx),
        displayText: content.substring(pipeIdx + 1),
        raw: content
      };
    } else {
      return {
        type: 'soft',
        searchText: content,
        displayText: content,
        raw: content
      };
    }
  }
}

// Fixed context extraction
function extractLinksWithContext(text, field = 'description') {
  const CONTEXT_CHARS = 60;
  const contexts = [];

  let match;
  while ((match = LINK_PATTERN.exec(text)) !== null) {
    const parsed = parseLink(match);
    const startIdx = match.index;
    const endIdx = startIdx + match[0].length;

    // Extract surrounding context
    const excerptStart = Math.max(0, startIdx - CONTEXT_CHARS);
    const excerptEnd = Math.min(text.length, endIdx + CONTEXT_CHARS);
    let excerpt = text.slice(excerptStart, excerptEnd);
    if (excerptStart > 0) excerpt = '...' + excerpt;
    if (excerptEnd < text.length) excerpt = excerpt + '...';

    contexts.push({
      ...parsed,
      excerpt,
      field,
      charOffset: startIdx,
      // Clean display - never show "uid:tree_123:n_456" in UI
      targetTitle: parsed.displayText || parsed.searchText || '[Unknown]'
    });
  }

  return contexts;
}
```

### Safeguard 4: BroadcastChannel Zombie Tab Timeout

**Risk:** Tab crashes after claiming rebuild lock. Other tabs wait forever.

**Solution:** Timeout-based lock stealing.

```javascript
const REBUILD_LOCK_TIMEOUT_MS = 15000; // 15 seconds

// Enhanced lock tracking with timestamps
let coordinationState = {
  rebuildsInProgress: new Map(), // treeId -> { tabId, claimedAt }
  indexVersions: new Map()
};

function atlasAnnounceRebuildStart(treeId) {
  const now = Date.now();
  atlasChannel.postMessage({
    type: 'REBUILD_START',
    treeId,
    tabId: TAB_ID,
    timestamp: now
  });
  coordinationState.rebuildsInProgress.set(treeId, {
    tabId: TAB_ID,
    claimedAt: now
  });
}

// Check if lock is stale (zombie tab)
function isLockStale(treeId) {
  const lock = coordinationState.rebuildsInProgress.get(treeId);
  if (!lock) return false;
  if (lock.tabId === TAB_ID) return false; // Our own lock

  const age = Date.now() - lock.claimedAt;
  if (age > REBUILD_LOCK_TIMEOUT_MS) {
    console.warn(`[Atlas] Lock for ${treeId} is stale (${age}ms). Tab ${lock.tabId} assumed dead.`);
    return true;
  }
  return false;
}

async function atlasShouldRebuild(treeId) {
  const lock = coordinationState.rebuildsInProgress.get(treeId);

  if (lock && lock.tabId !== TAB_ID) {
    // Another tab has the lock - check if stale
    if (isLockStale(treeId)) {
      // Steal the lock
      console.log(`[Atlas] Stealing stale lock for ${treeId} from tab ${lock.tabId}`);
      coordinationState.rebuildsInProgress.delete(treeId);
      return true;
    }
    // Lock is fresh - wait
    console.log(`[Atlas] Waiting for tab ${lock.tabId} to finish ${treeId}`);
    return false;
  }

  return true;
}

// Listen for messages - update lock timestamps
atlasChannel.onmessage = (event) => {
  const { type, treeId, tabId, timestamp } = event.data;

  switch (type) {
    case 'REBUILD_START':
      if (tabId !== TAB_ID) {
        coordinationState.rebuildsInProgress.set(treeId, {
          tabId,
          claimedAt: timestamp
        });
      }
      break;

    case 'REBUILD_COMPLETE':
      coordinationState.rebuildsInProgress.delete(treeId);
      if (tabId !== TAB_ID) {
        atlasReloadFromStorage(treeId);
      }
      break;

    case 'REBUILD_HEARTBEAT': // Optional: active tabs can send heartbeats
      if (tabId !== TAB_ID) {
        const lock = coordinationState.rebuildsInProgress.get(treeId);
        if (lock && lock.tabId === tabId) {
          lock.claimedAt = timestamp; // Refresh the lock
        }
      }
      break;
  }
};
```

---

## Appendix B: Consistency & Performance Refinements (OpenAI Final)

These refinements address the critical consistency and performance issues identified in the final architecture review.

### The Core Insight

> *"Atlas is basically you smuggling a graph database into a single HTML file by pretending it's 'just an index.' Your true product moat isn't search—it's identity + trust. The moment the graph lies once, the spell breaks. The moment it never lies, TreeListy quietly becomes a place people live."*

### Refinement 1: Single `uidOf()` Helper (Consistency)

**Problem:** Code paths inconsistently use `node.id` vs `nodeGuid`. This WILL break backlinks when nodes move.

**Rule:** Atlas UIDs must ALWAYS use `nodeGuid`. The positional `id` is for UI/tree structure only.

```javascript
// ═══════════════════════════════════════════════════════════════
// THE SINGLE SOURCE OF TRUTH FOR ATLAS IDENTITY
// Use this EVERYWHERE. Never reference node.id in Atlas code.
// ═══════════════════════════════════════════════════════════════

/**
 * Get the Atlas UID for a node. This is the ONLY way to get a UID.
 * @param {string} treeId - The tree's immutable ID
 * @param {object} node - The node object
 * @returns {string} The composite UID
 */
function uidOf(treeId, node) {
  if (!node.nodeGuid) {
    throw new Error(`[Atlas] Node missing nodeGuid: ${node.id || 'unknown'}`);
  }
  return `${treeId}:${node.nodeGuid}`;
}

/**
 * Parse a UID back into components
 * @param {string} uid - The composite UID
 * @returns {{treeId: string, nodeGuid: string}}
 */
function parseUid(uid) {
  const colonIdx = uid.indexOf(':');
  if (colonIdx === -1) {
    throw new Error(`[Atlas] Invalid UID format: ${uid}`);
  }
  return {
    treeId: uid.substring(0, colonIdx),
    nodeGuid: uid.substring(colonIdx + 1)
  };
}

// WRONG - never do this:
// const uid = `${treeId}:${node.id}`;

// RIGHT - always do this:
// const uid = uidOf(treeId, node);
```

**Enforcement:** Add ESLint rule or grep check in CI:
```bash
# Should return 0 matches in Atlas code
grep -n "treeId.*node\.id" treeplexity.html | grep -v "nodeGuid"
```

### Refinement 2: Hyperedge-as-Entity (Performance)

**Problem:** Current design makes every hyperedge a complete clique with O(k²) edges. A 200-member hyperedge creates 39,800 edges!

**Solution:** Store hyperedges as membership entities, not pairwise edges.

```javascript
// ═══════════════════════════════════════════════════════════════
// HYPEREDGE AS ENTITY (Not Clique)
// Avoids O(k²) edge explosion for large groups
// ═══════════════════════════════════════════════════════════════

// BAD: O(k²) clique edges
// nodeUids.forEach(sourceUid => {
//   nodeUids.forEach(targetUid => {
//     if (sourceUid !== targetUid) addEdge(...)
//   });
// });

// GOOD: O(k) membership references
interface AtlasGraph {
  edges: Record<string, EdgeTarget[]>;          // Explicit links (mentions, deps)
  reverseEdges: Record<string, EdgeSource[]>;   // Backlinks
  hyperedgeMembership: Record<string, string[]>; // nodeUid -> [hyperedgeIds]
  hyperedgeMembers: Record<string, string[]>;    // hyperedgeId -> [nodeUids]
}

function buildUnifiedGraph(treeId, treeData) {
  const graph = {
    edges: {},
    reverseEdges: {},
    hyperedgeMembership: {},
    hyperedgeMembers: {}
  };

  // Index hyperedges as MEMBERSHIP, not pairwise edges
  (treeData.hyperedges || []).forEach(he => {
    const heId = `${treeId}:he:${he.id}`;
    const memberUids = he.nodeIds.map(nid => {
      const node = getNodeById(nid);
      return uidOf(treeId, node);
    });

    // Store forward mapping: hyperedge -> members
    graph.hyperedgeMembers[heId] = memberUids;

    // Store reverse mapping: member -> hyperedges
    memberUids.forEach(uid => {
      if (!graph.hyperedgeMembership[uid]) {
        graph.hyperedgeMembership[uid] = [];
      }
      graph.hyperedgeMembership[uid].push(heId);
    });
  });

  // Dependencies and mentions still use explicit edges
  // (they're 1:1, not n:n, so no clique problem)
  // ... rest of edge building
}

// Backlinks pane: "What hyperedges is this node in?"
function getHyperedgeBacklinks(uid, graph) {
  const hyperedgeIds = graph.hyperedgeMembership[uid] || [];
  return hyperedgeIds.map(heId => ({
    type: 'hyperedge',
    hyperedgeId: heId,
    otherMembers: graph.hyperedgeMembers[heId].filter(m => m !== uid)
  }));
}
```

**Performance Impact:**
| Hyperedge Size | Old (Clique) | New (Entity) |
|---------------|--------------|--------------|
| 10 members | 90 edges | 10 refs |
| 50 members | 2,450 edges | 50 refs |
| 200 members | 39,800 edges | 200 refs |

### Refinement 3: MiniSearch Proper API

**Problem:** `JSON.stringify(searchIndex)` serializes wrong shape.

**Solution:** Use MiniSearch's native `toJSON()` / `loadJSON()`.

```javascript
// In worker: correct serialization
case 'GET_SERIALIZED':
  self.postMessage({
    type: 'SERIALIZED_INDEX',
    payload: {
      // CORRECT: Use native toJSON()
      searchIndexJSON: searchIndex.toJSON(),
      entries: entries
    },
    requestId
  });
  break;

case 'LOAD_SERIALIZED':
  // CORRECT: Use native loadJSON()
  searchIndex = MiniSearch.loadJSON(payload.searchIndexJSON, {
    fields: ['title', 'contentSnippet', 'tags'],
    storeFields: ['uid', 'title', 'treeName', 'type', 'status']
  });
  entries = payload.entries;
  self.postMessage({ type: 'LOAD_COMPLETE', requestId });
  break;
```

### Refinement 4: Worker Chunking with Yield

**Problem:** `nodes.forEach(...)` does all work in one go. Can cause long tasks and "using significant energy" warnings.

**Solution:** Chunk work with yielding.

```javascript
// In worker: chunked indexing with yield
case 'INDEX_TREE':
  const { treeId, nodes } = payload;
  const CHUNK_SIZE = 100;
  const newEntries = [];

  // Remove old entries (still synchronous, usually fast)
  Object.keys(entries).forEach(uid => {
    if (uid.startsWith(treeId + ':')) {
      searchIndex.remove(entries[uid]);
      delete entries[uid];
    }
  });

  // Process in chunks with yielding
  async function processChunks() {
    for (let i = 0; i < nodes.length; i += CHUNK_SIZE) {
      const chunk = nodes.slice(i, i + CHUNK_SIZE);

      chunk.forEach(node => {
        const entry = transformNodeToEntry(node, treeId);
        entries[entry.uid] = entry;
        searchIndex.add(entry);
        newEntries.push(entry);
      });

      // Yield control after each chunk
      if (i + CHUNK_SIZE < nodes.length) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }

      // Report progress
      self.postMessage({
        type: 'INDEX_PROGRESS',
        payload: {
          treeId,
          processed: Math.min(i + CHUNK_SIZE, nodes.length),
          total: nodes.length
        }
      });
    }

    self.postMessage({
      type: 'INDEX_COMPLETE',
      payload: { treeId, entryCount: newEntries.length },
      requestId
    });
  }

  processChunks();
  break;
```

### Refinement 5: Tree Clone/Fork Detection

**Problem:** User duplicates tree file → two files have same UUID → Atlas treats them as same tree.

**Solution:** Detect duplicate UUIDs and offer fork action.

```javascript
// ═══════════════════════════════════════════════════════════════
// TREE CLONE DETECTION
// Prevents identity collision when files are duplicated
// ═══════════════════════════════════════════════════════════════

const mountedSources = new Map(); // uuid -> { filename, contentHash }

function detectCloneConflict(treeData, filename) {
  const uuid = treeData.uuid || treeData.treeId;
  const contentHash = hashTreeContent(treeData);

  const existing = mountedSources.get(uuid);
  if (existing && existing.filename !== filename) {
    // Same UUID, different file = CLONE DETECTED
    if (existing.contentHash !== contentHash) {
      // Different content = diverged clone
      return {
        conflict: true,
        type: 'diverged_clone',
        existingFile: existing.filename,
        newFile: filename,
        message: `This appears to be a copy of "${existing.filename}" that has diverged. Fork as new tree?`
      };
    } else {
      // Same content = exact duplicate
      return {
        conflict: true,
        type: 'exact_duplicate',
        existingFile: existing.filename,
        newFile: filename,
        message: `This is a duplicate of "${existing.filename}". Open the original instead?`
      };
    }
  }

  // No conflict - register this source
  mountedSources.set(uuid, { filename, contentHash });
  return { conflict: false };
}

// User action: Fork tree identity
async function forkTreeIdentity(treeData) {
  const oldUuid = treeData.uuid;

  // Generate new identity
  treeData.uuid = `tree_${crypto.randomUUID()}`;
  treeData.treeId = treeData.uuid.substring(0, 13); // Short form

  // Update all nodeGuids to prevent cross-tree link confusion
  // (Optional: only if you want complete separation)

  console.log(`[Atlas] Forked tree identity: ${oldUuid} → ${treeData.uuid}`);
  showToast('Tree forked with new identity', 'success');

  saveState('Atlas: Forked tree identity');
  return treeData;
}

// UI: Show conflict dialog
function showCloneConflictDialog(conflict) {
  return showConfirmDialog(
    'Duplicate Tree Detected',
    conflict.message,
    conflict.type === 'diverged_clone'
      ? [
          { label: 'Fork as New Tree', action: 'fork', primary: true },
          { label: 'Open Original', action: 'open_original' },
          { label: 'Cancel', action: 'cancel' }
        ]
      : [
          { label: 'Open Original', action: 'open_original', primary: true },
          { label: 'Fork as New Tree', action: 'fork' },
          { label: 'Cancel', action: 'cancel' }
        ]
  );
}
```

### Refinement 6: Content-Only Dirty Detection

**Problem:** `saveState()` fires for view changes, layout changes, preferences. Unnecessary rebuilds.

**Solution:** Only mark dirty for semantic content changes.

```javascript
// ═══════════════════════════════════════════════════════════════
// SMART DIRTY DETECTION
// Only rebuild index for content changes, not layout/view changes
// ═══════════════════════════════════════════════════════════════

const CONTENT_CHANGE_PATTERNS = [
  'add', 'delete', 'edit', 'rename', 'move', 'paste', 'import',
  'description', 'notes', 'status', 'pattern', 'hyperedge'
];

const LAYOUT_CHANGE_PATTERNS = [
  'view', 'layout', 'zoom', 'pan', 'expand', 'collapse',
  'position', 'canvas', '3d', 'theme', 'preference'
];

// Enhanced saveState that classifies the change
function saveState(description) {
  // ... existing undo logic ...

  // Classify the change
  const descLower = description.toLowerCase();
  const isContentChange = CONTENT_CHANGE_PATTERNS.some(p => descLower.includes(p));
  const isLayoutChange = LAYOUT_CHANGE_PATTERNS.some(p => descLower.includes(p));

  if (isContentChange && !isLayoutChange) {
    atlasMarkDirty(currentTreeId);
  } else if (!isContentChange && !isLayoutChange) {
    // Unknown change type - be safe, mark dirty
    console.log(`[Atlas] Unknown change type: "${description}" - marking dirty`);
    atlasMarkDirty(currentTreeId);
  }
  // Layout-only changes: don't mark dirty
}

// Alternative: explicit content hash comparison
function shouldRebuildIndex(treeData, cachedHash) {
  const contentHash = hashTreeContent(treeData); // Hash only name, description, status, etc.
  return contentHash !== cachedHash;
}

function hashTreeContent(tree) {
  // Only hash content fields, not positions/layout
  const contentString = JSON.stringify(tree, (key, value) => {
    // Skip non-content fields
    if (['x', 'y', 'width', 'height', 'collapsed', 'canvasPosition'].includes(key)) {
      return undefined;
    }
    return value;
  });
  return simpleHash(contentString);
}
```

### Refinement 7: Download-First Update Strategy

**Problem:** In-place quine injection has high blast radius. Users could corrupt their file.

**Solution:** Make "download new file" the default. In-place is advanced option.

```javascript
// ═══════════════════════════════════════════════════════════════
// SAFE UPDATE STRATEGY
// Download is default, in-place is advanced/dangerous
// ═══════════════════════════════════════════════════════════════

async function showUpdateOptions(newVersion) {
  const choice = await showConfirmDialog(
    `Atlas Update Available (Build ${newVersion.build})`,
    'How would you like to update?',
    [
      {
        label: 'Download Updated File (Recommended)',
        action: 'download',
        primary: true,
        description: 'Downloads a new HTML file with your data. Safest option.'
      },
      {
        label: 'Update In-Place (Advanced)',
        action: 'inject',
        description: 'Modifies the current file. Creates backup first. For power users.'
      },
      {
        label: 'Later',
        action: 'dismiss'
      }
    ]
  );

  switch (choice) {
    case 'download':
      await downloadUpdatedFile(newVersion);
      break;
    case 'inject':
      // Extra confirmation for dangerous path
      const confirmed = await showConfirmDialog(
        '⚠️ In-Place Update',
        'This will modify your current file. A backup will be created. Continue?',
        [
          { label: 'Yes, Update In-Place', action: 'confirm', danger: true },
          { label: 'Cancel', action: 'cancel', primary: true }
        ]
      );
      if (confirmed === 'confirm') {
        await createBackup();
        await upgradeAtlasInPlace(newVersion);
      }
      break;
  }
}

async function downloadUpdatedFile(newVersion) {
  // Fetch the latest TreeListy HTML
  const response = await fetch('https://treelisty.netlify.app/');
  const newHtml = await response.text();

  // Inject current tree data into the new HTML
  const currentTreeJSON = JSON.stringify(capexTree);
  const updatedHtml = newHtml.replace(
    /const\s+DEFAULT_TREE\s*=\s*\{[^}]+\}/,
    `const DEFAULT_TREE = ${currentTreeJSON}`
  );

  // Trigger download
  const blob = new Blob([updatedHtml], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `treeplexity-${new Date().toISOString().slice(0,10)}.html`;
  a.click();
  URL.revokeObjectURL(url);

  showToast('Updated file downloaded! Open it to use the new version.', 'success');
}
```

---

## Appendix C: Brutal Test Suite

These tests validate the core trust invariants.

```javascript
// ═══════════════════════════════════════════════════════════════
// ATLAS TRUST TESTS
// If any of these fail, the graph lies and trust is broken
// ═══════════════════════════════════════════════════════════════

describe('Atlas Trust Invariants', () => {

  test('Rename Test: file rename preserves tree identity', async () => {
    const tree = createTestTree();
    const originalUuid = tree.uuid;

    // Simulate "Save As" with new filename
    atlasRegisterTree(tree, 'project-alpha.html');
    atlasRegisterTree(tree, 'project-alpha-renamed.html'); // Same tree, new name

    expect(atlasGetTreeByUuid(originalUuid)).toBeDefined();
    expect(atlasGetTreeByUuid(originalUuid).filename).toBe('project-alpha-renamed.html');
  });

  test('Move Test: moving node preserves backlinks', async () => {
    const tree = createTestTree();
    const nodeA = tree.children[0];
    const nodeB = tree.children[1];

    // Create link from A to B
    nodeA.description = `See [[uid:${tree.treeId}:${nodeB.nodeGuid}|Node B]]`;
    await atlasIndexTree(tree);

    // Move B to different parent
    moveNode(nodeB, tree.children[2]);
    await atlasIndexTree(tree);

    // Backlink must still resolve
    const backlinks = atlasGetBacklinks(uidOf(tree.treeId, nodeB));
    expect(backlinks).toHaveLength(1);
    expect(backlinks[0].sourceUid).toBe(uidOf(tree.treeId, nodeA));
  });

  test('Collision Test: title collision triggers disambiguation', async () => {
    const treeA = createTestTree('Tree A');
    const treeB = createTestTree('Tree B');

    // Both have node titled "My Task"
    treeA.children[0].name = 'My Task';
    treeB.children[0].name = 'My Task';

    await atlasIndexTree(treeA);
    await atlasIndexTree(treeB);

    // Soft link resolution must return multiple candidates
    const result = resolveSoftLink('My Task', treeA.treeId, atlasIndex);
    expect(result.resolved).toBe(false);
    expect(result.requiresUserChoice).toBe(true);
    expect(result.candidates).toHaveLength(2);
  });

  test('Clone Test: duplicate UUID triggers fork dialog', async () => {
    const tree = createTestTree();
    atlasRegisterTree(tree, 'original.html');

    // Simulate file duplication
    const clone = JSON.parse(JSON.stringify(tree));
    const conflict = detectCloneConflict(clone, 'copy-of-original.html');

    expect(conflict.conflict).toBe(true);
    expect(conflict.type).toBe('exact_duplicate');
  });

  test('Hyperedge Stress: 200-member hyperedge is fast', async () => {
    const tree = createTestTree();

    // Create 200 nodes
    for (let i = 0; i < 200; i++) {
      tree.children.push({ id: `node-${i}`, nodeGuid: `n_${i}`, name: `Node ${i}` });
    }

    // Create hyperedge with all 200
    tree.hyperedges = [{
      id: 'big-group',
      nodeIds: tree.children.map(n => n.id)
    }];

    const start = performance.now();
    await atlasIndexTree(tree);
    const duration = performance.now() - start;

    expect(duration).toBeLessThan(500); // Must complete in <500ms
    // With clique edges this would create 39,800 edges
    // With entity model this creates 200 refs
  });

  test('Benchmark: search p95 under 20ms', async () => {
    const tree = createLargeTestTree(2000); // 2000 nodes
    await atlasIndexTree(tree);

    const latencies = [];
    for (let i = 0; i < 100; i++) {
      const query = `node ${Math.floor(Math.random() * 2000)}`;
      const start = performance.now();
      atlasSearch(query);
      latencies.push(performance.now() - start);
    }

    latencies.sort((a, b) => a - b);
    const p95 = latencies[Math.floor(latencies.length * 0.95)];
    expect(p95).toBeLessThan(20);
  });

});
```

---

## Appendix D: Migration Script

```javascript
// Run once per tree on load to add UUID if missing
function migrateTreeToAtlas(capexTree) {
  let migrated = false;

  // Add tree UUID if missing
  if (!capexTree.uuid) {
    capexTree.uuid = `tree_${crypto.randomUUID()}`;
    migrated = true;
    console.log('[Atlas Migration] Added tree UUID:', capexTree.uuid);
  }

  // Ensure all nodes have stable IDs (not just sequential numbers)
  traverseTree(capexTree.children, (node, parent) => {
    if (!node.id || node.id.match(/^\d+$/)) {
      node.id = `node_${crypto.randomUUID().slice(0, 8)}`;
      migrated = true;
    }
  });

  if (migrated) {
    saveState('Atlas: Migrated tree identifiers');
  }

  return migrated;
}
```

---

## References

- [MiniSearch Documentation](https://lucaong.github.io/minisearch/)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Web Workers with Blob URLs](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers)
- [Roam Research Backlinks](https://roamresearch.com/)
- [Obsidian Graph View](https://obsidian.md/)

---

## Appendix E: TreeListy Home - Local Device Architecture

This appendix addresses the "device island" problem identified during UX review. When a user has many trees (50+) across multiple devices, Atlas must "warm up" each device by opening every tree file at least once. This creates friction for power users.

### The Problem: Device Islands

Each device running TreeListy is an isolated island:

| Scenario | User Experience | Impact |
|----------|-----------------|--------|
| New laptop | Must open each tree file manually | Hours of setup for 50+ trees |
| Browser data cleared | IndexedDB wiped, Atlas forgets everything | Back to square one |
| Different browser | Chrome vs Firefox have separate storage | Duplicate warm-up effort |
| Tree moved to subfolder | Atlas can't find it | Ghost backlinks |

The root cause: **Atlas relies entirely on browser-local storage** (IndexedDB), which is ephemeral, browser-specific, and invisible to the user.

### The Solution: TreeListy Home Folder

A dedicated local folder structure that stores Atlas state outside the browser:

```
~/.treelisty/                    # Hidden folder (invisible to casual users)
├── trees/                       # Canonical tree storage
│   ├── project-alpha.html
│   ├── philosophy-notes.html
│   └── work-tasks.html
├── index/                       # Atlas persistence
│   ├── registry.json           # Tree registry with UUIDs
│   ├── search-index.json       # MiniSearch serialized index
│   └── graph.json              # Unified edge graph
├── state/                       # Session state
│   ├── recent-trees.json       # Recently opened (for quick access)
│   └── preferences.json        # User settings
└── .treelisty-home              # Marker file (proves this is a Home folder)
```

### File System Access API Integration

Modern browsers support the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API), enabling persistent folder access:

```javascript
// ═══════════════════════════════════════════════════════════════
// TREELISTY HOME - Persistent Local Storage
// ═══════════════════════════════════════════════════════════════

let treelistyHomeHandle = null; // DirectoryHandle

// One-time setup: user grants folder access
async function setupTreeListyHome() {
  try {
    // Check for existing permission
    const storedHandle = await idb.get('treelisty-home-handle');
    if (storedHandle) {
      const permission = await storedHandle.queryPermission({ mode: 'readwrite' });
      if (permission === 'granted') {
        treelistyHomeHandle = storedHandle;
        return true;
      }
    }

    // First-time setup: show explanation
    const confirmed = await showConfirmDialog(
      'Enable TreeListy Home?',
      'TreeListy can store its index and settings in a local folder. ' +
      'This means your data persists across browser clears and works across browsers.\n\n' +
      'We recommend creating a hidden folder like ".treelisty" in your home directory.',
      [
        { label: 'Choose Folder', action: 'choose', primary: true },
        { label: 'Not Now', action: 'skip' }
      ]
    );

    if (confirmed !== 'choose') return false;

    // User picks the folder
    treelistyHomeHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'documents'
    });

    // Verify or create structure
    await ensureHomeStructure(treelistyHomeHandle);

    // Store handle for future sessions
    await idb.set('treelisty-home-handle', treelistyHomeHandle);

    showToast('TreeListy Home configured!', 'success');
    return true;

  } catch (e) {
    if (e.name === 'AbortError') {
      // User cancelled - that's fine
      return false;
    }
    console.error('[TreeListy Home] Setup failed:', e);
    return false;
  }
}

// Create folder structure if missing
async function ensureHomeStructure(homeHandle) {
  const dirs = ['trees', 'index', 'state'];
  for (const dir of dirs) {
    await homeHandle.getDirectoryHandle(dir, { create: true });
  }

  // Write marker file
  const markerHandle = await homeHandle.getFileHandle('.treelisty-home', { create: true });
  const writable = await markerHandle.createWritable();
  await writable.write(JSON.stringify({
    version: 1,
    created: new Date().toISOString(),
    lastAccessed: new Date().toISOString()
  }));
  await writable.close();
}
```

### Index Persistence to Home Folder

Instead of (or in addition to) IndexedDB, Atlas can persist to the Home folder:

```javascript
// Save Atlas index to Home folder
async function persistAtlasToHome() {
  if (!treelistyHomeHandle) return; // Fall back to IndexedDB only

  try {
    const indexDir = await treelistyHomeHandle.getDirectoryHandle('index');

    // Save registry
    await writeJsonFile(indexDir, 'registry.json', atlasRegistry);

    // Save search index
    const serializedIndex = await sendWorkerMessage('GET_SERIALIZED');
    await writeJsonFile(indexDir, 'search-index.json', serializedIndex.payload);

    // Save graph
    await writeJsonFile(indexDir, 'graph.json', atlasGraph);

    console.log('[Atlas] Persisted to TreeListy Home');

  } catch (e) {
    console.error('[Atlas] Home persistence failed:', e);
    // Continue with IndexedDB as fallback
  }
}

// Load Atlas index from Home folder
async function loadAtlasFromHome() {
  if (!treelistyHomeHandle) return null;

  try {
    const indexDir = await treelistyHomeHandle.getDirectoryHandle('index');

    const registry = await readJsonFile(indexDir, 'registry.json');
    const searchIndex = await readJsonFile(indexDir, 'search-index.json');
    const graph = await readJsonFile(indexDir, 'graph.json');

    if (registry && searchIndex && graph) {
      return { registry, searchIndex, graph };
    }

  } catch (e) {
    console.log('[Atlas] No Home index found, will rebuild');
  }

  return null;
}

// Helper: write JSON to folder
async function writeJsonFile(dirHandle, filename, data) {
  const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(data, null, 2));
  await writable.close();
}

// Helper: read JSON from folder
async function readJsonFile(dirHandle, filename) {
  try {
    const fileHandle = await dirHandle.getFileHandle(filename);
    const file = await fileHandle.getFile();
    const text = await file.text();
    return JSON.parse(text);
  } catch {
    return null;
  }
}
```

### Batch Tree Discovery (50+ Trees)

For power users with many trees, scan the Home folder to auto-discover all trees:

```javascript
// Scan trees folder for all .html files
async function discoverTrees() {
  if (!treelistyHomeHandle) {
    showToast('Enable TreeListy Home to auto-discover trees', 'info');
    return [];
  }

  const treesDir = await treelistyHomeHandle.getDirectoryHandle('trees');
  const discovered = [];

  for await (const [name, handle] of treesDir) {
    if (handle.kind === 'file' && name.endsWith('.html')) {
      discovered.push({
        filename: name,
        handle: handle,
        // Will read UUID when opened
        uuid: null
      });
    }
  }

  console.log(`[Atlas] Discovered ${discovered.length} trees in Home folder`);
  return discovered;
}

// Batch warm-up: index all trees in background
async function warmUpAllTrees() {
  const trees = await discoverTrees();

  showToast(`Warming up ${trees.length} trees...`, 'info');

  let indexed = 0;
  for (const treeInfo of trees) {
    try {
      const file = await treeInfo.handle.getFile();
      const html = await file.text();
      const treeData = extractTreeFromHtml(html);

      if (treeData) {
        await atlasIndexTree(treeData);
        indexed++;

        // Progress update
        if (indexed % 10 === 0) {
          showToast(`Indexed ${indexed}/${trees.length} trees...`, 'info');
        }
      }

    } catch (e) {
      console.error(`[Atlas] Failed to warm up ${treeInfo.filename}:`, e);
    }
  }

  showToast(`Indexed ${indexed} trees. Atlas is ready!`, 'success');
}

// Extract tree data from HTML file
function extractTreeFromHtml(html) {
  // Find the embedded JSON in the saved tree
  const match = html.match(/const\s+SAVED_TREE\s*=\s*(\{[\s\S]*?\});/);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }
  return null;
}
```

### Cross-Browser Synchronization

Because the Home folder is on the filesystem (not in browser storage), it works across browsers:

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Chrome    │      │   Firefox   │      │    Edge     │
│  TreeListy  │      │  TreeListy  │      │  TreeListy  │
└──────┬──────┘      └──────┬──────┘      └──────┬──────┘
       │                    │                    │
       └────────────────────┼────────────────────┘
                            │
                   ┌────────┴────────┐
                   │  ~/.treelisty/  │
                   │  (shared state) │
                   └─────────────────┘
```

**Conflict Prevention:** The first browser to access adds a lock file. Other browsers see "Index in use by Chrome, switch to read-only?"

```javascript
// Lock file for cross-browser coordination
async function acquireHomeLock() {
  const stateDir = await treelistyHomeHandle.getDirectoryHandle('state');

  try {
    // Check for existing lock
    const lockHandle = await stateDir.getFileHandle('.lock');
    const lockFile = await lockHandle.getFile();
    const lockData = JSON.parse(await lockFile.text());

    // Lock is stale if older than 30 seconds without heartbeat
    const lockAge = Date.now() - lockData.heartbeat;
    if (lockAge > 30000) {
      console.log('[Atlas] Stealing stale lock from', lockData.browser);
      // Fall through to create new lock
    } else {
      return {
        acquired: false,
        holder: lockData.browser,
        message: `TreeListy Home is in use by ${lockData.browser}`
      };
    }

  } catch {
    // No lock file - we can acquire
  }

  // Create our lock
  const lockHandle = await stateDir.getFileHandle('.lock', { create: true });
  const writable = await lockHandle.createWritable();
  await writable.write(JSON.stringify({
    browser: detectBrowser(),
    pid: TAB_ID,
    acquired: Date.now(),
    heartbeat: Date.now()
  }));
  await writable.close();

  // Start heartbeat
  setInterval(async () => {
    try {
      const lockHandle = await stateDir.getFileHandle('.lock');
      const writable = await lockHandle.createWritable();
      await writable.write(JSON.stringify({
        browser: detectBrowser(),
        pid: TAB_ID,
        acquired: Date.now(),
        heartbeat: Date.now()
      }));
      await writable.close();
    } catch {}
  }, 10000);

  return { acquired: true };
}
```

### Benefits Summary

| Problem | TreeListy Home Solution |
|---------|-------------------------|
| New device setup | Point to existing folder, instant warm-up |
| Browser data cleared | State persists in filesystem |
| Cross-browser use | Shared folder, lock coordination |
| 50+ trees warm-up | Batch discovery and indexing |
| Tree file moved | Home folder is canonical location |
| Backup/sync | Standard folder, works with Dropbox/OneDrive |

### Implementation Notes

1. **Optional Feature:** TreeListy Home is opt-in. Users who prefer browser-only operation continue using IndexedDB.

2. **Hidden Folder:** The `.treelisty/` naming convention hides it from casual users on Mac/Linux. Windows users see it but can set folder attributes to hide.

3. **Graceful Degradation:** If File System Access API unavailable (Firefox currently), fall back to IndexedDB only.

4. **Sync Services:** If Home folder is in Dropbox/OneDrive/Google Drive, trees sync automatically across devices.

5. **Phase Timing:** This is a Phase 6+ feature. Core Atlas (IndexedDB) must work first.

---

*Document created: 2025-12-25*
*Revised: 2025-12-25 v2 (Gemini Lead Dev feedback)*
*Revised: 2025-12-25 v3 (OpenAI architecture review)*
*Revised: 2025-12-25 v4 (Gemini final implementation safeguards)*
*Revised: 2025-12-25 v5 (OpenAI final consistency/performance review)*
*Revised: 2025-12-25 v6 (TreeListy Home local architecture)*
*Author: Claude Code (Opus 4.5)*
*Reviewers: Gemini (Lead Dev), OpenAI (Architecture)*
*Status: APPROVED FOR CONSTRUCTION - Phase-0 First*
