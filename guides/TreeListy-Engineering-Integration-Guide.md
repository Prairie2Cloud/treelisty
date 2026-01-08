# TreeListy Constitutional Integration Guide
## From Philosophy to Engineering Practice

**Purpose**: Operationalize the Constitutional Framework in daily engineering workflow  
**Audience**: TreeListy developers, contributors, code reviewers  
**Version**: 1.0

---

## Part 1: Engineering Integration Points

### 1.1 CLAUDE.md Updates

Add constitutional reference section to CLAUDE.md:

```markdown
## Constitutional Constraints

All TreeListy development is governed by the Constitutional Framework v1.
Before implementing any feature, verify compliance with:

SOVEREIGNTY: Does this feature work offline? Can user export all data?
PROVENANCE: Is AI-generated content marked? Does provenance survive operations?
INTEGRITY: Does this preserve structure visibility? Is destruction reversible?
HUMILITY: Does AI confidence drive UX behavior appropriately?
ANTI-ENFRAMING: Does this reveal or optimize? Any engagement metrics?
FEDERATION: Does cross-tree linking preserve individual sovereignty?

See: /docs/CONSTITUTION.md for full framework
```

### 1.2 Code Comment Standards

Add constitutional tags to code:

```javascript
// CONSTITUTIONAL: SOVEREIGNTY
// This function must work offline - no network calls
function exportTree(tree) {
  // Implementation
}

// CONSTITUTIONAL: PROVENANCE  
// All AI-generated nodes MUST include provenance metadata
function addAINode(parent, content, model, confidence) {
  return {
    ...content,
    provenance: {
      source: 'ai_generated',
      model: model,
      confidence: confidence,
      timestamp: new Date().toISOString(),
      claimed: false  // CONSTITUTIONAL: User must claim to remove badge
    }
  };
}

// CONSTITUTIONAL: INTEGRITY
// Branch deletion requires explicit user confirmation
// This is a SAMPLING operation in MCP terms
async function deleteBranch(branchId) {
  const confirmed = await requestUserConfirmation(
    `Delete branch "${branchId}" and all children?`
  );
  if (!confirmed) return false;
  // ... deletion logic
}
```

### 1.3 Architectural Decision Records (ADRs)

Template for new ADRs:

```markdown
# ADR-XXX: [Feature Name]

## Status
Proposed | Accepted | Deprecated

## Context
[Why this decision is needed]

## Decision
[What we decided]

## Constitutional Impact Assessment

### Sovereignty
- [ ] Works offline: YES/NO/PARTIAL
- [ ] Data exportable: YES/NO/PARTIAL
- [ ] Provider-independent: YES/NO/PARTIAL

### Provenance
- [ ] AI content marked: YES/NO/N/A
- [ ] Provenance survives export: YES/NO/N/A
- [ ] Audit trail maintained: YES/NO/N/A

### Integrity
- [ ] Structure visible: YES/NO
- [ ] Destructive ops require consent: YES/NO/N/A
- [ ] Reversible: YES/NO

### Humility
- [ ] Confidence drives behavior: YES/NO/N/A
- [ ] Uncertainty communicated: YES/NO/N/A

### Anti-Enframing
- [ ] No engagement metrics: CONFIRMED
- [ ] No algorithmic ranking: CONFIRMED
- [ ] Reveals rather than optimizes: YES/NO

### Federation (if applicable)
- [ ] Preserves tree sovereignty: YES/NO/N/A
- [ ] No central registry required: YES/NO/N/A

## Consequences
[Positive and negative impacts]

## Constitutional Exceptions (if any)
[Justify any constitutional tensions with mitigation plan]
```

---

## Part 2: Development Planning

### 2.1 Feature Prioritization Matrix

Score features against constitutional alignment:

```
FEATURE SCORING RUBRIC (0-3 per dimension)

SOVEREIGNTY SCORE:
  3 = Enhances user control (new export format, offline capability)
  2 = Neutral (doesn't affect sovereignty)
  1 = Minor tension (requires network for non-essential feature)
  0 = Violation (requires account, traps data)

PROVENANCE SCORE:
  3 = Enhances transparency (better AI attribution, audit logs)
  2 = Maintains existing provenance
  1 = Adds complexity to provenance tracking
  0 = Obscures or removes provenance

INTEGRITY SCORE:
  3 = Improves structural protection (better undo, clearer visibility)
  2 = Neutral
  1 = Adds destructive operations (with proper consent flow)
  0 = Allows silent structure modification

ADOPTION SCORE:
  3 = Significant UX improvement for casual users
  2 = Moderate improvement
  1 = Power user feature
  0 = Adds friction

PRIORITY = (Sovereignty × 3) + (Provenance × 2) + (Integrity × 2) + Adoption
           ─────────────────────────────────────────────────────────────────
                              Maximum possible: 27
```

### 2.2 Sprint Planning Template

```markdown
# Sprint [N] Planning

## Constitutional Health Check
- [ ] No features in this sprint violate SOVEREIGNTY
- [ ] No features in this sprint violate PROVENANCE
- [ ] Destructive features have consent flows designed

## Feature Breakdown

### Feature: [Name]
- Constitutional Score: [X/27]
- Primary Article: [Which article does this serve?]
- Risk Article: [Which article needs monitoring?]
- Acceptance Criteria:
  - [ ] Functional requirements
  - [ ] Constitutional requirements (specific to this feature)

## Technical Debt (Constitutional)
- [ ] List any constitutional debt being incurred
- [ ] Plan to address in future sprint
```

### 2.3 Backlog Labels

Add constitutional labels to issue tracker:

```
Labels:
  const:sovereignty     - Affects data ownership/portability
  const:provenance      - Affects AI attribution/tracking
  const:integrity       - Affects structure protection
  const:humility        - Affects AI confidence/behavior
  const:anti-enframing  - Affects reveal vs. optimize
  const:federation      - Affects cross-tree features
  const:violation       - Potential constitutional violation (needs review)
  const:enhancement     - Strengthens constitutional compliance
  mvs:layer1            - Safety Hatch Persistence
  mvs:layer2            - Visual Provenance
  mvs:layer3            - Humble AI
```

---

## Part 3: Test Framework

### 3.1 Constitutional Compliance Test Suite

```javascript
// tests/constitutional/sovereignty.test.js

describe('ARTICLE I: Sovereignty', () => {
  
  describe('Offline Capability', () => {
    it('should render tree without network', async () => {
      await disableNetwork();
      const tree = loadTreeFromLocalStorage();
      const rendered = renderTree(tree);
      expect(rendered).toBeTruthy();
    });
    
    it('should allow all CRUD operations offline', async () => {
      await disableNetwork();
      const node = await addNode(tree, { name: 'Test' });
      expect(node).toBeTruthy();
      await updateNode(node.id, { name: 'Updated' });
      await deleteNode(node.id);
      // All operations should succeed
    });
    
    it('should save to localStorage without network', async () => {
      await disableNetwork();
      await saveTree(tree);
      const loaded = loadTreeFromLocalStorage();
      expect(loaded).toEqual(tree);
    });
  });
  
  describe('Export Completeness', () => {
    it('should export 100% of tree data to JSON', () => {
      const exported = exportToJSON(tree);
      const reimported = importFromJSON(exported);
      expect(reimported).toDeepEqual(tree);
    });
    
    it('should include all provenance in export', () => {
      const exported = exportToJSON(treeWithAINodes);
      const parsed = JSON.parse(exported);
      const aiNodes = findNodesWithProvenance(parsed, 'ai_generated');
      expect(aiNodes.length).toBeGreaterThan(0);
      aiNodes.forEach(node => {
        expect(node.provenance.source).toBe('ai_generated');
        expect(node.provenance.model).toBeDefined();
        expect(node.provenance.timestamp).toBeDefined();
      });
    });
    
    it('should preserve Atlas links in export', () => {
      const exported = exportToJSON(treeWithAtlasLinks);
      const parsed = JSON.parse(exported);
      const atlasRefs = findAtlasReferences(parsed);
      expect(atlasRefs.length).toEqual(originalAtlasRefCount);
    });
  });
  
  describe('Provider Independence', () => {
    it('should function with Claude API', async () => {
      setAIProvider('claude');
      const result = await generateNode(prompt);
      expect(result).toBeTruthy();
    });
    
    it('should function with Gemini API', async () => {
      setAIProvider('gemini');
      const result = await generateNode(prompt);
      expect(result).toBeTruthy();
    });
    
    it('should function with no AI provider', async () => {
      setAIProvider(null);
      // Core functionality should still work
      const node = await addNode(tree, { name: 'Manual' });
      expect(node).toBeTruthy();
    });
  });
});
```

```javascript
// tests/constitutional/provenance.test.js

describe('ARTICLE II: Provenance', () => {
  
  describe('AI Attribution', () => {
    it('should mark AI-generated nodes with provenance', async () => {
      const node = await generateNodeWithAI(prompt);
      expect(node.provenance).toBeDefined();
      expect(node.provenance.source).toBe('ai_generated');
      expect(node.provenance.model).toBeDefined();
      expect(node.provenance.confidence).toBeDefined();
    });
    
    it('should display 🤖 badge for unclaimed AI nodes', () => {
      const rendered = renderNode(aiGeneratedNode);
      expect(rendered).toContain('🤖');
    });
    
    it('should remove badge only after explicit claim', async () => {
      const node = aiGeneratedNode;
      expect(node.provenance.claimed).toBe(false);
      
      await claimNode(node.id);
      
      expect(node.provenance.claimed).toBe(true);
      expect(node.provenance.claimedAt).toBeDefined();
      const rendered = renderNode(node);
      expect(rendered).not.toContain('🤖');
    });
    
    it('should NOT remove badge on view-only interactions', async () => {
      const node = aiGeneratedNode;
      await viewNode(node.id);
      await expandNode(node.id);
      await collapseNode(node.id);
      expect(node.provenance.claimed).toBe(false);
    });
  });
  
  describe('Provenance Survival', () => {
    it('should preserve provenance through export/import', () => {
      const exported = exportToJSON(treeWithProvenance);
      const reimported = importFromJSON(exported);
      
      const originalNodes = getAllNodes(treeWithProvenance);
      const reimportedNodes = getAllNodes(reimported);
      
      originalNodes.forEach((orig, i) => {
        expect(reimportedNodes[i].provenance).toDeepEqual(orig.provenance);
      });
    });
    
    it('should preserve provenance through merge', async () => {
      const merged = await mergeTrees(treeA, treeB);
      
      // All original provenance should be intact
      const nodesFromA = findNodesByTreeOrigin(merged, treeA.treeId);
      nodesFromA.forEach(node => {
        expect(node.provenance).toBeDefined();
      });
    });
    
    it('should preserve provenance through copy/paste', async () => {
      const copied = await copyBranch(branch);
      const pasted = await pasteBranch(copied, newParent);
      
      expect(pasted.provenance.source).toBe(branch.provenance.source);
      // But should add copy provenance layer
      expect(pasted.provenance.copiedFrom).toBe(branch.nodeGuid);
    });
  });
});
```

```javascript
// tests/constitutional/integrity.test.js

describe('ARTICLE III: Structural Integrity', () => {
  
  describe('Visibility', () => {
    it('should always show tree structure', () => {
      const rendered = renderTree(tree);
      expect(rendered.querySelector('.tree-structure')).toBeTruthy();
    });
    
    it('should show decomposition in all views', () => {
      const views = ['tree', 'canvas', 'mindmap', 'treemap'];
      views.forEach(view => {
        const rendered = renderInView(tree, view);
        expect(getVisibleNodeCount(rendered)).toBe(tree.nodeCount);
      });
    });
  });
  
  describe('Consent for Destruction', () => {
    it('should require confirmation for branch deletion', async () => {
      const confirmSpy = jest.spyOn(window, 'confirm');
      await deleteBranch(branch.id);
      expect(confirmSpy).toHaveBeenCalled();
    });
    
    it('should NOT delete without confirmation', async () => {
      jest.spyOn(window, 'confirm').mockReturnValue(false);
      const result = await deleteBranch(branch.id);
      expect(result).toBe(false);
      expect(findNode(branch.id)).toBeTruthy();
    });
    
    it('should require higher consent for large branches', async () => {
      const largeBranch = createBranchWithChildren(50);
      const confirmSpy = jest.spyOn(window, 'confirm');
      await deleteBranch(largeBranch.id);
      
      // Should show node count in confirmation
      expect(confirmSpy).toHaveBeenCalledWith(
        expect.stringContaining('50')
      );
    });
  });
  
  describe('Reversibility', () => {
    it('should support undo for all structural changes', async () => {
      const original = cloneTree(tree);
      
      await addNode(tree, { name: 'New' });
      await undo();
      expect(tree).toDeepEqual(original);
      
      await deleteNode(someNode.id);
      await undo();
      expect(findNode(someNode.id)).toBeTruthy();
      
      await moveNode(someNode.id, newParent.id);
      await undo();
      expect(someNode.parentId).toBe(originalParent.id);
    });
    
    it('should maintain undo history across session', async () => {
      await addNode(tree, { name: 'Test' });
      await saveTree(tree);
      
      // Simulate session restart
      const loaded = loadTreeFromLocalStorage();
      
      await undo();
      expect(findNode('Test')).toBeFalsy();
    });
  });
});
```

```javascript
// tests/constitutional/humility.test.js

describe('ARTICLE IV: Epistemic Humility', () => {
  
  describe('Confidence Routing', () => {
    it('should act silently at high confidence (>85%)', async () => {
      const result = await routeIntent({ 
        intent: 'add_node',
        confidence: 0.92 
      });
      expect(result.mode).toBe('silent');
      expect(result.userPromptShown).toBe(false);
    });
    
    it('should narrate at medium confidence (50-85%)', async () => {
      const result = await routeIntent({
        intent: 'restructure_branch',
        confidence: 0.67
      });
      expect(result.mode).toBe('transparent');
      expect(result.narration).toBeDefined();
    });
    
    it('should ask at low confidence (<50%)', async () => {
      const result = await routeIntent({
        intent: 'interpret_ambiguous',
        confidence: 0.35
      });
      expect(result.mode).toBe('ask');
      expect(result.options).toBeDefined();
      expect(result.options.length).toBeGreaterThan(1);
    });
  });
  
  describe('Uncertainty Communication', () => {
    it('should display confidence in AI suggestions', () => {
      const suggestion = renderAISuggestion({
        content: 'Suggested structure',
        confidence: 0.72
      });
      expect(suggestion).toContain('72%');
    });
    
    it('should offer alternatives at medium confidence', () => {
      const suggestion = renderAISuggestion({
        content: 'Primary suggestion',
        confidence: 0.65,
        alternatives: ['Alt 1', 'Alt 2']
      });
      expect(suggestion).toContain('Alt 1');
      expect(suggestion).toContain('Alt 2');
    });
  });
});
```

### 3.2 Red Team Test Scenarios

```javascript
// tests/red-team/centralization-attacks.test.js

describe('Red Team: Centralization Attack Vectors', () => {
  
  describe('Sync Trojan Defense', () => {
    it('should never require account for core features', () => {
      const coreFeatures = [
        'createTree', 'addNode', 'editNode', 'deleteNode',
        'exportJSON', 'importJSON', 'switchView', 'search'
      ];
      
      coreFeatures.forEach(feature => {
        expect(requiresAccount(feature)).toBe(false);
      });
    });
    
    it('should work fully offline after initial load', async () => {
      await loadApplication();
      await disableNetwork();
      
      // All core workflows should succeed
      await createFullTreeWorkflow();
      await editAndReorganizeWorkflow();
      await exportWorkflow();
    });
    
    it('should present cloud as external, not home', () => {
      const syncUI = renderSyncOptions();
      expect(syncUI).toContain('Connect to');
      expect(syncUI).not.toContain('Sign in');
      expect(syncUI).not.toContain('Create account');
    });
  });
  
  describe('Ranking Creep Defense', () => {
    it('should have no trending or popular features', () => {
      const allFeatures = getAllFeatureFlags();
      expect(allFeatures).not.toContain('trending');
      expect(allFeatures).not.toContain('popular');
      expect(allFeatures).not.toContain('recommended');
    });
    
    it('should not track engagement metrics', () => {
      const telemetry = getTelemetrySchema();
      expect(telemetry).not.toContain('timeSpent');
      expect(telemetry).not.toContain('clickCount');
      expect(telemetry).not.toContain('sessionDuration');
    });
    
    it('Gallery should be human-curated, not algorithmic', () => {
      const gallerySort = getGallerySortOptions();
      expect(gallerySort).toContain('newest');
      expect(gallerySort).toContain('alphabetical');
      expect(gallerySort).not.toContain('popular');
      expect(gallerySort).not.toContain('trending');
    });
  });
  
  describe('Model Lock-In Defense', () => {
    it('should have feature parity across providers', async () => {
      const features = ['generateNode', 'suggestStructure', 'analyzeTree'];
      const providers = ['claude', 'gemini', 'openai'];
      
      for (const feature of features) {
        const results = {};
        for (const provider of providers) {
          setAIProvider(provider);
          results[provider] = await testFeature(feature);
        }
        
        // All should succeed (parity)
        providers.forEach(p => {
          expect(results[p].success).toBe(true);
        });
      }
    });
    
    it('should degrade gracefully without AI', async () => {
      setAIProvider(null);
      
      // Core features work
      expect(await createTree()).toBeTruthy();
      expect(await addNode()).toBeTruthy();
      expect(await exportJSON()).toBeTruthy();
      
      // AI features show helpful message
      const aiButton = renderAIButton();
      expect(aiButton).toContain('Configure AI');
    });
  });
  
  describe('Provenance Fade Defense', () => {
    it('should not allow disabling provenance display', () => {
      const settings = getAllSettings();
      expect(settings).not.toContain('hideProvenance');
      expect(settings).not.toContain('disableAIBadge');
    });
    
    it('should allow styling but not hiding badges', () => {
      const badgeSettings = getProvenanceSettings();
      expect(badgeSettings).toContain('badgeColor');
      expect(badgeSettings).toContain('badgeSize');
      expect(badgeSettings).not.toContain('badgeVisible');
    });
    
    it('should include provenance in all export formats', () => {
      const formats = ['json', 'markdown', 'html', 'pdf'];
      formats.forEach(format => {
        const exported = exportTree(treeWithAI, format);
        expect(exported).toContain('ai_generated');
      });
    });
  });
});
```

### 3.3 MVS Validation Tests

```javascript
// tests/mvs/minimum-viable-sovereignty.test.js

describe('Minimum Viable Sovereignty', () => {
  
  describe('Layer 1: Safety Hatch Persistence', () => {
    it('should have prominent Download button', () => {
      const ui = renderMainUI();
      const downloadBtn = ui.querySelector('[data-testid="download-mind"]');
      expect(downloadBtn).toBeTruthy();
      expect(isVisible(downloadBtn)).toBe(true);
      expect(isAboveFold(downloadBtn)).toBe(true);
    });
    
    it('should export complete tree in one click', async () => {
      const downloadBtn = getDownloadButton();
      const exported = await clickAndCapture(downloadBtn);
      
      expect(exported.format).toBe('json');
      expect(exported.data.nodes.length).toBe(tree.nodeCount);
      expect(exported.data.provenance).toBeDefined();
    });
    
    it('exported file should run offline perfectly', async () => {
      const exported = await exportTree(tree);
      await disableNetwork();
      
      const loaded = await importTree(exported);
      expect(loaded).toDeepEqual(tree);
      
      // All operations should work
      await addNode(loaded, { name: 'Offline node' });
      await editNode(loaded.nodes[0], { name: 'Edited offline' });
    });
  });
  
  describe('Layer 2: Visual Provenance', () => {
    it('should show Draft/Final UX for casual users', () => {
      const aiNode = createAINode();
      const rendered = renderNode(aiNode);
      
      // Casual user sees "Draft"
      expect(rendered).toContain('Draft');
      // Or badge
      expect(rendered).toContain('🤖');
    });
    
    it('should convert to Final on edit', async () => {
      const aiNode = createAINode();
      expect(aiNode.provenance.claimed).toBe(false);
      
      await editNodeContent(aiNode.id, 'User edited this');
      
      expect(aiNode.provenance.claimed).toBe(true);
      const rendered = renderNode(aiNode);
      expect(rendered).not.toContain('Draft');
      expect(rendered).not.toContain('🤖');
    });
    
    it('should have low-friction Approve action', () => {
      const aiNode = createAINode();
      const rendered = renderNode(aiNode);
      
      // Approve button should be one click
      const approveBtn = rendered.querySelector('[data-action="claim"]');
      expect(approveBtn).toBeTruthy();
    });
  });
  
  describe('Layer 3: Humble AI', () => {
    it('should not inject structure without indication', async () => {
      const result = await generateStructure(prompt);
      
      // Should present, not inject
      expect(result.injected).toBe(false);
      expect(result.presented).toBe(true);
      expect(result.userAction).toBe('pending');
    });
    
    it('should phrase medium-confidence as suggestion', async () => {
      const result = await generateWithConfidence(prompt, 0.65);
      
      expect(result.message).toMatch(/drafted|suggested|would you like/i);
      expect(result.message).not.toMatch(/here is|I've added|done/i);
    });
    
    it('should ask for direction at low confidence', async () => {
      const result = await generateWithConfidence(prompt, 0.35);
      
      expect(result.type).toBe('question');
      expect(result.options.length).toBeGreaterThan(1);
    });
  });
});
```

---

## Part 4: CI/CD Integration

### 4.1 Pre-Commit Hooks

```bash
#!/bin/bash
# .husky/pre-commit

# Constitutional compliance check
echo "Running constitutional compliance checks..."

# Check for forbidden patterns
if grep -r "trending\|popular\|engagement" --include="*.js" src/; then
  echo "❌ CONSTITUTIONAL VIOLATION: Anti-enframing (engagement metrics detected)"
  exit 1
fi

if grep -r "requiresAccount\|mustLogin" --include="*.js" src/features/; then
  echo "❌ CONSTITUTIONAL VIOLATION: Sovereignty (account requirement in core feature)"
  exit 1
fi

# Run constitutional test suite
npm run test:constitutional

if [ $? -ne 0 ]; then
  echo "❌ Constitutional tests failed"
  exit 1
fi

echo "✅ Constitutional compliance verified"
```

### 4.2 GitHub Actions Workflow

```yaml
# .github/workflows/constitutional-check.yml

name: Constitutional Compliance

on:
  pull_request:
    branches: [main, develop]

jobs:
  constitutional-check:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run Constitutional Tests
        run: npm run test:constitutional
        
      - name: Run Red Team Tests
        run: npm run test:red-team
        
      - name: Run MVS Validation
        run: npm run test:mvs
        
      - name: Check for Constitutional Debt
        run: |
          DEBT=$(grep -r "TODO:CONSTITUTIONAL" --include="*.js" src/ | wc -l)
          echo "Constitutional debt items: $DEBT"
          if [ $DEBT -gt 10 ]; then
            echo "⚠️ Warning: High constitutional debt"
          fi
          
      - name: Generate Constitutional Report
        run: npm run report:constitutional
        
      - name: Upload Report
        uses: actions/upload-artifact@v3
        with:
          name: constitutional-report
          path: reports/constitutional.html
```

### 4.3 PR Template

```markdown
<!-- .github/PULL_REQUEST_TEMPLATE.md -->

## Description
[What does this PR do?]

## Constitutional Impact Assessment

### Sovereignty
- [ ] Works offline: YES / NO / N/A
- [ ] Data exportable: YES / NO / N/A  
- [ ] No account required: YES / NO / N/A

### Provenance
- [ ] AI content marked: YES / NO / N/A
- [ ] Provenance preserved: YES / NO / N/A

### Integrity
- [ ] Structure visible: YES / NO / N/A
- [ ] Destructive ops have consent: YES / NO / N/A
- [ ] Changes reversible: YES / NO / N/A

### Humility  
- [ ] Confidence drives behavior: YES / NO / N/A

### Anti-Enframing
- [ ] No engagement metrics: CONFIRMED / VIOLATION
- [ ] No algorithmic ranking: CONFIRMED / VIOLATION

### Federation (if applicable)
- [ ] Preserves tree sovereignty: YES / NO / N/A

## Constitutional Exceptions
[If any box above is NO or VIOLATION, explain and justify here]

## Testing
- [ ] Constitutional tests pass
- [ ] Red team tests pass (if applicable)
- [ ] MVS validation passes

## Reviewer Checklist
- [ ] Constitutional impact is acceptable
- [ ] No sovereignty violations introduced
- [ ] Provenance tracking maintained
```

---

## Part 5: Developer Onboarding

### 5.1 New Developer Checklist

```markdown
# TreeListy Developer Onboarding

## Day 1: Constitutional Foundation

- [ ] Read CONSTITUTION.md (30 min)
- [ ] Read this Integration Guide (30 min)
- [ ] Run constitutional test suite locally
- [ ] Identify the 6 Articles in the codebase (scavenger hunt)

## Day 2: Hands-On Constitutional Coding

- [ ] Add a node with proper provenance metadata
- [ ] Implement a feature that works offline
- [ ] Write a constitutional test for an existing feature

## Day 3: Red Team Thinking

- [ ] Review red team test scenarios
- [ ] Propose one new attack vector
- [ ] Design defense for your attack vector

## Certification

To merge code, you must demonstrate understanding of:
1. Why sovereignty matters (explain in your own words)
2. How provenance is tracked in the codebase
3. When to request user confirmation (integrity)
4. How the intent router implements humility
```

### 5.2 Quick Reference Card

```
╔═══════════════════════════════════════════════════════════════╗
║              TREELISTY CONSTITUTIONAL QUICK REF               ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  BEFORE CODING, ASK:                                          ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ 1. Does this work offline?              [SOVEREIGNTY]   │  ║
║  │ 2. Is AI content marked?                [PROVENANCE]    │  ║
║  │ 3. Can the user undo this?              [INTEGRITY]     │  ║
║  │ 4. Does AI admit uncertainty?           [HUMILITY]      │  ║
║  │ 5. Am I revealing or optimizing?        [ANTI-ENFRAME]  │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║  NEVER:                                                       ║
║  • Require account for core features                          ║
║  • Hide AI provenance                                         ║
║  • Delete without confirmation                                ║
║  • Add engagement metrics                                     ║
║  • Add "trending" or "popular" features                       ║
║                                                               ║
║  ALWAYS:                                                      ║
║  • Include provenance in node creation                        ║
║  • Support offline operation                                  ║
║  • Make structure visible                                     ║
║  • Route by confidence level                                  ║
║  • Preserve data in exports                                   ║
║                                                               ║
║  CONFIDENCE ROUTING:                                          ║
║  • >85%  → Act silently                                       ║
║  • 50-85% → Act + narrate                                     ║
║  • <50%  → Ask first                                          ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## Part 6: Metrics Dashboard

### 6.1 Constitutional Health Metrics

```javascript
// scripts/constitutional-metrics.js

const metrics = {
  
  sovereignty: {
    offlineCapability: calculateOfflineFeaturePercentage(),
    exportCompleteness: calculateExportCoverage(),
    providerIndependence: testProviderParity(),
  },
  
  provenance: {
    aiNodesCovered: countAINodesWithProvenance() / countAINodes(),
    provenanceSurvival: testProvenanceThroughOperations(),
    claimRate: countClaimedNodes() / countAINodes(),
  },
  
  integrity: {
    undoablOps: countUndoableOperations() / countAllOperations(),
    consentedDestructions: countConsentFlows() / countDestructiveOps(),
    structureVisibility: testStructureInAllViews(),
  },
  
  humility: {
    confidenceRouted: countRoutedByConfidence() / countAIInteractions(),
    uncertaintyCommunicated: testUncertaintyDisplay(),
  },
  
  antiEnframing: {
    engagementMetrics: countEngagementMetrics(), // Should be 0
    algorithmicRankings: countRankingFeatures(), // Should be 0
    viewModeCount: countAvailableViews(), // Should be 9
  },
  
  overall: function() {
    return {
      score: this.calculateOverallScore(),
      status: this.calculateOverallScore() > 95 ? 'HEALTHY' : 'NEEDS ATTENTION',
      violations: this.findViolations(),
    };
  }
};
```

### 6.2 Weekly Constitutional Report

```markdown
# Constitutional Health Report
## Week of [DATE]

### Overall Score: 97/100 ✅

### Article Breakdown

| Article | Score | Status | Notes |
|---------|-------|--------|-------|
| Sovereignty | 100% | ✅ | All features offline-capable |
| Provenance | 95% | ⚠️ | 2 edge cases missing provenance |
| Integrity | 98% | ✅ | All destructive ops have consent |
| Humility | 100% | ✅ | Routing working correctly |
| Anti-Enframing | 100% | ✅ | No violations |
| Federation | N/A | - | Not yet implemented |

### Violations Found
- [ ] `importFromURL()` missing offline fallback
- [ ] `batchAIGenerate()` not adding provenance to all nodes

### Constitutional Debt
- 3 items tagged TODO:CONSTITUTIONAL
- Oldest: 14 days (target: <7 days)

### Recommendations
1. Fix provenance gaps in batch operations
2. Add offline fallback to URL import
3. Clear constitutional debt in next sprint
```

---

## Summary: Integration Checklist

```
IMMEDIATE ACTIONS (This Week)
├── [ ] Add constitutional section to CLAUDE.md
├── [ ] Create tests/constitutional/ directory
├── [ ] Implement sovereignty tests
├── [ ] Add PR template with constitutional checklist
└── [ ] Set up pre-commit hooks

SHORT TERM (This Month)
├── [ ] Complete all Article test suites
├── [ ] Implement red team tests
├── [ ] Add MVS validation tests
├── [ ] Set up CI/CD constitutional checks
└── [ ] Create developer onboarding materials

ONGOING
├── [ ] Weekly constitutional health reports
├── [ ] Constitutional debt tracking
├── [ ] New feature constitutional assessment
└── [ ] Quarterly constitutional review
```

---

*This guide transforms philosophical principles into engineering practice.*
