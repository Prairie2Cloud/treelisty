# TreeListy Design Principles: User Tiers

## Overview

TreeListy serves two distinct user segments with different capabilities and needs:

1. **Casual Users** - Got a shared URL, wants to view/edit a tree in browser
2. **Power Users** - Have API keys, Claude Code, MCP Bridge, Chrome Extension

## Design Principle

> Every feature should work for casual users in "view mode" even if creation requires power user setup.

## Feature Accessibility Matrix

| Feature | Casual (Browser Only) | Power User (API Keys) | Power User (MCP/Ext) |
|---------|:---------------------:|:---------------------:|:--------------------:|
| **Core Tree Operations** |
| View/edit tree | ✅ | ✅ | ✅ |
| All 5 views (Tree/Canvas/3D/Gantt/Calendar) | ✅ | ✅ | ✅ |
| Drag-drop reorganization | ✅ | ✅ | ✅ |
| Undo/redo (50 states) | ✅ | ✅ | ✅ |
| Pattern selection | ✅ | ✅ | ✅ |
| **Import/Export** |
| JSON import/export | ✅ | ✅ | ✅ |
| Excel export | ✅ | ✅ | ✅ |
| MS Project XML | ✅ | ✅ | ✅ |
| **Collaboration** |
| Firebase Live Sync | ✅ | ✅ | ✅ |
| Cloud share URLs | ✅ | ✅ | ✅ |
| **AI Features** |
| TreeBeard AI chat | ❌ | ✅ Gemini/Claude/OpenAI | ✅ |
| AI-assisted node creation | ❌ | ✅ | ✅ |
| **Image Analysis** |
| View image analysis trees | ✅ | ✅ | ✅ |
| View bounding boxes in Canvas | ✅ | ✅ | ✅ |
| Interact with bbox overlays | ✅ | ✅ | ✅ |
| Create new image analysis | ❌ | ✅ Gemini | ✅ |
| Image reconstruction | ❌ | ✅ Nano Banana Pro | ✅ |
| **Integration Features** |
| Gmail/Drive sync | ❌ | ❌ | ✅ MCP + Claude Code |
| Screen capture from browser | ❌ | ❌ | ✅ Chrome Extension |
| Claude Code task dispatch | ❌ | ❌ | ✅ MCP Bridge |

## Error Handling for Casual Users

When a casual user attempts a power-user feature, show clear guidance:

```
❌ Analysis failed: Gemini API key required. Set it in Settings → API Keys.
```

**Principles:**
- Never show cryptic errors
- Always explain what's needed
- Point to Settings location
- Don't block exploration of existing content

## Image Analysis: Detailed Breakdown

### What Casual Users CAN Do
- Open a shared tree that contains image analysis data
- View the source image as Canvas background
- See bounding box overlays on detected objects
- Click bounding boxes to select corresponding nodes
- Hover to highlight bbox ↔ node relationships
- Edit, reorganize, or extend the analyzed tree
- Export the tree (JSON, Excel, etc.)
- Share with others

### What Casual Users CANNOT Do (Without API Key)
- Import a new image for analysis
- Regenerate analysis on existing images
- Use Nano Banana Pro for reconstruction
- Use TreeBeard AI chat

### Error Experience
1. User opens Import Image modal
2. Selects an image
3. Clicks "Analyze"
4. Toast appears: "❌ Analysis failed: Gemini API key required..."
5. User can dismiss and continue using other features

## Progressive Disclosure Pattern

```
Casual User Journey:
┌─────────────────────────────────────────────────────────┐
│  Receives shared URL                                     │
│       ↓                                                  │
│  Views tree in browser (full functionality)              │
│       ↓                                                  │
│  Discovers "Import Image" feature                        │
│       ↓                                                  │
│  Tries it → Gets clear "need API key" message            │
│       ↓                                                  │
│  Decides: Stay casual OR become power user               │
└─────────────────────────────────────────────────────────┘
```

## Implementation Checklist for New Features

When adding new features, ask:

- [ ] Can casual users VIEW content created by this feature?
- [ ] Is the "creation" path clearly marked as needing setup?
- [ ] Does the error message explain what's needed?
- [ ] Does the error point to Settings?
- [ ] Can casual users still use the rest of the app after the error?

## API Key Requirements by Provider

| Provider | Features Enabled | Setup Location |
|----------|-----------------|----------------|
| Gemini | TreeBeard chat, Image Analysis, Embeddings | Settings → API Keys |
| Claude | TreeBeard chat (via proxy or direct) | Settings → API Keys |
| OpenAI | TreeBeard chat, Embeddings | Settings → API Keys |
| Firebase | Live collaboration, Cloud sharing | Built-in (no user setup) |

## Future Considerations

### Server-Side Proxy Option
Like the existing Claude proxy (`netlify/functions/claude-proxy.js`), we could add:
- `gemini-proxy.js` for limited free image analysis
- Rate limiting per IP/session
- Would enable casual users to try image analysis

### Demo Mode
- Pre-analyzed example trees
- "Try Image Analysis" with sample images
- No API key required for demos

---

*Last updated: Build 570 (2025-12-24)*
