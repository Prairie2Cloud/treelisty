/**
 * Debate Mode Tests (Builds 427-431)
 *
 * Part 1: Presence tests - verify Debate Mode UI elements exist
 * Part 2: State and config tests - verify debate state structure
 * Part 3: Function presence tests - verify core functions exist
 * Part 4: Insight extraction tests - verify Add to Tree functionality
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Debate Mode (Builds 427-431)', () => {
    let htmlContent;

    beforeAll(() => {
        const htmlPath = resolve(__dirname, '../../../../treeplexity.html');
        htmlContent = readFileSync(htmlPath, 'utf-8');
    });

    // ========================================================================
    // PART 1: PRESENCE TESTS - UI Elements (Build 427)
    // ========================================================================

    describe('Presence - Debate Panel UI (Build 427)', () => {

        it('includes debate-panel element', () => {
            expect(htmlContent).toContain('id="debate-panel"');
        });

        it('has debate header with title and controls', () => {
            expect(htmlContent).toContain('class="debate-header"');
            expect(htmlContent).toContain('id="debate-title"');
            expect(htmlContent).toContain('id="debate-turn-counter"');
        });

        it('has debate body with transcript area', () => {
            expect(htmlContent).toContain('class="debate-body"');
            expect(htmlContent).toContain('id="debate-transcript"');
        });

        it('has debate input controls', () => {
            expect(htmlContent).toContain('id="debate-interject-input"');
            expect(htmlContent).toContain('id="debate-interject-btn"');
        });

        it('has debate action buttons', () => {
            expect(htmlContent).toContain('id="debate-next-turn-btn"');
            expect(htmlContent).toContain('id="debate-end-btn"');
            expect(htmlContent).toContain('id="debate-close-btn"');
            expect(htmlContent).toContain('id="debate-minimize-btn"');
        });

        it('has autoplay toggle', () => {
            expect(htmlContent).toContain('id="debate-autoplay"');
        });
    });

    describe('Presence - Debate Setup Modal (Build 427)', () => {

        it('includes debate-setup-modal element', () => {
            expect(htmlContent).toContain('id="debate-setup-modal"');
        });

        it('has persona selectors', () => {
            expect(htmlContent).toContain('id="debate-persona-a"');
            expect(htmlContent).toContain('id="debate-persona-b"');
        });

        it('has rounds selector', () => {
            expect(htmlContent).toContain('id="debate-rounds"');
        });

        it('has start and cancel buttons', () => {
            expect(htmlContent).toContain('id="debate-start-btn"');
            expect(htmlContent).toContain('id="debate-cancel-setup"');
        });

        it('has topic display area', () => {
            expect(htmlContent).toContain('id="debate-topic-display"');
        });
    });

    // ========================================================================
    // PART 2: DEBATE STYLES & ROLES (Build 430)
    // ========================================================================

    describe('Presence - Debate Styles (Build 430)', () => {

        it('has DEBATE_STYLES configuration object', () => {
            expect(htmlContent).toContain('const DEBATE_STYLES');
        });

        it('includes Scholar style', () => {
            expect(htmlContent).toContain('scholarly:');
            expect(htmlContent).toMatch(/scholarly:\s*\{[^}]*name:\s*['"]Scholar/);
        });

        it('includes Socratic style', () => {
            expect(htmlContent).toContain('socratic:');
        });

        it('includes Passionate style', () => {
            expect(htmlContent).toContain('passionate:');
        });

        it('includes Pragmatist style', () => {
            // Note: key is 'pragmatic', display name is 'Pragmatist'
            expect(htmlContent).toContain('pragmatic:');
        });
    });

    describe('Presence - Debate Roles (Build 430)', () => {

        it('has DEBATE_ROLES configuration object', () => {
            expect(htmlContent).toContain('const DEBATE_ROLES');
        });

        it('includes defender role', () => {
            expect(htmlContent).toContain('defender:');
        });

        it('includes challenger role', () => {
            expect(htmlContent).toContain('challenger:');
        });
    });

    describe('Presence - Debate States', () => {

        it('has DEBATE_STATES configuration object', () => {
            expect(htmlContent).toContain('const DEBATE_STATES');
        });

        it('includes required states', () => {
            expect(htmlContent).toContain("SETUP:");
            expect(htmlContent).toContain("ACTIVE:");
            expect(htmlContent).toContain("EXTRACTING:");
            expect(htmlContent).toContain("COMPLETED:");
        });
    });

    // ========================================================================
    // PART 3: FUNCTION PRESENCE TESTS
    // ========================================================================

    describe('Presence - Core Debate Functions', () => {

        it('has handleDebate function', () => {
            expect(htmlContent).toContain('function handleDebate()');
        });

        it('has showDebateSetup function', () => {
            expect(htmlContent).toContain('function showDebateSetup(');
        });

        it('has startDebate function', () => {
            // Build 859: startDebate now takes parameters (node, opponentType, persona)
            expect(htmlContent).toContain('async function startDebate(node');
        });

        it('has getNextDebateTurn function', () => {
            expect(htmlContent).toContain('function getNextDebateTurn(');
        });

        it('has handleDebateEnd function', () => {
            expect(htmlContent).toContain('function handleDebateEnd()');
        });

        it('has extractDebateInsights function', () => {
            expect(htmlContent).toContain('function extractDebateInsights()');
        });

        it('has addInsightsToTree function', () => {
            expect(htmlContent).toContain('function addInsightsToTree()');
        });

        it('has closeDebatePanel function', () => {
            expect(htmlContent).toContain('function closeDebatePanel()');
        });

        it('has initDebatePanel function', () => {
            expect(htmlContent).toContain('function initDebatePanel()');
        });
    });

    describe('Presence - Debate UI Functions', () => {

        it('has updateDebateTranscript function', () => {
            expect(htmlContent).toContain('function updateDebateTranscript()');
        });

        it('has updateDebateTurnCounter function', () => {
            expect(htmlContent).toContain('function updateDebateTurnCounter()');
        });

        it('has addDebateTurnLoading function', () => {
            expect(htmlContent).toContain('function addDebateTurnLoading(');
        });

        it('has handleDebateInterject function', () => {
            expect(htmlContent).toContain('function handleDebateInterject()');
        });

        it('has handleDebateNextTurn function', () => {
            expect(htmlContent).toContain('function handleDebateNextTurn()');
        });
    });

    describe('Presence - Debate Persistence Functions', () => {

        it('has saveDebateState function', () => {
            expect(htmlContent).toContain('function saveDebateState()');
        });

        it('has restoreDebateState function', () => {
            expect(htmlContent).toContain('function restoreDebateState()');
        });

        it('has DEBATE_STORAGE_KEY constant', () => {
            expect(htmlContent).toContain('DEBATE_STORAGE_KEY');
            expect(htmlContent).toContain('treelisty_debate_state');
        });
    });

    // ========================================================================
    // PART 4: ADD TO TREE FUNCTIONALITY (Build 431)
    // ========================================================================

    describe('Presence - Add to Tree Navigation (Build 431)', () => {

        it('addInsightsToTree expands parent node', () => {
            // Build 431: Parent node should be expanded
            expect(htmlContent).toMatch(/sourceNode\.expanded\s*=\s*true/);
        });

        it('addInsightsToTree scrolls to new content', () => {
            // Build 431: Should scroll to show newly added content
            // Uses containerNode.id to find element and scrollIntoView
            expect(htmlContent).toContain('scrollIntoView');
            expect(htmlContent).toContain('containerNode.id');
        });

        it('addInsightsToTree shows node name in toast', () => {
            // Build 431: Toast should show WHERE insights were added
            expect(htmlContent).toMatch(/showToast.*sourceNode\.name/s);
        });

        it('addInsightsToTree sets expanded on firstPhase for root node', () => {
            // When adding to root, first phase should expand
            expect(htmlContent).toMatch(/firstPhase\.expanded\s*=\s*true/);
        });
    });

    describe('Presence - Insight Types', () => {

        it('has insight type icons mapping', () => {
            expect(htmlContent).toContain('typeIcons');
            expect(htmlContent).toMatch(/pro:\s*['"][^'"]+['"]/);
            expect(htmlContent).toMatch(/con:\s*['"][^'"]+['"]/);
            expect(htmlContent).toMatch(/tension:\s*['"][^'"]+['"]/);
            expect(htmlContent).toMatch(/question:\s*['"][^'"]+['"]/);
        });

        it('has pattern-aware insight type mapping', () => {
            expect(htmlContent).toContain('getPatternItemType');
        });
    });

    // ========================================================================
    // PART 5: CSS PRESENCE TESTS
    // ========================================================================

    describe('Presence - Debate CSS', () => {

        it('has debate-panel CSS', () => {
            expect(htmlContent).toContain('#debate-panel');
        });

        it('has debate-turn CSS classes', () => {
            expect(htmlContent).toContain('.debate-turn');
            expect(htmlContent).toContain('.debate-turn.persona-a');
            expect(htmlContent).toContain('.debate-turn.persona-b');
            expect(htmlContent).toContain('.debate-turn.user');
        });

        it('has debate-setup-modal CSS', () => {
            expect(htmlContent).toContain('.debate-setup-modal');
        });

        it('has debate-insights-selection CSS', () => {
            expect(htmlContent).toContain('.debate-insights-selection');
            expect(htmlContent).toContain('.debate-insight-item');
        });

        it('has debate animation', () => {
            expect(htmlContent).toContain('debateSlideIn');
        });
    });

    // ========================================================================
    // PART 6: CONTEXT MENU INTEGRATION
    // ========================================================================

    describe('Presence - Context Menu Integration', () => {

        it('has ctx-debate menu item', () => {
            expect(htmlContent).toContain('id="ctx-debate"');
        });

        it('has Debate This Topic label', () => {
            expect(htmlContent).toContain('Debate This Topic');
        });

        it('attaches click handler to ctx-debate', () => {
            expect(htmlContent).toMatch(/ctx-debate.*onclick.*handleDebate|handleDebate.*ctx-debate/s);
        });
    });

    // ========================================================================
    // PART 7: DRAGGABLE PANEL (Build 429)
    // ========================================================================

    describe('Presence - Draggable Panel (Build 429)', () => {

        it('has initDebateDrag function', () => {
            expect(htmlContent).toContain('function initDebateDrag()');
        });

        it('debate header is draggable', () => {
            // The header should have cursor: move or grab styling
            expect(htmlContent).toMatch(/debate-header.*cursor:\s*(move|grab)/s);
        });
    });
});
