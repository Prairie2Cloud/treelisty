# Email Workflow Improvements Design

**Date:** 2025-12-22
**Status:** Draft
**Pattern:** Email Workflow (Gmail integration)

---

## Summary

Three improvements needed for the Gmail/Email workflow pattern:
1. Canvas zoom should keep center focus item in view
2. Gmail export missing critical data (attachments, full bodies, encoding)
3. Email reading modal with full Gmail capabilities

---

## Issue 1: Canvas Zoom Focus

### Problem
When zooming in/out on Canvas view, the viewport zooms from corner rather than keeping the currently focused/centered item in view. User loses context.

### Current Behavior
- Zoom changes scale uniformly
- No adjustment to pan offset based on focus point
- User must manually re-navigate after zoom

### Desired Behavior
- Zoom centers on currently selected node (if any)
- If no selection, zoom centers on viewport center
- Smooth transition maintains spatial awareness

### Implementation

**Location:** `treeplexity.html` - Canvas zoom handlers

**Approach:**
```javascript
// On zoom change:
1. Get current center point in world coordinates
2. Apply zoom scale change
3. Adjust pan offset to keep center point at same screen position

// Formula:
newPanX = centerScreenX - (centerWorldX * newScale)
newPanY = centerScreenY - (centerWorldY * newScale)
```

**Files to modify:**
- `treeplexity.html` - Canvas zoom event handlers (wheel, pinch, +/- buttons)

---

## Issue 2: Gmail Export Data Gaps

### Current Data Captured
- Thread ID, subject, sender, recipient, CC
- Email body (truncated to 500-1000 chars)
- Send date, status, labels
- Message count, subItems with messages

### Missing Data

| Data | Priority | Notes |
|------|----------|-------|
| Attachments | High | Filename, size, mimeType, downloadUrl |
| Full body | High | Currently truncated to 500 chars |
| HTML body | Medium | Currently plain text only |
| Emoji encoding | High | UTF-8 mojibake (shows as ������) |
| Inline images | Low | References in HTML body |
| BCC | Low | Not typically available via API |

### Implementation

**File:** `export_gmail_to_treelisty.py`

#### A. Fix Emoji Encoding
```python
# Ensure UTF-8 throughout pipeline
def decode_body(payload):
    # ... existing code ...
    return base64.urlsafe_b64decode(data).decode('utf-8', errors='replace')
```

#### B. Extract Attachments
```python
def extract_attachments(payload):
    attachments = []
    if 'parts' in payload:
        for part in payload['parts']:
            if part.get('filename'):
                attachments.append({
                    'filename': part['filename'],
                    'mimeType': part['mimeType'],
                    'size': part['body'].get('size', 0),
                    'attachmentId': part['body'].get('attachmentId')
                })
    return attachments
```

#### C. Increase Body Length
```python
# Config at top of script
MAX_BODY_LENGTH = 5000  # Increased from 500
MAX_PREVIEW_LENGTH = 300

# In parse_thread():
thread_node['emailBody'] = msg_body[:MAX_BODY_LENGTH]
```

#### D. Capture HTML Body
```python
def decode_body(payload, prefer_html=False):
    if 'parts' in payload:
        for part in payload['parts']:
            mime = part['mimeType']
            if prefer_html and mime == 'text/html':
                return decode_base64(part['body'])
            if mime == 'text/plain':
                plain = decode_base64(part['body'])
        # Return HTML if requested and found, else plain
```

### Updated Node Schema

```javascript
{
  id: "thread-id",
  name: "Subject line",
  type: "item",
  // ... existing fields ...

  // NEW FIELDS:
  attachments: [
    {
      filename: "document.pdf",
      mimeType: "application/pdf",
      size: 102400,
      attachmentId: "abc123"  // For download via API
    }
  ],
  htmlBody: "<div>Rich HTML content...</div>",
  hasAttachments: true,
  attachmentCount: 2
}
```

---

## Issue 3: Email Reading Modal

### Requirements

A popup modal for reading/composing emails with:
- Full email display (HTML rendered)
- Attachment list with download links
- Reply/Forward/Edit capabilities
- Thread view (conversation)
- Quick actions (archive, delete, label)

### UI Design

```
+--------------------------------------------------+
| [x]                    Email                      |
+--------------------------------------------------+
| From: sender@example.com                          |
| To: recipient@example.com                         |
| Subject: Re: Project Update                       |
| Date: Dec 22, 2025 10:35 AM                       |
+--------------------------------------------------+
|                                                   |
|  [Rendered HTML email body]                       |
|                                                   |
|  Lorem ipsum dolor sit amet...                    |
|                                                   |
+--------------------------------------------------+
| Attachments:                                      |
|  [📎 document.pdf (100KB)] [📎 image.png (50KB)] |
+--------------------------------------------------+
| [Reply] [Forward] [Archive] [Delete] [Label v]   |
+--------------------------------------------------+
```

### Modal Behavior
- Opens on double-click email node (or Enter key)
- Escape closes modal
- Click outside closes modal
- Keyboard navigation: j/k for next/prev message in thread

### Implementation Phases

**Phase 1: Read-Only Modal**
- Display full email with HTML rendering
- Show attachment list (no download yet)
- Thread navigation (prev/next message)

**Phase 2: Attachment Handling**
- Download attachments via Gmail API
- Preview common types (images, PDF)
- Open in system app

**Phase 3: Actions (requires Gmail write scope)**
- Reply (opens compose)
- Forward
- Archive/Delete
- Add labels

### Security Considerations
- HTML rendering: Sanitize to prevent XSS
- Use DOMPurify or similar for HTML body
- Attachments: Download to temp, scan before open
- OAuth scope: Currently read-only, Phase 3 needs write

### Files to Modify
- `treeplexity.html` - Add modal HTML, CSS, handlers
- `export_gmail_to_treelisty.py` - Enhanced data capture
- Potentially new: `gmail-actions.js` for API calls

---

## Implementation Plan

### Phase 1: Quick Fixes (Build 547)
- [ ] Fix emoji encoding in export script
- [ ] Increase body length to 5000 chars
- [ ] Add attachment metadata extraction
- [ ] Update node schema with new fields

### Phase 2: Canvas Zoom (Build 548)
- [ ] Implement center-focused zoom
- [ ] Test with keyboard (+/-), mouse wheel, touch pinch
- [ ] Add smooth transition animation

### Phase 3: Email Modal MVP (Build 549-550)
- [ ] Create modal HTML structure
- [ ] Style with existing modal CSS patterns
- [ ] Wire up open/close triggers
- [ ] Render HTML body safely
- [ ] Display attachments (no download)

### Phase 4: Full Email Modal (Build 551+)
- [ ] Attachment download via API
- [ ] Thread navigation
- [ ] Reply/Forward stubs (open Gmail in new tab)

---

## Open Questions

1. **Gmail API quotas** - How many requests/day? Need rate limiting?
2. **Attachment storage** - Download on demand or cache locally?
3. **Write permissions** - Add gmail.modify scope for archive/delete?
4. **Offline support** - Cache emails for offline reading?

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Zoom maintains focus | 100% (no drift on +/- 5 zoom levels) |
| Email body captured | 95%+ of content visible |
| Attachment detection | 100% (all attachments listed) |
| Modal open time | < 200ms |
| HTML render safety | 0 XSS vulnerabilities |

---

*Design version: 1.0*
*Created: 2025-12-22*
