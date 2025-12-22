# Gmail Bidirectional Sync Design

**Date:** 2025-12-22
**Status:** Approved
**Pattern:** Email Workflow (Gmail integration)
**Extends:** 2025-12-22-email-workflow-improvements-design.md

---

## Summary

Enable bidirectional sync between TreeListy and Gmail, allowing users to:
- Create drafts from TreeListy
- Archive, delete, star, and mark emails as read
- Use TreeBeard for batch operations
- Set up automatic rules for zero-friction sync

**OAuth scope expansion:** `gmail.readonly` → `gmail.readonly` + `gmail.compose` + `gmail.modify`

---

## Priority Order (User-Defined)

1. **F - Create Drafts** (`gmail.compose`)
2. **A - Archive/Label** (`gmail.modify`)
3. **D - Delete** (`gmail.modify`)
4. **B - Mark Read/Unread** (`gmail.modify`)
5. **C - Star/Unstar** (`gmail.modify`)

---

## Section 1: OAuth Scope Upgrade

**New scopes required:**
```python
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',   # existing
    'https://www.googleapis.com/auth/gmail.compose',    # NEW: create drafts
    'https://www.googleapis.com/auth/gmail.modify'      # NEW: labels, archive, delete, read, star
]
```

**Upgrade flow:**
1. User clicks "Enable Gmail Sync" in TreeListy settings
2. Script detects old token has insufficient scopes
3. Deletes `token.json`, triggers re-auth
4. Google consent screen shows all permissions
5. New token saved with expanded access

**Consent screen text:**
```
TreeListy wants to:
- Read your email messages
- Create, modify and send drafts
- Modify labels and organize emails
- Archive and delete messages
```

**Fallback:** If user denies new scopes, continue with read-only mode. Show "Sync disabled - read only" indicator.

---

## Section 2: Draft Composition UI

### Info Panel Quick Reply

```
+---------------------------------------------+
| Email Actions                               |
+---------------------------------------------+
| [Reply] [Forward] [Read Full]               |
+---------------------------------------------+
| Quick Reply:                                |
| +-------------------------------------+     |
| | Type your reply...                  |     |
| |                                     |     |
| +-------------------------------------+     |
| [Save Draft] [Expand]         Local draft   |
+---------------------------------------------+
```

### Full Modal (on Expand)

```
+--------------------------------------------------+
| Compose Draft                               [x]  |
+--------------------------------------------------+
| To:      [john@example.com                     ] |
| CC:      [                              ] [+BCC] |
| Subject: [Re: Project Update                   ] |
+--------------------------------------------------+
| [B] [I] [U] [Link] [List]                        |
| +----------------------------------------------+ |
| |                                              | |
| | Hi John,                                     | |
| |                                              | |
| | Thanks for the update...                     | |
| |                                              | |
| +----------------------------------------------+ |
+--------------------------------------------------+
| Local draft (auto-saved 10s ago)                 |
|                                                  |
| [Save to Gmail Drafts]  [Discard]  [Send]        |
+--------------------------------------------------+
```

### Draft Storage

- `localStorage['treelisty_drafts']` - Array of local drafts
- Each draft linked to thread ID
- Status: `local` → `synced` → `sent`

### Sync Behavior

- Auto-save to localStorage every 30 seconds (crash protection)
- Explicit "Save to Gmail Drafts" button for sync
- Visual indicator: "Local draft" vs "Synced to Gmail"

---

## Section 3: Gmail Sync Actions

### Manual Buttons in Info Panel

| Button | Gmail API Call | Endpoint |
|--------|---------------|----------|
| Archive | `users.threads.modify` | Remove INBOX label |
| Delete | `users.threads.trash` | Move to trash |
| Star | `users.threads.modify` | Add STARRED label |
| Mark Read | `users.threads.modify` | Remove UNREAD label |
| Save Draft | `users.drafts.create` | Create draft message |

### TreeBeard Batch Commands

```
"Archive all emails marked as done"
-> TB finds nodes with status=done, calls archive for each

"Delete everything in my Junk folder"
-> TB finds nodes under Junk phase, calls trash for each

"Star all emails from @anthropic.com"
-> TB searches senderEmail, calls star for matches
```

### API Helper Functions

```javascript
// gmail-sync.js (new module)
async function archiveThread(threadId, accessToken) { ... }
async function deleteThread(threadId, accessToken) { ... }
async function starThread(threadId, accessToken) { ... }
async function markRead(threadId, accessToken) { ... }
async function createDraft(threadId, body, accessToken) { ... }
async function sendDraft(draftId, accessToken) { ... }
```

---

## Section 4: Automatic Rules Engine

### Default Rules (enabled by default)

| TreeListy Action | Gmail Effect | Reversible |
|------------------|--------------|------------|
| Move to "Done" | Archive | Yes (unarchive) |
| Move to "Trash" | Delete | Yes (30 day recovery) |
| Add star to name | Star | Yes |
| Check as complete | Mark read | Yes |

### Rules Data Structure

```javascript
capexTree.gmailSyncRules = {
  enabled: true,
  rules: [
    { trigger: 'move_to_phase', phase: 'done', action: 'archive' },
    { trigger: 'move_to_phase', phase: 'trash', action: 'delete' },
    { trigger: 'name_contains', pattern: 'star', action: 'star' },
    { trigger: 'status_change', status: 'completed', action: 'mark_read' }
  ],
  customRules: []  // User-defined via settings
};
```

### Settings UI

```
+--------------------------------------------------+
| Gmail Sync Rules                                 |
+--------------------------------------------------+
| [x] Enable automatic sync                        |
|                                                  |
| Default Rules:                                   |
| [x] Move to Done -> Archive in Gmail             |
| [x] Move to Trash -> Delete in Gmail             |
| [ ] Star emoji -> Star in Gmail (disabled)       |
| [x] Mark complete -> Mark as read                |
|                                                  |
| Custom Rules:                           [+ Add]  |
| +----------------------------------------------+ |
| | When [moved to phase] [Action Required]      | |
| | Then [add label] [needs-response]            | |
| +----------------------------------------------+ |
+--------------------------------------------------+
```

---

## Section 5: Sync Status & Error Handling

### Visual Indicators

| State | Indicator | Location |
|-------|-----------|----------|
| Synced | Green checkmark | Next to thread name |
| Pending sync | Spinner | Next to thread name |
| Sync failed | Yellow warning | Next to thread name |
| Local only | Disk icon | Draft composer |
| Offline | Banner | Top of screen |

### Error Handling

```javascript
async function syncToGmail(action, threadId) {
  try {
    await performAction(action, threadId);
    updateNodeSyncStatus(threadId, 'synced');
    showToast(`${action} synced to Gmail`, 'success');
  } catch (error) {
    if (error.status === 401) {
      // Token expired - trigger re-auth
      promptReauth();
    } else if (error.status === 429) {
      // Rate limited - queue for retry
      queueForRetry(action, threadId, 60000);
      showToast('Rate limited - will retry in 1 min', 'warning');
    } else {
      // Other error - mark failed
      updateNodeSyncStatus(threadId, 'failed', error.message);
      showToast(`Sync failed: ${error.message}`, 'error');
    }
  }
}
```

### Retry Queue

- Failed syncs queued in localStorage
- Retry with exponential backoff
- Max 3 retries, then mark permanently failed
- User can manually retry via context menu

---

## Section 6: Implementation Phases

### Phase 1: OAuth + Manual Buttons (Build 550)
- [ ] Update `export_gmail_to_treelisty.py` with new scopes
- [ ] Add scope detection and re-auth flow
- [ ] Store access token securely for browser use
- [ ] Add Archive/Delete/Star/Mark Read buttons to Info Panel
- [ ] Implement single-thread API calls

### Phase 2: Draft Composition (Build 551)
- [ ] Quick reply box in Info Panel
- [ ] Full compose modal with rich text
- [ ] Local auto-save to localStorage
- [ ] "Save to Gmail Drafts" API integration
- [ ] Draft status indicators

### Phase 3: TreeBeard Commands (Build 552)
- [ ] Batch archive command
- [ ] Batch delete command
- [ ] Batch star/label commands
- [ ] Confirmation prompts for destructive actions

### Phase 4: Automatic Rules (Build 553)
- [ ] Rules engine with trigger detection
- [ ] Default rules implementation
- [ ] Settings UI for rule customization
- [ ] TreeBeard rule modification via chat

### Phase 5: Polish (Build 554)
- [ ] Sync status indicators
- [ ] Error handling and retry queue
- [ ] Offline mode detection
- [ ] Sync history/audit log

---

## Section 7: Security Considerations

| Risk | Mitigation |
|------|------------|
| Token theft | Never store in localStorage; use httpOnly cookie or secure storage |
| Accidental mass delete | Require confirmation for >5 items; "Undo" within 10 seconds |
| Scope creep | Clear consent screen; option to revoke in settings |
| Rate limiting | Queue system; max 10 API calls/second |
| Data loss | Local drafts survive sync failures; Gmail has 30-day trash recovery |

### Token Storage Options

1. **Python proxy** (recommended) - Token stays on local machine, browser calls Python server
2. **Netlify function** - Token in environment variable, server-side API calls
3. **Browser storage** - Least secure, but works offline

**Recommendation:** Python proxy for personal use, Netlify function if sharing.

---

## Summary Table

| Feature | Scope | Phase |
|---------|-------|-------|
| Archive/Delete/Star/Read | gmail.modify | 1 |
| Draft composition | gmail.compose | 2 |
| TreeBeard batch commands | gmail.modify | 3 |
| Automatic rules | gmail.modify | 4 |
| Sync status UI | - | 5 |

**Total new OAuth scopes:** `gmail.compose` + `gmail.modify`

**User consent required:** Yes, one-time re-authorization

---

*Design version: 1.0*
*Created: 2025-12-22*
*Status: Approved*
