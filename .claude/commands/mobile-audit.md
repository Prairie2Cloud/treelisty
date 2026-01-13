# Mobile Audit Checklist

Systematic checklist for testing TreeListy on mobile devices. Mobile is the 2nd highest bug area (19 fixes in history).

## When to Use

**Automatic Triggers** (skill suggests running):
- After touch/gesture code changes
- After CSS changes affecting responsive layout
- After PWA-related changes
- Before major releases

**Manual Triggers**:
- `/mobile-audit` - Run full mobile checklist
- `/mobile-audit quick` - Quick smoke test (top 5 items only)

## Prerequisites

Test on at least one of:
- **iOS Safari** (preferred - most bugs found here)
- **iOS PWA** (installed via "Add to Home Screen")
- **Android Chrome**
- **BrowserStack** (if no physical device)

Load a test tree with 3+ levels of hierarchy.

## Quick Smoke Test (5 items)

Run these first - they catch 80% of mobile bugs:

| # | Test | How to Verify | Common Failures |
|---|------|---------------|-----------------|
| 1 | **Page loads** | Open https://treelisty.netlify.app | Blank screen, JS errors |
| 2 | **Tree renders** | See nodes with expand/collapse | Missing nodes, layout broken |
| 3 | **Touch expand** | Tap expand arrow | Doesn't respond, double-tap needed |
| 4 | **Pinch zoom** | Two-finger pinch on tree | Zoom doesn't work, page zooms instead |
| 5 | **Chat opens** | Tap chat icon, type message | Keyboard covers input, can't submit |

If any fail → stop and fix before full audit.

## Full Audit Checklist

### 1. Touch Interactions (HIGH PRIORITY)

| Test | Steps | Expected | Bug If... |
|------|-------|----------|-----------|
| Tap node | Single tap on node card | Node selected, info panel shows | No selection, wrong node selected |
| Expand/collapse | Tap expand arrow | Children show/hide smoothly | Stutters, doesn't respond |
| Double-tap edit | Double-tap node name | Edit mode activates | Nothing happens, selects text |
| Long-press context | Press and hold node | Context menu appears | No menu, page selects text |
| Swipe pane | Swipe left/right on tree | Switch to info/chat pane | Stuck, partial swipe |

### 2. Pinch-to-Zoom (Build 491-493)

| Test | Steps | Expected | Bug If... |
|------|-------|----------|-----------|
| Tree view zoom | Pinch in/out on tree | Tree scales, stays centered | Page zooms, jumps around |
| Canvas zoom | Pinch on canvas view | Canvas scales smoothly | Laggy, snaps to wrong level |
| 3D zoom | Pinch on 3D view | Camera moves in/out | Nothing happens |
| Gantt zoom | Pinch on Gantt | Timeline scales | Horizontal scroll instead |
| Reset zoom | Double-tap | Returns to 100% | Doesn't reset |

### 3. Keyboard Handling (Build 632)

| Test | Steps | Expected | Bug If... |
|------|-------|----------|-----------|
| Keyboard appears | Tap text input | Keyboard slides up, input visible | Input hidden behind keyboard |
| Accessory bar | With keyboard open | Quick action bar above keyboard | No bar, bar cut off |
| Keyboard dismiss | Tap outside input | Keyboard closes | Stays open |
| Return key | Press return in chat | Sends message | Inserts newline |
| Emoji picker | Open emoji keyboard | Works, can insert | Crashes, freezes |

### 4. PWA vs Safari (Build 680)

| Test | Safari | PWA | Notes |
|------|--------|-----|-------|
| Voice recording | ✅ Works | ❌ Blocked | PWA blocks Speech Recognition |
| ?capture=1 | ✅ Works | ❌ Redirect | Should redirect to Safari |
| Clipboard paste | ✅ Works | ⚠️ Limited | PWA needs "Paste Share Link" button |
| Share sheet | ✅ Native | ⚠️ Web Share API | May not include all apps |

### 5. View Switching

| Test | Steps | Expected | Bug If... |
|------|-------|----------|-----------|
| Tree → Canvas | Tap View → Canvas | Smooth transition | Blank, artifacts |
| Canvas → 3D | Tap View → 3D | WebGL renders | Black screen, crash |
| 3D → Gantt | Tap View → Gantt | Timeline appears | Empty, wrong dates |
| Gantt → Calendar | Tap View → Calendar | Month grid shows | Missing events |
| Any → Checklist | Tap View → Checklist | Checkboxes render | Items missing |

### 6. Responsive Layout

| Test | Steps | Expected | Bug If... |
|------|-------|----------|-----------|
| Portrait mode | Hold phone vertical | Single column, full width | Overflow, cut off |
| Landscape mode | Rotate phone | Wider layout, may show panels | Doesn't resize |
| Safe areas | Check notch/home bar | Content not hidden | Covered by notch |
| Modal dialogs | Open any modal | Fits screen, scrollable | Off-screen, can't close |

### 7. Performance

| Test | Steps | Expected | Bug If... |
|------|-------|----------|-----------|
| Large tree (100+ nodes) | Load big tree | Renders < 3s | Hangs, crashes |
| Scroll smoothness | Scroll tree rapidly | 60fps smooth | Stutters, jumps |
| Memory after navigation | Switch views 10x | No slowdown | Gets slower each time |
| Wake lock (TTS) | Play read-aloud | Screen stays on | Screen turns off mid-read |

### 8. Mobile-Specific Features

| Feature | Test | Expected |
|---------|------|----------|
| Bottom sheet (Build 813) | Trigger any bottom sheet | Slides up from bottom, swipe to dismiss |
| Tree picker (Build 826) | Tap tree switcher on mobile | Bottom sheet with recent trees |
| Pull-to-refresh blocked (Build 637) | Pull down on tree | Nothing happens (no page refresh) |
| Checklist view (Build 823) | View → Checklist | Progress bar, tap checkboxes |

## Reporting Results

After running audit, report as:

```
## Mobile Audit Results - Build XXX

**Device**: iPhone 14 Pro, iOS 17.2, Safari
**Date**: 2026-01-12

### Quick Smoke: ✅ PASS (5/5)

### Full Audit:
| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Touch | 5/5 | 0 | |
| Pinch-zoom | 4/5 | 1 | Gantt zoom broken |
| Keyboard | 5/5 | 0 | |
| PWA vs Safari | 3/4 | 1 | Expected (voice) |
| View switch | 5/5 | 0 | |
| Responsive | 4/4 | 0 | |
| Performance | 4/4 | 0 | |
| Mobile features | 4/4 | 0 | |

**Issues Found**:
1. Gantt pinch-zoom scrolls horizontally instead of zooming

**Recommendation**: Fix Gantt zoom before release
```

## Historical Bug Patterns

These areas have caused the most mobile bugs:

| Area | Bug Count | What Breaks |
|------|-----------|-------------|
| iOS Safari quirks | 6 | Touch events, keyboard, clipboard |
| PWA limitations | 4 | Speech API, clipboard, share |
| Pinch-zoom | 3 | Wrong element scales, jumps |
| Keyboard handling | 3 | Input hidden, accessory bar |
| View transitions | 2 | Artifacts, blank screens |

## When to Block Release

**Block if**:
- Quick smoke test fails any item
- Touch interactions don't work
- Can't navigate between views
- Keyboard completely blocks input

**Warn but don't block if**:
- PWA-specific features broken (Safari works)
- Minor visual glitches
- Performance slightly degraded
- One view has issues (others work)
