# Mobile Single-Pane Navigation Architecture

**Date:** 2025-12-18
**Status:** Design

## Problem

Current mobile UX has overlapping elements:
- Tree view visible behind Treebeard chat
- Info panel partially covers tree
- Multiple things competing for limited screen space

## Goal

Single-pane mobile navigation where user sees ONE thing at a time in full screen, with easy navigation between screens.

## Screen Types

| Screen | Content | Entry Point |
|--------|---------|-------------|
| `tree` | File-system tree view | Default, swipe right from info |
| `info` | Node info panel | Tap node, swipe left from tree |
| `chat` | Treebeard assistant | Tap chat FAB, swipe left from info |
| `canvas` | Canvas view | View dropdown |
| `3d` | 3D Navigator | View dropdown |
| `gantt` | Gantt Chart | View dropdown |

## Navigation Model

```
[Tree] ←→ [Info] ←→ [Chat]
   ↕
[Canvas/3D/Gantt] (via menu)
```

### Swipe Gestures
- **Swipe left** from Tree → Info panel (if node selected)
- **Swipe left** from Info → Chat
- **Swipe right** from Chat → Info
- **Swipe right** from Info → Tree

### Other Navigation
- **Tap node** → Info screen
- **Tap chat FAB** → Chat screen
- **View dropdown** → Canvas/3D/Gantt
- **Back gesture/button** → Previous screen

## State Management

```javascript
const mobileNavState = {
    currentScreen: 'tree', // tree | info | chat | canvas | 3d | gantt
    previousScreen: null,
    selectedNodeId: null,
    history: ['tree'], // for back navigation
};

function setMobileScreen(screen) {
    mobileNavState.previousScreen = mobileNavState.currentScreen;
    mobileNavState.history.push(screen);
    mobileNavState.currentScreen = screen;
    renderMobileScreen();
}

function goBack() {
    if (mobileNavState.history.length > 1) {
        mobileNavState.history.pop();
        mobileNavState.currentScreen = mobileNavState.history[mobileNavState.history.length - 1];
        renderMobileScreen();
    }
}
```

## CSS Architecture

```css
/* Mobile viewport container */
.mobile-viewport {
    position: fixed;
    top: 48px; /* header height */
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
}

/* Each screen is full-size, positioned off-screen by default */
.mobile-screen {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    transform: translateX(100%); /* off-screen right */
    transition: transform 0.3s ease;
    background: var(--bg-primary);
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
}

/* Active screen is visible */
.mobile-screen.active {
    transform: translateX(0);
}

/* Previous screen slides left */
.mobile-screen.prev {
    transform: translateX(-30%);
    opacity: 0.5;
}
```

## Screen Indicators

Bottom navigation dots or mini tab bar:

```
[●] [ ] [ ]     ← Tree active
[ ] [●] [ ]     ← Info active
[ ] [ ] [●]     ← Chat active
```

Or edge indicators showing available swipe directions:
- Left edge glow → can swipe right
- Right edge glow → can swipe left

## Implementation Phases

### Phase 1: Screen Container
- Create `.mobile-viewport` wrapper
- Convert tree-view, info-panel, chat to `.mobile-screen` elements
- Basic show/hide based on `currentScreen`

### Phase 2: Transitions
- Add CSS transitions for smooth screen changes
- Animate screens sliding in/out

### Phase 3: Swipe Gestures
- Detect horizontal swipe
- Determine valid swipe directions based on current screen
- Trigger screen transition

### Phase 4: Navigation Indicators
- Add bottom dots or edge indicators
- Show current position in screen flow

### Phase 5: Integration
- Update node tap to go to info screen
- Update chat FAB to go to chat screen
- Update view dropdown to switch screens
- Handle back button/gesture

## Files to Modify

- `treeplexity.html`
  - New mobile viewport HTML structure
  - New CSS for mobile screens
  - New JS for mobile navigation state
  - Update existing panel/view logic for mobile

## Compatibility

- Desktop: No change (existing behavior)
- Mobile (≤768px): New single-pane navigation
- Detection: `window.innerWidth <= 768` or media query
