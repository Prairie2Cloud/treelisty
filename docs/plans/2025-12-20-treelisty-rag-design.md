# TreeListy RAG: Visual Knowledge Retrieval System

**Status:** Draft
**Author:** Claude + Garnet
**Date:** 2025-12-20
**Target:** Build 520+

---

## Executive Summary

TreeListy RAG transforms TreeListy from a project planning tool into a **visual knowledge retrieval system**. Instead of flat vector chunks, documents are parsed into navigable tree structures where hierarchy provides context. Users can browse, edit, and query their knowledge base through TreeListy's familiar interface, with Claude Code integration via MCP for AI-powered retrieval.

**Key differentiator:** "See and edit your RAG" - unlike black-box vector databases, TreeListy RAG lets users understand and refine how their documents are structured and retrieved.

---

## Problem Statement

### Current RAG Limitations

1. **Black Box Retrieval**: Users can't see what chunks exist or why certain results appear
2. **Lost Structure**: Documents have hierarchy (chapters, sections) that flat chunking destroys
3. **No Curation**: Can't fix bad chunks or add missing context
4. **Separate Tools**: RAG systems are disconnected from where users actually work

### P2C Use Case

- Documents stored in Google Drive
- Need to query across documents using natural language
- Want to understand and refine the knowledge structure
- Integration with Claude Code for development workflows

---

## Solution: Hierarchical RAG

### Core Concept

```
Traditional RAG                    TreeListy RAG
─────────────────                  ─────────────────
Document                           Document
    ↓                                  ↓
[chunk1][chunk2][chunk3]           📁 Parsed Tree
    ↓                               ├── 📄 Chapter 1
Vector embeddings                   │    ├── Section 1.1 (chunk)
    ↓                               │    └── Section 1.2 (chunk)
Similarity search                   └── 📄 Chapter 2
    ↓                                    └── Section 2.1 (chunk)
Flat context                              ↓
                                   Structural search
                                          ↓
                                   Context with hierarchy
                                   "Chapter 1 > Section 1.1"
```

### Why Trees Beat Flat Chunks

| Aspect | Flat Chunks | Tree Nodes |
|--------|-------------|------------|
| Context | None (just the chunk) | Full path: Doc > Chapter > Section |
| Navigation | List of results | Browse parent/children |
| Editing | Rebuild entire index | Edit single node |
| Summarization | Separate process | Parent nodes = summaries |
| Relationships | Lost | Preserved (siblings, hierarchy) |
| Visibility | Hidden in vector DB | Visible in TreeListy UI |

---

## Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Data Sources                             │
│  Google Drive │ Local Files │ URLs │ Paste │ Voice              │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Ingestion Pipeline                          │
│                                                                  │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐     │
│  │ Extract  │ → │ Parse to │ → │ Generate │ → │  Store   │     │
│  │  Text    │   │  Tree    │   │Embeddings│   │  Tree    │     │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘     │
│   PyMuPDF        AI (Claude/    Optional       TreeListy        │
│   Unstructured   Gemini)        per-node       JSON             │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                     TreeListy Knowledge Base                     │
│                                                                  │
│  📁 Knowledge Base (root)                                        │
│   ├── 📄 Security Guide.pdf                                     │
│   │    ├── Authentication                                       │
│   │    │    ├── OAuth 2.0 [embedding: [...]]                   │
│   │    │    └── JWT Tokens [embedding: [...]]                  │
│   │    └── Authorization                                        │
│   │         └── RBAC [embedding: [...]]                        │
│   ├── 📄 API Documentation.md                                   │
│   │    └── ...                                                  │
│   └── 📄 Meeting Notes.docx                                     │
│        └── ...                                                  │
│                                                                  │
│  Storage: localStorage + optional IndexedDB for embeddings      │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                      Retrieval Layer                             │
│                                                                  │
│  ┌─────────────────┐    ┌─────────────────┐                     │
│  │  Text Search    │    │ Semantic Search │                     │
│  │  (existing)     │    │ (new/optional)  │                     │
│  │                 │    │                 │                     │
│  │ Keyword match   │    │ Cosine sim on   │                     │
│  │ across nodes    │    │ node embeddings │                     │
│  └────────┬────────┘    └────────┬────────┘                     │
│           └──────────┬───────────┘                              │
│                      ↓                                          │
│           Ranked Results with Path Context                      │
└───────────────────────────────┬─────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────┐
│                        Access Methods                            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ TreeListy   │  │ MCP Bridge  │  │ TreeBeard   │             │
│  │ Search UI   │  │ (Claude     │  │ Chat        │             │
│  │             │  │  Code)      │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
└─────────────────────────────────────────────────────────────────┘
```

### Data Model

#### Node Schema (Extended)

```javascript
{
  id: "node-abc123",
  name: "OAuth 2.0 Authentication",
  description: "OAuth 2.0 is an authorization framework that enables...",

  // Existing TreeListy fields
  pattern: { key: "knowledge-base" },
  items: [...],  // children

  // RAG-specific fields (new)
  _rag: {
    // Source tracking
    source: {
      type: "google-drive",           // google-drive | local | url | paste
      uri: "gdrive://1abc.../doc.pdf",
      importedAt: "2025-12-20T10:30:00Z",
      pageRange: [12, 15]             // optional: which pages
    },

    // Embeddings (optional, for semantic search)
    embedding: {
      model: "text-embedding-3-small",
      vector: [0.023, -0.041, ...],   // 1536 dims
      generatedAt: "2025-12-20T10:31:00Z"
    },

    // Chunking metadata
    chunk: {
      tokenCount: 847,
      charCount: 3421,
      isLeaf: true                    // true = searchable chunk
    },

    // Retrieval stats
    stats: {
      retrievalCount: 12,
      lastRetrievedAt: "2025-12-20T14:22:00Z",
      avgRelevanceScore: 0.78
    }
  }
}
```

#### Knowledge Base Pattern

New pattern: `knowledge-base`

```javascript
PATTERNS['knowledge-base'] = {
  key: 'knowledge-base',
  name: 'Knowledge Base',
  icon: '📚',
  description: 'Document corpus for RAG retrieval',

  levels: [
    { name: 'Knowledge Base', icon: '📚' },  // Root
    { name: 'Source',         icon: '📄' },  // Document
    { name: 'Section',        icon: '📑' },  // Chapter/major section
    { name: 'Chunk',          icon: '📝' }   // Retrievable unit
  ],

  persona: {
    name: 'Research Librarian',
    prompt: 'You are a research librarian helping organize and retrieve information...'
  },

  defaultFields: ['source', 'summary', 'keywords'],

  // RAG-specific settings
  ragSettings: {
    autoEmbed: true,
    chunkSize: 1000,        // target tokens per leaf node
    overlapTokens: 100,
    embedModel: 'text-embedding-3-small'
  }
};
```

---

## Implementation Phases

### Phase 1: Enhanced Document Import (Build 520)

**Goal:** Import documents and parse into well-structured trees.

#### 1.1 Long Document Handling

Current "Import Text" handles short content. Enhance for long documents:

```javascript
async function importLongDocument(text, options = {}) {
  const {
    pattern = 'knowledge-base',
    chunkSize = 1000,
    source = null
  } = options;

  // Step 1: Pre-chunk if very long (>50k tokens)
  const sections = preprocessIntoSections(text);

  // Step 2: AI parses each section into tree structure
  const trees = await Promise.all(
    sections.map(section => aiParseToTree(section, pattern))
  );

  // Step 3: Merge into single tree
  const mergedTree = mergeTrees(trees);

  // Step 4: Add source metadata
  annotateWithSource(mergedTree, source);

  return mergedTree;
}
```

#### 1.2 Source Type Handlers

```javascript
const sourceHandlers = {
  'pdf': async (file) => {
    // Use pdf.js or call external service
    const text = await extractPdfText(file);
    return { text, metadata: { pages: file.numPages } };
  },

  'gdrive': async (fileId) => {
    // Use Google Drive API via MCP or direct
    const { text, metadata } = await fetchGoogleDriveDoc(fileId);
    return { text, metadata };
  },

  'url': async (url) => {
    // Fetch and extract main content
    const html = await fetch(url);
    const text = extractMainContent(html);
    return { text, metadata: { url, fetchedAt: new Date() } };
  }
};
```

#### 1.3 UI: Import Modal Enhancement

Add to existing Import Text modal:

```html
<div id="import-source-section">
  <label>Import From:</label>
  <div class="source-buttons">
    <button onclick="importFromPaste()">📋 Paste</button>
    <button onclick="importFromFile()">📁 File</button>
    <button onclick="importFromGoogleDrive()">🔗 Google Drive</button>
    <button onclick="importFromUrl()">🌐 URL</button>
  </div>
</div>

<div id="import-options">
  <label>
    <input type="checkbox" id="auto-embed" checked>
    Generate embeddings (enables semantic search)
  </label>
  <label>
    Target chunk size:
    <select id="chunk-size">
      <option value="500">Small (~500 tokens)</option>
      <option value="1000" selected>Medium (~1000 tokens)</option>
      <option value="2000">Large (~2000 tokens)</option>
    </select>
  </label>
</div>
```

---

### Phase 2: Multi-Source Knowledge Base (Build 521)

**Goal:** Manage multiple documents as a unified searchable corpus.

#### 2.1 Knowledge Base Manager

New UI section for managing the corpus:

```javascript
class KnowledgeBaseManager {
  constructor() {
    this.sources = [];  // Tracked source documents
  }

  async addSource(source) {
    const tree = await importLongDocument(source.text, {
      pattern: 'knowledge-base',
      source: source.metadata
    });

    // Add as child of knowledge base root
    this.appendToKnowledgeBase(tree);
    this.sources.push(source.metadata);

    // Trigger embedding generation
    if (this.autoEmbed) {
      await this.generateEmbeddings(tree);
    }
  }

  async refresh(sourceId) {
    // Re-fetch and re-parse a source
    const source = this.sources.find(s => s.id === sourceId);
    const newTree = await this.fetchAndParse(source);
    this.replaceSubtree(sourceId, newTree);
  }

  getStats() {
    return {
      sourceCount: this.sources.length,
      nodeCount: this.countNodes(),
      embeddedCount: this.countEmbeddedNodes(),
      lastUpdated: this.getLastUpdate()
    };
  }
}
```

#### 2.2 Source Status UI

```html
<div id="knowledge-base-panel">
  <h3>📚 Knowledge Base</h3>
  <div class="kb-stats">
    <span>12 sources</span> · <span>847 chunks</span> · <span>100% embedded</span>
  </div>

  <div class="kb-sources">
    <div class="source-item">
      <span class="source-icon">📄</span>
      <span class="source-name">Security Guide.pdf</span>
      <span class="source-status">✓ 142 chunks</span>
      <button onclick="refreshSource('...')">🔄</button>
    </div>
    <!-- more sources -->
  </div>

  <button onclick="addNewSource()">+ Add Source</button>
</div>
```

---

### Phase 3: Retrieval Engine (Build 522)

**Goal:** Fast, accurate retrieval with structural context.

#### 3.1 Hybrid Search

Combine text search (fast, exact) with semantic search (slower, fuzzy):

```javascript
class RetrievalEngine {
  async search(query, options = {}) {
    const {
      maxResults = 5,
      searchMode = 'hybrid',  // text | semantic | hybrid
      includeAncestors = true,
      minRelevance = 0.5
    } = options;

    let results = [];

    // Text search (always fast)
    if (searchMode !== 'semantic') {
      const textResults = this.textSearch(query);
      results.push(...textResults.map(r => ({ ...r, source: 'text' })));
    }

    // Semantic search (if embeddings exist)
    if (searchMode !== 'text' && this.hasEmbeddings()) {
      const queryEmbedding = await this.embed(query);
      const semanticResults = this.vectorSearch(queryEmbedding);
      results.push(...semanticResults.map(r => ({ ...r, source: 'semantic' })));
    }

    // Deduplicate and rank
    results = this.deduplicateAndRank(results);

    // Add ancestor context
    if (includeAncestors) {
      results = results.map(r => ({
        ...r,
        path: this.getAncestorPath(r.nodeId),
        ancestors: this.getAncestorContent(r.nodeId)
      }));
    }

    // Filter and limit
    return results
      .filter(r => r.relevance >= minRelevance)
      .slice(0, maxResults);
  }

  textSearch(query) {
    const terms = query.toLowerCase().split(/\s+/);
    const results = [];

    this.walkTree(node => {
      const text = `${node.name} ${node.description}`.toLowerCase();
      const matchCount = terms.filter(t => text.includes(t)).length;

      if (matchCount > 0) {
        results.push({
          nodeId: node.id,
          node: node,
          relevance: matchCount / terms.length,
          matchedTerms: terms.filter(t => text.includes(t))
        });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  vectorSearch(queryEmbedding) {
    const results = [];

    this.walkTree(node => {
      if (node._rag?.embedding?.vector) {
        const similarity = cosineSimilarity(
          queryEmbedding,
          node._rag.embedding.vector
        );

        results.push({
          nodeId: node.id,
          node: node,
          relevance: similarity
        });
      }
    });

    return results.sort((a, b) => b.relevance - a.relevance);
  }
}
```

#### 3.2 Context Assembly

Build rich context from retrieved nodes:

```javascript
function assembleContext(results, options = {}) {
  const { maxTokens = 4000, includeHierarchy = true } = options;

  let context = '';
  let tokenCount = 0;

  for (const result of results) {
    const nodeContext = formatNodeContext(result, includeHierarchy);
    const nodeTokens = estimateTokens(nodeContext);

    if (tokenCount + nodeTokens > maxTokens) break;

    context += nodeContext + '\n\n---\n\n';
    tokenCount += nodeTokens;
  }

  return { context, tokenCount, nodesUsed: results.length };
}

function formatNodeContext(result, includeHierarchy) {
  let context = '';

  if (includeHierarchy && result.path) {
    context += `**Source:** ${result.path.join(' > ')}\n\n`;
  }

  context += `**${result.node.name}**\n\n`;
  context += result.node.description || '';

  // Include parent summary if available
  if (result.ancestors?.length > 0) {
    const parent = result.ancestors[result.ancestors.length - 1];
    if (parent.description) {
      context = `*Context: ${parent.name}*\n${parent.description.slice(0, 200)}...\n\n` + context;
    }
  }

  return context;
}
```

---

### Phase 4: MCP Integration (Build 523)

**Goal:** Claude Code can query the knowledge base via MCP.

#### 4.1 New MCP Tools

Add to `treelisty-mcp-bridge`:

```javascript
// In handleToolsList()
const ragTools = [
  {
    name: 'retrieve_context',
    description: 'Search knowledge base and retrieve relevant content with structural context',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language search query'
        },
        max_results: {
          type: 'number',
          description: 'Maximum results to return',
          default: 5
        },
        search_mode: {
          type: 'string',
          enum: ['text', 'semantic', 'hybrid'],
          default: 'hybrid'
        },
        include_ancestors: {
          type: 'boolean',
          description: 'Include parent nodes for context',
          default: true
        }
      },
      required: ['query']
    }
  },

  {
    name: 'get_knowledge_base_stats',
    description: 'Get statistics about the knowledge base',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  {
    name: 'list_sources',
    description: 'List all document sources in the knowledge base',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },

  {
    name: 'get_source_content',
    description: 'Get full parsed content of a source document',
    inputSchema: {
      type: 'object',
      properties: {
        source_id: { type: 'string' }
      },
      required: ['source_id']
    }
  }
];
```

#### 4.2 Handler Implementation

```javascript
// In TreeListyMCPHandler
async retrieveContext(params) {
  const { query, max_results = 5, search_mode = 'hybrid', include_ancestors = true } = params;

  const engine = new RetrievalEngine(capexTree);
  const results = await engine.search(query, {
    maxResults: max_results,
    searchMode: search_mode,
    includeAncestors: include_ancestors
  });

  const { context, tokenCount, nodesUsed } = assembleContext(results);

  return {
    query,
    results: results.map(r => ({
      path: r.path,
      name: r.node.name,
      excerpt: r.node.description?.slice(0, 200),
      relevance: r.relevance,
      source: r.node._rag?.source?.uri
    })),
    context,
    metadata: {
      tokenCount,
      nodesUsed,
      searchMode: search_mode
    }
  };
}
```

#### 4.3 Claude Code Usage

```
User: "Based on our security docs, how should we implement authentication?"

Claude Code:
1. Calls retrieve_context({ query: "authentication implementation" })
2. Gets structured results:
   - Security Guide > Authentication > OAuth 2.0 (relevance: 0.89)
   - Security Guide > Authentication > JWT Tokens (relevance: 0.82)
   - API Docs > Auth Endpoints (relevance: 0.71)
3. Uses assembled context to generate answer
4. Cites sources with full paths
```

---

### Phase 5: Google Drive Integration (Build 524)

**Goal:** Direct import from Google Drive.

#### 5.1 Drive Connector Options

**Option A: MCP Server for Drive**
```json
{
  "mcpServers": {
    "gdrive": {
      "command": "npx",
      "args": ["@anthropic/mcp-gdrive"]
    }
  }
}
```
Claude Code fetches files, passes to TreeListy.

**Option B: Direct OAuth in TreeListy**
```javascript
// Google Drive picker integration
async function importFromGoogleDrive() {
  // OAuth flow
  const token = await authenticateWithGoogle();

  // Show Drive picker
  const selectedFiles = await showDrivePicker(token);

  // Fetch and import each file
  for (const file of selectedFiles) {
    const content = await fetchDriveFile(token, file.id);
    await knowledgeBase.addSource({
      text: content.text,
      metadata: {
        type: 'google-drive',
        fileId: file.id,
        name: file.name,
        mimeType: file.mimeType
      }
    });
  }
}
```

**Option C: Local Sync + Watch**
```bash
# Use rclone to sync Drive folder locally
rclone sync gdrive:Documents/KnowledgeBase ./kb-sync

# TreeListy watches the folder
```

#### 5.2 Refresh/Sync Flow

```javascript
async function syncWithDrive() {
  for (const source of knowledgeBase.sources) {
    if (source.type !== 'google-drive') continue;

    const driveMetadata = await getDriveFileMetadata(source.fileId);

    if (driveMetadata.modifiedTime > source.importedAt) {
      console.log(`Updating ${source.name}...`);
      await knowledgeBase.refresh(source.id);
    }
  }
}
```

---

## Embedding Strategy

### When to Embed

| Corpus Size | Recommendation |
|-------------|----------------|
| < 100 nodes | Text search only (fast, free) |
| 100-1000 nodes | Embeddings optional (improves recall) |
| > 1000 nodes | Embeddings recommended |

### Embedding Storage

**Option A: Inline in Tree JSON**
- Simple, single file
- Large file size (~6KB per node with embedding)
- Good for < 500 nodes

**Option B: Separate IndexedDB**
```javascript
// Store embeddings in IndexedDB, reference by nodeId
const embeddingStore = {
  async save(nodeId, vector) {
    const db = await openDB('treelisty-embeddings');
    await db.put('vectors', { nodeId, vector });
  },

  async get(nodeId) {
    const db = await openDB('treelisty-embeddings');
    return db.get('vectors', nodeId);
  },

  async searchSimilar(queryVector, topK = 10) {
    // Brute force for now, could use HNSW later
    const all = await db.getAll('vectors');
    return all
      .map(v => ({ nodeId: v.nodeId, similarity: cosine(queryVector, v.vector) }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);
  }
};
```

**Option C: External Vector DB**
For large corpora (>10k nodes), use Chroma/pgvector:
```javascript
const vectorDB = new ChromaClient();
const collection = await vectorDB.getOrCreateCollection('treelisty-kb');

// On node create/update
await collection.upsert({
  ids: [node.id],
  embeddings: [node._rag.embedding.vector],
  metadatas: [{ name: node.name, path: node.path.join('/') }]
});
```

---

## UI Mockups

### Knowledge Base Panel (Sidebar)

```
┌─────────────────────────────────────────┐
│ 📚 Knowledge Base                    ⚙️ │
├─────────────────────────────────────────┤
│ 12 sources · 847 chunks · 100% indexed  │
├─────────────────────────────────────────┤
│ 🔍 Search knowledge...                  │
├─────────────────────────────────────────┤
│ ▼ Sources                               │
│   📄 Security Guide.pdf      ✓ 142     │
│   📄 API Documentation.md    ✓ 89      │
│   📄 Architecture.docx       ✓ 67      │
│   📄 Meeting Notes (Dec)     ⏳ syncing │
│                                         │
│   [+ Add Source]                        │
├─────────────────────────────────────────┤
│ ▶ Recent Retrievals                     │
│ ▶ Settings                              │
└─────────────────────────────────────────┘
```

### Search Results View

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 "authentication flow"                              [Clear]│
├─────────────────────────────────────────────────────────────┤
│ 5 results in 0.12s                    [Text] [Semantic] [●] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ 📄 Security Guide > Authentication > OAuth 2.0             │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ OAuth 2.0 provides a secure authentication flow using   ││
│ │ access tokens and refresh tokens. The flow begins...    ││
│ └─────────────────────────────────────────────────────────┘│
│ Relevance: 89%  ·  Matched: "authentication", "flow"       │
│ [View in Tree] [Copy]                                       │
│                                                             │
│ 📄 API Docs > Endpoints > /auth/login                      │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ POST /auth/login initiates the authentication flow...   ││
│ └─────────────────────────────────────────────────────────┘│
│ Relevance: 82%                                              │
│ [View in Tree] [Copy]                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Security Considerations

### API Keys
- Embedding API keys stored in localStorage (existing pattern)
- Google Drive OAuth tokens stored securely
- Never send embeddings to untrusted servers

### Data Privacy
- All processing local by default
- Embeddings generated via user's own API keys
- No data sent to TreeListy servers

### Source Attribution
- Always track and display source documents
- Maintain provenance through retrieval chain

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Import speed | < 5s per 10-page PDF |
| Text search | < 100ms for 1000 nodes |
| Semantic search | < 500ms for 1000 nodes (local embeddings) |
| Embedding generation | ~1s per node (API call) |
| Memory usage | < 100MB for 1000 nodes with embeddings |

---

## Success Metrics

1. **Import Success Rate**: > 95% of documents parse into meaningful tree structure
2. **Retrieval Precision**: Top-5 results contain relevant content > 80% of queries
3. **User Curation Rate**: Users edit/refine < 20% of auto-parsed nodes
4. **Query Latency**: p95 < 1s for hybrid search

---

## Open Questions

1. **Embedding model**: OpenAI vs Voyage vs local (Ollama)?
2. **Chunking strategy**: Fixed size vs semantic boundaries?
3. **Multi-tree corpus**: Separate trees or single mega-tree?
4. **Sync frequency**: Real-time vs manual refresh for Drive?
5. **Collaboration**: How do shared knowledge bases work with Live Sync?

---

## Appendix: Competitive Analysis

| Feature | NotebookLM | LangChain RAG | TreeListy RAG |
|---------|------------|---------------|---------------|
| Visual browsing | ❌ | ❌ | ✅ |
| Edit chunks | ❌ | ❌ | ✅ |
| Structural context | ❌ | ❌ | ✅ |
| API/MCP access | ❌ | ✅ | ✅ |
| Self-hosted | ❌ | ✅ | ✅ |
| Free tier | ✅ | ✅ | ✅ |
| Google Drive | ✅ | 🔧 | 🔧 |
| Citations | ✅ | 🔧 | ✅ |

---

## Next Steps

1. **Validate concept**: Test AI document → tree parsing quality
2. **Phase 1 prototype**: Enhanced import with chunking
3. **User feedback**: Test with real P2C documents
4. **Iterate**: Refine based on retrieval quality
