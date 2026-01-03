# Gallery of Trees - AI Architecture Review Prompt

**Date:** 2026-01-02
**Design Doc:** `2026-01-02-gallery-of-trees-design.md`
**Reviewer Role:** Senior architect reviewing cross-device sharing feature

---

## Context

**TreeListy** is a single-file HTML application (~1.3MB) for hierarchical knowledge decomposition. Users create structured trees for projects, philosophy breakdowns, debates, life planning, etc. Current build: 695.

**Existing Infrastructure:**
- **Cloud Share (Build 425):** Upload tree to Firebase, get short URL (`?s=abc123`)
- **Embed Mode (Build 610):** Readonly/embed URL parameters for previewing trees
- **Atlas (Build 623-664):** Local device index of opened trees with cross-tree search
- **Atlas TreeListy Home (designed, not shipped):** Local folder (`~/.treelisty/`) synced via OneDrive/Dropbox for personal cross-device sync
- **AI Narrative (Build 695):** Pattern-aware text-to-speech synthesis of tree content

---

## Problem Statement

Users cannot easily:
1. **Discover example trees** - New users face blank canvas, no "what good looks like"
2. **Share trees across their own devices** - Must manually export JSON, email to self
3. **Browse community contributions** - Trees are invisible silos on individual devices

**Key Use Case (Mobile → Desktop → Narrate):**
```
1. Mobile: Record YouTube debate via Voice Capture
2. Mobile: AI structures into debate tree
3. Mobile: Publish to Gallery
4. Desktop: Clone from Gallery
5. Desktop: Refine with Canvas view, hyperedges, counter-arguments
6. Desktop: Generate pattern-aware AI Narrative (spoken synthesis)
7. Result: Complete analysis workflow across devices
```

---

## Proposed Solution: Gallery of Trees

A public, browsable collection of trees hosted on Firebase with a curated index.

### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         TreeListy Sharing Ecosystem                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ATLAS (Local Device)           GALLERY (Public)         CLOUD SHARE        │
│  ┌─────────────────┐           ┌─────────────────┐      ┌─────────────────┐ │
│  │ TreeRegistry    │           │ gallery-index   │      │ ?s=abc123       │ │
│  │ (your trees)    │◀──clone───│ .json manifest  │      │ (direct links)  │ │
│  │                 │           │                 │      │                 │ │
│  │ Search Index    │           │ Firebase store  │      │ One-off sharing │ │
│  │ (MiniSearch)    │           │ (tree data)     │      │ Not discoverable│ │
│  └─────────────────┘           └─────────────────┘      └─────────────────┘ │
│         │                              ▲                                     │
│         │                              │                                     │
│         ▼                              │                                     │
│  TreeListy Home                   User publishes                            │
│  (~/.treelisty/)                  tree to gallery                           │
│  synced via cloud                                                           │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Gallery Index Format

Static JSON manifest hosted at `https://treelisty.netlify.app/gallery-index.json`:

```json
{
  "version": "1.0",
  "categories": [
    { "id": "philosophy", "name": "Philosophy", "icon": "🏛️" },
    { "id": "templates", "name": "Templates", "icon": "📋" }
  ],
  "trees": [
    {
      "id": "kant-critique",
      "name": "Kant's Critique of Pure Reason",
      "description": "Complete breakdown with counter-arguments",
      "category": "philosophy",
      "pattern": "philosophy",
      "author": "TreeListy Team",
      "shortcode": "kant-cpr-v1",
      "nodeCount": 156,
      "tags": ["kant", "epistemology"],
      "publishedAt": "2026-01-01T00:00:00Z"
    }
  ]
}
```

### Clone Flow

When user clones a gallery tree:
1. Fetch tree data from Firebase using shortcode
2. **Generate fresh identities** (new `treeId`, new `nodeGuid` for all nodes)
3. Load as current tree
4. Register in local Atlas TreeRegistry
5. User now has independent copy to edit

Fresh IDs prevent Atlas collisions if same tree cloned multiple times.

### Publish Flow

User-controlled (no approval queue):
1. User clicks "Publish to Gallery" on their tree
2. Select category, add description, tags
3. Upload to Firebase (existing Cloud Share infrastructure)
4. Add entry to gallery submissions
5. Tree appears in Gallery

Moderation: Report button → flag for review → removal if warranted.

---

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Index format | Static JSON file | Simple, cacheable, works offline |
| Storage | Firebase (existing) | Reuse Cloud Share infrastructure |
| Identity on clone | Fresh IDs generated | Prevent Atlas collisions |
| Moderation | User-controlled + reporting | Trust users, act on abuse |
| Preview | Embedded readonly mode | Reuse existing embed mode |

---

## Implementation Phases

**Phase 1 (MVP):** Browse & Clone - 3-5 days
- Gallery index and seed trees
- Browser modal UI with search/filter
- Preview in readonly mode
- Clone with fresh identities

**Phase 2:** Publish Flow - 2-3 days
- Publish modal UI
- Category/tag selection
- Firebase submission

**Phase 3:** Community Features - 1 week
- Download counts
- Favorites/stars
- Author profiles

---

## Questions for Reviewers

### Architecture

1. **Static index vs. dynamic API:** The gallery index is a static JSON file updated on publish. Should this be a dynamic Firebase query instead? Trade-offs: static is simpler/cacheable but requires index rebuild on publish.

2. **Fresh ID generation:** On clone, we generate new `treeId` and `nodeGuid` for all nodes. Is `crypto.randomUUID().slice(0,8)` sufficient, or should we use full UUIDs? Collision risk assessment?

3. **Shortcode stability:** Gallery entries reference trees by Firebase shortcode. If shortcode system changes, gallery breaks. Should we add a layer of indirection (gallery ID → shortcode mapping)?

### User Experience

4. **Preview depth:** How much of the tree should be visible in preview mode? Full tree could be large. Options: (a) full tree, (b) first 2-3 levels, (c) summary + expand on demand.

5. **Clone attribution:** Should cloned trees show "Based on X by Y"? Visible in tree metadata, info panel, or hidden? Privacy implications for anonymous authors?

6. **Mobile publish flow:** Publishing requires category/description input. Is this friction acceptable on mobile, or should mobile publish be simplified (auto-categorize, skip description)?

### Security & Moderation

7. **Content stripping on publish:** We strip `aiConfig` (API keys). What else should be stripped? `clonedFrom` chains? User-specific paths? Hyperedge references to unpublished trees?

8. **Abuse vectors:** What are the main abuse risks?
   - Spam (junk trees flooding gallery)
   - Malicious content in descriptions
   - Copyright infringement
   - PII exposure (user publishes tree with personal info)

   Are report + takedown sufficient, or do we need proactive filtering?

9. **Rate limiting:** Should we limit publishes per user/device? What's a reasonable limit (e.g., 5 trees/day)?

### Integration

10. **Atlas sync:** When user clones gallery tree, it registers in Atlas. If user later opens the same tree on another device via Atlas Home sync, are there ID conflicts? The cloned tree has fresh IDs, but original gallery tree still exists.

11. **Narrative caching:** If a gallery tree has a pre-generated narrative, should it be included in the clone? Or should user generate fresh narrative? Stale narrative risk if tree is edited post-clone.

12. **Cross-tree hyperedges:** If a gallery tree references nodes in another (unpublished) tree via hyperedge, what happens on clone? Options: (a) strip external hyperedges, (b) include as broken links, (c) resolve to gallery copies if available.

### Performance

13. **Gallery size scaling:** At 100 trees, static index is fine. At 10,000 trees, it's 1MB+. When should we switch to paginated/dynamic loading? Or is 10K trees unrealistic for foreseeable future?

14. **Clone performance:** Large trees (1000+ nodes) require generating 1000+ fresh GUIDs. Is this a noticeable delay? Should we show progress indicator?

---

## Constraints

- **Single-file architecture:** TreeListy is a monolithic HTML file. No external JS imports. All code must be inline or loaded via Blob URLs.
- **Existing infrastructure:** Must use existing Firebase setup for Cloud Share. No new backend services.
- **Offline capability:** Gallery index should be cached for offline browsing (trees require network to clone).
- **Mobile-first use case:** Publishing must work on mobile (debate capture scenario).

---

## Success Criteria

1. User can browse gallery in < 2 seconds
2. User can clone tree to local device in < 5 seconds
3. Cloned tree works identically to original (all features)
4. Cross-device workflow (mobile capture → desktop refine → narrate) completes successfully
5. Gallery works offline (cached index, preview unavailable)

---

## Your Review

Please analyze this design and provide feedback on:

1. **Architecture soundness** - Are the technical decisions appropriate?
2. **Missing considerations** - What have we overlooked?
3. **Risk assessment** - What could go wrong?
4. **Alternative approaches** - Are there better solutions to any component?
5. **Priority validation** - Is Gallery the right thing to build now vs. other backlog items?

Be direct and critical. Identify weaknesses rather than affirming the design.
