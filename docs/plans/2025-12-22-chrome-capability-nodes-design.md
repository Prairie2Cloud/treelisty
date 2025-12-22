# Chrome Capability Nodes Design

**Date:** 2025-12-22
**Status:** Draft (reviewed by OpenAI + Gemini)
**Extends:** 2025-12-20-claude-chrome-integration-design.md

---

## Summary

Enable TreeListy sub-agents to perform authenticated actions on websites using Chrome, with user-defined permission scopes. Capabilities are stored as TreeListy nodes.

**Design principles:**
1. Default deny - actions must be explicitly allowed
2. Read-first - start with read/navigate, earn trust for writes
3. Executor enforces - permissions checked in code, not prompts

---

## Core Concept

A **capability node** tells Claude what it can do on a website and what's forbidden. Claude uses your existing browser session - no credential storage.

```javascript
{
  type: "capability",
  name: "Chase Balance",
  site: "chase.com",
  goal: "Read checking account balance",
  allow: ["read"],
  forbid: ["transfer", "pay"]
}
```

---

## Architecture

```
TreeListy                 Claude Code              Chrome
   │                          │                      │
   │  "get my Chase balance"  │                      │
   ├─────────────────────────>│                      │
   │                          │                      │
   │         find capability  │                      │
   │         node by intent   │                      │
   │                          │                      │
   │                          │  execute within      │
   │                          │  permission scope    │
   │                          ├─────────────────────>│
   │                          │                      │
   │                          │      balance: $1,234 │
   │                          │<─────────────────────┤
   │                          │                      │
   │     result + provenance  │                      │
   │<─────────────────────────┤                      │
```

---

## Capability Node Schema

### Minimal (required)

```javascript
{
  type: "capability",
  name: "Service - Action",
  site: "domain.com",
  goal: "What to accomplish"
}
```

### Full (with permissions)

```javascript
{
  type: "capability",
  name: "Chase Balance",
  site: "chase.com",
  pathPattern: "/accounts/*",           // optional path restriction
  goal: "Read checking account balance",

  // Scoped autonomy (default deny - only these allowed)
  allow: ["read", "navigate"],
  requireApproval: ["download"],

  // Chrome profile targeting
  profileHint: "Personal",              // matches Chrome profile name

  // Intent matching helpers
  examples: ["what's my balance", "check chase", "bank balance"],
  aliases: ["checking balance", "chase account"],

  // Resilient selectors (semantic, not just CSS)
  selectors: {
    "balance": {
      css: ".account-balance .available",   // fast but brittle
      text: "Available Balance",            // resilient
      aria: "account-balance-display"       // best practice
    },
    "accounts_tab": {
      css: "[data-nav='accounts']",
      text: "Accounts",
      aria: "navigation-accounts"
    }
  },

  // Health tracking
  lastSuccessAt: "2025-12-22T10:00:00Z",
  failureStreak: 0,
  status: "healthy"
}
```

### Permission Types (Phased Rollout)

**MVP (Phase 1):**
| Permission | Meaning |
|------------|---------|
| `read` | Extract text, read page content |
| `navigate` | Click links, tabs within site |

**Phase 2 (with approval gates):**
| Permission | Meaning |
|------------|---------|
| `download` | Download files, statements |
| `fill_form` | Enter data into forms |

**Future (requires explicit opt-in):**
| Permission | Meaning |
|------------|---------|
| `submit` | Submit forms, confirm actions |
| `send` | Send messages, emails |

**Enforcement:** Executor checks permissions in code. Claude never has raw browser access - only calls `execute_capability()` which maps to permitted actions.

---

## Authentication Model

**Session piggyback** - Claude uses your existing logged-in browser session.

| Scenario | Behavior |
|----------|----------|
| Session active | Execute immediately |
| Session expired | Pause, notify user: "Please log into Chase, then say 'continue'" |
| PWA running | Use DevTools Protocol to access PWA window |
| No session found | Open site in background tab using existing cookies |

No credentials stored. No login automation. Browser remains the trust boundary.

### Chrome Profile Targeting

Users often have multiple Chrome profiles (Personal, Work). The `profileHint` field ensures the right session is used:

```javascript
profileHint: "Personal"  // matches Chrome profile name
```

**MCP Bridge behavior:**
1. List all Chrome DevTools Protocol targets across all profiles
2. Match `profileHint` to profile name
3. Connect to correct profile's session
4. If no match, prompt user: "Which profile has your Chase login?"

---

## Selector Resilience

Websites change. CSS selectors break. Use semantic selectors for durability:

```javascript
selectors: {
  "balance": {
    css: ".account-balance",      // Try first (fast)
    text: "Available Balance",    // Fallback (resilient)
    aria: "account-balance"       // Best practice
  }
}
```

**Selector priority:** css → aria → text

**Why this works:**
- CSS: Fast, but breaks when site redesigns
- ARIA: Stable (accessibility requirements), but not always present
- Text: Resilient (labels rarely change), but slower to match

**During teaching:** Claude observes all three and stores the best available.

---

## Intent Matching

Sub-agents express intent, system finds matching capability:

| Agent says | Matches capability |
|------------|-------------------|
| "get my Chase balance" | Chase Balance (exact example match) |
| "checking balance" | Chase Balance (alias match) |
| "check bank account" | Chase Balance (semantic fallback) |
| "transfer $100" | NO MATCH (no capability allows transfer) |

**Matching logic (in order):**
1. Exact example match (`examples` array)
2. Alias match (`aliases` array)
3. Semantic similarity to `goal` (fallback)
4. Permission check (is requested action in `allow`?)

Deterministic matching first reduces wrong-capability accidents.

---

## Teaching New Capabilities

### Guided Demonstration

1. User: "Teach Chrome how to check my Concur expenses"
2. TreeListy creates draft capability node
3. TreeListy: "Open Concur and show me the steps"
4. User performs workflow, Claude observes
5. Claude asks: "Was clicking 'Reports' essential?"
6. Claude extracts **procedure skeleton** (not DOM content):
   - URL patterns
   - Selectors / aria labels
   - Action sequence
7. User reviews and saves capability node

**What's stored:** Procedure steps, not page content or screenshots. Keeps "no credential storage" true in spirit.

### From Natural Language

1. User: "Add capability: read my 401k balance on Fidelity"
2. Claude creates node:
   ```javascript
   {
     type: "capability",
     name: "Fidelity 401k Balance",
     site: "fidelity.com",
     goal: "Read 401k account balance",
     allow: ["read", "navigate"],
     examples: ["401k balance", "retirement account", "fidelity balance"]
   }
   ```
3. User adjusts permissions if needed

---

## Health Checks & Drift Detection

Capabilities can break when sites change. Track health:

```javascript
{
  lastSuccessAt: "2025-12-22T10:00:00Z",
  lastTestedAt: "2025-12-22T09:00:00Z",
  failureStreak: 0,
  status: "healthy"  // healthy | degraded | broken
}
```

**Behaviors:**
| Failure Streak | Status | Action |
|----------------|--------|--------|
| 0 | healthy | Normal operation |
| 1-2 | degraded | Show warning, continue trying |
| 3+ | broken | Stop, prompt "needs retraining" |

**Test button:** Runs dry-run (read-only) to verify selectors still work.

---

## Integration with Existing Design

This extends the Chrome integration design (2025-12-20):

| Existing Component | How Capabilities Integrate |
|-------------------|---------------------------|
| MCP Bridge | Capabilities exposed as MCP resources |
| Research Capture | Research can use capability sessions for paywalled content |
| TreeBeard | Can invoke capabilities via intent |
| Workflow Trees | Workflow tasks can reference capabilities |
| Activity Log | Capability executions logged with provenance |

### New MCP Tools

| Tool | Parameters | Returns |
|------|------------|---------|
| `list_capabilities` | `site?` | Array of capability nodes |
| `execute_capability` | `intent`, `params?` | Execution result |
| `teach_capability` | `name`, `site`, `goal` | Starts guided demo |

---

## Security Model

### Scoped Autonomy

Each capability defines explicit boundaries. Claude cannot exceed them.

```
User defines:    allow: ["read"]
Agent requests:  "transfer $100"
System:          BLOCKED - "transfer" not in allow list
```

### Audit Trail

All capability executions logged (types, not values):

```javascript
{
  timestamp: "2025-12-22T10:30:00Z",
  capability: "Chase Balance",
  actions: ["navigate", "read"],
  result: "success",
  data_types: ["balance"],  // what was read, not the value
  duration_ms: 2300
}
```

Actual extracted values go to the requesting TreeListy node, not global logs.

### Session Isolation

- Capabilities use existing browser sessions
- No cross-site session leakage
- PWA sessions accessed via DevTools Protocol
- Incognito/guest profiles not accessible

---

## UI in TreeListy

### Capability Node Display

```
┌─────────────────────────────────────────┐
│ 🔐 Chase Balance                        │
│                                         │
│ Site: chase.com                         │
│ Goal: Read checking account balance     │
│                                         │
│ ✓ read  ✓ navigate                      │
│ ✗ transfer  ✗ pay                       │
│                                         │
│ [Test] [Edit] [Teach More]              │
└─────────────────────────────────────────┘
```

### Capabilities Panel (sidebar)

```
┌────────────────────────────┐
│ 🔐 Capabilities            │
├────────────────────────────┤
│ Banking                    │
│  └ Chase Balance      ●    │
│  └ Fidelity 401k      ●    │
│ Work                       │
│  └ Concur Expenses    ○    │
│  └ Workday PTO        ●    │
│                            │
│ ● = session active         │
│ ○ = needs login            │
│                            │
│ [+ Add Capability]         │
└────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Foundation (Read-Only MVP)
- [ ] Capability node type in TreeListy
- [ ] Schema: name, site, goal, allow (read/navigate only), examples, aliases
- [ ] Display capability card in tree view
- [ ] MCP resource: `list_capabilities`
- [ ] Default-deny executor (code-enforced, not prompt-based)

### Phase 2: Execution + Testing
- [ ] Intent matching (examples → aliases → semantic)
- [ ] `execute_capability` MCP tool
- [ ] Session detection (active/expired/PWA)
- [ ] Dry-run "Test" button
- [ ] Health tracking (lastSuccess, failureStreak)
- [ ] Activity logging (types, not values)

### Phase 3: Teaching
- [ ] Guided demonstration flow
- [ ] Procedure skeleton extraction (not DOM content)
- [ ] Natural language capability creation
- [ ] "Needs retraining" detection

### Phase 4: Expanded Permissions
- [ ] `download` with approval gate
- [ ] `fill_form` with approval gate
- [ ] Capabilities sidebar panel
- [ ] Session status indicators

---

## Examples

### Example 1: Check Bank Balance (MVP)

**Capability node:**
```javascript
{
  type: "capability",
  name: "Chase Balance",
  site: "chase.com",
  goal: "Read checking account balance",
  allow: ["read", "navigate"],
  examples: ["what's my balance", "check chase", "bank balance"],
  aliases: ["checking balance", "chase account"]
}
```

**TreeBeard interaction:**
```
User: "What's my bank balance?"
TreeBeard: "Checking Chase... Your balance is $1,234.56 as of 10:30 AM."
```

### Example 2: Read Expense Report (Phase 1)

**Capability node:**
```javascript
{
  type: "capability",
  name: "Concur Expenses",
  site: "concur.com",
  goal: "Read expense report status and amounts",
  allow: ["read", "navigate"],
  examples: ["check expenses", "expense report status", "concur balance"]
}
```

*Note: Submit capability would be Phase 4+ with approval gates.*

### Example 3: Research with Paywall (MVP)

**Capability node:**
```javascript
{
  type: "capability",
  name: "WSJ Read Article",
  site: "wsj.com",
  goal: "Read full article content",
  allow: ["read", "navigate"],
  examples: ["read wsj article", "wall street journal"]
}
```

**Research integration:**
- Sub-agent researching "2024 market trends"
- Encounters WSJ paywall
- Finds WSJ capability, uses existing subscription session
- Extracts article content
- Returns to research synthesis

---

## Capability Discovery (Community Registry)

**Problem:** How does a user know what capabilities are possible for a site?

**Solution:** Community-sourced capability registry.

```
User Flow:
1. Right-click "Chase.com" in capabilities panel
2. "Search Community Capabilities"
3. See: "Chase Balance v2 (Verified) - 1,234 users"
4. Import → capability added with allow: [] (empty)
5. User explicitly enables "read" permission
```

**Security model:**
- Imported capabilities start with `allow: []` (no permissions)
- User must explicitly enable each permission
- No session data shared - only the schema (selectors, examples)
- "Verified" badge = community-tested, not security-audited

**Future:** Host registry as public JSON repo or integrate with TreeListy cloud.

---

## Open Questions

1. ~~**Capability discovery:**~~ Solved by community registry.

2. **Version drift:** Partially solved by resilient selectors + health checks. Major site redesigns still need retraining.

3. **Sharing:** Yes - only schema shares, not cookies or session data.

4. **Mobile:** Capabilities are desktop-only (Chrome). Show "Desktop only" badge in mobile UI.

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Capability creation time | < 2 minutes via guided demo |
| Intent match accuracy | > 90% for trained capabilities |
| Session detection reliability | > 95% |
| Permission violation rate | 0% (hard block) |
| User trust (survey) | "I understand what Claude can/can't do" |

---

## Review Notes

**OpenAI feedback incorporated (2025-12-22):**
- Default deny enforced in executor code, not prompts
- Read-first rollout (MVP = read + navigate only)
- Intent matching: examples/aliases before semantic
- Store procedure skeletons, not DOM content
- Health checks + "needs retraining" state
- Log data types, not values
- Path patterns for site restriction

**Gemini feedback incorporated (2025-12-22):**
- Chrome profile targeting (`profileHint` field)
- Resilient selectors (css + text + aria fallback chain)
- Community capability registry for discovery
- Imported capabilities start with empty permissions

**Strategic verdict (Gemini):** "Proceed immediately. This is the missing link."

---

*Design version: 1.2*
*Created: 2025-12-22*
*Reviewed: OpenAI + Gemini (2025-12-22)*
