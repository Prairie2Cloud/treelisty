# TreeListy Self-Trees

This folder contains self-tree iterations - trees that TreeListy builds about itself.

## Purpose

Each self-tree serves as:
- Living documentation of TreeListy
- Quality benchmark for AI integrations
- Improvement engine (Current → Assessment → Improvement pattern)
- Seed for the next iteration (Meta phase generates next prompt)

## Files

| File | Purpose |
|------|---------|
| `self-tree-vX.Y-buildNNN.json` | Exported self-tree (version + build) |
| `next-prompt.md` | Multi-lens prompt for next iteration (currently v1.3) |
| `evaluation-vX.X.md` | Optional analysis of an iteration |

### Current Files
- `self-tree-v1.0-build538.json` - Initial developer lens self-tree
- `self-tree-v1.1-build538.json` - Added cross-cutting themes
- `next-prompt.md` - v1.3 multi-lens framework (17 lenses across 5 clusters)

## Running a Self-Tree Test

1. Open TreeListy
2. Load previous self-tree (if exists) for context
3. Use prompt from `next-prompt.md` (v1.3 multi-lens framework)
4. Choose lens(es): Developer, Utility, Sharpness, Intent, etc.
5. Let TreeBeard build the tree with `[MEASURED]` evidence tags
6. Export to this folder with naming convention: `self-tree-vX.Y-buildNNN.json`
7. Update Meta phase insights in prompt if needed

## Prompt Evolution

| Version | Focus | Key Addition |
|---------|-------|--------------|
| v1.0 | Developer concerns | Features, Architecture, Tech Debt |
| v1.1 | Cross-cutting themes | Theme frequency analysis |
| v1.2 | Evidence standards | `[MEASURED]` vs `[CODE-INFERRED]` |
| v1.3 | Multi-lens framework | 17 lenses across 5 clusters |

## Evaluation Questions

After each run, assess:
- Can AI leverage this tree?
- Can a user learn TreeListy from this tree?
- Did validation prevent building non-problems?
- Did the process reveal real TreeListy improvements?

See `docs/plans/2025-12-22-self-tree-improvement-plan.md` for validation learnings.
