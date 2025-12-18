# Quick Capture: Conversation-to-Tree Feature

**Date:** 2025-12-18
**Status:** Design approved, ready for implementation

## Problem

Capturing impromptu conversations with TreeListy on mobile requires 4+ steps:
1. Open TreeListy
2. Navigate menus
3. Find voice feature
4. Start recording

By the time you're ready, the moment is gone.

## Solution

A URL-triggered capture mode that starts recording immediately, with iOS Shortcuts integration for one-tap access.

---

## Capture Mode Entry

### URL Parameter
- `?capture=1` → immediate capture mode
- `?capture=1&duration=5m` → auto-stop after 5 minutes (optional)

### Behavior on Launch
1. Skip splash screen, welcome tree, all standard UI
2. Request microphone permission if not granted
3. Show full-screen recording interface
4. Start recording within 1 second of page load

---

## Recording Screen

### Visual Design
- Dark background (#1a1a2e)
- Waveform visualization (shows audio is being captured)
- Running timer centered: `02:34`
- Large "Done" button at bottom of screen
- Small "Cancel" link in corner (discards recording)

### Principles
- No header, no menus, no tree UI
- Just the recording essentials
- Discrete - suitable for public use

---

## Processing Flow

### After "Done" is Tapped
- Recording stops
- Transition to processing screen

### Processing Screen (Discrete)
- Same dark background
- Small subtle spinner
- Simple text: "Processing..."
- Thin progress line animating across top
- No transcript preview (keeps it discrete)

### On Success
- Fade into Tree View with new conversation tree
- Quiet toast: "Conversation captured"

### On Failure
- Save raw transcript to localStorage
- Show: "Couldn't process - saved locally"
- Option to retry later

---

## AI Processing

### Pattern
- Use **Generic pattern** (test first before creating dedicated pattern)
- AI decides structure based on conversation content

### Possible Structures (AI-selected)
- By topic: themes/subjects discussed
- By outcome: decisions, action items, questions
- By speaker: who said what
- Chronological: timeline of discussion

### Result
- New tree created (one tree per conversation)
- User can edit/refine after capture

---

## iOS Shortcut Setup

### Approach
Documentation only - power users can handle iOS Shortcuts.

### User Steps (documented in Help)
1. Open iOS Shortcuts app
2. Create new Shortcut
3. Add action: "Open URL"
4. Set URL: `https://treelisty.netlify.app/?capture=1`
5. Name it: "Capture Conversation"
6. Optional: Add to Home Screen
7. Optional: Enable for Siri ("Hey Siri, capture conversation")

---

## Implementation Notes

### Detection
```javascript
// On page load, check for capture mode
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('capture') === '1') {
    enterCaptureMode();
}
```

### Duration Parameter
```javascript
const duration = urlParams.get('duration');
if (duration) {
    const minutes = parseInt(duration);
    setTimeout(stopRecording, minutes * 60 * 1000);
}
```

### Graceful Fallback
- If mic permission denied: show explanation, offer retry
- If Web Speech API unavailable: show error, suggest desktop
- If AI processing fails: save transcript, allow retry

---

## Out of Scope (for now)

- Native iOS app / widget (PWA limitations)
- In-app floating quick-capture button (future enhancement)
- Dedicated "Conversation" pattern (test Generic first)
- Speaker diarization (who said what) - depends on AI capability
