# Gmail Bidirectional Sync Design

**Date:** 2025-12-22
**Status:** Approved (v1.2 - Gemini + OpenAI reviews incorporated)
**Pattern:** Email Workflow (Gmail integration)
**Extends:** 2025-12-22-email-workflow-improvements-design.md
**Related:** 2025-12-22-chrome-capability-nodes-design.md

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

## Architecture: MCP Bridge Integration (Gemini Review)

**Key insight:** Don't create a separate Python proxy. Use existing MCP Bridge infrastructure.

### Why MCP Bridge?

| Approach | Pros | Cons |
|----------|------|------|
| ~~Python proxy~~ | Simple | Redundant backend, token in multiple places |
| **MCP Bridge** | Unified architecture, secure token storage | Slight complexity |

### Gmail as MCP Tools

```javascript
// packages/treelisty-mcp-bridge/src/gmail-tools.js
{
  name: 'gmail_archive',
  description: 'Archive a Gmail thread',
  parameters: { thread_id: 'string' }
}

{
  name: 'gmail_create_draft',
  description: 'Create a draft reply',
  parameters: { thread_id: 'string', body: 'string', to: 'string', subject: 'string' }
}

{
  name: 'gmail_delete',
  description: 'Move thread to trash',
  parameters: { thread_id: 'string' }
}
```

### Gmail as Capability Node

Integrates with Chrome Capability Nodes design:

```javascript
{
  type: "capability",
  name: "Gmail Sync",
  site: "gmail.com",
  goal: "Manage email via TreeListy",

  // Granular permissions - user controls each
  allow: ["read"],           // Always on after import
  requireApproval: ["archive", "star", "mark_read"],  // Medium risk
  forbid: ["delete", "send"],  // User must explicitly enable

  // OAuth scopes mapped to permissions
  scopeMapping: {
    "read": "gmail.readonly",
    "archive": "gmail.modify",
    "delete": "gmail.modify",
    "draft": "gmail.compose",
    "send": "gmail.send"
  }
}
```

**User flow:**
1. Import Gmail → Capability node created with `allow: ["read"]`
2. User clicks "Enable Archive" → `archive` moved to `allow`
3. First archive action → OAuth re-consent if scope missing

### Optimistic UI + Undo Toast

**Pattern:** Hide immediately, delay API call, allow undo.

```javascript
function archiveThread(threadId) {
  // 1. Optimistic update - hide immediately
  hideNodeInUI(threadId);
  showUndoToast('Archived', 10000, () => {
    // Undo callback - restore node
    restoreNodeInUI(threadId);
  });

  // 2. Delayed API call (10 seconds)
  const timeoutId = setTimeout(async () => {
    await mcpBridge.call('gmail_archive', { thread_id: threadId });
    updateNodeSyncStatus(threadId, 'synced');
  }, 10000);

  // 3. Store timeout for cancellation
  pendingActions.set(threadId, timeoutId);
}

function undoAction(threadId) {
  const timeoutId = pendingActions.get(threadId);
  if (timeoutId) {
    clearTimeout(timeoutId);
    pendingActions.delete(threadId);
    restoreNodeInUI(threadId);
  }
}
```

**Undo Toast UI:**
```
+------------------------------------------+
| Archived "Project Update"     [Undo] [x] |
| ████████████░░░░░░░░░░░░░░░░ 7s          |
+------------------------------------------+
```

### Draft Conflict Resolution

**Problem:** User edits draft in TreeListy AND Gmail simultaneously.

**Solution:** Last-Modified-Wins with prompt.

```javascript
async function saveDraftToGmail(localDraft) {
  // 1. Fetch remote draft version
  const remoteDraft = await mcpBridge.call('gmail_get_draft', {
    draft_id: localDraft.draftId
  });

  // 2. Compare timestamps
  if (remoteDraft.lastModified > localDraft.lastFetched) {
    // Conflict detected
    const choice = await showConflictDialog({
      message: 'This draft was edited in Gmail since you last loaded it.',
      options: [
        { label: 'Keep mine', action: 'overwrite' },
        { label: 'Keep Gmail version', action: 'discard' },
        { label: 'View diff', action: 'diff' }
      ]
    });

    if (choice === 'discard') return;
  }

  // 3. Save with version tracking
  await mcpBridge.call('gmail_update_draft', {
    draft_id: localDraft.draftId,
    body: localDraft.body,
    version: remoteDraft.version
  });
}
```

### Rules Engine Conflict Prevention

**Problem:** Rules could create infinite loops (e.g., archive triggers label, label triggers archive).

**Solution:** Action deduplication + loop detection.

```javascript
const recentActions = new Map(); // threadId -> Set of actions

function executeRule(rule, threadId) {
  const key = `${threadId}:${rule.action}`;

  // Dedupe: Don't repeat same action within 5 seconds
  if (recentActions.has(key)) {
    console.log(`Skipping duplicate action: ${key}`);
    return;
  }

  // Mark action as in-flight
  recentActions.set(key, Date.now());
  setTimeout(() => recentActions.delete(key), 5000);

  // Execute
  performAction(rule.action, threadId);
}
```

---

## Safety Rails (OpenAI Review)

### 1. Explicit OAuth Re-auth (No Silent Token Deletion)

**Problem:** Auto-deleting `token.json` feels spooky and is a foot-gun.

**Solution:** Explicit user action required.

```javascript
async function checkGmailScopes() {
  const hasModify = await tokenHasScope('gmail.modify');
  const hasCompose = await tokenHasScope('gmail.compose');

  if (!hasModify || !hasCompose) {
    // Show button, don't auto-delete
    showReauthBanner({
      message: 'Gmail sync requires additional permissions',
      button: 'Re-authorize Gmail',
      onConfirm: () => {
        // Only now delete and re-auth
        deleteToken();
        startOAuthFlow();
      }
    });
  }
}
```

### 2. Token Security: Python Proxy Only

**Rule:** Access tokens NEVER enter the browser.

```
Browser → Python Proxy → Gmail API
           (holds tokens)

✓ Python proxy holds refresh/access tokens
✓ Browser only receives action results
✗ No tokens in localStorage, sessionStorage, or DOM
```

### 3. IndexedDB for Draft Storage

**Problem:** localStorage is fragile and small (5-10MB limit).

**Solution:** IndexedDB for drafts + retry queue.

```javascript
// IndexedDB stores:
const draftStore = {
  id: 'draft-123',
  threadId: 'thread-456',
  body: '...',
  lastModified: Date.now(),
  syncStatus: 'local'  // local | syncing | synced | conflict
};

// localStorage only stores:
localStorage.setItem('lastDraftId', 'draft-123'); // Crash pointer only
```

**Toggle:** "Keep local drafts on this device" (default ON for personal, OFF for shared).

### 4. Naming: "Trash" Not "Delete"

| Button Label | Gmail API | User Expectation |
|--------------|-----------|------------------|
| **Trash** | `users.threads.trash` | Recoverable (30 days) |
| **Delete Forever** | `users.messages.delete` | PERMANENT (gated, future) |

### 5. Batch Operations: Mandatory Preview

For ANY batch operation:

```
+--------------------------------------------------+
| Archive 23 threads?                              |
+--------------------------------------------------+
| Preview (showing 5 of 23):                       |
|  • "Re: Project Update" - john@example.com       |
|  • "Meeting Notes" - team@company.com            |
|  • "Invoice #1234" - billing@vendor.com          |
|  • "Weekly Report" - manager@company.com         |
|  • "Follow-up" - client@external.com             |
|  ... and 18 more                                 |
+--------------------------------------------------+
| [Cancel]                    [Archive 23 threads] |
+--------------------------------------------------+
```

**Required for:** Any action affecting >1 thread.

### 6. Auto-Rules: Safe Defaults

| Rule | Default State | Reason |
|------|---------------|--------|
| Mark as read | **ON** | Reversible |
| Archive | **ON** | Reversible |
| Star | **OFF** | Annoying if wrong |
| Trash | **OFF** | Destructive |

**First-run mode:** "Dry run" shows what WOULD happen:

```
+--------------------------------------------------+
| Rules Preview (dry run - no changes made)        |
+--------------------------------------------------+
| Would archive: 12 threads                        |
| Would mark read: 8 threads                       |
| Would trash: 0 threads (rule disabled)           |
+--------------------------------------------------+
| [Enable these rules]    [Adjust settings first]  |
+--------------------------------------------------+
```

### 7. Action Ledger (Idempotency)

Store per-thread action history to prevent replays:

```javascript
// Per-node action ledger
node.gmailActionLedger = [
  {
    action: 'archive',
    dedupeKey: 'archive-thread456-1703275200',
    timestamp: '2025-12-22T15:00:00Z',
    result: 'success'
  }
];

// Before any action:
function shouldExecute(action, threadId) {
  const key = `${action}-${threadId}-${Math.floor(Date.now() / 60000)}`; // 1-min window
  if (ledger.has(key)) return false; // Already done
  return true;
}
```

### 8. Rate Limiting: Proper Queue

```javascript
const gmailQueue = {
  concurrency: 2,           // Max parallel requests
  minDelay: 200,            // 200ms between requests
  maxRetries: 3,
  backoff: {
    initial: 1000,          // 1s
    multiplier: 2,          // 2s, 4s, 8s
    maxDelay: 30000,        // 30s cap
    jitter: 0.2             // +/- 20% randomness
  }
};

// On 429 response:
function handle429(response) {
  const retryAfter = response.headers['Retry-After'] || gmailQueue.backoff.initial;
  queue.pause(retryAfter * 1000);
}
```

### 9. Send Button: Phase 3+ Only

**Phase 2 compose modal:**
```
[Save to Gmail Drafts]  [Discard]
```

**Phase 3+ compose modal (requires confirmation):**
```
[Save Draft]  [Discard]  [Send →]
                              ↓
         +------------------------+
         | Confirm Send           |
         | To: john@example.com   |
         | Subject: Re: Update    |
         | [Cancel] [Send Now]    |
         +------------------------+
```

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
| [Save to Gmail Drafts]  [Discard]                |
+--------------------------------------------------+
Note: Send button added in Phase 3+ with confirmation gate.
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
| **Trash** | `users.threads.trash` | Move to trash (30-day recovery) |
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

### Default Rules (safe defaults per OpenAI review)

| TreeListy Action | Gmail Effect | Default | Reason |
|------------------|--------------|---------|--------|
| Check as complete | Mark read | **ON** | Reversible |
| Move to "Done" | Archive | **ON** | Reversible |
| Add star to name | Star | **OFF** | Annoying if wrong |
| Move to "Trash" | Trash | **OFF** | Destructive |

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

### Phase 1: MCP Gmail Tools + Capability Node (Build 550)
- [ ] Add Gmail tools to MCP Bridge (`gmail_archive`, `gmail_trash`, `gmail_star`, `gmail_mark_read`)
- [ ] Create Gmail Capability Node schema
- [ ] Update OAuth scopes in export script
- [ ] Explicit re-auth flow (button, not auto-delete)
- [ ] Add Archive/Trash/Star/Mark Read buttons to Info Panel
- [ ] Implement optimistic UI + undo toast (10s delay)
- [ ] Action ledger for idempotency

### Phase 2: Draft Composition (Build 551)
- [ ] Quick reply box in Info Panel
- [ ] Full compose modal (NO send button yet)
- [ ] IndexedDB for draft storage (localStorage only for crash pointer)
- [ ] `gmail_create_draft` / `gmail_update_draft` MCP tools
- [ ] Draft conflict resolution (last-modified-wins with prompt)
- [ ] Draft status indicators
- [ ] "Keep local drafts" toggle

### Phase 3: TreeBeard Commands + Send (Build 552)
- [ ] Batch archive/trash/star commands
- [ ] Mandatory preview for batch operations (show affected threads)
- [ ] Send button with confirmation dialog
- [ ] Proper rate limiting queue (concurrency 2, backoff + jitter)

### Phase 4: Automatic Rules (Build 553)
- [ ] Rules engine with trigger detection
- [ ] Safe defaults (destructive rules OFF)
- [ ] First-run dry-run mode
- [ ] Action deduplication + loop prevention
- [ ] Settings UI for rule customization
- [ ] TreeBeard rule modification via chat

### Phase 5: Polish (Build 554)
- [ ] Sync status indicators (synced/pending/failed)
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

### Token Storage: MCP Bridge

**Architecture:** Token stored securely in MCP Bridge (Node.js), never exposed to browser.

```
TreeListy (browser) → MCP Bridge (local) → Gmail API
                         ↑
                    token.json
                    (never sent to browser)
```

**Benefits:**
- Token never in DOM/localStorage (XSS-safe)
- Unified with Chrome extension architecture
- Claude Code can also use same token for email research

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

## Review Notes

**Gemini feedback incorporated (2025-12-22):**
- Use MCP Bridge for Gmail API calls (not separate Python proxy)
- Gmail as Capability Node with granular permissions
- Optimistic UI with 10-second undo toast before API call
- Draft conflict resolution with last-modified-wins prompt
- Rules engine loop prevention via action deduplication

**OpenAI feedback incorporated (2025-12-22):**
- Explicit re-auth flow (button, not auto-delete token)
- Token security: tokens never in browser, Python proxy only
- IndexedDB for draft storage (localStorage only as crash pointer)
- Rename "Delete" → "Trash" to match Gmail behavior
- Mandatory preview for batch operations
- Safe defaults: destructive rules OFF by default
- Action ledger for idempotency (prevent replay attacks)
- Proper rate limiting: queue with concurrency + backoff + jitter
- Send button deferred to Phase 3+ with confirmation gate

**Strategic verdict:** "Solid and shippable" - proceed with Phase 1.

---

## Benchmarks / Pre-Mortem

**"Good" looks like:**
- No Gmail tokens in localStorage (ever)
- Batch actions always show preview + require confirmation
- Retry queue never double-applies an action (dedupe ledger)

**Top failure path:** Auto-rule or TreeBeard batch trashes threads unexpectedly.

**Mitigation:** Destructive rules default OFF + preview/confirm + action dedupe + undo path.

---

*Design version: 1.2*
*Created: 2025-12-22*
*Updated: 2025-12-22 (Gemini + OpenAI reviews)*
*Status: Approved - Ready for Phase 1*
