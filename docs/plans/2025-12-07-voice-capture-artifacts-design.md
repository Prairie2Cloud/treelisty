# Voice Capture & Artifact System Design

**Date:** 2025-12-07
**Status:** Design Complete
**Feature:** Voice Inbox + Artifact Management for TreeListy

---

## Overview

Voice Capture transforms TreeListy into a frictionless thought-capture tool. Instead of typing, users speak naturally and let AI structure their words into the tree. This is especially powerful for LifeTree users documenting family stories - capture Mom's memories as she tells them, process them later.

The companion Artifact System handles photos, documents, and audio files that accompany these memories, with a portable `.treelisty` bundle format for sharing complete trees via email.

### Core Philosophy

**"Capture now, structure later."**

Voice interfaces fail when they demand memorized commands or perfect speech. This system succeeds by:
- Accepting messy, stream-of-consciousness input
- Storing captures in an inbox for later processing
- Letting TreeBeard (AI) handle structuring through natural conversation

### Primary Users (Priority Order)

1. **LifeTree Storyteller** - Documenting family memories with photos and narrated stories
2. **Creative Dumper** - Externalizing streams of thought quickly, organizing later
3. **Walking Thinker** - Capturing ideas on-the-go, away from keyboard

### Success Metrics

- Time from "idea in head" to "captured in TreeListy" < 5 seconds
- Zero learning curve - no commands to memorize
- Complete LifeTree shareable via single email attachment

---

## Voice Capture System

### Entry Points

| Trigger | Platform | Behavior |
|---------|----------|----------|
| **Floating Action Button (FAB)** | Mobile | Mic button in corner, context-aware (hides during modals, 3D view, keyboard) |
| **TreeBeard mic icon** | Desktop/Mobile | Mic button in TreeBeard input area |

Both entry points open TreeBeard (full-screen on mobile) with recording interface.

### Recording Experience

```
┌─────────────────────────────────────────────────────────┐
│  TREEBEARD (full-screen on mobile)                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  🔴 Recording... 2:34                            │   │
│  │                                                   │   │
│  │  "Mom said she remembers when they moved to      │   │
│  │   Brooklyn, it was right after the war and       │   │
│  │   grandpa had just started working at the..."    │   │
│  │                                          ▊       │   │
│  │                                                   │   │
│  │              [ ⏹ Stop Recording ]                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Recording features:**
- **Live transcript** - Words appear as user speaks (Web Speech API interim results)
- **Duration display** - Running timer showing recording length
- **Soft limit at 5 minutes** - Gentle prompt: "Still recording... tap to continue or stop to save"
- **Offline behavior (MVP)** - Block with message: "Voice capture requires internet for transcription"

### Capture Landing

After stopping, transcript becomes a pending capture in TreeBeard's "📎 Captures" section:

```
┌─────────────────────────────────────────────────────────┐
│  📎 Captures (2)                                        │
│  ───────────────────────────────────────────────────── │
│  📎 "Mom said she remembers when they..."  [143 words]  │
│     2 minutes ago                            ▼ expand   │
│                                                         │
│  📎 "The house on Maple Street had a big..."  [67 words]│
│     1 hour ago                               ▼ expand   │
│  ───────────────────────────────────────────────────── │
│                                                         │
│  [Select multiple]                                      │
└─────────────────────────────────────────────────────────┘
```

**Capture properties:**
- Per-tree (captures belong to active tree when recorded)
- Expandable preview (first line collapsed → full transcript on tap)
- Persist in IndexedDB (survives browser refresh/crash)
- Badge count on FAB shows unprocessed captures
- Gentle nudge after 3+ unprocessed: "You have 5 captures waiting"

---

## Processing Flow

### Initiating Processing

Tap a capture → TreeBeard presents guided prompt:

```
┌─────────────────────────────────────────────────────────┐
│  📎 Voice Capture                                       │
│  "Mom said she remembers when they moved to Brooklyn,   │
│   it was right after the war and grandpa had just       │
│   started working at the factory..."                    │
│                                                         │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  What should I do with this?                            │
│                                                         │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐    │
│  │ Add to tree  │ │ New branch   │ │ Save as note │    │
│  └──────────────┘ └──────────────┘ └──────────────┘    │
│                                                         │
│  Or type your own instruction...                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Add this to Mom's 1940s decade, she was about   │   │
│  │ 8 years old                                     │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Quick Actions

| Action | Behavior |
|--------|----------|
| **Add to tree** | AI structures transcript using current pattern, merges into existing tree |
| **New branch** | AI creates new phase/branch from transcript |
| **Save as note** | Add transcript as single raw text item (no AI processing) |
| **🧠 Psychological analysis** | Run Free Speech pattern analysis (surfaces hidden patterns) |

### Custom Instructions

User can type any instruction instead of quick actions:

- *"Add this to Mom's 1960s, she was about 15"*
- *"These are three action items from the vendor call"*
- *"Extract the names mentioned and add to people list"*
- *"Just dump this into a new phase called Morning Ideas"*

TreeBeard processes with full context (current pattern, tree structure, conversation mode).

### Optional Review Step

Before AI processes, user can edit transcript to fix speech recognition errors:

```
┌─────────────────────────────────────────────────────────┐
│  ✏️ Review transcript (optional)                        │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Mom said she remembers when they moved to       │   │
│  │ Brooklyn, it was right after the war and        │   │
│  │ grandpa had just started working at the         │   │
│  │ [on tross] → [Aunt Rose]  ← tap to edit         │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  [ Skip review ]              [ Done editing ]          │
└─────────────────────────────────────────────────────────┘
```

### Batch Processing

For multiple related captures:

1. Tap "Select multiple" in captures section
2. Check captures to combine
3. "Process all as one" → TreeBeard receives combined transcript
4. Single conversation to structure all captures together

### Data Model

Processed items store transcript on parent:

```javascript
{
  id: "phase-1940s",
  name: "1940s",
  raw_transcript: "Mom said she remembers when they moved to Brooklyn...",
  capture_mode: "voice",
  items: [
    { id: "item-1", name: "Moved to Brooklyn", /* no transcript here */ },
    { id: "item-2", name: "Grandpa's factory job", /* no transcript here */ }
  ]
}
```

---

## Artifact Management

### Supported File Types

| Category | Formats | Display |
|----------|---------|---------|
| **Images** | JPG, PNG, WEBP, HEIC, GIF | Thumbnail preview |
| **Audio** | MP3, WAV, WEBM, M4A | Audio player |
| **Documents** | PDF | PDF preview |
| **Other** | DOCX, TXT, etc. | File icon + name/size |

Philosophy: Accept everything, preview what we can, archive the rest.

### Three Entry Points for Adding Artifacts

**1. Attach to existing item**
```
Select item → ⋮ menu → 📎 Add artifact → Pick file
```

**2. Capture with voice**
```
During recording → tap 📷 → attach photo
Photo + transcript bundled as single capture
```

**3. Drag-and-drop**
```
Drop file anywhere on TreeListy → lands in Captures section
Process like voice capture: "What is this? Where does it belong?"
```

### Artifact Display

**In tree view:** Items with artifacts show badge icon

```
├── 📁 1940s
│   ├── 🏠 Moved to Brooklyn  📎
│   ├── 👔 Grandpa's factory job  🖼️ 3
│   └── 🎄 First Christmas in new house  🎙️
```

| Badge | Meaning |
|-------|---------|
| 📎 | Has attachment(s) |
| 🖼️ 3 | Has 3 images |
| 🎙️ | Has audio recording |

**Side panel preview:** Select item → panel shows artifacts

```
┌─────────────────────────────────────────┐
│  📎 Artifacts (3)                       │
│  ───────────────────────────────────── │
│  ┌───────┐                              │
│  │       │  grandpa-factory.jpg         │
│  │  🖼️   │  2.3 MB • Added Dec 7        │
│  │       │                              │
│  └───────┘                              │
│  ┌───────┐                              │
│  │       │  brooklyn-house.jpg          │
│  │  🖼️   │  1.8 MB • Added Dec 7        │
│  │       │                              │
│  └───────┘                              │
│  ┌───────┐                              │
│  │       │  mom-story.webm              │
│  │  🎙️   │  4.1 MB • 3:24 duration      │
│  │       │  ▶️ Play                      │
│  └───────┘                              │
│                                         │
│  [ + Add artifact ]                     │
└─────────────────────────────────────────┘
```

Scrollable list for easy viewing of many artifacts.

### Storage Architecture

**During session (local):** IndexedDB
- Artifacts saved immediately on add
- Survives browser refresh/crash
- Keyed to tree ID

**During collaboration:** Firebase Storage
- Artifacts upload to shared cloud storage
- All collaborators see in real-time
- References stored in Firebase Realtime DB

**Size limits (tiered):**

| Mode | Per-file limit | Per-tree limit |
|------|----------------|----------------|
| Solo (local) | None | None |
| Collaboration | 25 MB | 500 MB |

### Deleting Artifacts

- Permanent delete (no recovery/trash)
- Always maintain 1 backup copy of tree before delete operations
- No swipe-to-delete (explicit action required)

---

## The .treelisty Bundle

A portable ZIP archive containing everything needed to view, edit, and collaborate on a tree.

### Bundle Structure

```
mom-lifetree.treelisty (ZIP)
│
├── tree.json                   # Full tree data
│   {
│     "id": "tree-abc123",
│     "name": "Mom's Life",
│     "pattern": "lifetree",
│     "children": [...],
│     "artifacts": {
│       "art-001": { "filename": "grandpa-factory.jpg", "itemId": "item-123" },
│       "art-002": { "filename": "brooklyn-house.jpg", "itemId": "item-123" },
│       "art-003": { "filename": "mom-story.webm", "itemId": "item-456" }
│     }
│   }
│
├── artifacts/                  # Full-resolution files
│   ├── grandpa-factory.jpg
│   ├── brooklyn-house.jpg
│   └── mom-story.webm
│
├── thumbnails/                 # Quick previews (optional, for fast loading)
│   ├── grandpa-factory-thumb.jpg
│   └── brooklyn-house-thumb.jpg
│
└── session.json                # Live collab config (optional)
    {
      "firebaseRoom": "abc123",
      "voiceChatEnabled": true,
      "inviteMessage": "Join us to build Mom's LifeTree!",
      "createdBy": "Sarah",
      "createdAt": "2025-12-07T10:30:00Z"
    }
```

### Export Flow

```
┌─────────────────────────────────────────────────────────┐
│  Export Tree                                            │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  Mom's Life (LifeTree)                                  │
│  47 items • 12 artifacts • 34.2 MB                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📦  .treelisty Bundle                           │   │
│  │     Complete tree + all artifacts               │   │
│  │     Importable to any TreeListy                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📄  PDF Memory Book                             │   │
│  │     Printable document with photos              │   │
│  │     For family who won't use the app            │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 📋  JSON Only (no artifacts)                    │   │
│  │     Tree data, lightweight                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Import Flow

```
┌─────────────────────────────────────────────────────────┐
│  Import                                                 │
│  ─────────────────────────────────────────────────────  │
│                                                         │
│  📦 mom-lifetree.treelisty                              │
│                                                         │
│  Detected:                                              │
│  • Tree: "Mom's Life" (LifeTree pattern)                │
│  • 47 items across 8 decades                            │
│  • 12 artifacts (34.2 MB)                               │
│  • 🟢 Includes live session config                      │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🌳  Open Tree                                   │   │
│  │     View and edit locally                       │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 👥  Join Live Session                           │   │
│  │     Connect with Sarah and 2 others             │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### PDF Memory Book

For sharing with family members who won't use TreeListy:

- Formatted document with tree structure
- Photos embedded inline with captions
- Organized by phases (decades for LifeTree)
- Printable for physical family archives

---

## Technical Implementation

### New Components Required

| Component | Description | Complexity |
|-----------|-------------|------------|
| **Voice Capture UI** | Recording interface in TreeBeard with live transcript | Moderate - builds on existing Free Speech |
| **Captures Section** | New section in TreeBeard for pending captures | Low |
| **FAB Component** | Floating mic button for mobile, context-aware visibility | Low |
| **Artifact Side Panel** | Inspector panel for viewing item attachments | Moderate |
| **IndexedDB Layer** | Local storage for artifacts during session | Moderate (~100 lines) |
| **Firebase Storage Integration** | Cloud sync for collaborative artifacts | Moderate - extends existing Firebase |
| **Bundle Export/Import** | ZIP creation and parsing for .treelisty format | Moderate |
| **PDF Generator** | Memory Book export | Moderate - likely use jsPDF or similar |

### APIs & Libraries

| Need | Solution |
|------|----------|
| Speech-to-text | Web Speech API (already used in Free Speech) |
| Local artifact storage | IndexedDB (native, or `idb-keyval` ~1KB wrapper) |
| Cloud artifact storage | Firebase Storage (already have Firebase project) |
| ZIP bundling | JSZip (~90KB, well-supported) |
| PDF generation | jsPDF + html2canvas (for Memory Book) |

### Data Model Changes

```javascript
// New fields on tree items
{
  raw_transcript: "string",     // Full transcript (on parent only)
  capture_mode: "voice|text|manual",
  artifacts: [
    {
      id: "art-001",
      filename: "photo.jpg",
      type: "image/jpeg",
      size: 2340000,
      localKey: "idb-key-123",      // IndexedDB reference
      firebaseUrl: "https://...",    // Cloud URL (if synced)
      addedAt: "2025-12-07T10:30:00Z"
    }
  ]
}

// New fields on tree root
{
  captures: [
    {
      id: "cap-001",
      transcript: "Mom said she remembers...",
      wordCount: 143,
      createdAt: "2025-12-07T10:30:00Z",
      artifacts: [...]  // Attached during capture
    }
  ]
}
```

### Mobile TreeBeard Changes

- Full-screen mode on mobile (always, not just for voice)
- FAB positioned bottom-right, 60x60px tap target
- FAB hides during: modals, 3D view, keyboard open, TreeBeard open

---

## Decisions Summary

| Area | Decision |
|------|----------|
| **Primary users** | LifeTree Storyteller > Creative Dumper > Walking Thinker |
| **Capture triggers** | FAB (mobile) + TreeBeard mic (desktop) |
| **Recording UI** | Inside TreeBeard with live transcript |
| **Mobile TreeBeard** | Always full-screen |
| **Capture landing** | Inside TreeBeard (📎 Captures section) |
| **Capture scope** | Per-tree |
| **Duration limit** | Soft warning at 5 minutes |
| **Offline (MVP)** | Block with message |
| **Processing flow** | Guided prompt → TreeBeard conversation |
| **Transcription errors** | Optional review/edit step |
| **Batch processing** | One-at-a-time + select multiple option |
| **Free Speech pattern** | Keep separate + offer as processing option |
| **Transcript storage** | On parent item only |
| **Artifact entry points** | Attach to item, capture with voice, drag-and-drop |
| **Artifact display** | Icon badge in tree + side panel preview |
| **Artifact panel layout** | Scrollable list |
| **Local storage** | IndexedDB |
| **Collab storage** | Firebase Storage (free tier) |
| **File types** | Generous - preview what we can, archive rest |
| **Size limits** | Tiered: unlimited local, 25MB/file + 500MB/tree collab |
| **Deleting** | Permanent delete, always keep 1 backup |
| **Export formats** | .treelisty bundle + PDF Memory Book |
| **Hosted sharing** | Future enhancement (post-MVP) |

---

## Future Enhancements (Post-MVP)

1. **Offline capture** - Record audio locally, transcribe when back online
2. **Hosted link sharing** - Firebase-hosted read-only view via URL
3. **Voice emotion detection** - AI-derived sentiment on captures
4. **Voice commands** - "New child called X", "Move this under Y"
5. **Audio playback in tree** - Play original recording alongside transcript
6. **Artifact OCR** - Extract text from photos of documents/letters

---

*Design completed through collaborative brainstorming session, 2025-12-07*
