# Meta-Prompt Research Findings

## Executive Summary

**Research Goal**: Improve philosophical depth scores through meta-prompting techniques

**Baseline Performance**: 88% overall (Meno 87%, Descartes 90%)

**Best Technique Found**: **Structured Scholar** - 93% overall (+4.7%)
- Meno: 94% (+7%)
- Descartes: 92% (+2%)

---

## Research Methodology

### Phase 1: A/B Testing of Meta-Prompting Techniques

Tested 6 distinct prompting techniques across 2 philosophical texts:

| Technique | Description | Meno | Descartes | Avg | vs Baseline |
|-----------|-------------|------|-----------|-----|-------------|
| Baseline | Current production prompt | 87% | 90% | 88% | — |
| Socratic Prompting | 10 classical principles | 88% | 86% | 87% | -0.8% |
| Chain-of-Reasoning | Hypothesis-driven inquiry | 82% | 83% | 82% | -5.9% |
| Tree of Thoughts | Multiple reasoning paths | 84% | 85% | 85% | -3.5% |
| Metacognitive | 5-stage self-monitoring | 84% | 84% | 84% | -4.2% |
| Multi-Persona | Historian/Logician/Critic | 83% | 87% | 85% | -2.9% |

**Finding**: None of the "creative" meta-prompting techniques outperformed the baseline.

### Phase 2: Hybrid Techniques

Created 4 hybrid approaches combining insights from Phase 1:

| Technique | Description | Meno | Descartes | Avg | vs Baseline |
|-----------|-------------|------|-----------|-----|-------------|
| **Structured Scholar** | Academic format with mandatory citations | **94%** | **92%** | **93%** | **+4.7%** |
| Argument First | Prioritize logical structure | 90% | 89% | 89% | +1.3% |
| Baseline+ | Baseline + Socratic elements | 90% | 88% | 89% | +1.0% |
| Critical Depth | Emphasis on objections | 89% | 89% | 89% | +0.9% |

**Finding**: The **Structured Scholar** technique achieved significant improvement.

---

## Detailed Analysis by Tier

### Tier 1: Argument Reconstruction (40% weight)

| Technique | Meno | Descartes | Avg |
|-----------|------|-----------|-----|
| Structured Scholar | 90% | 90% | 90% |
| Argument First | 95% | 90% | 92.5% |
| Baseline+ | 88% | 90% | 89% |
| Baseline | 83% | 88% | 85.5% |

**Best for Tier 1**: Argument First (+7% vs baseline)

### Tier 2: Philosophical Contextualization (30% weight)

| Technique | Meno | Descartes | Avg |
|-----------|------|-----------|-----|
| Structured Scholar | 95% | 95% | 95% |
| Critical Depth | 95% | 95% | 95% |
| Baseline | 98% | 95% | 96.5% |

**Finding**: Baseline already strong here; marginal differences.

### Tier 3: Critical Apparatus (30% weight)

| Technique | Meno | Descartes | Avg |
|-----------|------|-----------|-----|
| **Structured Scholar** | **98%** | **90%** | **94%** |
| Critical Depth | 88% | 93% | 90.5% |
| Baseline | 80% | 88% | 84% |

**Best for Tier 3**: Structured Scholar (+10% vs baseline)

---

## Key Insights

### What Works

1. **Explicit Citation Requirements**
   - Demanding "at least 3 specific scholars" forces the model to retrieve concrete names
   - Example instruction: "Cite at least 3 specific scholars who have written on this text"

2. **Academic Framing**
   - "You are preparing a graduate seminar handout" primes scholarly rigor
   - Creates expectation of depth and precision

3. **Mandatory Named Objections**
   - Requiring "[Objection name] by [Philosopher]" format ensures specificity
   - Generic "there are objections" gets replaced with "Lichtenberg's objection"

4. **Structured Output Requirements**
   - Explicit sections for STANDARD OBJECTIONS, SECONDARY LITERATURE
   - Forces model to address these categories even if not naturally inclined

### What Doesn't Work

1. **Complex Multi-Step Reasoning Chains**
   - Chain-of-Reasoning and Metacognitive prompting added overhead without benefit
   - Explicit reasoning steps didn't improve output quality

2. **Multiple Reasoning Paths (Tree of Thoughts)**
   - Generating and evaluating multiple interpretations diluted focus
   - Single focused interpretation with depth > multiple shallow interpretations

3. **Role-Playing Multiple Personas**
   - Multi-Persona approach fragmented the analysis
   - Better to have one coherent scholarly voice

4. **Socratic Principles in Isolation**
   - Applying 10 Socratic principles was too abstract
   - Works better when integrated into concrete output requirements

---

## Recommended Prompt Structure

Based on findings, the optimal philosophy prompt should:

```
1. ACADEMIC FRAMING
   "You are preparing a graduate seminar handout..."

2. EXPLICIT CITATION REQUIREMENTS
   - "Cite at least 3 specific scholars with works"
   - "Name at least 2 standard objections with sources"

3. STRUCTURED SECTIONS
   - Argument Reconstruction
   - Contextualization
   - Critical Apparatus (with mandatory subsections)

4. SPECIFIC OUTPUT FORMAT
   - Metadata must include: secondarySources, standardObjections, tradition
   - Each item should have itemType from defined vocabulary
```

---

## Winning Prompt: Structured Scholar

```javascript
`You are preparing a graduate seminar handout on this philosophical text.
Your analysis must meet ACADEMIC STANDARDS.

## SCHOLARLY REQUIREMENTS

Your output must include:
1. **NAMED SECONDARY SOURCES**: Cite at least 3 specific scholars who have
   written on this text (e.g., "Vlastos (1991)", "Williams (1978)")
2. **STANDARD OBJECTIONS**: Name specific objections with their associated
   philosophers (e.g., "Lichtenberg's objection: it thinks, not I think")
3. **TRADITION PLACEMENT**: Identify the specific school of thought
4. **ARGUMENT FORMALIZATION**: State the argument in premise-conclusion form

[... rest of prompt ...]
`
```

---

## Next Steps

1. **Update Production Prompts**
   - Integrate Structured Scholar elements into `treeplexity.html`
   - Add explicit citation requirements to philosophy pattern

2. **Further Testing**
   - Test on additional philosophical texts (Kant, Aristotle, Hume)
   - Verify improvements generalize beyond Meno/Descartes

3. **Consider Tiered Approach**
   - Use Argument First for Tier 1 optimization
   - Use Structured Scholar for Tier 3 optimization
   - Combine best elements

---

## Test Artifacts

- A/B Test Dashboard: `test-results/metaprompt-ab/ab-test-dashboard.html`
- Hybrid Test Dashboard: `test-results/hybrid-prompts/hybrid-test-dashboard.html`
- Philosophy Depth Dashboard: `test-results/philosophy-depth/philosophy-depth-dashboard.html`
- Full Results: `test-results/*/all-results.json`

---

*Generated: 2025-11-29*
*Treelisty v2.10.0 Build 166*
