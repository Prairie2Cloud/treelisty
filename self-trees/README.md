# TreeListy Self-Trees

This folder contains self-tree iterations - trees that TreeListy builds about itself.

## Purpose

Each self-tree serves as:
- Living documentation of TreeListy
- Quality benchmark for AI integrations
- Improvement engine (Current → Assessment → Improvement pattern)
- Seed for the next iteration (Meta phase generates next prompt)

## Files

| Pattern | Purpose |
|---------|---------|
| `self-tree-v1.0-build537.json` | Exported self-tree (version + build) |
| `next-prompt.md` | Extracted prompt for next iteration |
| `evaluation-vX.X.md` | Optional analysis of an iteration |

## Running a Self-Tree Test

1. Open TreeListy
2. Load previous self-tree (if exists) for context
3. Paste prompt from `../treeplex-dna-bootstrap.md` (first run) or `next-prompt.md` (subsequent runs)
4. Let TreeBeard build the tree
5. Export to this folder with naming convention above
6. Extract next prompt from Meta phase → save as `next-prompt.md`

## Evaluation Questions

After each run, assess:
- Can AI leverage this tree?
- Can a user learn TreeListy from this tree?
- Did the Meta phase produce a better prompt?
- Did the process reveal real TreeListy improvements?

See `docs/plans/2025-12-21-self-tree-quality-benchmark-design.md` for full details.
