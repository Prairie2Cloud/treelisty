/**
 * Angel Investor Pitch A/B Test Runner
 *
 * Tests differentiated CFO personas for startup fundraising optimization.
 * Generates live-updating dashboard as tests complete.
 *
 * Usage:
 *   npm run test:angel-pitch           # Mock mode
 *   npm run test:angel-pitch:live      # Real API calls
 */

import dotenv from 'dotenv';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename_temp = fileURLToPath(import.meta.url);
const __dirname_temp = path.dirname(__filename_temp);
dotenv.config({ path: path.join(__dirname_temp, '../../.env') });

// Dynamic import for Gemini
let GoogleGenerativeAI;
try {
  const googleModule = await import('@google/generative-ai');
  GoogleGenerativeAI = googleModule.GoogleGenerativeAI;
} catch (e) {
  // Will be handled in key check
}

import {
  microgridProjectText,
  angelInvestorRubric,
  angelPersonas,
  investorKeyTerms
} from '../fixtures/microgrid-datacenter-scenario.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MOCK_AI = process.env.MOCK_AI !== 'false';
const OUTPUT_DIR = path.join(__dirname, '../../test-results/angel-investor-test');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Check for API keys
if (!MOCK_AI) {
  const missingKeys = [];
  if (!process.env.ANTHROPIC_API_KEY) missingKeys.push('ANTHROPIC_API_KEY');
  if (!process.env.GEMINI_API_KEY) missingKeys.push('GEMINI_API_KEY');

  if (missingKeys.length > 0) {
    console.error('\n❌ Missing API keys:', missingKeys.join(', '));
    process.exit(1);
  }
}

// Initialize API clients
const anthropic = !MOCK_AI ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;
const gemini = !MOCK_AI && GoogleGenerativeAI ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

/**
 * Build tree-listing prompt for angel investor context
 */
function buildAngelTreePrompt(persona) {
  return `${persona.prompt}

CONTEXT: You are helping a startup create an investor-ready CAPEX tree for angel investors.
The tree will be presented LIVE to investors during pitch meetings.

IMPORTANT: The tree shows CAPEX COSTS and FUNDING PHASES/SERIES - NOT the funding ask itself.
- The funding ask (valuation, check sizes, terms) goes in the verbal pitch, not the tree
- The tree shows: What we're building, what it costs, and which funding phase covers it
- Phases should align with funding series (Seed, Series A, etc.) so investors see what their money builds

CRITICAL REQUIREMENTS FOR INVESTOR-READY CAPEX TREE:
1. Structure phases around FUNDING SERIES (Seed Phase, Series A Phase, etc.)
2. Each phase shows the CAPEX items that funding series covers
3. Each phase must end with a concrete, measurable MILESTONE
4. Show RISKS explicitly with specific mitigations (builds trust)
5. Demonstrate CAPITAL EFFICIENCY - lean costs that build real value
6. Make it clear what each dollar buys

OUTPUT FORMAT (JSON only):
{
  "name": "Project Name",
  "description": "What we're building (elevator pitch style)",
  "children": [
    {
      "name": "Seed Phase: [What This Funding Builds]",
      "phaseNumber": 0,
      "subtitle": "Funding series this phase aligns with",
      "items": [
        {
          "name": "CAPEX Item Name",
          "description": "What this is and why it matters",
          "cost": 100000,
          "itemType": "Equipment|Infrastructure|Development|Validation",
          "dependencies": [],
          "notes": "Key context for investors"
        }
      ]
    },
    {
      "name": "Series A Phase: [What This Funding Builds]",
      "phaseNumber": 1,
      "subtitle": "Growth/scale infrastructure",
      "items": [...]
    }
  ]
}

KEY RULES:
- Every item MUST have a realistic cost (no $0 placeholders)
- Costs should sum to realistic project totals by phase
- Phase names should indicate funding series alignment
- Dependencies show logical build order
- itemType helps investors categorize spend

STARTUP PROJECT TO STRUCTURE:
${microgridProjectText}

Respond with ONLY valid JSON. Make it investor-ready for a live presentation.`;
}

/**
 * Build evaluation prompt for angel investor rubric
 */
function buildAngelEvaluationPrompt(treeJson, personaName) {
  return `You are an experienced angel investor evaluating a startup's CAPEX tree for investment readiness.

PERSONA TESTED: ${personaName}

EVALUATION RUBRIC (Angel Investor Perspective):
${JSON.stringify(angelInvestorRubric, null, 2)}

KEY INVESTOR TERMS THAT SHOULD BE PRESENT:
${investorKeyTerms.join(', ')}

CONTEXT: This is a $2.8M seed round for an islanded microgrid data center.
The tree will be presented LIVE to angel investors during pitch meetings.

TREE TO EVALUATE:
${JSON.stringify(treeJson, null, 2)}

EVALUATE from an angel investor perspective:
- Would you invest based on this structure?
- Is the funding story clear and compelling?
- Are risks honestly disclosed with credible mitigations?
- Is the path to returns obvious?
- Does it show capital efficiency and lean operations?

OUTPUT FORMAT (JSON only):
{
  "scores": {
    "fundingStory": 0.85,
    "riskTransparency": 0.75,
    "returnNarrative": 0.80,
    "competitiveMoat": 0.70
  },
  "overallScore": 0.78,
  "investmentDecision": "INVEST|PASS|MORE_INFO",
  "checkSize": "$100K (if investing)",
  "strengths": [
    "Specific strength for investors",
    "Another strength"
  ],
  "concerns": [
    "Specific investor concern",
    "Another concern"
  ],
  "questionsForFounders": [
    "Question an investor would ask",
    "Another question"
  ],
  "improvementSuggestions": [
    "How to make more investable"
  ]
}

Be critical but fair. Score honestly - differentiate between good and great.`;
}

/**
 * Generate tree using Claude
 */
async function generateTree(persona) {
  const prompt = buildAngelTreePrompt(persona);

  if (MOCK_AI) {
    console.log(`  [MOCK] Generating tree for ${persona.name}...`);
    await new Promise(r => setTimeout(r, 500)); // Simulate delay
    return {
      tree: getMockTree(persona.id),
      timing: 2000 + Math.random() * 1000,
      tokens: { input: 3000, output: 2000 }
    };
  }

  console.log(`  Generating tree for ${persona.name}...`);
  const startTime = Date.now();

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }]
    });

    const timing = Date.now() - startTime;
    const content = response.content[0].text;

    let tree;
    try {
      const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                        content.match(/```\n?([\s\S]*?)\n?```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : content;
      tree = JSON.parse(jsonStr.trim());
    } catch (e) {
      console.error(`  ⚠️ JSON parse error for ${persona.name}:`, e.message);
      tree = null;
    }

    return {
      tree,
      timing,
      tokens: {
        input: response.usage?.input_tokens || 0,
        output: response.usage?.output_tokens || 0
      },
      rawResponse: content
    };
  } catch (e) {
    console.error(`  ❌ API error for ${persona.name}:`, e.message);
    return { tree: null, timing: 0, tokens: { input: 0, output: 0 } };
  }
}

/**
 * Evaluate tree using Gemini
 */
async function evaluateTree(treeJson, personaName) {
  const prompt = buildAngelEvaluationPrompt(treeJson, personaName);

  if (MOCK_AI) {
    console.log(`  [MOCK] Evaluating ${personaName}...`);
    await new Promise(r => setTimeout(r, 300));
    return getMockEvaluation(personaName);
  }

  console.log(`  Evaluating ${personaName}...`);

  try {
    const model = gemini.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent(prompt);
    const content = result.response.text();

    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/) ||
                      content.match(/```\n?([\s\S]*?)\n?```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonStr.trim());
  } catch (e) {
    console.error(`  ⚠️ Evaluation error for ${personaName}:`, e.message);
    return null;
  }
}

/**
 * Mock tree generator with persona-specific variations
 */
function getMockTree(personaId) {
  const variations = {
    'angel-whisperer': { fundingStory: 0.92, riskTransparency: 0.88 },
    'lean-startup': { fundingStory: 0.85, riskTransparency: 0.82 },
    'pitch-architect': { fundingStory: 0.90, riskTransparency: 0.78 },
    'risk-first': { fundingStory: 0.80, riskTransparency: 0.95 },
    'returns-obsessed': { fundingStory: 0.88, riskTransparency: 0.75 },
    'storyteller': { fundingStory: 0.87, riskTransparency: 0.80 },
    'current': { fundingStory: 0.75, riskTransparency: 0.70 }
  };

  return {
    name: "Prairie Power Compute - Islanded Microgrid Data Center",
    description: "$2.8M Seed: America's first carbon-negative edge data center",
    fundingAsk: { amount: 2800000, valuation: "$8M pre-money" },
    children: [
      {
        name: "Phase 1: Foundation & Validation",
        phaseNumber: 0,
        fundingTranche: { amount: 800000, releaseCondition: "Land closed, permits secured" },
        items: [
          { name: "Land Acquisition", cost: 120000, itemType: "Task" },
          { name: "Permits & Environmental", cost: 50000, itemType: "Validation" },
          { name: "Wind Turbine Deposit", cost: 400000, itemType: "Task" }
        ],
        phaseMilestone: { name: "Site Ready", criteria: "Land + permits + deposits" }
      }
    ],
    _mockVariation: variations[personaId] || variations['current']
  };
}

/**
 * Mock evaluation with persona-specific scoring
 */
function getMockEvaluation(personaName) {
  // Create differentiated scores based on persona
  const baseScores = {
    'Angel Investor Whisperer': { fs: 0.92, rt: 0.88, rn: 0.85, cm: 0.82 },
    'Lean Startup CFO': { fs: 0.85, rt: 0.82, rn: 0.78, cm: 0.75 },
    'Pitch Deck Architect': { fs: 0.90, rt: 0.78, rn: 0.88, cm: 0.80 },
    'Risk-First CFO': { fs: 0.80, rt: 0.95, rn: 0.75, cm: 0.72 },
    'Returns-Obsessed CFO': { fs: 0.78, rt: 0.75, rn: 0.92, cm: 0.78 },
    'Storyteller CFO': { fs: 0.87, rt: 0.80, rn: 0.82, cm: 0.85 },
    'Current Production (Baseline)': { fs: 0.72, rt: 0.68, rn: 0.70, cm: 0.65 }
  };

  const scores = baseScores[personaName] || baseScores['Current Production (Baseline)'];
  const overall = scores.fs * 0.30 + scores.rt * 0.25 + scores.rn * 0.25 + scores.cm * 0.20;

  return {
    scores: {
      fundingStory: scores.fs,
      riskTransparency: scores.rt,
      returnNarrative: scores.rn,
      competitiveMoat: scores.cm
    },
    overallScore: overall,
    investmentDecision: overall > 0.82 ? "INVEST" : overall > 0.70 ? "MORE_INFO" : "PASS",
    checkSize: overall > 0.82 ? "$150K" : overall > 0.70 ? "$50K (minimum)" : "N/A",
    strengths: [
      "Clear milestone-gated funding structure",
      "Strong team credentials highlighted"
    ],
    concerns: [
      "Customer validation could be stronger",
      "Exit timeline ambitious"
    ],
    questionsForFounders: [
      "What's your backup if wind PPA falls through?",
      "How defensible is the first-mover advantage?"
    ],
    improvementSuggestions: [
      "Add more customer LOIs/commitments",
      "Detail competitive response scenarios"
    ]
  };
}

/**
 * Generate live-updating HTML dashboard
 */
function generateDashboard(results, isComplete = false) {
  const sorted = [...results].sort((a, b) =>
    (b.evaluation?.overallScore || 0) - (a.evaluation?.overallScore || 0)
  );

  const winner = sorted[0];
  const statusText = isComplete ? '✅ COMPLETE' : '🔄 RUNNING...';
  const statusColor = isComplete ? '#22c55e' : '#f59e0b';

  // Generate persona cards
  const personaCards = sorted.map((r, idx) => {
    const isWinner = idx === 0 && isComplete;
    const scores = r.evaluation?.scores || {};
    const overall = r.evaluation?.overallScore || 0;
    const decision = r.evaluation?.investmentDecision || 'PENDING';
    const decisionColor = decision === 'INVEST' ? '#22c55e' : decision === 'MORE_INFO' ? '#f59e0b' : '#ef4444';

    return `
      <div class="persona-card ${isWinner ? 'winner' : ''} ${r.status === 'running' ? 'running' : ''}">
        ${isWinner ? '<div class="winner-badge">🏆 BEST PERSONA</div>' : ''}
        ${r.status === 'running' ? '<div class="running-badge">⏳ Testing...</div>' : ''}
        <h3>${r.personaName}</h3>
        <p class="hypothesis">${r.hypothesis || ''}</p>

        <div class="overall-score">${(overall * 100).toFixed(0)}%</div>
        <div class="investment-decision" style="color: ${decisionColor}">${decision}</div>
        ${r.evaluation?.checkSize ? `<div class="check-size">Check: ${r.evaluation.checkSize}</div>` : ''}

        <div class="metrics">
          <div class="metric">
            <span class="metric-label">💰 Funding Story</span>
            <div class="metric-bar"><div class="metric-fill" style="width: ${(scores.fundingStory || 0) * 100}%; background: linear-gradient(90deg, #22c55e, #16a34a);"></div></div>
            <span class="metric-value">${((scores.fundingStory || 0) * 100).toFixed(0)}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">⚠️ Risk Transparency</span>
            <div class="metric-bar"><div class="metric-fill" style="width: ${(scores.riskTransparency || 0) * 100}%; background: linear-gradient(90deg, #f59e0b, #d97706);"></div></div>
            <span class="metric-value">${((scores.riskTransparency || 0) * 100).toFixed(0)}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">📈 Return Narrative</span>
            <div class="metric-bar"><div class="metric-fill" style="width: ${(scores.returnNarrative || 0) * 100}%; background: linear-gradient(90deg, #3b82f6, #2563eb);"></div></div>
            <span class="metric-value">${((scores.returnNarrative || 0) * 100).toFixed(0)}%</span>
          </div>
          <div class="metric">
            <span class="metric-label">🏰 Competitive Moat</span>
            <div class="metric-bar"><div class="metric-fill" style="width: ${(scores.competitiveMoat || 0) * 100}%; background: linear-gradient(90deg, #a855f7, #9333ea);"></div></div>
            <span class="metric-value">${((scores.competitiveMoat || 0) * 100).toFixed(0)}%</span>
          </div>
        </div>

        ${r.evaluation?.strengths ? `
          <div class="feedback">
            <div class="strengths">
              <h4>✅ Investor Strengths</h4>
              <ul>${r.evaluation.strengths.slice(0, 2).map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
            <div class="concerns">
              <h4>⚠️ Investor Concerns</h4>
              <ul>${(r.evaluation.concerns || []).slice(0, 2).map(c => `<li>${c}</li>`).join('')}</ul>
            </div>
          </div>
        ` : ''}

        <div class="timing">
          <span>⏱️ ${r.timing ? r.timing.toFixed(0) + 'ms' : '...'}</span>
          <span>🔤 ${r.tokens?.input || 0}/${r.tokens?.output || 0}</span>
        </div>
      </div>
    `;
  }).join('');

  // Winner analysis section (only show when complete)
  const winnerAnalysis = isComplete && winner?.evaluation ? `
    <div class="winner-analysis">
      <h2>🎯 Winning Prompt Analysis: ${winner.personaName}</h2>
      <div class="winner-details">
        <div class="prompt-extract">
          <h4>Key Prompt Elements That Worked:</h4>
          <pre>${winner.personaPrompt}</pre>
        </div>
        <div class="investor-questions">
          <h4>Questions Investors Would Ask:</h4>
          <ul>${(winner.evaluation.questionsForFounders || []).map(q => `<li>${q}</li>`).join('')}</ul>
        </div>
        <div class="improvements">
          <h4>Further Improvements:</h4>
          <ul>${(winner.evaluation.improvementSuggestions || []).map(s => `<li>${s}</li>`).join('')}</ul>
        </div>
      </div>
    </div>
  ` : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="${isComplete ? '999999' : '5'}">
  <title>Angel Investor Pitch A/B Test ${isComplete ? '- Complete' : '- Running'}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
      color: #e2e8f0;
      min-height: 100vh;
      padding: 40px 20px;
    }
    .container { max-width: 1600px; margin: 0 auto; }
    header {
      text-align: center;
      margin-bottom: 40px;
    }
    h1 {
      font-size: 2.5rem;
      background: linear-gradient(90deg, #22c55e, #3b82f6, #a855f7);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .status {
      display: inline-block;
      padding: 8px 20px;
      background: rgba(255,255,255,0.1);
      border-radius: 20px;
      color: ${statusColor};
      font-weight: 600;
      margin-bottom: 16px;
    }
    .subtitle {
      color: #94a3b8;
      font-size: 1.1rem;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
      gap: 24px;
      margin-bottom: 40px;
    }
    .persona-card {
      background: rgba(255,255,255,0.05);
      border-radius: 20px;
      padding: 28px;
      position: relative;
      border: 1px solid rgba(255,255,255,0.1);
      transition: all 0.3s ease;
    }
    .persona-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
    }
    .persona-card.winner {
      border: 2px solid #22c55e;
      box-shadow: 0 0 40px rgba(34, 197, 94, 0.3);
    }
    .persona-card.running {
      border-color: #f59e0b;
      animation: pulse 2s infinite;
    }
    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 20px rgba(245, 158, 11, 0.2); }
      50% { box-shadow: 0 0 40px rgba(245, 158, 11, 0.4); }
    }
    .winner-badge, .running-badge {
      position: absolute;
      top: -14px;
      right: 24px;
      padding: 8px 20px;
      border-radius: 20px;
      font-weight: 700;
      font-size: 13px;
    }
    .winner-badge {
      background: linear-gradient(90deg, #22c55e, #16a34a);
      color: white;
    }
    .running-badge {
      background: linear-gradient(90deg, #f59e0b, #d97706);
      color: white;
    }
    .persona-card h3 {
      font-size: 1.4rem;
      margin-bottom: 8px;
      color: #f8fafc;
    }
    .hypothesis {
      font-size: 0.85rem;
      color: #94a3b8;
      font-style: italic;
      margin-bottom: 20px;
      line-height: 1.4;
    }
    .overall-score {
      font-size: 4rem;
      font-weight: 800;
      background: linear-gradient(90deg, #22c55e, #3b82f6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      line-height: 1;
    }
    .investment-decision {
      font-size: 1.3rem;
      font-weight: 700;
      margin: 8px 0;
    }
    .check-size {
      color: #94a3b8;
      font-size: 0.95rem;
      margin-bottom: 20px;
    }
    .metrics { margin: 24px 0; }
    .metric {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    .metric-label {
      width: 160px;
      font-size: 0.9rem;
      color: #cbd5e1;
    }
    .metric-bar {
      flex: 1;
      height: 10px;
      background: rgba(255,255,255,0.1);
      border-radius: 5px;
      margin: 0 12px;
      overflow: hidden;
    }
    .metric-fill {
      height: 100%;
      border-radius: 5px;
      transition: width 0.5s ease;
    }
    .metric-value {
      width: 50px;
      text-align: right;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .feedback {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin: 20px 0;
      font-size: 0.85rem;
    }
    .strengths h4, .concerns h4 { margin-bottom: 8px; font-size: 0.9rem; }
    .strengths ul, .concerns ul { list-style: none; }
    .strengths li, .concerns li {
      margin-bottom: 6px;
      padding-left: 16px;
      position: relative;
      line-height: 1.4;
    }
    .strengths li::before { content: '✓'; position: absolute; left: 0; color: #22c55e; }
    .concerns li::before { content: '!'; position: absolute; left: 0; color: #f59e0b; }
    .timing {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #64748b;
      border-top: 1px solid rgba(255,255,255,0.1);
      padding-top: 16px;
      margin-top: 16px;
    }
    .winner-analysis {
      background: linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(59, 130, 246, 0.1));
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 20px;
      padding: 32px;
      margin-bottom: 40px;
    }
    .winner-analysis h2 {
      color: #22c55e;
      margin-bottom: 24px;
    }
    .winner-details {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 24px;
    }
    .winner-details h4 {
      margin-bottom: 12px;
      color: #94a3b8;
    }
    .prompt-extract pre {
      background: rgba(0,0,0,0.3);
      padding: 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      white-space: pre-wrap;
      line-height: 1.5;
      color: #e2e8f0;
    }
    .investor-questions ul, .improvements ul {
      list-style: none;
    }
    .investor-questions li, .improvements li {
      margin-bottom: 8px;
      padding-left: 20px;
      position: relative;
    }
    .investor-questions li::before { content: '❓'; position: absolute; left: 0; }
    .improvements li::before { content: '💡'; position: absolute; left: 0; }
    .test-info {
      text-align: center;
      color: #64748b;
      font-size: 0.85rem;
      margin-top: 40px;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🚀 Angel Investor Pitch A/B Test</h1>
      <div class="status">${statusText}</div>
      <p class="subtitle">Testing CFO personas for Prairie Power Compute - $2.8M Seed Round</p>
    </header>

    <div class="cards">
      ${personaCards}
    </div>

    ${winnerAnalysis}

    <p class="test-info">
      Last updated: ${new Date().toISOString()}<br>
      Mode: ${MOCK_AI ? 'MOCK' : 'LIVE API'} | Generator: Claude Sonnet 4 | Evaluator: Gemini 2.0 Flash<br>
      ${!isComplete ? 'Auto-refreshing every 5 seconds...' : 'Test complete - refresh stopped'}
    </p>
  </div>
</body>
</html>`;
}

/**
 * Save dashboard and results
 */
function saveDashboard(results, isComplete = false) {
  const dashboard = generateDashboard(results, isComplete);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'angel-pitch-dashboard.html'), dashboard);
  fs.writeFileSync(path.join(OUTPUT_DIR, 'angel-pitch-results.json'), JSON.stringify(results, null, 2));
}

/**
 * Main test runner
 */
async function runAngelInvestorTest() {
  console.log('\n🚀 Angel Investor Pitch A/B Test');
  console.log('=' .repeat(60));
  console.log(`Mode: ${MOCK_AI ? 'MOCK' : 'LIVE API'}`);
  console.log(`Project: Prairie Power Compute - Islanded Microgrid Data Center`);
  console.log(`Funding Ask: $2.8M Seed Round`);
  console.log('');

  // Select personas to test
  const personasToTest = Object.values(angelPersonas);
  console.log(`Testing ${personasToTest.length} personas...\n`);

  // Initialize results
  const results = personasToTest.map(p => ({
    personaKey: p.id,
    personaName: p.name,
    personaPrompt: p.prompt,
    hypothesis: p.hypothesis,
    status: 'pending',
    tree: null,
    evaluation: null,
    timing: null,
    tokens: null
  }));

  // Save initial dashboard
  saveDashboard(results);
  console.log(`📊 Dashboard: ${path.join(OUTPUT_DIR, 'angel-pitch-dashboard.html')}`);
  console.log('   (Auto-refreshes every 5 seconds)\n');

  // Open dashboard in browser
  const dashboardPath = path.join(OUTPUT_DIR, 'angel-pitch-dashboard.html');

  // Run tests sequentially with live updates
  for (let i = 0; i < personasToTest.length; i++) {
    const persona = personasToTest[i];
    console.log(`\n📋 [${i + 1}/${personasToTest.length}] Testing: ${persona.name}`);

    // Mark as running
    results[i].status = 'running';
    saveDashboard(results);

    // Generate tree
    const generation = await generateTree(persona);
    results[i].tree = generation.tree;
    results[i].timing = generation.timing;
    results[i].tokens = generation.tokens;

    if (!generation.tree) {
      console.log(`  ❌ Failed to generate tree`);
      results[i].status = 'failed';
      saveDashboard(results);
      continue;
    }

    // Evaluate tree
    const evaluation = await evaluateTree(generation.tree, persona.name);
    results[i].evaluation = evaluation;
    results[i].status = evaluation ? 'complete' : 'failed';

    if (evaluation) {
      const decision = evaluation.investmentDecision;
      const decisionEmoji = decision === 'INVEST' ? '💰' : decision === 'MORE_INFO' ? '🤔' : '❌';
      console.log(`  ✅ Score: ${(evaluation.overallScore * 100).toFixed(0)}% | ${decisionEmoji} ${decision}`);
    }

    // Update dashboard
    saveDashboard(results);
  }

  // Final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));

  const sorted = results
    .filter(r => r.evaluation)
    .sort((a, b) => b.evaluation.overallScore - a.evaluation.overallScore);

  sorted.forEach((r, idx) => {
    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '  ';
    const decision = r.evaluation.investmentDecision;
    console.log(`${medal} ${r.personaName}: ${(r.evaluation.overallScore * 100).toFixed(0)}% [${decision}]`);
  });

  // Save final dashboard
  saveDashboard(sorted, true);

  // Extract winning prompt features
  if (sorted.length > 0) {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 WINNING PROMPT ANALYSIS');
    console.log('='.repeat(60));
    console.log(`Winner: ${sorted[0].personaName}`);
    console.log(`Score: ${(sorted[0].evaluation.overallScore * 100).toFixed(0)}%`);
    console.log(`Investment Decision: ${sorted[0].evaluation.investmentDecision}`);
    console.log('\nKey Prompt Elements:');
    console.log(sorted[0].personaPrompt);
  }

  console.log(`\n📁 Results: ${OUTPUT_DIR}`);
  console.log(`📊 Dashboard: ${dashboardPath}`);

  return sorted;
}

// Run if called directly
runAngelInvestorTest().catch(console.error);

export { runAngelInvestorTest };
