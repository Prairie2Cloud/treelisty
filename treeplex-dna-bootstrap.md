# TreeListy Self-Tree Bootstrap Prompt v1.0

## Mission

Build a comprehensive self-tree that documents, assesses, and proposes improvements for TreeListy itself. This tree will serve as:
1. Living documentation of what TreeListy is
2. Quality benchmark for AI integration capabilities
3. Improvement engine that identifies what to fix/enhance
4. Seed for the next iteration (this tree generates the next prompt)

## Structure

Create a tree with 4 top-level phases:

### Phase 1: Features
Document every major capability of TreeListy. For each feature area, create three child nodes:
- **Current**: What it does today, how it works
- **Assessment**: Honest evaluation - what's good, what's broken, what's confusing
- **Improvements**: Specific, actionable enhancements

Feature areas to cover:
- Views (Tree, Canvas, 3D, Gantt, Calendar)
- Patterns (all 21, translation engine, shadow data)
- AI Integration (TreeBeard, Claude/Gemini/ChatGPT, Research mode, MCP Bridge)
- Collaboration (Firebase Live Sync, Cloud Share)
- Data Management (Import/Export formats, Undo system, Auto-save)
- Mobile/PWA (Single-pane nav, gestures, installability)

### Phase 2: Architecture
Document how TreeListy is built technically. Same Current -> Assessment -> Improvement pattern.

Areas to cover:
- Single-File Structure (HTML/CSS/JS organization)
- Core Data Model (capexTree, node schema, hyperedges, 4-level hierarchy)
- Rendering Pipeline (render functions for each view)
- State Management (globals, saveState, viewMode, sync states)
- External Integrations (Netlify, Firebase, MCP Bridge, CDN libraries)
- Build & Deploy (GitHub -> Netlify, versioning, test suite)

### Phase 3: User Journey
Document the experience of using TreeListy from discovery to mastery. Same pattern.

Stages to cover:
- Discovery (finding TreeListy, first impressions)
- Onboarding (first session, time-to-value)
- Daily Use (common workflows, efficiency)
- Power Features (collaboration, research, MCP - discoverability and learning curve)
- Pain Points (known issues, workarounds)
- Mastery (expert patterns, ceiling, what's missing)

### Phase 4: Meta
Document this self-tree process itself. This phase enables self-improvement.

Include:
- **Genesis**: This prompt (verbatim), build date, TL version, AI models used, parent tree (none for v1.0)
- **Quality Assessment**: How complete/accurate is this tree? What's missing? Can AI leverage it? Can users leverage it?
- **Learnings**: What was surprising? What was hard to document? What revealed gaps?
- **Next Iteration**:
  - Write an improved prompt for building self-tree v1.1
  - Identify focus areas that need deeper coverage
  - Suggest experiments (different patterns, AI backends, etc.)
- **TreeListy Improvements**: Bugs found, feature gaps revealed, enhancement ideas from this exercise

## Guidelines

1. **Be honest in assessments** - The value is in truthful evaluation, not flattery
2. **Be specific in improvements** - "Make it faster" is useless; "Add virtual scrolling for trees >500 nodes" is actionable
3. **Use TreeListy's own patterns** - Apply appropriate patterns to nodes where they fit
4. **Exercise AI capabilities** - Use research mode, MCP Bridge if available, multiple AI backends
5. **Note what you couldn't do** - If something was hard to document or assess, that's valuable signal
6. **The Meta phase is critical** - This is where the next iteration's prompt lives

## Success Criteria

This self-tree succeeds if:
- [ ] All 4 phases are complete with Current/Assessment/Improvement nodes
- [ ] Assessments are honest (includes negatives, not just positives)
- [ ] Improvements are specific and actionable
- [ ] Meta phase contains a refined prompt for v1.1
- [ ] Someone unfamiliar with TreeListy could understand it from this tree
- [ ] The TreeListy team could use the Improvements as a roadmap
- [ ] The next self-tree will be better because this one exists

## Begin

Start by creating the root node "TreeListy Self-Tree v1.0" with a description summarizing what this tree is. Then build out each phase systematically.

When you reach the Meta phase, reflect on the entire process and write the v1.1 prompt based on what you learned.
