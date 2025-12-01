# TreeListy Collaboration Guide

Help the user set up and use TreeListy's collaboration features for async and sync teamwork.

## Collaboration Features (Build 210-211)

### 1. Collaboration Comments (`collabComments` field)
- Found in the Edit Modal under "Collaboration" section
- Use to leave notes for collaborators
- Example: "Owen - what do you think about this counterargument?"
- Shows as a pulsing 💬 indicator on nodes

### 2. Contributor Tags (`contributor` field)
- Tag who made each edit (e.g., "Dad", "Owen")
- Quick-select buttons for common contributors
- Shows as 👤 badge on nodes in Tree and Canvas views
- Timestamps automatically recorded (`contributorTimestamp`)

### 3. Watch Mode (Build 211)
- Live sync for collaborators editing the same file
- Poll shared files every 5-60 seconds
- Auto-detects changes and shows who made them
- Skips reloading your own saves

### 4. Google Drive Links ("Chess by Mail")
- Share trees via email using URL parameters
- `?gdrive=FILE_ID` - Load a tree from Google Drive
- `?watch=URL` - Load and auto-open Watch Mode

## Async Collaboration Workflow

1. **Save to shared location**: File → Save As JSON to OneDrive/Google Drive/Dropbox
2. **Share the file**: Get shareable link from cloud provider
3. **Email the link**: Format as `https://treelisty.netlify.app?gdrive=YOUR_FILE_ID`
4. **Collaborator opens**: They see your tree, with your contributor badges
5. **They edit and save**: Back to the same shared file
6. **You reload**: See their 👤 badges and 💬 comments

## Sync Collaboration Workflow

1. Both collaborators open the same tree
2. Click **Watch Mode** button in sidebar
3. Enter your name (Dad/Owen)
4. Select the shared file (or paste URL)
5. Choose poll interval (5-10 seconds for active collab)
6. Click "Start Watching"
7. Edits sync automatically!

## URL Parameters

| Parameter | Description | Example |
|-----------|-------------|---------|
| `?gdrive=ID` | Load from Google Drive file ID | `?gdrive=1ABC123def` |
| `?gdrive=URL` | Load from full Drive URL | `?gdrive=https://drive.google.com/file/d/...` |
| `?watch=URL` | Load + auto-open Watch Mode | `?watch=https://example.com/tree.json` |
| `?branch=DATA` | Collaboration branch (compressed) | Used by Share workflow |

## Tips

- **Tag your edits**: Always set Contributor before saving
- **Leave questions**: Use Collab Comments for async discussion
- **Watch the badges**: 💬 means someone left you a note
- **Check timestamps**: Hover over 👤 badge to see when
