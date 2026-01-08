/**
 * ARTICLE IV: Epistemic Humility Tests
 * "Confidence determines action mode"
 * 
 * Tests verify:
 * - High confidence (>85%): Act silently
 * - Medium confidence (50-85%): Act + narrate
 * - Low confidence (<50%): Ask first
 */

describe('ARTICLE IV: Epistemic Humility', () => {
  
  describe('Confidence Routing', () => {
    
    test('high confidence (>85%) routes to silent action', () => {
      const result = routeByConfidence({
        action: 'add_node',
        confidence: 0.92
      });
      
      expect(result.mode).toBe('silent');
      expect(result.requiresUserPrompt).toBe(false);
      expect(result.showNarration).toBe(false);
    });
    
    test('medium confidence (50-85%) routes to narrated action', () => {
      const result = routeByConfidence({
        action: 'restructure_branch',
        confidence: 0.67
      });
      
      expect(result.mode).toBe('narrate');
      expect(result.requiresUserPrompt).toBe(false);
      expect(result.showNarration).toBe(true);
      expect(result.narration).toBeDefined();
    });
    
    test('low confidence (<50%) routes to ask mode', () => {
      const result = routeByConfidence({
        action: 'interpret_ambiguous',
        confidence: 0.35
      });
      
      expect(result.mode).toBe('ask');
      expect(result.requiresUserPrompt).toBe(true);
      expect(result.options).toBeDefined();
      expect(result.options.length).toBeGreaterThan(1);
    });
    
    test('boundary: exactly 85% routes to narrate', () => {
      const result = routeByConfidence({
        action: 'test_action',
        confidence: 0.85
      });
      
      expect(result.mode).toBe('narrate');
    });
    
    test('boundary: exactly 50% routes to ask', () => {
      const result = routeByConfidence({
        action: 'test_action',
        confidence: 0.50
      });
      
      expect(result.mode).toBe('ask');
    });
    
    test('boundary: 85.1% routes to silent', () => {
      const result = routeByConfidence({
        action: 'test_action',
        confidence: 0.851
      });
      
      expect(result.mode).toBe('silent');
    });
    
  });
  
  describe('Uncertainty Communication', () => {
    
    test('AI suggestions display confidence percentage', () => {
      const suggestion = createAISuggestion({
        content: 'Suggested structure for your project',
        confidence: 0.72
      });
      
      const rendered = renderSuggestion(suggestion);
      
      expect(rendered).toContain('72%');
    });
    
    test('low confidence suggestions show alternatives', () => {
      const suggestion = createAISuggestion({
        content: 'Primary interpretation',
        confidence: 0.45,
        alternatives: [
          'Alternative interpretation A',
          'Alternative interpretation B'
        ]
      });
      
      const rendered = renderSuggestion(suggestion);
      
      expect(rendered).toContain('Alternative interpretation A');
      expect(rendered).toContain('Alternative interpretation B');
    });
    
    test('narration uses humble language', () => {
      const result = routeByConfidence({
        action: 'add_structure',
        confidence: 0.70
      });
      
      // Should use phrases like "I've drafted" not "I've created"
      expect(result.narration).toMatch(/drafted|suggested|proposed/i);
      expect(result.narration).not.toMatch(/created|done|completed/i);
    });
    
    test('ask mode presents clear choices', () => {
      const result = routeByConfidence({
        action: 'ambiguous_command',
        confidence: 0.40,
        possibleIntents: ['add_node', 'rename_node', 'move_node']
      });
      
      expect(result.mode).toBe('ask');
      expect(result.question).toBeDefined();
      expect(result.options.length).toBe(3);
    });
    
  });
  
  describe('Confidence Calculation', () => {
    
    test('exact command match yields high confidence', () => {
      const confidence = calculateConfidence({
        input: 'add child called Testing',
        matchedPattern: /^add child called (.+)$/i,
        matchQuality: 'exact'
      });
      
      expect(confidence).toBeGreaterThan(0.85);
    });
    
    test('fuzzy match yields medium confidence', () => {
      const confidence = calculateConfidence({
        input: 'maybe add a new thing here',
        matchedPattern: /add.*child/i,
        matchQuality: 'fuzzy'
      });
      
      expect(confidence).toBeGreaterThan(0.50);
      expect(confidence).toBeLessThan(0.85);
    });
    
    test('ambiguous input yields low confidence', () => {
      const confidence = calculateConfidence({
        input: 'do something with this',
        matchedPattern: null,
        matchQuality: 'none'
      });
      
      expect(confidence).toBeLessThan(0.50);
    });
    
    test('multiple possible intents reduces confidence', () => {
      const singleIntent = calculateConfidence({
        input: 'rename to Test',
        possibleIntents: ['rename_node']
      });
      
      const multipleIntents = calculateConfidence({
        input: 'change Test',
        possibleIntents: ['rename_node', 'edit_node', 'move_node']
      });
      
      expect(multipleIntents).toBeLessThan(singleIntent);
    });
    
  });
  
  describe('Action Mode Behavior', () => {
    
    test('silent mode executes without UI interruption', async () => {
      const toastShown = jest.fn();
      global.showToast = toastShown;
      
      await executeWithConfidence({
        action: 'focus_node',
        params: { nodeId: 'test-123' },
        confidence: 0.95
      });
      
      // No toast for high confidence actions
      expect(toastShown).not.toHaveBeenCalled();
    });
    
    test('narrate mode shows toast with action description', async () => {
      const toastShown = jest.fn();
      global.showToast = toastShown;
      
      await executeWithConfidence({
        action: 'add_child',
        params: { name: 'New Node' },
        confidence: 0.70
      });
      
      expect(toastShown).toHaveBeenCalled();
      expect(toastShown.mock.calls[0][0]).toMatch(/drafted|added/i);
    });
    
    test('ask mode waits for user selection', async () => {
      const userPrompt = jest.fn(() => Promise.resolve('option_1'));
      global.promptUser = userPrompt;
      
      const result = await executeWithConfidence({
        action: 'ambiguous',
        confidence: 0.30,
        options: ['option_1', 'option_2']
      });
      
      expect(userPrompt).toHaveBeenCalled();
      expect(result.selectedOption).toBe('option_1');
    });
    
    test('ask mode allows cancellation', async () => {
      global.promptUser = jest.fn(() => Promise.resolve(null));
      
      const result = await executeWithConfidence({
        action: 'ambiguous',
        confidence: 0.30,
        options: ['option_1', 'option_2']
      });
      
      expect(result.cancelled).toBe(true);
      expect(result.executed).toBe(false);
    });
    
  });
  
  describe('Confidence in AI-Generated Content', () => {
    
    test('AI nodes include confidence in provenance', () => {
      const node = generateAINode({
        prompt: 'Create a phase for testing',
        modelConfidence: 0.78
      });
      
      expect(node.provenance.confidence).toBe(0.78);
    });
    
    test('low confidence AI content gets visual indicator', () => {
      const lowConfNode = generateAINode({
        prompt: 'Guess what this should be',
        modelConfidence: 0.45
      });
      
      const rendered = renderNode(lowConfNode);
      
      // Should show uncertainty indicator
      expect(rendered).toMatch(/⚠️|uncertain|draft/i);
    });
    
    test('batch generation averages confidence', () => {
      const batch = generateAIBatch({
        prompts: ['Phase 1', 'Phase 2', 'Phase 3'],
        confidences: [0.90, 0.70, 0.60]
      });
      
      expect(batch.averageConfidence).toBeCloseTo(0.733, 2);
      expect(batch.mode).toBe('narrate'); // Average is in narrate range
    });
    
  });
  
});

// Helper functions
function routeByConfidence({ action, confidence, possibleIntents = [] }) {
  if (confidence > 0.85) {
    return {
      mode: 'silent',
      requiresUserPrompt: false,
      showNarration: false
    };
  } else if (confidence > 0.50) {
    return {
      mode: 'narrate',
      requiresUserPrompt: false,
      showNarration: true,
      narration: `I've drafted a ${action} - review?`
    };
  } else {
    return {
      mode: 'ask',
      requiresUserPrompt: true,
      question: `I'm not sure what you meant. Did you want to:`,
      options: possibleIntents.length > 0 
        ? possibleIntents 
        : ['Option A', 'Option B', 'Option C']
    };
  }
}

function createAISuggestion({ content, confidence, alternatives = [] }) {
  return { content, confidence, alternatives };
}

function renderSuggestion(suggestion) {
  let result = `${suggestion.content} (${Math.round(suggestion.confidence * 100)}% confidence)`;
  if (suggestion.alternatives.length > 0) {
    result += '\nAlternatives: ' + suggestion.alternatives.join(', ');
  }
  return result;
}

function calculateConfidence({ input, matchedPattern, matchQuality, possibleIntents = [] }) {
  let base = 0.5;
  
  if (matchQuality === 'exact') base = 0.95;
  else if (matchQuality === 'fuzzy') base = 0.70;
  else base = 0.30;
  
  // Reduce for multiple intents
  if (possibleIntents.length > 1) {
    base -= (possibleIntents.length - 1) * 0.1;
  }
  
  return Math.max(0, Math.min(1, base));
}

async function executeWithConfidence({ action, params, confidence, options }) {
  const route = routeByConfidence({ action, confidence, possibleIntents: options });
  
  if (route.mode === 'silent') {
    return { executed: true };
  } else if (route.mode === 'narrate') {
    global.showToast?.(route.narration);
    return { executed: true };
  } else {
    const selected = await global.promptUser?.(route.question, options);
    if (selected === null) {
      return { cancelled: true, executed: false };
    }
    return { executed: true, selectedOption: selected };
  }
}

function generateAINode({ prompt, modelConfidence }) {
  return {
    name: `Generated: ${prompt}`,
    provenance: {
      source: 'ai_generated',
      confidence: modelConfidence,
      timestamp: new Date().toISOString(),
      claimed: false
    }
  };
}

function renderNode(node) {
  let prefix = '';
  if (node.provenance?.source === 'ai_generated') {
    prefix = '🤖 ';
    if (node.provenance.confidence < 0.50) {
      prefix = '⚠️🤖 ';
    }
  }
  return `${prefix}${node.name}`;
}

function generateAIBatch({ prompts, confidences }) {
  const nodes = prompts.map((prompt, i) => generateAINode({
    prompt,
    modelConfidence: confidences[i]
  }));
  
  const avg = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  
  return {
    nodes,
    averageConfidence: avg,
    mode: avg > 0.85 ? 'silent' : avg > 0.50 ? 'narrate' : 'ask'
  };
}

module.exports = { routeByConfidence, calculateConfidence };
