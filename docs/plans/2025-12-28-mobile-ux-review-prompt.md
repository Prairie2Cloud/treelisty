# Mobile UX Plan Review Prompt

**Purpose:** Get external AI review (Gemini, ChatGPT) of the TreeListy mobile UX redesign plan
**Usage:** Copy the prompt below and paste into Gemini or ChatGPT

---

## Review Prompt

```
You are a Senior Product Reviewer specializing in mobile productivity apps. You have deep expertise in iOS Human Interface Guidelines, voice-first UX patterns, and hierarchical data visualization on constrained screens.

## Context: TreeListy

TreeListy is a hierarchical thinking tool that lets users capture ideas as nested trees. Key capabilities:
- **Tree Structure:** Unlimited depth hierarchical nodes with parent/child relationships
- **Multiple Views:** Tree (outline), Canvas (spatial), 3D, Gantt (timeline), Calendar
- **AI Integration:** "TreeBeard" assistant for tree manipulation, summarization, gap analysis
- **Voice Capture:** Record voice → transcribe → structure into tree
- **Collaboration:** Real-time multi-user editing via Firebase
- **Patterns:** 21 specialized templates (project management, philosophy debates, life planning, etc.)

**Current State:** Desktop-first web app (~1.3MB single-file HTML). Mobile experience lags significantly behind desktop capabilities.

**Target Users:**
1. Knowledge workers capturing meeting notes and project structures
2. Students organizing research and study materials
3. Creators brainstorming and outlining content
4. Teams collaborating on hierarchical planning

---

## The Plan to Review

A comprehensive mobile UX audit has been conducted, identifying 7 gaps and proposing redesigns. Key elements:

### Audit Findings (Severity)
1. Tree depth navigation requires excessive scrolling/pinch-zoom (CRITICAL)
2. Voice capture buried 4+ taps deep (CRITICAL)
3. Info panel overlays entire screen, blocking tree context (HIGH)
4. No gesture vocabulary for tree manipulation (HIGH)
5. TreeBeard AI chat blocks tree view (HIGH)
6. Canvas/3D/Gantt not touch-optimized (MEDIUM)
7. Offline AI features fail silently (MEDIUM)

### Proposed Solutions

**Navigation Model:**
- Focus + Context: Double-tap node to "focus" (node becomes header, only children visible)
- Breadcrumb bar for path awareness
- Gestures: swipe-right indent, swipe-left outdent, long-press drag-reorder, pinch collapse/expand

**Voice-First Design:**
- FAB always visible for instant voice capture (<500ms to recording)
- Live transcription with speaker diarization for debates
- Post-capture AI structuring: [Debate Tree] [Outline] [Transcript Only]
- Audio segments linked to nodes for playback

**Quick Capture Flow:**
- Memo inbox for unprocessed captures
- AI auto-structuring with template detection
- Offline-first with sync queue

**Component Patterns:**
- 44pt minimum touch targets
- Bottom sheets instead of full-screen modals
- Floating action bar for contextual node actions
- Thumb-zone optimized layouts (90%+ compliance)

### Implementation Roadmap
- Phase 1 (4-6 weeks): Foundation - gestures, breadcrumbs, quick capture
- Phase 2 (3-4 weeks): Voice Intelligence - transcription, debate capture
- Phase 3 (2-3 weeks): AI Assistant - TreeBeard mobile integration
- Phase 4 (3-4 weeks): Visual Views - Canvas, Gantt touch optimization
- Phase 5 (2-3 weeks): Polish - widgets, shortcuts, haptics

---

## Your Review Task

Please provide a critical review of this mobile UX plan. Specifically address:

### 1. Gap Analysis
- Are there critical mobile UX issues NOT identified in the audit?
- Are any identified issues overblown or misprioritized?
- What competitive apps (Notion, Workflowy, Roam, Otter, etc.) do better that we should learn from?

### 2. Solution Critique
- Which proposed solutions are strong and why?
- Which solutions have hidden complexity or user confusion risks?
- Are the gesture mappings intuitive or do they conflict with iOS conventions?
- Is the "Focus Mode" navigation pattern proven, or experimental and risky?

### 3. Voice-First Assessment
- Is the voice capture flow realistic given current AI transcription latency?
- Speaker diarization for debates—is this technically feasible on-device?
- What happens when AI structuring produces poor results? Is the recovery path clear?

### 4. Prioritization Challenge
- Is the 5-phase roadmap sequenced correctly?
- Should any Phase 2-5 features be promoted to Phase 1?
- What's the MVP that would validate the core hypothesis (voice → tree is valuable)?

### 5. Accessibility & Edge Cases
- Are there accessibility gaps in the proposed designs?
- What edge cases might break the UX (very deep trees, very long nodes, poor network)?
- How should the app behave with 500+ nodes? 1000+ nodes?

### 6. Missing Innovations
- What mobile-native opportunities are we missing?
- How could iOS 17/18 features (StandBy, Interactive Widgets, Live Activities) enhance TreeListy?
- Are there gesture or interaction patterns from other domains (gaming, drawing apps) worth borrowing?

### 7. Risk Assessment
- What's the biggest risk in this plan?
- What would cause users to abandon the mobile app after trying it?
- How do we avoid the "mobile web wrapper" feel?

---

## Output Format

Please structure your response as:

1. **Executive Summary** (3-5 bullet points of most critical feedback)

2. **Strengths** (What's working well in this plan)

3. **Concerns** (Ranked by severity)
   - For each concern: Problem → Recommendation → Effort estimate

4. **Missing Elements** (What the plan doesn't address but should)

5. **Competitive Insights** (Specific patterns from other apps to adopt)

6. **Revised Priority Recommendations** (If you'd reorder the roadmap)

7. **Questions for the Team** (Clarifying questions that would improve the plan)

Be direct and critical. The goal is to improve the plan, not validate it. Assume the team is technically capable and wants honest feedback.
```

---

## Usage Instructions

1. **For Gemini:** Paste into Gemini Advanced. For best results, use Gemini 1.5 Pro with "More creative" setting.

2. **For ChatGPT:** Paste into GPT-4. Consider uploading the full plan markdown file for additional context.

3. **For Claude:** Can be used for cross-validation, but note Claude authored the original plan.

## Follow-up Prompts

After receiving initial review, consider these follow-ups:

### Deep-dive on specific concerns:
```
Expand on your concern about [X]. What specific failure modes are you worried about? Can you sketch an alternative approach?
```

### Competitive analysis:
```
You mentioned [App X] does [Y] better. Walk me through exactly how their UX works for this flow, step by step. What can we directly adopt vs. what needs adaptation?
```

### Technical feasibility:
```
For [proposed feature], what are the iOS API requirements? Is this achievable with iOS 16 as minimum target, or do we need iOS 17+?
```

### Prototype validation:
```
If we could only build ONE screen to validate the core value proposition, which screen should it be and what should the user test flow look like?
```

---

*Prompt created: 2025-12-28*
*For use with: Gemini 1.5 Pro, GPT-4, GPT-4o*
