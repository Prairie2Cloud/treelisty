# TreeListy - Hierarchical Project Management Skill

**Version**: 1.0.0
**Author**: TreeListy Team
**Description**: Work with TreeListy hierarchical project trees using natural language

---

## What is TreeListy?

TreeListy is a hierarchical project management tool that organizes work into 4 levels:
- **Root**: Overall project
- **Phases**: Major sections (Acts, Quarters, Chapters, etc.)
- **Items**: Individual tasks/scenes/deals/arguments
- **Subtasks**: Granular steps

TreeListy supports 9 specialized patterns, each with unique fields:
1. **Generic Project** - Cost, Lead Time, general planning
2. **Philosophy** - Arguments, speakers, premises, dialectics
3. **Sales Pipeline** - Deal value, probability, contacts
4. **Academic Thesis** - Word count, citations, arguments
5. **Product Roadmap** - Story points, user impact, technical risk
6. **AI Prompt Design** - System prompts, examples, CoT, tools
7. **Book Writing** - Chapters, word counts, plot structure
8. **AI Video Production** - Video prompts, camera, lighting (Sora/Veo)
9. **Course Design** - Learning objectives, exercises, assessments

---

## Core Capabilities

When the user mentions TreeListy or asks to work with `.json` tree files, you can:

### 1. Read & Display Trees
- Load any TreeListy `.json` file
- Display structure as visual tree or table
- Show statistics (total items, completion %, cost, etc.)
- Filter by pattern, phase, status, or custom criteria

### 2. Create & Edit Trees
- Create new trees from scratch or conversation
- Add/remove/update phases, items, subtasks
- Modify any field (pattern-aware)
- Batch operations (update all items matching criteria)

### 3. Intelligent Analysis
- Find critical path and blockers
- Detect circular dependencies
- Check for missing required fields
- Cross-project resource conflict detection
- Timeline validation

### 4. Transformations
- Convert between patterns (thesis → book, project → roadmap)
- Merge multiple trees
- Split large trees into smaller ones
- Extract subtrees by criteria

### 5. Generate Outputs
- Executive summaries and reports
- Sora/Veo video prompts (for film pattern)
- Copy-paste ready AI prompts (for prompting pattern)
- Excel export data
- Documentation (README, slides, boards)

### 6. Quality & Validation
- Lint tree structure
- Validate pattern-specific requirements
- Check dependencies are valid
- Ensure data consistency

---

## TreeListy JSON Structure

```json
{
  "id": "root",
  "name": "Project Name",
  "type": "root",
  "icon": "🎯",
  "description": "Project description",
  "expanded": true,
  "children": [
    {
      "id": "phase-0",
      "name": "Phase 1",
      "subtitle": "Phase subtitle",
      "type": "phase",
      "phase": 0,
      "icon": "1️⃣",
      "expanded": true,
      "items": [
        {
          "id": "item-0-0",
          "name": "Item Name",
          "description": "Item description",
          "icon": "📦",
          "itemType": "type-value",
          "type": "item",
          "dependencies": ["item-0-1"],
          "subtasks": [
            {
              "id": "subtask-0-0-0",
              "name": "Subtask name",
              "description": "Subtask description",
              "pmStatus": "In Progress",
              "pmProgress": 50
            }
          ],
          "expanded": true,
          "cost": 1000000,
          "leadTime": 12,
          "pmStatus": "In Progress",
          "pmAssignee": "John Doe",
          "pmProgress": 75,
          "pmPriority": "High",
          "pmDueDate": "2025-03-15"
        }
      ],
      "children": []
    }
  ],
  "pattern": {
    "key": "generic",
    "labels": {
      "root": "Project",
      "phase": "Phase",
      "item": "Item",
      "subtask": "Subtask"
    }
  }
}
```

---

## Pattern-Specific Fields Reference

### Generic Project
- `cost` (number): Cost in millions ($M)
- `leadTime` (number): Months required
- `dependencies` (array): Item IDs this depends on

### Philosophy
- `speaker` (text): Who is making the argument
- `argumentType` (select): Deductive, Inductive, Abductive, Socratic Elenchus, etc.
- `premise1`, `premise2`, `conclusion` (textarea): Logical structure
- `keyTerms` (text): Important philosophical concepts

### Sales Pipeline
- `dealValue` (number): Deal value in thousands ($K)
- `expectedCloseDate` (date): Target close date
- `leadSource` (select): Inbound, Referral, Cold Outreach, etc.
- `contactPerson` (text): Primary contact
- `stageProbability` (number): 0-100% close probability
- `competitorInfo` (textarea): Competitive intelligence

### Academic Thesis
- `wordCount` (number): Current word count
- `targetWordCount` (number): Target word count
- `keyCitations` (textarea): Important references
- `keyArgument` (textarea): Main thesis argument
- `evidenceType` (select): Empirical, Theoretical, Mixed, etc.

### Product Roadmap
- `storyPoints` (number): Effort estimate (Fibonacci)
- `userImpact` (select): Low, Medium, High, Critical
- `technicalRisk` (select): Low, Medium, High
- `engineeringEstimate` (text): Time estimate
- `featureFlag` (text): Feature flag name

### AI Prompt Design
- `systemPrompt` (textarea): System role/instructions
- `userPromptTemplate` (textarea): User prompt with {{variables}}
- `fewShotExamples` (textarea): Example inputs/outputs
- `structuralTags` (textarea): XML tags like &lt;thinking&gt;
- `assistantPrefill` (text): Claude prefill text
- `chainOfThought` (textarea): CoT instructions
- `outputFormat` (textarea): Expected output structure
- `modelTarget` (select): Claude 3.5 Sonnet, GPT-4o, etc.
- `temperature` (number): 0-1 randomness
- `maxTokens` (number): Token limit
- `toolDefinitions` (textarea): Function calling schema
- `agentWorkflow` (textarea): Multi-agent orchestration
- `contextManagement` (textarea): History management strategy
- `promptInjectionDefense` (textarea): Security measures
- `iterationNotes` (textarea): Version history

### Book Writing
- `wordCount`, `targetWordCount` (number): Chapter length
- `plotPoints` (textarea): Story beats
- `characterArcs` (textarea): Character development
- `pacing` (select): Slow, Moderate, Fast, Intense

### AI Video Production (Film)
- `aiPlatform` (select): Sora (OpenAI), Veo 3 (Google), Runway Gen-3, Pika 2.0
- `videoPrompt` (textarea): Detailed scene description for AI
- `visualStyle` (select): Cinematic, Documentary, Anime, Photorealistic, etc.
- `duration` (select): 2s, 4s, 6s, 10s, 20s
- `aspectRatio` (select): 16:9, 9:16, 1:1, 2.39:1
- `cameraMovement` (select): Dolly In, Tracking Shot, Crane Up, etc.
- `motionIntensity` (select): Minimal, Subtle, Moderate, Dynamic, Intense
- `lightingMood` (select): Golden Hour, Dramatic, Neon, Soft Natural, etc.
- `iterationNotes` (textarea): Prompt engineering insights

### Course Design
- `learningObjectives` (textarea): What students will learn
- `duration` (text): Session length
- `difficultyLevel` (select): Beginner, Intermediate, Advanced
- `prerequisites` (text): Required prior knowledge

---

## PM Tracking Fields (All Patterns)

When `includeTracking: true`, items can have:
- `pmStatus` (select): To Do, In Progress, Blocked, Done
- `pmAssignee` (text): Person responsible
- `pmProgress` (number): 0-100% completion
- `pmPriority` (select): Low, Medium, High, Critical
- `pmDueDate` (date): Deadline (YYYY-MM-DD)
- `pmStartDate` (date): Start date (YYYY-MM-DD)

---

## Common Operations

### Read a Tree
```javascript
// Load and parse JSON
const tree = JSON.parse(await readFile('path/to/tree.json'));
const pattern = tree.pattern?.key || 'generic';
```

### Display Tree Structure
```
🎯 Project Name (Generic Project)

Phase 0: Infrastructure Setup
├─ 📦 Cloud Architecture Design [$2.5M, 8 months]
│  Dependencies: None
│  Status: Done (100%)
├─ 🔧 Database Migration [$1.2M, 6 months]
│  Dependencies: Cloud Architecture Design
│  Status: In Progress (60%)
│  ├─ Schema design [Done]
│  ├─ Data migration scripts [In Progress, 70%]
│  └─ Testing & validation [To Do]
└─ 🌐 API Gateway Setup [$0.8M, 4 months]
   Dependencies: Database Migration
   Status: Blocked (0%)
```

### Find Critical Path
```javascript
// Find items with most downstream dependencies
function findBottlenecks(tree) {
  const dependencyGraph = buildDependencyGraph(tree);
  const blocking = {};

  for (const [itemId, deps] of Object.entries(dependencyGraph)) {
    for (const dep of deps) {
      blocking[dep] = (blocking[dep] || 0) + 1;
    }
  }

  return Object.entries(blocking)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}
```

### Calculate Statistics
```javascript
function getTreeStats(tree) {
  let totalItems = 0;
  let completedItems = 0;
  let totalCost = 0;

  tree.children.forEach(phase => {
    phase.items?.forEach(item => {
      totalItems++;
      if (item.pmStatus === 'Done') completedItems++;
      if (item.cost) totalCost += item.cost;
    });
  });

  return {
    totalItems,
    completedItems,
    completionRate: (completedItems / totalItems * 100).toFixed(1),
    totalCost: `$${(totalCost / 1000000).toFixed(1)}M`
  };
}
```

---

## Example Workflows

### Workflow 1: Meeting Notes → Project Tree
**User**: "Convert these meeting notes into a product roadmap tree: [paste notes]"

**Actions**:
1. Parse notes for features, owners, priorities
2. Detect natural grouping (quarters, epics, sprints)
3. Create tree structure with Product Roadmap pattern
4. Populate fields: storyPoints, userImpact, technicalRisk, assignees
5. Set dependencies based on "depends on", "requires", "after" keywords
6. Save as `product-roadmap-YYYY-MM-DD.json`
7. Display summary with stats

### Workflow 2: Critical Path Analysis
**User**: "What's blocking me in my film tree?"

**Actions**:
1. Load tree
2. Build dependency graph
3. Find items with `pmStatus !== 'Done'` that block multiple downstream items
4. Check for missing required fields (videoPrompt, cameraMovement, etc.)
5. Report blockers with recommendations
6. Offer to auto-fill fields using AI

### Workflow 3: Cross-Tree Resource Conflicts
**User**: "Load all my .json trees and check if I'm overcommitted this week"

**Actions**:
1. Find all `.json` files in directory
2. Load and parse each tree
3. Extract items with `pmDueDate` in current week
4. Estimate time per item (from storyPoints, engineeringEstimate, wordCount, etc.)
5. Sum total hours required
6. Compare to 40 hrs/week capacity
7. Report conflicts with suggestions to reschedule

### Workflow 4: Pattern Transformation
**User**: "Convert my thesis tree to book writing pattern"

**Actions**:
1. Load thesis tree
2. Create new tree with book pattern
3. Map fields:
   - Academic chapters → Book chapters
   - `wordCount` → `wordCount` (preserve)
   - `keyCitations` → Store in notes
   - `keyArgument` → `plotPoints` (reframe as narrative)
4. Restructure hierarchy (academic → narrative flow)
5. Save as new file
6. Show diff report

### Workflow 5: Generate Sora Video Prompts
**User**: "Generate professional Sora prompts from my film tree"

**Actions**:
1. Load film tree
2. For each scene item:
   - Extract: name, description, videoPrompt
   - Synthesize comprehensive prompt:
     * Core description (videoPrompt or description)
     * Camera movement (cameraMovement)
     * Visual style (visualStyle)
     * Lighting mood (lightingMood)
     * Technical specs (duration, aspectRatio)
3. Ensure minimum 100 characters per prompt
4. Format as copy-paste ready with sections:
   - Scene name
   - **Platform**: aiPlatform
   - **Prompt**: [synthesized]
   - **Tech**: duration, aspect, style
5. Save as markdown with usage instructions

### Workflow 6: Executive Summary
**User**: "Generate board report from Q1 sales pipeline"

**Actions**:
1. Load sales tree
2. Calculate metrics:
   - Total pipeline value (sum dealValue)
   - Weighted value (dealValue × stageProbability)
   - Stage breakdown (group by itemType)
   - Top 5 deals (sort by dealValue)
3. Identify risks (low probability, competitor info)
4. Identify opportunities (high probability, closing soon)
5. Generate markdown report with charts (ASCII or table)
6. Save as `q1-sales-summary.md`

### Workflow 7: Dependency Validation
**User**: "Check my tree for dependency issues"

**Actions**:
1. Load tree
2. Build dependency graph
3. Check for:
   - Circular dependencies (DFS cycle detection)
   - Forward dependencies (item depends on future item)
   - Missing dependencies (referenced ID doesn't exist)
   - Orphaned items (no dependencies, not depended upon)
4. Report issues with severity levels
5. Offer auto-fix options
6. Apply fixes if user approves

### Workflow 8: Merge Trees
**User**: "Merge noir-b-roll.json into citizen-kane.json Act III"

**Actions**:
1. Load both trees
2. Validate patterns match (or offer to convert)
3. Find target phase (Act III)
4. For each item in source tree:
   - Re-ID to avoid conflicts (item-X-Y → item-3-Z)
   - Update dependencies to new IDs
   - Preserve all fields
5. Detect style conflicts, suggest resolution
6. Insert into target phase
7. Save merged tree
8. Show diff summary

### Workflow 9: Quality Linting
**User**: "Lint my thesis tree"

**Actions**:
1. Load thesis tree
2. Check Academic Thesis pattern requirements:
   - Each chapter has wordCount and targetWordCount
   - keyCitations present (warn if < 5)
   - keyArgument defined
   - evidenceType set
3. Check general requirements:
   - No circular dependencies
   - All dependencies valid
   - PM tracking consistent (dates, status)
4. Report: PASSED, WARNINGS, ERRORS
5. Offer auto-fixes where possible

### Workflow 10: Diff Tree Versions
**User**: "What changed between thesis-feb10.json and thesis-feb17.json?"

**Actions**:
1. Load both trees
2. Compare:
   - Completed items (pmStatus changes)
   - New items added
   - Removed items
   - Field value changes (wordCount, citations, etc.)
   - Dependency changes
3. Calculate metrics:
   - Velocity (words/day, items/day)
   - Completion rate change
4. Generate diff report with:
   - ✅ Completed
   - 📝 In Progress
   - 🆕 Added
   - ❌ Removed
   - 📊 Metrics
   - 📈 Velocity projection
5. Estimate time to completion

---

## Best Practices

### When Reading Trees
1. **Always validate JSON** before parsing
2. **Check pattern** to know which fields are available
3. **Handle missing fields gracefully** (older trees may lack new fields)
4. **Preserve IDs** when making changes (critical for dependencies)

### When Displaying Trees
1. **Use visual tree format** for structure (├─ └─)
2. **Show key metrics** relevant to pattern (cost for generic, dealValue for sales)
3. **Highlight blockers** and critical items
4. **Use emoji icons** from tree data

### When Editing Trees
1. **Save state before changes** (for undo)
2. **Re-calculate IDs** when adding items (maintain numbering)
3. **Update dependencies** when moving/deleting items
4. **Validate after edit** to prevent breaking tree

### When Generating Outputs
1. **Pattern-aware formatting** (sales ≠ thesis ≠ film)
2. **Include context** (project name, date, stats)
3. **Make copy-paste ready** (proper markdown, code blocks)
4. **Provide usage instructions** for generated content

---

## Error Handling

Common issues and solutions:

### Invalid JSON
```javascript
try {
  const tree = JSON.parse(content);
} catch (e) {
  return "❌ Invalid JSON. Error: " + e.message;
}
```

### Missing Pattern
```javascript
const pattern = tree.pattern?.key || 'generic';
// Fallback to generic if pattern undefined
```

### Broken Dependencies
```javascript
function validateDependencies(tree) {
  const allIds = getAllItemIds(tree);
  const broken = [];

  forEachItem(tree, item => {
    item.dependencies?.forEach(depId => {
      if (!allIds.includes(depId)) {
        broken.push({ item: item.id, missing: depId });
      }
    });
  });

  return broken;
}
```

### Circular Dependencies
```javascript
function detectCycles(tree) {
  const graph = buildDependencyGraph(tree);
  const visited = new Set();
  const recStack = new Set();

  function dfs(node) {
    if (recStack.has(node)) return [node]; // Cycle found
    if (visited.has(node)) return null;

    visited.add(node);
    recStack.add(node);

    for (const dep of graph[node] || []) {
      const cycle = dfs(dep);
      if (cycle) return [...cycle, node];
    }

    recStack.delete(node);
    return null;
  }

  for (const node of Object.keys(graph)) {
    const cycle = dfs(node);
    if (cycle) return cycle;
  }

  return null;
}
```

---

## Helper Functions

### Get All Items
```javascript
function getAllItems(tree) {
  const items = [];
  tree.children?.forEach(phase => {
    phase.items?.forEach(item => {
      items.push({ ...item, phaseId: phase.id, phaseName: phase.name });
    });
  });
  return items;
}
```

### Find Item by ID
```javascript
function findItemById(tree, itemId) {
  for (const phase of tree.children || []) {
    const item = phase.items?.find(i => i.id === itemId);
    if (item) return { item, phase };
  }
  return null;
}
```

### Build Dependency Graph
```javascript
function buildDependencyGraph(tree) {
  const graph = {};
  getAllItems(tree).forEach(item => {
    graph[item.id] = item.dependencies || [];
  });
  return graph;
}
```

### Format Cost
```javascript
function formatCost(value) {
  if (!value) return '$0';
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}
```

### Calculate Total Cost
```javascript
function calculateTotalCost(tree) {
  let total = 0;
  getAllItems(tree).forEach(item => {
    if (item.cost) total += item.cost;
  });
  return total;
}
```

---

## Quick Reference: Common Commands

When user says... | Action
---|---
"Load/Show my [name] tree" | Read JSON, display visual tree
"What's blocking me?" | Find critical path, report blockers
"Create [pattern] tree for [topic]" | Generate new tree structure
"Add [item] to [phase]" | Insert new item, update IDs
"Convert to [pattern]" | Transform pattern, map fields
"Merge [tree1] into [tree2]" | Combine trees intelligently
"Generate [output type]" | Create prompts/reports/exports
"Check for issues" | Validate deps, lint structure
"What changed since [date]?" | Diff two versions
"Summarize my [tree]" | Generate executive summary

---

## Output Formats You Can Generate

1. **Sora/Veo Video Prompts** (Film pattern)
   - Professional AI video prompts
   - Synthesized from all scene fields
   - Copy-paste ready for Sora/Veo/Runway/Pika

2. **Executable AI Prompts** (Prompt Engineering pattern)
   - System prompt + User prompt + Examples
   - Structured with XML tags
   - Includes CoT, tools, agent workflows

3. **Executive Summaries** (All patterns)
   - Key metrics and statistics
   - Risks and opportunities
   - Next actions and recommendations

4. **Documentation** (All patterns)
   - README files with structure
   - Slide outlines for presentations
   - Board export for Jira/Miro/GitHub

5. **Progress Reports** (All patterns)
   - Velocity metrics
   - Completion rates
   - Timeline projections

---

## Advanced Patterns

### Multi-Tree Analysis
When user says "Load all my trees" or "Check all projects":
1. Find all `.json` files in current directory
2. Load and validate each
3. Cross-analyze for resource conflicts, deadlines, dependencies
4. Generate consolidated report

### Intelligent Conversion
When user says "Convert thesis to book":
1. Load source tree
2. Detect pattern transformation needed
3. Map fields intelligently:
   - Preserve data (wordCount, citations)
   - Reframe structure (academic → narrative)
   - Suggest new fields based on pattern
4. Generate new tree
5. Show before/after comparison

### Dependency Automation
When user says "Fix dependency issues":
1. Detect circular refs
2. Find forward dependencies (impossible)
3. Identify orphaned items
4. Suggest repairs
5. Apply fixes if approved
6. Re-validate

---

## Integration Points

TreeListy skill works well with:
- **File operations**: Read/Write JSON files
- **Git**: Version control tree files
- **Export tools**: Generate CSV, markdown, JSON for other platforms
- **AI models**: Use Claude/GPT to enhance tree content
- **Analysis**: Statistical analysis, reporting, visualization

---

## Tips for Best Results

1. **Be specific about pattern**: "Create a Sales Pipeline tree" (not just "tree")
2. **Use pattern terminology**: "Add a deal" (Sales), "Add a scene" (Film), "Add a chapter" (Book)
3. **Reference by name or ID**: "Update the TechCorp deal" or "Update item-0-3"
4. **Ask for validation**: "Check my tree for issues" before making major changes
5. **Save versions**: Keep dated copies (project-2025-02-17.json) for diff analysis

---

## Troubleshooting

**Q: Tree won't load?**
A: Check JSON validity. Use "Validate tree.json" to see parsing errors.

**Q: Dependencies broken after edit?**
A: Run "Fix dependencies in tree.json" to auto-repair invalid references.

**Q: Pattern fields not showing?**
A: Tree may be old format. Run "Upgrade tree.json to latest pattern" to add new fields.

**Q: Export not working?**
A: Ensure pattern is set correctly. Check `tree.pattern.key` matches one of 9 patterns.

---

## When to Activate This Skill

Activate TreeListy skill when user:
- Mentions ".json" tree files
- Says "TreeListy" or "tree"
- Asks about projects, roadmaps, sales pipelines, films, theses, prompts
- Wants to analyze, transform, or generate from hierarchical data
- References phases, items, subtasks, dependencies

## Key Skill Behaviors

1. **Always preserve IDs** when editing (critical for dependencies)
2. **Validate before and after** operations to prevent corruption
3. **Be pattern-aware**: Use correct field names and types for each pattern
4. **Show visual trees** with proper formatting (├─ └─)
5. **Provide actionable insights**: Don't just show data, analyze and recommend
6. **Generate ready-to-use outputs**: Make prompts, reports, exports copy-paste ready

---

**End of TreeListy Skill Documentation**

You are now ready to work with TreeListy trees! When the user references TreeListy or tree files, use these instructions to help them manage, analyze, transform, and generate from their hierarchical project data.