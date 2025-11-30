/**
 * Islanded Microgrid Data Center - Angel Investor CAPEX Scenario
 *
 * A startup fundraising scenario for testing CFO personas
 * optimized for angel investor pitch readiness.
 *
 * Key differentiators from generic CAPEX:
 * - Phased funding asks (Seed → Series A → Series B alignment)
 * - Clear milestones tied to funding tranches
 * - Risk/reward narrative for investors
 * - Competitive moat articulation
 * - Path to profitability story
 */

// The pitch: An islanded microgrid data center in rural South Dakota
export const microgridProjectText = `
PRAIRIE POWER COMPUTE - Islanded Microgrid Data Center

ELEVATOR PITCH:
We're building America's first fully islanded, renewable-powered edge data center in rural South Dakota. By combining cheap land, abundant wind/solar, and proximity to fiber backbones, we deliver enterprise-grade compute at 40% below hyperscaler pricing while achieving carbon-negative operations.

THE OPPORTUNITY:
- Hyperscaler pricing is unsustainable for AI/ML workloads ($3-5/kWh effective)
- Enterprise demand for sustainable compute growing 60% YoY
- Rural land + renewable energy = 70% lower operating costs
- SD tax incentives: No corporate income tax, property tax abatements

COMPETITIVE MOAT:
1. First-mover in SD renewable data center market
2. 20-year wind PPA at $0.018/kWh (vs $0.12 grid average)
3. Relationships with 3 Tier-1 fiber providers
4. Team includes ex-Google SRE and former wind farm developer

FUNDING REQUEST: $2.8M Seed Round

USE OF FUNDS:

Phase 1 - Site & Power Foundation ($800K) - Months 1-6
- Land acquisition: 40 acres in Brookings County ($120K)
- Site preparation and access roads ($80K)
- Wind turbine deposit (2x 2MW Vestas) - 50% down ($400K)
- Solar array materials for 500kW ground mount ($150K)
- Permits, environmental studies, interconnection ($50K)

Phase 2 - Energy Infrastructure ($1.2M) - Months 4-12
- Wind turbine installation and commissioning ($350K balance + $150K install)
- Solar array installation ($100K labor)
- Battery storage: 4MWh Tesla Megapack ($450K)
- Microgrid controller and switchgear ($100K)
- Grid interconnection (backup only) ($50K)

Phase 3 - Data Center Build ($600K) - Months 8-14
- Modular data center unit (Schneider prefab, 20 racks) ($300K)
- Cooling: Direct liquid cooling system for AI workloads ($120K)
- Network: Dual fiber connections to Sioux Falls IX ($80K)
- Security: Fencing, cameras, access control ($50K)
- Initial compute hardware (customer-funded via prepay) ($0 - capital light model)

Phase 4 - Operations & Scale ($200K) - Months 12-18
- Hiring: 2 FTE site operators ($120K annual)
- Marketing and sales ($40K)
- Working capital reserve ($40K)

KEY MILESTONES FOR INVESTORS:
M1 (Month 3): Land closed, permits in hand - Release Tranche 1
M2 (Month 6): Wind turbines on-site, PPA executed - Release Tranche 2
M3 (Month 10): First power generated, grid backup live - Release Tranche 3
M4 (Month 14): First customer live, revenue generating - Release Tranche 4
M5 (Month 18): Breakeven operations, Series A ready

FINANCIAL PROJECTIONS:
- Year 1 Revenue: $180K (3 anchor customers)
- Year 2 Revenue: $720K (expansion to 50 racks)
- Year 3 Revenue: $2.1M (second site, 150 total racks)
- Gross Margin: 65% (vs 35% traditional DC)
- Path to profitability: Month 18-20

RISKS & MITIGATIONS:
1. Wind variability → 4MWh battery buffer + grid backup
2. Customer acquisition → 2 LOIs signed, 1 term sheet
3. Construction delays → Modular/prefab approach, parallel workstreams
4. Regulatory → SD has streamlined permitting, no state income tax
5. Technology risk → Proven components (Vestas, Tesla, Schneider)

EXIT SCENARIOS:
- Strategic acquisition by hyperscaler seeking green credentials ($15-25M)
- Regional rollup play (5 sites → $50M+ valuation)
- Hold and distribute (30%+ cash-on-cash by Year 5)

TEAM:
- CEO: 15 years enterprise sales, built $40M ARR SaaS company
- CTO: Ex-Google SRE, designed 50MW data center cooling
- COO: Wind farm developer, 200MW deployed across Midwest

ASKING:
$2.8M Seed at $8M pre-money valuation
Minimum check: $50K | Lead investor: $500K+ (board seat)
`;

// Startup/Angel Investor Evaluation Rubric
export const angelInvestorRubric = {
  // Funding Story (30%): Clear ask, use of funds, milestone-gated tranches
  fundingStory: {
    weight: 0.30,
    description: "Clear funding ask with milestone-gated tranches that tell a compelling investment narrative",
    criteria: [
      "Total funding ask is clear and specific",
      "Phases align with natural funding tranches (Seed/A/B)",
      "Each phase has clear deliverables that de-risk the next",
      "Milestones are concrete, measurable, and time-bound",
      "Capital efficiency is evident (lean operations)"
    ],
    scoringGuide: {
      excellent: "Crystal clear funding story with milestone-gated tranches, obvious capital efficiency",
      good: "Clear funding phases but milestones could be sharper",
      acceptable: "Basic phase structure but funding narrative weak",
      poor: "No clear funding story, just a list of costs"
    }
  },

  // Risk Transparency (25%): Honest risk disclosure with credible mitigations
  riskTransparency: {
    weight: 0.25,
    description: "Honest risk disclosure with specific, credible mitigation strategies",
    criteria: [
      "Key risks are explicitly identified (not hidden)",
      "Each risk has a specific mitigation strategy",
      "Mitigations are credible and actionable",
      "Risks are prioritized by likelihood/impact",
      "Contingency planning is evident"
    ],
    scoringGuide: {
      excellent: "All major risks surfaced with credible, specific mitigations",
      good: "Most risks identified, mitigations reasonable",
      acceptable: "Some risks mentioned but mitigations vague",
      poor: "Risks ignored or hand-waved away"
    }
  },

  // Return Narrative (25%): Path to returns, exit scenarios, value creation
  returnNarrative: {
    weight: 0.25,
    description: "Compelling path to investor returns with credible projections",
    criteria: [
      "Revenue milestones are specific and time-bound",
      "Path to profitability is clear",
      "Unit economics are evident (margins, CAC, LTV implied)",
      "Exit scenarios are articulated",
      "Valuation justification is implicit in structure"
    ],
    scoringGuide: {
      excellent: "Clear path to 10x+ returns with credible milestones",
      good: "Good return story but some projections feel aggressive",
      acceptable: "Basic financial milestones but return path unclear",
      poor: "No clear path to returns, just costs"
    }
  },

  // Competitive Moat (20%): Why this team, why now, why defensible
  competitiveMoat: {
    weight: 0.20,
    description: "Clear articulation of competitive advantages and defensibility",
    criteria: [
      "First-mover or unique advantages are captured",
      "Team strengths are reflected in structure",
      "Barriers to entry are implicit",
      "Timing rationale (why now) is evident",
      "Sustainable advantages vs one-time benefits"
    ],
    scoringGuide: {
      excellent: "Strong moat narrative woven throughout structure",
      good: "Competitive advantages present but not emphasized",
      acceptable: "Generic structure, moat not differentiated",
      poor: "No competitive differentiation visible"
    }
  }
};

// Highly differentiated personas for angel investor pitch optimization
export const angelPersonas = {
  // Baseline: Current production persona
  currentProduction: {
    id: "current",
    name: "Current Production (Baseline)",
    prompt: "You are an experienced Project Manager and CFO with deep expertise in budget management, resource allocation, risk mitigation, and financial planning for complex projects.",
    hypothesis: "Generic PM/CFO framing may miss startup fundraising nuances"
  },

  // Persona 1: Angel Investor Whisperer
  angelWhisperer: {
    id: "angel-whisperer",
    name: "Angel Investor Whisperer",
    prompt: `You are a startup CFO who has raised $50M+ across 5 seed rounds. You think like an angel investor because you've been on both sides of the table.

Your philosophy:
- Every dollar has to tell a story toward the next milestone
- Risks aren't weaknesses—they're opportunities to show you've thought ahead
- Angels invest in narratives, not spreadsheets
- Milestone-gated tranches protect both founders and investors
- Show capital efficiency: prove you can do more with less

When structuring projects, you always:
1. Align phases with natural funding tranches
2. Put concrete, measurable milestones at phase boundaries
3. Show risks upfront with specific mitigations (builds trust)
4. Make the path to next funding round obvious
5. Highlight what makes this team uniquely positioned`,
    hypothesis: "Explicit angel mindset will produce more investable structures"
  },

  // Persona 2: Lean Startup CFO
  leanStartup: {
    id: "lean-startup",
    name: "Lean Startup CFO",
    prompt: `You are a CFO trained in lean startup methodology. Every expenditure must be validated against customer discovery and market feedback.

Your principles:
- Build → Measure → Learn applies to CAPEX too
- Each phase should test a key assumption before scaling
- Pivot points should be explicit in the structure
- Capital preservation is survival—extend runway at all costs
- Prove demand before building supply

Structure projects to:
1. Front-load validation activities (LOIs, pilots, customer commits)
2. Make each phase a hypothesis test with clear pass/fail criteria
3. Build in decision gates: "Continue/Pivot/Kill" milestones
4. Minimize irreversible commitments until assumptions validated
5. Show investors you'll fail fast and cheap if needed`,
    hypothesis: "Lean framing emphasizes validation and capital efficiency"
  },

  // Persona 3: Pitch Deck Architect
  pitchDeckArchitect: {
    id: "pitch-architect",
    name: "Pitch Deck Architect",
    prompt: `You are a startup advisor who has helped 100+ companies raise from angels. You structure projects the way the best pitch decks tell stories.

The pitch deck narrative structure:
1. Problem → Solution → Why Now → Market Size
2. Business Model → Traction → Team → Financials
3. The Ask → Use of Funds → Milestones → Vision

Apply this to CAPEX trees:
- Phase 1 = "Prove the problem is real" (validation)
- Phase 2 = "Prove we can solve it" (MVP/pilot)
- Phase 3 = "Prove it scales" (growth)
- Phase 4 = "Prove the returns" (profitability)

Every item should answer: "Why does this make the company more fundable?"
Every milestone should be: "This is what we'll show in the Series A deck"`,
    hypothesis: "Pitch narrative structure creates more compelling investor story"
  },

  // Persona 4: Risk-First CFO
  riskFirstCfo: {
    id: "risk-first",
    name: "Risk-First CFO",
    prompt: `You are a CFO who believes risk transparency is the ultimate trust builder with investors. You've seen too many startups hide risks and lose investor confidence.

Your approach:
- Lead with risks, not hide them—sophisticated investors will find them anyway
- Every risk needs a specific, credible mitigation (not hand-waving)
- Structure phases to systematically eliminate the biggest risks first
- De-risking milestones are more valuable than feature milestones
- Show investors you've stress-tested every assumption

When structuring:
1. Identify top 5 risks upfront and build mitigation into phase structure
2. Order phases by risk reduction (highest uncertainty first)
3. Include explicit "risk retired" milestones
4. Budget for contingencies (10-15% buffer)
5. Show what happens if key assumptions are wrong`,
    hypothesis: "Risk-forward framing builds investor trust and credibility"
  },

  // Persona 5: Returns-Obsessed CFO
  returnsObsessed: {
    id: "returns-obsessed",
    name: "Returns-Obsessed CFO",
    prompt: `You are a CFO who thinks like a fund manager calculating IRR. Every structure choice is evaluated against investor returns.

Your mental model:
- Angels need 10x+ returns to offset portfolio failures
- Time to liquidity matters as much as multiple
- Each milestone should increase company valuation
- Show the math: how does $1 invested become $10?
- Exit optionality is a feature, not an afterthought

Structure projects to:
1. Tie each phase to a valuation inflection point
2. Show revenue milestones that justify next-round pricing
3. Make exit scenarios explicit (acquisition targets, strategic buyers)
4. Demonstrate capital efficiency (revenue per $ invested)
5. Include "proof points" that drive up valuation multiples`,
    hypothesis: "Returns-focused framing aligns structure with investor incentives"
  },

  // Persona 6: Storyteller CFO
  storytellerCfo: {
    id: "storyteller",
    name: "Storyteller CFO",
    prompt: `You are a CFO who believes the best investment structures tell a story with a beginning, middle, and end. Data informs, but narrative persuades.

Your storytelling framework:
- Act 1 (Setup): Establish the opportunity and team credibility
- Act 2 (Confrontation): Show the hard work and risks overcome
- Act 3 (Resolution): Deliver the returns and scale vision

Structure principles:
1. Phase names should tell a story arc ("Foundation" → "Proof" → "Scale" → "Harvest")
2. Each phase should have a narrative hook (what's the exciting milestone?)
3. Risks are plot obstacles that heroes (team) overcome
4. Numbers support the narrative, not replace it
5. End with vision: where does this go after this funding?`,
    hypothesis: "Narrative structure creates emotional investor connection"
  }
};

// Key terms that should be preserved (investor-specific)
export const investorKeyTerms = [
  // Funding terms
  "Seed", "Series A", "tranche", "milestone", "valuation", "pre-money",
  // Financial metrics
  "ARR", "MRR", "gross margin", "CAC", "LTV", "runway", "burn rate",
  // Risk terms
  "mitigation", "contingency", "de-risk", "validated", "LOI",
  // Return terms
  "ROI", "IRR", "exit", "acquisition", "multiple", "liquidity",
  // Project specific
  "PPA", "microgrid", "islanded", "MWh", "kWh", "Vestas", "Megapack"
];

// Poor structure for comparison (what NOT to do)
export const poorInvestorStructure = {
  name: "Data Center Project",
  description: "Build a data center",
  children: [
    {
      name: "Phase 1",
      items: [
        { name: "Buy land", cost: 120000 },
        { name: "Get permits", cost: 50000 },
        { name: "Buy turbines", cost: 800000 }
      ]
    },
    {
      name: "Phase 2",
      items: [
        { name: "Install stuff", cost: 1000000 },
        { name: "Build building", cost: 500000 }
      ]
    },
    {
      name: "Phase 3",
      items: [
        { name: "Launch", cost: 200000 }
      ]
    }
  ]
};

export default {
  microgridProjectText,
  angelInvestorRubric,
  angelPersonas,
  investorKeyTerms,
  poorInvestorStructure
};
