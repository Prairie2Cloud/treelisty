# 🧠 AI Prompt Design Pattern

**Date**: <!-- add date -->  
**Feature**: Prompt-engineering specific pattern  
**Status**: ✅ Implemented

---

## Overview

The AI Prompt Design pattern turns TreeListy into a full prompt-engineering workbook. It supports both:
1. **Analysis/forensics** of imported prompts
2. **Forward synthesis** of multi-agent, multi-tool prompt systems.

### Hierarchy
| Level | Label | Example |
|-------|-------|---------|
| Root  | Prompt Workbook | “Customer Support Prompt Suite” |
| Phase | Stage | Research & Requirements, Drafting, Testing, Deployment |
| Item  | Prompt Module | System persona, tool-call template, evaluator, guardrail |
| Subtask | Prompt Step | Instruction variant, test case, hand-off detail |

---

## Phase Subtitles
1. Research & Requirements – user stories, context mapping, constraints
2. Prompt Drafting – system prompt, user template, tool schemas
3. Testing & Optimization – eval harness, A/B variants, safety probes
4. Deployment & Monitoring – rollout plan, telemetry reviews, retrain triggers

---

## Item Types
- **System Persona** – base system/front matter
- **User Prompt Template**
- **Tool / Function Call**
- **Agent Hand-off** – instructions when transferring control
- **Evaluator / Judge**
- **Safety / Guardrail**
- **Workflow Orchestration**
- **Test Dataset**

---

## Pattern-Specific Fields
| Field | Purpose |
|-------|---------|
| **Use Case** | RAG, Chain-of-Thought, Tool Invocation, etc. |
| **Target Model** | Specific LLM(s) tuned (Claude Sonnet, GPT-4, custom) |
| **Temperature / Max Tokens / Stop Sequences** | Generation controls |
| **Input Variables** | Slots / placeholders such as `{{user_context}}` |
| **Expected Output** | Schema, formatting, or deliverable description |
| **Evaluation Criteria** | Metrics for success (accuracy, tone, latency) |
| **Safety Considerations** | PII handling, bias concerns, jailbreak mitigations |
| **Hallucination Risks** | Known failure modes |
| **Prompt Examples** | Reference snippets (system/user/assistant) |
| **Test Status** | Idea → Drafted → Testing → Validated → Production |
| **Benchmark / Metrics** | Observed win rate, BLEU, latency, etc. |
| **Agent Hand-off Notes** | What gets passed to the next agent/tool |

Dependencies remain enabled so prompt modules can reference shared datasets or upstream instructions. PM tracking is on for Prompt Steps, allowing progress/status for test cases or iteration tickets.

---

## Suggested Templates
1. **Multi-Agent “Prompt Copilot”** – research agent, synthesis agent, evaluator.
2. **RAG Prompt Suite** – ingestion, retrieval, synthesis, judge.
3. **Safety Harness** – red-team prompts, guardrails, escalation workflow.

---

## AI Analysis Tips
- Quick Mode: convert a raw prompt spec into Stage → Module → Step structure.
- Deep Mode: read system/user messages, infer temperature, placeholders, risk notes.
- Add detection logic for fields like `inputs`, `evaluationCriteria`, `benchmarks` so analysis surfaces gaps.

---

## Future Enhancements
- Template library for common stacks (support workflow, sales-copilot, QA judge).
- Inline testing surface (hook to local eval harness).
- Visualization of agent hand-offs.

---

**Ready for prompt engineering workflows!** Write once, instrument everywhere. 🧠✨
