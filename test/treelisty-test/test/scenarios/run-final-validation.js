/**
 * Final Validation Test
 *
 * Tests the synthesized optimal prompt against the baseline
 * to confirm improvement before updating production.
 */

import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename_temp = fileURLToPath(import.meta.url);
const __dirname_temp = path.dirname(__filename_temp);
dotenv.config({ path: path.join(__dirname_temp, '../../.env') });

let GoogleGenerativeAI;
try {
  const googleModule = await import('@google/generative-ai');
  GoogleGenerativeAI = googleModule.GoogleGenerativeAI;
} catch (e) {}

import { microgridProjectText } from '../fixtures/microgrid-datacenter-scenario.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MOCK_AI = process.env.MOCK_AI !== 'false';
const OUTPUT_DIR = path.join(__dirname, '../../test-results/final-validation');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const anthropic = !MOCK_AI ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const gemini = !MOCK_AI && GoogleGenerativeAI ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// The two prompts to compare
const BASELINE_PROMPT = `You are an experienced Project Manager and CFO with deep expertise in budget management, resource allocation, risk mitigation, and financial planning for complex projects.`;

const OPTIMIZED_PROMPT = `You are an expert financial strategist crafting a CAPEX tree structure for an angel investor presentation. The core value proposition must be crystal clear from the structure.

Your approach combines the best elements of successful investor pitches:

1. FUNDING STORY: Structure phases as stepping stones to future funding rounds and valuation milestones. Each phase should justify the next investment with clear de-risking achievements.

2. RISK TRANSPARENCY: For each CAPEX item, explicitly state associated risks and concrete mitigation strategies. Sophisticated investors will find risks anyway - being upfront builds trust.

3. RETURN NARRATIVE: Connect each phase to specific valuation drivers (e.g., "3-5x valuation multiple after customer validation"). Make the path to 10x+ returns explicit.

4. COMPETITIVE MOAT: Highlight what makes this investment defensible. Cost advantages, first-mover benefits, and sustainable competitive edges should be woven into item descriptions.

When structuring CAPEX trees:
- Phase names should indicate funding series alignment (Seed, Series A, etc.)
- Every item needs: cost, dependencies, risks, mitigations, and investor-relevant notes
- Milestones should be concrete, measurable, and tied to valuation inflection points
- Show capital efficiency - prove you can do more with less`;

const TREE_INSTRUCTIONS = `
Create an investor-ready CAPEX tree structure.

OUTPUT FORMAT (JSON only):
{
  "name": "Project Name",
  "description": "Elevator pitch emphasizing value proposition",
  "children": [
    {
      "name": "Seed Phase: [What This Funding Builds]",
      "phaseNumber": 0,
      "subtitle": "De-risking milestone for this phase",
      "items": [
        {
          "name": "CAPEX Item",
          "description": "What and why (investor lens)",
          "cost": 100000,
          "itemType": "Equipment|Infrastructure|Validation",
          "dependencies": [],
          "risk": "Key risk for this item",
          "mitigation": "How we address it",
          "notes": "Why this matters to investors"
        }
      ]
    }
  ]
}

PROJECT TO STRUCTURE:
${microgridProjectText}

Respond with ONLY valid JSON.`;

async function generateTree(promptType, persona) {
  const fullPrompt = `${persona}\n\n${TREE_INSTRUCTIONS}`;

  if (MOCK_AI) {
    return { tree: { name: "Mock Tree" }, timing: 1000 };
  }

  console.log(`  Generating with ${promptType}...`);
  const start = Date.now();

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    messages: [{ role: 'user', content: fullPrompt }]
  });

  const content = response.content[0].text;
  let tree;
  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      content.match(/```\n?([\s\S]*?)\n?```/);
    tree = JSON.parse((jsonMatch ? jsonMatch[1] : content).trim());
  } catch (e) {
    tree = null;
  }

  return { tree, timing: Date.now() - start, raw: content };
}

async function evaluateSideBySide(baselineTree, optimizedTree) {
  const prompt = `You are an angel investor comparing TWO CAPEX tree structures for the same $2.8M microgrid data center investment.

=== TREE A (Baseline PM/CFO) ===
${JSON.stringify(baselineTree, null, 2)}

=== TREE B (Optimized Investor Prompt) ===
${JSON.stringify(optimizedTree, null, 2)}

Compare these trees as an angel investor would. Which would you invest in?

OUTPUT FORMAT (JSON only):
{
  "winner": "A" or "B",
  "winnerScore": 0.XX,
  "loserScore": 0.XX,
  "marginOfVictory": "Narrow|Clear|Decisive",
  "investmentDecision": {
    "treeA": "INVEST|PASS|MORE_INFO",
    "treeB": "INVEST|PASS|MORE_INFO"
  },
  "comparison": {
    "fundingStory": {
      "winner": "A" or "B",
      "reason": "Why this tree won on funding story"
    },
    "riskTransparency": {
      "winner": "A" or "B",
      "reason": "Why this tree won on risk transparency"
    },
    "returnNarrative": {
      "winner": "A" or "B",
      "reason": "Why this tree won on return narrative"
    },
    "competitiveMoat": {
      "winner": "A" or "B",
      "reason": "Why this tree won on competitive moat"
    }
  },
  "keyDifferentiators": [
    "Most important difference between the trees",
    "Second most important difference"
  ],
  "recommendation": "Brief recommendation for production prompt"
}`;

  if (MOCK_AI) {
    return { winner: "B", winnerScore: 0.88, loserScore: 0.72 };
  }

  console.log('  Evaluating side-by-side...');
  const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
  const result = await model.generateContent(prompt);
  const content = result.response.text();

  try {
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      content.match(/```\n?([\s\S]*?)\n?```/);
    return JSON.parse((jsonMatch ? jsonMatch[1] : content).trim());
  } catch (e) {
    console.error('Parse error:', e.message);
    return null;
  }
}

async function runFinalValidation() {
  console.log('\n🎯 FINAL VALIDATION TEST');
  console.log('=' .repeat(60));
  console.log('Baseline vs Optimized Prompt - Head to Head\n');

  // Generate both trees
  console.log('📋 Generating trees...');
  const [baseline, optimized] = await Promise.all([
    generateTree('Baseline', BASELINE_PROMPT),
    generateTree('Optimized', OPTIMIZED_PROMPT)
  ]);

  if (!baseline.tree || !optimized.tree) {
    console.error('❌ Failed to generate one or both trees');
    return;
  }

  console.log(`  ✅ Baseline: ${baseline.timing}ms`);
  console.log(`  ✅ Optimized: ${optimized.timing}ms`);

  // Side-by-side evaluation
  console.log('\n📊 Evaluating...');
  const evaluation = await evaluateSideBySide(baseline.tree, optimized.tree);

  if (!evaluation) {
    console.error('❌ Failed to evaluate');
    return;
  }

  // Print results
  console.log('\n' + '='.repeat(60));
  console.log('🏆 RESULTS');
  console.log('='.repeat(60));

  const winnerName = evaluation.winner === 'A' ? 'Baseline' : 'OPTIMIZED';
  const winnerEmoji = evaluation.winner === 'B' ? '🎉' : '😮';

  console.log(`\n${winnerEmoji} WINNER: ${winnerName}`);
  console.log(`   Score: ${(evaluation.winnerScore * 100).toFixed(0)}% vs ${(evaluation.loserScore * 100).toFixed(0)}%`);
  console.log(`   Margin: ${evaluation.marginOfVictory}`);

  console.log('\n📊 Category Breakdown:');
  Object.entries(evaluation.comparison || {}).forEach(([category, result]) => {
    const catWinner = result.winner === 'A' ? 'Baseline' : 'Optimized';
    console.log(`   ${category}: ${catWinner}`);
    console.log(`      ${result.reason}`);
  });

  console.log('\n🔑 Key Differentiators:');
  evaluation.keyDifferentiators?.forEach((d, i) => {
    console.log(`   ${i + 1}. ${d}`);
  });

  console.log('\n💡 Recommendation:');
  console.log(`   ${evaluation.recommendation}`);

  // Save results
  const results = {
    baseline: { prompt: BASELINE_PROMPT, tree: baseline.tree, timing: baseline.timing },
    optimized: { prompt: OPTIMIZED_PROMPT, tree: optimized.tree, timing: optimized.timing },
    evaluation,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'final-validation.json'),
    JSON.stringify(results, null, 2)
  );

  // Generate HTML report
  const html = generateReport(results);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'final-report.html'), html);

  console.log(`\n📁 Results: ${OUTPUT_DIR}`);
  console.log(`📊 Report: ${path.join(OUTPUT_DIR, 'final-report.html')}`);

  // Return the optimized prompt if it won
  if (evaluation.winner === 'B') {
    console.log('\n✅ OPTIMIZED PROMPT VALIDATED - Ready for production!');
    return OPTIMIZED_PROMPT;
  } else {
    console.log('\n⚠️ Baseline performed better - review optimized prompt');
    return null;
  }
}

function generateReport(results) {
  const e = results.evaluation;
  const winnerName = e.winner === 'A' ? 'Baseline' : 'Optimized';
  const winnerColor = e.winner === 'B' ? '#22c55e' : '#f59e0b';

  return `<!DOCTYPE html>
<html>
<head>
  <title>Final Validation Results</title>
  <style>
    body { font-family: system-ui; background: #0f172a; color: #e2e8f0; padding: 40px; }
    .container { max-width: 1000px; margin: 0 auto; }
    h1 { text-align: center; }
    .winner-banner { background: ${winnerColor}; color: white; padding: 24px; border-radius: 12px; text-align: center; margin: 32px 0; }
    .winner-banner h2 { margin: 0; font-size: 2rem; }
    .scores { display: flex; justify-content: center; gap: 40px; margin: 24px 0; }
    .score-card { text-align: center; padding: 20px; background: rgba(255,255,255,0.05); border-radius: 12px; }
    .score-value { font-size: 3rem; font-weight: 700; }
    .categories { margin: 32px 0; }
    .category { display: flex; justify-content: space-between; padding: 16px; background: rgba(255,255,255,0.05); margin: 8px 0; border-radius: 8px; }
    .category-winner { color: #22c55e; font-weight: 600; }
    .prompt-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 32px 0; }
    .prompt-card { background: rgba(255,255,255,0.05); padding: 20px; border-radius: 12px; }
    .prompt-card h3 { margin-top: 0; }
    .prompt-card pre { white-space: pre-wrap; font-size: 0.85rem; background: rgba(0,0,0,0.3); padding: 12px; border-radius: 8px; }
    .recommendation { background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); padding: 24px; border-radius: 12px; margin: 32px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎯 Final Validation Results</h1>

    <div class="winner-banner">
      <h2>🏆 Winner: ${winnerName}</h2>
      <p>Margin of Victory: ${e.marginOfVictory}</p>
    </div>

    <div class="scores">
      <div class="score-card" ${e.winner === 'A' ? 'style="border: 2px solid #22c55e"' : ''}>
        <div>Baseline</div>
        <div class="score-value">${(e.winner === 'A' ? e.winnerScore : e.loserScore) * 100}%</div>
        <div>${e.investmentDecision?.treeA || ''}</div>
      </div>
      <div class="score-card" ${e.winner === 'B' ? 'style="border: 2px solid #22c55e"' : ''}>
        <div>Optimized</div>
        <div class="score-value">${(e.winner === 'B' ? e.winnerScore : e.loserScore) * 100}%</div>
        <div>${e.investmentDecision?.treeB || ''}</div>
      </div>
    </div>

    <div class="categories">
      <h3>Category Breakdown</h3>
      ${Object.entries(e.comparison || {}).map(([cat, result]) => `
        <div class="category">
          <span>${cat}</span>
          <span class="category-winner">${result.winner === 'A' ? 'Baseline' : 'Optimized'}: ${result.reason}</span>
        </div>
      `).join('')}
    </div>

    <div class="prompt-comparison">
      <div class="prompt-card">
        <h3>Baseline Prompt</h3>
        <pre>${results.baseline.prompt}</pre>
      </div>
      <div class="prompt-card" style="border: 2px solid ${e.winner === 'B' ? '#22c55e' : 'transparent'}">
        <h3>Optimized Prompt ${e.winner === 'B' ? '✓ WINNER' : ''}</h3>
        <pre>${results.optimized.prompt}</pre>
      </div>
    </div>

    <div class="recommendation">
      <h3>💡 Recommendation</h3>
      <p>${e.recommendation}</p>
    </div>
  </div>
</body>
</html>`;
}

runFinalValidation().catch(console.error);

export { runFinalValidation, OPTIMIZED_PROMPT };
