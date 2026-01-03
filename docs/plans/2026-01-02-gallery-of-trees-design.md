# Gallery of Trees: Public Tree Discovery & Sharing

**Date:** 2026-01-02
**Status:** READY - Priority 1 (Revised after Gemini review)
**Build Target:** 696-700
**Dependencies:** Cloud Share (Build 425), Embed Mode (Build 610), Atlas Tree Registry (Build 623)
**Review:** Gemini + GPT-4 architecture reviews completed 2026-01-02

---

## Architecture Review Summary (Gemini)

### Critical Issues Identified

| Issue | Severity | Resolution |
|-------|----------|------------|
| **Write Gap** | Critical | Client cannot write to static JSON. Implement Firebase "Submissions" collection + admin rebuild script. |
| **ID Translation** | High | Fresh ID generation breaks internal hyperedges. Must include translation map to re-link. |
| **Spam Risk** | High | No auth = unlimited spam. Add rate limiting via Firebase Rules or lightweight auth. |
| **Version Compat** | Medium | Old clients may crash on new tree schemas. Add `minBuildVersion` to index. |
| **UUID Slicing** | Medium | `slice(0,8)` collision risk. Use full UUIDs. |
| **Cross-tree Hyperedges** | Medium | Strip external hyperedges on clone (dead links otherwise). |
| **Thumbnails** | Low | Can't embed in JSON. Use Firebase Storage URLs. |

### Revised Strategy

**Phase 1 (MVP): Read-Only Gallery**
- Manually curate `gallery-index.json` (no user publish)
- Zero abuse risk, high quality control
- Ship browse/clone functionality only

**Phase 2: Publish with Submission Queue**
- Client writes to Firebase "Submissions" collection
- Admin script validates and rebuilds static index
- Rate limiting via Firebase Rules

### ID Translation Map (Clone Fix)

When cloning, maintain old→new ID mapping to preserve internal references:

```javascript
function cloneWithTranslation(tree) {
    const idMap = new Map(); // oldId → newId

    // Pass 1: Generate new IDs, build translation map
    function generateIds(node) {
        const oldGuid = node.nodeGuid;
        const newGuid = `n_${crypto.randomUUID()}`;
        if (oldGuid) idMap.set(oldGuid, newGuid);
        node.nodeGuid = newGuid;

        [...(node.children || []), ...(node.items || [])].forEach(generateIds);
    }

    // Pass 2: Re-link hyperedges using translation map
    function relinkHyperedges(node) {
        if (node.hyperedges) {
            node.hyperedges = node.hyperedges.map(he => ({
                ...he,
                nodes: he.nodes.map(ref => {
                    // Only translate internal refs (same tree)
                    if (!ref.includes(':')) {
                        return idMap.get(ref) || ref;
                    }
                    // Strip external cross-tree refs
                    return null;
                }).filter(Boolean)
            })).filter(he => he.nodes.length > 1);
        }

        [...(node.children || []), ...(node.items || [])].forEach(relinkHyperedges);
    }

    generateIds(tree);
    relinkHyperedges(tree);
    return tree;
}
```

---

## Architecture Review Summary (GPT-4)

### Additional Issues Identified

| Issue | Severity | Resolution |
|-------|----------|------------|
| **Moderation Contradiction** | High | Doc says "no approval queue" AND "manual review queue" in different places. **Decision: Submissions queue for Phase 2.** |
| **Firestore 900KB Limit** | High | Cloud Share enforces ~900KB doc limit. Large trees (philosophy, debates) will fail. Add publish size meter + warnings. |
| **Immutable Snapshots** | Medium | Featured gallery entries should reference immutable snapshots. Make Firebase `shared/` collection append-only in rules. |
| **Namespace Confusion** | Medium | Code uses `?share=`, design uses `?s=` and "shortcode". Verify actual implementation. |
| **Offline Seed Manifest** | Medium | First launch with no network shows empty gallery. Bake minimal seed manifest into HTML. |
| **Node Content Sanitization** | Medium | Must sanitize node titles/descriptions, not just tree metadata. Strip file paths, device identifiers. |

### Strategic Alternative: Clone from Share Link First

GPT suggests a simpler path to cross-device workflow:

> "Ship 'Clone from Cloud Share link' first for cross-device, then Gallery browsing. You already load `?share=...` and assign it into the current tree. Add a 'Clone to My Trees' button on that page so personal device-to-device stops requiring export/email."

**Analysis:** This directly hits the Mobile → Desktop → Narrate workflow without opening spam risk. Could be a quick Phase 0.5 before full Gallery.

### Hybrid Index Strategy (Recommended)

```
gallery-index.json (static)     Firebase collection (dynamic)
┌─────────────────────┐         ┌─────────────────────┐
│ Featured/Curated    │         │ Community           │
│ - Offline-first     │         │ - Paginated         │
│ - Fast load         │         │ - Submissions queue │
│ - Admin-controlled  │         │ - Rate-limited      │
└─────────────────────┘         └─────────────────────┘
```

### Publish Size Constraints

| Tree Size | Status | Action |
|-----------|--------|--------|
| < 500KB | OK | Publish normally |
| 500-900KB | Warning | Show size meter, suggest trimming |
| > 900KB | Blocked | "Tree too large" error, suggest "publish summary only" |

### Proof/Verification Tests

1. **Clone invariants:** Clone tree with hyperedges → verify all endpoints exist post-clone
2. **Collision simulation:** Generate 100k GUIDs → assert uniqueness
3. **Offline demo:** Launch with no network + seeded manifest → Gallery shows featured
4. **Size gate:** Attempt publish at 899KB and 901KB → verify predictable UI

---

## Executive Summary

Gallery of Trees enables TreeListy users to browse, preview, and clone public trees from a curated collection. This transforms TreeListy from a single-device tool into a knowledge-sharing platform where users can discover templates, examples, and community-contributed trees.

**The Vision:**
> "Start with someone else's thinking, then make it your own."

---

## Relationship to Atlas

**This is NOT cross-device sync for personal trees.** Atlas already addresses that via TreeListy Home (see `2025-12-25-atlas-cross-tree-intelligence-design.md`, Appendix E).

| Concern | Solution | Mechanism |
|---------|----------|-----------|
| "I want MY trees on all my devices" | **Atlas TreeListy Home** | Local folder synced via OneDrive/Dropbox |
| "I want to discover PUBLIC trees" | **Gallery of Trees** | Firebase-hosted curated collection |
| "I want to share a tree with someone" | **Cloud Share** (Build 425) | Short URL `?share=abc123` |

**Gallery complements Atlas:**
- Atlas indexes trees you've opened locally
- Gallery provides trees you haven't seen yet
- Cloning a gallery tree → registers in local Atlas

---

## Key Use Cases: Cross-Device Workflows

### Mobile → Desktop (Capture → Validate → Narrate)

```
Mobile                              Desktop
┌──────────────────┐                ┌──────────────────┐
│ 🎙️ Record debate │                │ 📥 Clone tree    │
│ via Voice Capture│───Publish───▶  │ from Gallery     │
└────────┬─────────┘                └────────┬─────────┘
         │                                   │
         ▼                                   ▼
┌──────────────────┐                ┌──────────────────┐
│ 🤖 AI structures │                │ 🖥️ Refine with:  │
│ into debate tree │                │ • Canvas view    │
└────────┬─────────┘                │ • Hyperedges     │
         │                          │ • Counter-args   │
         ▼                          └────────┬─────────┘
┌──────────────────┐                         │
│ 📤 Publish to    │                         ▼
│ Gallery          │                ┌──────────────────┐
└──────────────────┘                │ 🔊 AI Narrative  │
                                    │ (pattern-aware)  │
                                    │                  │
                                    │ Synthesizes tree │
                                    │ into coherent    │
                                    │ spoken analysis  │
                                    └──────────────────┘
```

**Full Example Flow:**
1. **Mobile:** Record YouTube debate via Voice Capture
2. **Mobile:** AI structures raw transcript into debate tree (claims, counter-claims, evidence)
3. **Mobile:** Publish to Gallery
4. **Desktop:** Clone from Gallery
5. **Desktop:** Refine in Canvas view - visualize argument flow, add hyperedges linking related claims
6. **Desktop:** Generate AI Narrative (Build 695) - pattern-aware synthesis that explains the debate structure, key tensions, and implications
7. **Result:** Narrative saved to tree, can be replayed anytime (cached)

### Desktop → Mobile (Create → Test)

```
Desktop                             Mobile
┌──────────────────┐                ┌──────────────────┐
│ 🏗️ Build complex │                │ 📥 Clone tree    │
│ tree with full   │───Publish───▶  │ from Gallery     │
│ toolset          │                │                  │
│                  │                │ 📱 Test mobile   │
│ 📤 Publish to    │                │ UX with real     │
│ Gallery          │                │ tree data        │
└──────────────────┘                └──────────────────┘
```

**Example:** Create philosophy breakdown on desktop → Publish → Test how it renders on mobile, verify touch gestures work with complex tree.

---

## Problem Statement

### Current Pain Points

1. **Cold Start Problem** - New users face a blank canvas. No examples of "what good looks like."

2. **Template Discovery** - Users manually share tree JSON files via email/Discord. No central discovery.

3. **Cross-Device Friction** - User creates tree on laptop, wants it on phone. Currently requires manual export/import or cloud folder sync.

4. **Knowledge Silos** - Valuable trees (philosophy breakdowns, project templates, research structures) exist only on individual devices.

### User Stories

| User | Need | Current Workaround |
|------|------|-------------------|
| New user | "Show me what TreeListy can do" | Welcome tree only |
| Power user | "I want my Kant tree on my phone" | Export JSON, email to self, import |
| Teacher | "Share my course outline with students" | Generate share link, post to LMS |
| Community | "Browse what others have built" | None - trees are invisible |

---

## Solution Architecture

### How Gallery + Atlas + Cloud Share Work Together

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TreeListy Sharing Ecosystem                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    ATLAS (Local Device)                              │    │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐              │    │
│  │  │ TreeRegistry│    │ Search Index│    │ Edge Graph  │              │    │
│  │  │ (your trees)│    │ (MiniSearch)│    │ (backlinks) │              │    │
│  │  └──────┬──────┘    └─────────────┘    └─────────────┘              │    │
│  │         │                                                            │    │
│  │         ▼                                                            │    │
│  │  ┌─────────────────────────────────────────────────────────┐        │    │
│  │  │             TreeListy Home (~/.treelisty/)              │        │    │
│  │  │  ├── trees/        ← Your tree files                    │        │    │
│  │  │  ├── index/        ← Atlas persistence                  │        │    │
│  │  │  └── (synced via OneDrive/Dropbox/Google Drive)        │        │    │
│  │  └─────────────────────────────────────────────────────────┘        │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                              ▲                                               │
│                              │ Clone registers                               │
│                              │ in local Atlas                                │
│  ┌───────────────────────────┼───────────────────────────────────────┐      │
│  │                    GALLERY (Public)                               │      │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐        │      │
│  │  │ Gallery      │    │ Firebase     │    │ User's       │        │      │
│  │  │ Index        │◄───│ Cloud Store  │◄───│ Published    │        │      │
│  │  │ (manifest)   │    │ (tree data)  │    │ Trees        │        │      │
│  │  └──────────────┘    └──────────────┘    └──────────────┘        │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                              ▲                                               │
│                              │ Share URL                                     │
│  ┌───────────────────────────┼───────────────────────────────────────┐      │
│  │                 CLOUD SHARE (Direct Links)                        │      │
│  │                                                                    │      │
│  │     https://treelisty.netlify.app/?s=abc123                       │      │
│  │     (One-off sharing, not discoverable in gallery)                │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Gallery Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Gallery Infrastructure                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐       │
│  │ Gallery      │    │ Firebase     │    │ User's       │       │
│  │ Index        │◄───│ Cloud Store  │◄───│ Published    │       │
│  │ (manifest)   │    │ (tree data)  │    │ Trees        │       │
│  └──────┬───────┘    └──────────────┘    └──────────────┘       │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Gallery Browser UI                       │       │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐    │       │
│  │  │Template │ │Community│ │My Public│ │ Recent  │    │       │
│  │  │  Trees  │ │  Trees  │ │  Trees  │ │ Clones  │    │       │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘    │       │
│  └──────────────────────────────────────────────────────┘       │
│                          │                                       │
│         ┌────────────────┼────────────────┐                     │
│         ▼                ▼                ▼                     │
│     Preview          Clone to         Open in                   │
│     (embed)          Edit             Readonly                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Components

1. **Gallery Index** - JSON manifest listing available trees with metadata
2. **Firebase Cloud Store** - Existing infrastructure (Build 425) stores tree data
3. **Gallery Browser UI** - New modal for browsing/searching/previewing
4. **Publish Flow** - User action to add their tree to gallery
5. **Clone Flow** - Copy gallery tree to local device for editing

---

## Gallery Index Format

### Manifest Schema

**Location:** `https://treelisty.netlify.app/gallery-index.json`

```json
{
  "version": "1.0",
  "lastUpdated": "2026-01-02T00:00:00Z",
  "categories": [
    {
      "id": "templates",
      "name": "Templates",
      "icon": "📋",
      "description": "Starting points for common use cases"
    },
    {
      "id": "philosophy",
      "name": "Philosophy",
      "icon": "🏛️",
      "description": "Philosophical arguments and debates"
    },
    {
      "id": "projects",
      "name": "Project Management",
      "icon": "📊",
      "description": "Project plans and workflows"
    },
    {
      "id": "education",
      "name": "Education",
      "icon": "🎓",
      "description": "Course outlines and learning materials"
    },
    {
      "id": "community",
      "name": "Community",
      "icon": "🌐",
      "description": "User-contributed trees"
    }
  ],
  "trees": [
    {
      "id": "kant-critique-pure-reason",
      "name": "Kant's Critique of Pure Reason",
      "description": "Complete breakdown of Kant's first Critique with counter-arguments",
      "category": "philosophy",
      "pattern": "philosophy",
      "author": "TreeListy Team",
      "authorId": null,
      "shortcode": "kant-cpr-v1",
      "nodeCount": 156,
      "thumbnail": "thumbnails/kant-cpr.png",
      "tags": ["kant", "epistemology", "german-idealism", "transcendental"],
      "featured": true,
      "publishedAt": "2026-01-01T00:00:00Z",
      "downloads": 0,
      "rating": null
    },
    {
      "id": "software-project-template",
      "name": "Software Project Template",
      "description": "Agile project structure with sprints, epics, and stories",
      "category": "templates",
      "pattern": "generic",
      "author": "TreeListy Team",
      "authorId": null,
      "shortcode": "sw-proj-v1",
      "nodeCount": 42,
      "thumbnail": null,
      "tags": ["agile", "software", "project-management"],
      "featured": true,
      "publishedAt": "2026-01-01T00:00:00Z",
      "downloads": 0,
      "rating": null
    }
  ]
}
```

### Tree Entry Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique identifier (slug format) |
| `name` | string | Yes | Display name |
| `description` | string | Yes | Brief description (max 200 chars) |
| `category` | string | Yes | Category ID from categories array |
| `pattern` | string | Yes | TreeListy pattern key |
| `author` | string | Yes | Display name of author |
| `authorId` | string | No | User ID if authenticated publish |
| `shortcode` | string | Yes | Firebase shortcode for tree data |
| `nodeCount` | number | Yes | Total nodes in tree |
| `thumbnail` | string | No | URL to preview image |
| `tags` | string[] | No | Searchable tags |
| `featured` | boolean | No | Show in featured section |
| `publishedAt` | ISO date | Yes | Publication timestamp |
| `downloads` | number | No | Clone count (for popularity) |
| `rating` | number | No | Average rating (future) |
| `minBuildVersion` | number | Yes | Minimum build required to load tree |
| `thumbnailUrl` | string | No | Firebase Storage URL for preview image |

---

## User Flows

### Flow 1: Browse Gallery

```
User clicks "Gallery" button (new sidebar icon)
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  🌳 Tree Gallery                              [Search]  │
├─────────────────────────────────────────────────────────┤
│  ⭐ Featured                                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐       │
│  │ Kant's  │ │ Project │ │ LifeTree│ │ Debate  │       │
│  │ CPR     │ │ Template│ │ Example │ │ Template│       │
│  │ 🏛️ 156  │ │ 📋 42   │ │ 🌱 89   │ │ ⚔️ 34   │       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘       │
│                                                         │
│  📁 Categories                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📋 Templates  │ 🏛️ Philosophy │ 📊 Projects    │   │
│  │ 🎓 Education  │ 🌐 Community  │                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  🕐 Recently Added                                      │
│  • Hegel's Phenomenology (2 days ago)                  │
│  • GTD Workflow (5 days ago)                           │
│  • Research Paper Template (1 week ago)                │
└─────────────────────────────────────────────────────────┘
```

### Flow 2: Preview Tree

```
User clicks tree card in gallery
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  ← Back                     Kant's Critique of Pure... │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │                                                   │ │
│  │           [Embedded TreeListy Preview]            │ │
│  │            (readonly embed mode)                  │ │
│  │                                                   │ │
│  │   📖 Critique of Pure Reason                     │ │
│  │   ├── Transcendental Aesthetic                   │ │
│  │   │   ├── Space as A Priori Intuition           │ │
│  │   │   └── Time as A Priori Intuition            │ │
│  │   ├── Transcendental Analytic                   │ │
│  │   └── Transcendental Dialectic                  │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  📊 156 nodes  •  🏛️ Philosophy  •  By: TreeListy Team │
│  Tags: kant, epistemology, german-idealism              │
│                                                         │
│  ┌────────────────┐  ┌────────────────┐                │
│  │  📥 Clone to   │  │  🔗 Open in    │                │
│  │     Edit       │  │   New Tab      │                │
│  └────────────────┘  └────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

### Flow 3: Clone Tree

```
User clicks "Clone to Edit"
    │
    ▼
Fetch tree from Firebase (shortcode)
    │
    ▼
Generate new treeId and nodeGuids (fresh identities)
    │
    ▼
Set capexTree = clonedTree
    │
    ▼
Register in Atlas TreeRegistry
    │
    ▼
Show toast: "🌳 Tree cloned! Now editing your copy."
    │
    ▼
Close gallery modal, render tree
```

### Flow 4: Publish to Gallery

```
User clicks "Publish to Gallery" in tree menu
    │
    ▼
┌─────────────────────────────────────────────────────────┐
│  Publish to Gallery                                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Tree: Kant's Critique of Pure Reason                   │
│  Nodes: 156                                             │
│                                                         │
│  Category: [Philosophy        ▼]                        │
│                                                         │
│  Description:                                           │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Complete breakdown of Kant's first Critique with  │ │
│  │ counter-arguments from empiricists and idealists. │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Tags: [kant] [epistemology] [+]                        │
│                                                         │
│  ⚠️ This will create a public snapshot of your tree.   │
│     Future edits won't update the published version.   │
│                                                         │
│  ┌────────────────┐  ┌────────────────┐                │
│  │    Cancel      │  │   📤 Publish   │                │
│  └────────────────┘  └────────────────┘                │
└─────────────────────────────────────────────────────────┘
    │
    ▼
Upload to Firebase (existing Cloud Share flow)
    │
    ▼
Submit to gallery-submissions queue (or auto-add for v1)
    │
    ▼
Show toast: "📤 Tree published to Gallery!"
```

---

## Technical Implementation

### Phase 1: Gallery Browser (Read-Only)

**Effort:** 3-5 days
**Goal:** Users can browse and clone curated trees

#### 1.1 Gallery Index Loader

```javascript
// ═══════════════════════════════════════════════════════════════
// GALLERY INDEX
// Cached fetch of gallery manifest with fallback
// ═══════════════════════════════════════════════════════════════

const GALLERY_INDEX_URL = 'https://treelisty.netlify.app/gallery-index.json';
const GALLERY_CACHE_KEY = 'treelisty_gallery_cache';
const GALLERY_CACHE_TTL = 1000 * 60 * 60; // 1 hour

let galleryIndex = null;

async function fetchGalleryIndex(forceRefresh = false) {
    // Check cache first
    if (!forceRefresh) {
        const cached = localStorage.getItem(GALLERY_CACHE_KEY);
        if (cached) {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < GALLERY_CACHE_TTL) {
                galleryIndex = data;
                return data;
            }
        }
    }

    try {
        const response = await fetch(GALLERY_INDEX_URL);
        if (!response.ok) throw new Error('Gallery fetch failed');

        galleryIndex = await response.json();

        // Cache for offline/fast access
        localStorage.setItem(GALLERY_CACHE_KEY, JSON.stringify({
            data: galleryIndex,
            timestamp: Date.now()
        }));

        return galleryIndex;
    } catch (error) {
        console.error('[Gallery] Fetch failed:', error);

        // Return cached even if stale
        const cached = localStorage.getItem(GALLERY_CACHE_KEY);
        if (cached) {
            galleryIndex = JSON.parse(cached).data;
            return galleryIndex;
        }

        return null;
    }
}
```

#### 1.2 Gallery UI Components

```javascript
// ═══════════════════════════════════════════════════════════════
// GALLERY MODAL
// Browse, search, preview, and clone trees
// ═══════════════════════════════════════════════════════════════

function showGalleryModal() {
    const modal = document.getElementById('modal');
    modal.classList.add('gallery-modal');
    document.getElementById('modal-title').textContent = '🌳 Tree Gallery';

    document.getElementById('modal-body').innerHTML = `
        <div class="gallery-container">
            <div class="gallery-header">
                <input type="text" id="gallery-search" placeholder="Search trees..."
                       style="flex: 1; padding: 10px; border-radius: 8px; border: 1px solid var(--border-color);">
                <button onclick="refreshGallery()" class="btn btn-secondary" style="margin-left: 8px;">
                    🔄 Refresh
                </button>
            </div>

            <div id="gallery-content" class="gallery-content">
                <div class="gallery-loading">Loading gallery...</div>
            </div>
        </div>
    `;

    document.querySelector('#modal .modal-footer').innerHTML = `
        <button class="btn" onclick="document.getElementById('modal').style.display='none'">
            Close
        </button>
    `;

    modal.style.display = 'flex';

    // Load gallery content
    loadGalleryContent();

    // Setup search
    document.getElementById('gallery-search').addEventListener('input', debounce((e) => {
        filterGalleryTrees(e.target.value);
    }, 300));
}

async function loadGalleryContent() {
    const container = document.getElementById('gallery-content');
    const index = await fetchGalleryIndex();

    if (!index) {
        container.innerHTML = `
            <div class="gallery-error">
                <p>Unable to load gallery. Check your connection.</p>
                <button onclick="loadGalleryContent()" class="btn">Retry</button>
            </div>
        `;
        return;
    }

    // Render featured section
    const featured = index.trees.filter(t => t.featured);
    const categories = index.categories;

    container.innerHTML = `
        ${featured.length > 0 ? `
            <div class="gallery-section">
                <h3>⭐ Featured</h3>
                <div class="gallery-grid">
                    ${featured.map(tree => renderTreeCard(tree)).join('')}
                </div>
            </div>
        ` : ''}

        <div class="gallery-section">
            <h3>📁 Categories</h3>
            <div class="gallery-categories">
                ${categories.map(cat => `
                    <button class="category-chip" onclick="filterByCategory('${cat.id}')">
                        ${cat.icon} ${cat.name}
                    </button>
                `).join('')}
            </div>
        </div>

        <div class="gallery-section">
            <h3>🕐 All Trees</h3>
            <div id="gallery-all-trees" class="gallery-grid">
                ${index.trees.map(tree => renderTreeCard(tree)).join('')}
            </div>
        </div>
    `;
}

function renderTreeCard(tree) {
    const categoryIcon = galleryIndex?.categories?.find(c => c.id === tree.category)?.icon || '📄';

    return `
        <div class="gallery-card" onclick="previewGalleryTree('${tree.shortcode}', '${tree.id}')">
            <div class="gallery-card-header">
                <span class="gallery-card-icon">${categoryIcon}</span>
                <span class="gallery-card-nodes">${tree.nodeCount} nodes</span>
            </div>
            <div class="gallery-card-title">${escapeHtml(tree.name)}</div>
            <div class="gallery-card-desc">${escapeHtml(tree.description || '')}</div>
            <div class="gallery-card-footer">
                <span class="gallery-card-author">By ${escapeHtml(tree.author)}</span>
            </div>
        </div>
    `;
}
```

#### 1.3 Clone Logic

```javascript
// ═══════════════════════════════════════════════════════════════
// CLONE TREE FROM GALLERY
// Fetch, generate fresh IDs, load as new tree
// ═══════════════════════════════════════════════════════════════

async function cloneGalleryTree(shortcode, originalId) {
    showToast('📥 Cloning tree...', 'info', 2000);

    try {
        // Fetch tree data using existing Cloud Share infrastructure
        const treeData = await fetchSharedTree(shortcode);

        if (!treeData) {
            showToast('Failed to fetch tree', 'error');
            return;
        }

        // Generate fresh identities (critical for Atlas)
        const clonedTree = generateFreshIdentities(treeData);

        // Mark as cloned
        clonedTree.clonedFrom = {
            galleryId: originalId,
            shortcode: shortcode,
            clonedAt: new Date().toISOString()
        };

        // Load as current tree
        loadTreeData(clonedTree);

        // Register in Atlas
        if (typeof registerTreeInAtlas === 'function') {
            registerTreeInAtlas(clonedTree);
        }

        // Close gallery modal
        document.getElementById('modal').style.display = 'none';

        showToast('🌳 Tree cloned! Now editing your copy.', 'success');

    } catch (error) {
        console.error('[Gallery] Clone failed:', error);
        showToast('Clone failed: ' + error.message, 'error');
    }
}

function generateFreshIdentities(tree) {
    const clone = JSON.parse(JSON.stringify(tree));
    const idMap = new Map(); // oldGuid → newGuid (for hyperedge re-linking)

    // New tree identity (full UUIDs per Gemini review)
    clone.treeId = `tree_${crypto.randomUUID()}`;
    clone.uuid = `tree_${crypto.randomUUID()}`;

    // Pass 1: Generate new node GUIDs, build translation map
    function refreshNodeIds(node) {
        if (node.nodeGuid) {
            const oldGuid = node.nodeGuid;
            const newGuid = `n_${crypto.randomUUID()}`; // Full UUID
            idMap.set(oldGuid, newGuid);
            node.nodeGuid = newGuid;
        }

        const children = [
            ...(node.children || []),
            ...(node.items || []),
            ...(node.subItems || [])
        ];

        children.forEach(refreshNodeIds);
    }

    // Pass 2: Re-link internal hyperedges, strip external refs
    function relinkHyperedges(node) {
        if (node.hyperedges) {
            node.hyperedges = node.hyperedges.map(he => ({
                ...he,
                nodes: he.nodes.map(ref => {
                    // Internal ref (no colon) - translate via map
                    if (!ref.includes(':')) {
                        return idMap.get(ref) || ref;
                    }
                    // External cross-tree ref - strip it
                    return null;
                }).filter(Boolean)
            })).filter(he => he.nodes.length > 1); // Remove broken hyperedges
        }

        const children = [
            ...(node.children || []),
            ...(node.items || []),
            ...(node.subItems || [])
        ];

        children.forEach(relinkHyperedges);
    }

    refreshNodeIds(clone);
    relinkHyperedges(clone);

    // Strip fields that shouldn't be cloned
    delete clone.undoStack;
    delete clone.history;
    delete clone.viewState;
    delete clone.aiConfig; // API keys

    return clone;
}
```

#### 1.4 CSS Styles

```css
/* ═══════════════════════════════════════════════════════════════
   GALLERY STYLES
   ═══════════════════════════════════════════════════════════════ */

#modal.gallery-modal .modal-content {
    max-width: 1000px;
    width: 95vw;
    max-height: 85vh;
}

.gallery-container {
    display: flex;
    flex-direction: column;
    gap: 20px;
    max-height: 70vh;
    overflow: hidden;
}

.gallery-header {
    display: flex;
    align-items: center;
    padding: 0 4px;
}

.gallery-content {
    overflow-y: auto;
    padding: 4px;
}

.gallery-section {
    margin-bottom: 24px;
}

.gallery-section h3 {
    margin-bottom: 12px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 600;
}

.gallery-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
}

.gallery-card {
    background: var(--card-bg);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    padding: 16px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.gallery-card:hover {
    border-color: var(--accent-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.gallery-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.gallery-card-icon {
    font-size: 20px;
}

.gallery-card-nodes {
    font-size: 11px;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    padding: 2px 8px;
    border-radius: 10px;
}

.gallery-card-title {
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 6px;
    color: var(--text-primary);
    line-height: 1.3;
}

.gallery-card-desc {
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

.gallery-card-footer {
    margin-top: 12px;
    padding-top: 8px;
    border-top: 1px solid var(--border-color);
}

.gallery-card-author {
    font-size: 11px;
    color: var(--text-tertiary);
}

.gallery-categories {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
}

.category-chip {
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 20px;
    padding: 6px 14px;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.category-chip:hover {
    background: var(--accent-color);
    color: white;
    border-color: var(--accent-color);
}

.gallery-loading,
.gallery-error {
    text-align: center;
    padding: 40px;
    color: var(--text-secondary);
}

/* Mobile responsive */
@media (max-width: 768px) {
    .gallery-grid {
        grid-template-columns: 1fr;
    }

    #modal.gallery-modal .modal-content {
        width: 100%;
        max-height: 90vh;
        border-radius: 16px 16px 0 0;
    }
}
```

### Phase 2: Publish Flow

**Effort:** 2-3 days
**Goal:** Users can publish trees to gallery

#### 2.1 Publish Modal

```javascript
function showPublishModal() {
    const modal = document.getElementById('modal');
    document.getElementById('modal-title').textContent = '📤 Publish to Gallery';

    const categories = galleryIndex?.categories || [
        { id: 'templates', name: 'Templates', icon: '📋' },
        { id: 'philosophy', name: 'Philosophy', icon: '🏛️' },
        { id: 'projects', name: 'Projects', icon: '📊' },
        { id: 'education', name: 'Education', icon: '🎓' },
        { id: 'community', name: 'Community', icon: '🌐' }
    ];

    const nodeCount = countTreeNodes(capexTree);

    document.getElementById('modal-body').innerHTML = `
        <div class="publish-form">
            <div class="publish-preview">
                <strong>${escapeHtml(capexTree.name || 'Untitled Tree')}</strong>
                <span class="publish-node-count">${nodeCount} nodes</span>
            </div>

            <div class="form-group">
                <label>Category</label>
                <select id="publish-category">
                    ${categories.map(c => `
                        <option value="${c.id}">${c.icon} ${c.name}</option>
                    `).join('')}
                </select>
            </div>

            <div class="form-group">
                <label>Description (max 200 chars)</label>
                <textarea id="publish-description" maxlength="200" rows="3"
                          placeholder="Brief description of this tree...">${escapeHtml(capexTree.description || '')}</textarea>
                <span class="char-count"><span id="desc-count">0</span>/200</span>
            </div>

            <div class="form-group">
                <label>Tags (comma-separated)</label>
                <input type="text" id="publish-tags" placeholder="e.g., philosophy, kant, ethics">
            </div>

            <div class="publish-warning">
                ⚠️ This creates a public snapshot. Future edits won't update the published version.
            </div>
        </div>
    `;

    document.querySelector('#modal .modal-footer').innerHTML = `
        <button class="btn btn-secondary" onclick="document.getElementById('modal').style.display='none'">
            Cancel
        </button>
        <button class="btn btn-primary" onclick="publishToGallery()">
            📤 Publish
        </button>
    `;

    // Char counter
    const textarea = document.getElementById('publish-description');
    const counter = document.getElementById('desc-count');
    textarea.addEventListener('input', () => {
        counter.textContent = textarea.value.length;
    });
    counter.textContent = textarea.value.length;

    modal.style.display = 'flex';
}

async function publishToGallery() {
    const category = document.getElementById('publish-category').value;
    const description = document.getElementById('publish-description').value.trim();
    const tagsInput = document.getElementById('publish-tags').value;
    const tags = tagsInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t);

    if (!description) {
        showToast('Please add a description', 'warning');
        return;
    }

    showToast('📤 Publishing...', 'info', 3000);

    try {
        // Use existing Cloud Share to upload tree
        const shortcode = await uploadToCloudShare(capexTree);

        // Submit gallery entry (for v1, this could be a GitHub issue or Firebase collection)
        const submission = {
            id: `user-${Date.now()}`,
            name: capexTree.name || 'Untitled Tree',
            description: description,
            category: category,
            pattern: capexTree.pattern?.key || currentPattern || 'generic',
            author: 'Anonymous', // Or pull from user profile if implemented
            shortcode: shortcode,
            nodeCount: countTreeNodes(capexTree),
            tags: tags,
            submittedAt: new Date().toISOString()
        };

        // For v1: Store in Firebase submissions collection for manual review
        // For v2: Auto-add to community category
        await submitGalleryEntry(submission);

        document.getElementById('modal').style.display = 'none';
        showToast('📤 Published to Gallery!', 'success');

    } catch (error) {
        console.error('[Gallery] Publish failed:', error);
        showToast('Publish failed: ' + error.message, 'error');
    }
}
```

### Phase 3: Cross-Device Sync (Future)

**Effort:** 1 week+
**Goal:** User's own trees sync across devices

This builds on Atlas TreeRegistry and requires:

1. **User Authentication** - Optional login (Google/GitHub)
2. **My Trees Cloud** - Firebase collection per user
3. **Sync Protocol** - Last-write-wins or conflict resolution
4. **Offline Queue** - Changes queued when offline

This is a larger undertaking and should be a separate design doc.

---

## UI Integration Points

### 1. Sidebar Icon

Add new Gallery icon to left sidebar:

```javascript
// In sidebar icon array
{ id: 'gallery-btn', icon: '🌳', title: 'Tree Gallery', onclick: 'showGalleryModal()' }
```

### 2. Welcome Tree CTA

Add "Browse Gallery" link to welcome tree:

```
Welcome to TreeListy!
├── Getting Started
├── Browse Gallery →  [Click to explore example trees]
└── ...
```

### 3. Empty State

When no tree is loaded, show gallery prompt:

```
┌─────────────────────────────────────────┐
│                                         │
│         🌳 No tree loaded               │
│                                         │
│   [Import File]  [Start Blank]          │
│                                         │
│   ─────── or ───────                    │
│                                         │
│   [🌳 Browse Gallery]                   │
│                                         │
└─────────────────────────────────────────┘
```

### 4. Tree Menu Option

Add "Publish to Gallery" in tree context menu (root node):

```
Export as JSON
Export as Excel
Share Link
──────────────
📤 Publish to Gallery
```

---

## Seed Content Strategy

### Initial Gallery Trees

Before launch, create 10-15 high-quality example trees:

| Category | Trees |
|----------|-------|
| Templates | Software Project, Research Paper, Book Outline, Meeting Notes |
| Philosophy | Kant's Critique, Hegel's Dialectic, Nietzsche's Will to Power |
| Education | Course Syllabus, Study Guide, Thesis Structure |
| Projects | Product Launch, Event Planning, Home Renovation |

### Quality Guidelines

Published trees should:
- Have 20+ nodes (substantial content)
- Include descriptions at multiple levels
- Use appropriate pattern
- Be self-explanatory (no private context)
- Avoid sensitive/personal information

---

## Security Considerations

### Content Moderation

**User-Controlled Publishing:** Users decide which of their trees to make public. No approval queue.

| Risk | Mitigation |
|------|------------|
| Spam/junk trees | Report button → flag for review → removal if warranted |
| Inappropriate content | Community reporting, clear ToS |
| Malicious links in descriptions | Sanitize HTML, no external links in descriptions |
| Copyright infringement | DMCA-style takedown process, attribution encouraged |

**Philosophy:** Trust users by default, act on reports. Similar to GitHub Gists or CodePen.

### Data Privacy

- Published trees are **public snapshots** - warn users
- Strip any `aiConfig` API keys before publish
- Remove `clonedFrom` metadata on publish (don't leak clone chains)
- No PII collection required for browse/clone

---

## Implementation Phases (Revised per Gemini Review)

### Phase 1: Read-Only Gallery (MVP)
**Target:** Build 696-700
**Effort:** 3-5 days
**Risk:** Low (no user-generated content)

- [ ] Gallery index format with `minBuildVersion` field
- [ ] Manually curate 5-10 seed trees
- [ ] Gallery modal UI with sidebar icon
- [ ] Category filtering and search
- [ ] Tree preview (embedded readonly, first 2-3 levels)
- [ ] Clone with ID translation map (preserves internal hyperedges)
- [ ] Version compatibility check before clone
- [ ] Strip sensitive fields on clone (`aiConfig`, `undoStack`, etc.)

**Key Decision:** No user publish in Phase 1. Admin manually curates index.

### Phase 2: Publish with Submission Queue
**Target:** Build 705-710
**Effort:** 1 week
**Risk:** Medium (requires Firebase Rules for rate limiting)

- [ ] Firebase "gallery-submissions" collection
- [ ] Client-side Publish modal (writes to submissions, NOT static JSON)
- [ ] Rate limiting: 5 publishes/day per device via Firebase Rules
- [ ] Admin CLI script: validate submissions, rebuild `gallery-index.json`
- [ ] Netlify rebuild trigger on index update
- [ ] Mobile-friendly publish (auto-generate tags, optional description)

**Moderation:** Report button → flag in Firebase → admin review → removal

### Phase 3: Community Features
**Target:** Build 720+
**Effort:** 1 week

- [ ] Download/clone counts (increment on clone)
- [ ] Star/favorite trees (localStorage for anonymous, Firebase for auth'd)
- [ ] "Cloned from" attribution in tree metadata
- [ ] Remix detection (if re-published clone, link to original)

### Phase 4: Scaling & Auth (Future)
**Target:** v2.x
**Effort:** 2+ weeks
**Trigger:** When gallery exceeds 500 entries

- [ ] Pagination: `gallery-index-p1.json`, `gallery-index-p2.json`
- [ ] Optional lightweight auth (GitHub OAuth or magic link email)
- [ ] Verified author badges
- [ ] Full-text search via Algolia (if needed)

---

## Acceptance Criteria

### Phase 1 (MVP)

- [ ] User can open Gallery from sidebar
- [ ] Gallery loads within 2 seconds
- [ ] User can search trees by name/tag
- [ ] User can filter by category
- [ ] User can preview tree in readonly mode
- [ ] User can clone tree to edit locally
- [ ] Cloned tree has fresh identities (no ID collision)
- [ ] Gallery works offline (cached index)

### Phase 2 (Publish)

- [ ] User can publish current tree to gallery
- [ ] Submission includes category, description, tags
- [ ] Published tree appears in gallery (after review)
- [ ] User warned about public visibility

---

## Files to Create

| File | Purpose |
|------|---------|
| `gallery-index.json` | Initial gallery manifest |
| `thumbnails/` | Tree preview images (optional) |

## Files to Modify

| File | Changes |
|------|---------|
| `treeplexity.html` | Gallery modal, clone logic, sidebar icon, CSS |

---

## Open Questions

1. **Moderation Model:** Manual review queue vs. auto-publish with report button?

2. **Attribution:** Should cloned trees show "Based on X by Y"?

3. **Versioning:** Can publishers update their trees, or always new submissions?

4. **Analytics:** Track downloads/clones for popularity ranking?

5. **Cross-Device Scope:** Is Phase 4 (sync) part of this feature or separate Atlas work?

---

## Appendix: Alternative Approaches Considered

### A. GitHub-Hosted Gallery

**Pros:** Free hosting, PR-based submissions, version control
**Cons:** Requires GitHub knowledge to contribute, slower iteration

### B. Decentralized (IPFS)

**Pros:** Censorship-resistant, no central server
**Cons:** Complex, slow, overkill for this use case

### C. In-App Only (No Web Gallery)

**Pros:** Simpler, no hosting costs
**Cons:** No discoverability, can't share gallery links

**Decision:** Firebase-backed with static index file provides best balance of simplicity, speed, and future flexibility.
