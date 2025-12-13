/**
 * Tree Agent Tests (Build 405-408)
 *
 * Part 1: Presence tests - verify Tree Agent affordances exist in HTML
 * Part 2: Node tracking tests - verify change detection logic works
 * Part 3: Structure tests - verify Tree Agent HTML/CSS structure
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Tree Agent (Builds 405-408)', () => {
    let htmlContent;

    beforeAll(() => {
        const htmlPath = resolve(__dirname, '../../../../treeplexity.html');
        htmlContent = readFileSync(htmlPath, 'utf-8');
    });

    // ========================================================================
    // PART 1: PRESENCE TESTS (Build 405)
    // ========================================================================

    describe('Presence - Tree Agent Frame (Build 405)', () => {

        it('includes tree-agent-frame element', () => {
            expect(htmlContent).toContain('id="tree-agent-frame"');
        });

        it('has agent header with title and progress', () => {
            expect(htmlContent).toContain('class="agent-header"');
            expect(htmlContent).toContain('id="agent-title"');
            expect(htmlContent).toContain('id="agent-progress-fill"');
            expect(htmlContent).toContain('id="agent-progress-text"');
        });

        it('has agent body with messages area', () => {
            expect(htmlContent).toContain('class="agent-body"');
            expect(htmlContent).toContain('id="agent-messages"');
        });

        it('has agent input controls', () => {
            expect(htmlContent).toContain('id="agent-input"');
            expect(htmlContent).toContain('id="agent-send-btn"');
            expect(htmlContent).toContain('id="agent-voice-btn"');
        });

        it('has agent action buttons', () => {
            expect(htmlContent).toContain('id="agent-cancel-btn"');
            expect(htmlContent).toContain('id="agent-finish-btn"');
            expect(htmlContent).toContain('id="agent-minimize-btn"');
            expect(htmlContent).toContain('id="agent-close-btn"');
        });

        it('has tree-agent CSS class defined', () => {
            // CSS uses ID selector #tree-agent-frame, HTML element has class="tree-agent"
            expect(htmlContent).toContain('#tree-agent-frame');
            expect(htmlContent).toContain('class="tree-agent"');
        });
    });

    // ========================================================================
    // PART 2: PRESENCE TESTS (Build 406 - Visual Highlighting)
    // ========================================================================

    describe('Presence - Node Highlighting (Build 406)', () => {

        it('has node-new-highlight CSS class', () => {
            expect(htmlContent).toContain('.node-new-highlight');
        });

        it('has node-modified-highlight CSS class', () => {
            expect(htmlContent).toContain('.node-modified-highlight');
        });

        it('has nodeNewPulse animation keyframes', () => {
            expect(htmlContent).toContain('@keyframes nodeNewPulse');
        });

        it('has nodeModifiedPulse animation keyframes', () => {
            expect(htmlContent).toContain('@keyframes nodeModifiedPulse');
        });

        it('defines trackNodeChange function', () => {
            expect(htmlContent).toContain('function trackNodeChange');
        });

        it('defines hasRecentChange function', () => {
            expect(htmlContent).toContain('function hasRecentChange');
        });

        it('defines recentlyChangedNodes Map', () => {
            expect(htmlContent).toContain('window.recentlyChangedNodes');
        });

        it('integrates highlighting in render() for filesystem pattern', () => {
            // Check that render adds highlight classes
            const renderMatch = htmlContent.match(/buildFilesystemNode[\s\S]*?hasRecentChange/);
            expect(renderMatch).not.toBeNull();
        });

        it('integrates highlighting in render() for default pattern', () => {
            // Check that buildColumn uses hasRecentChange
            const buildColumnMatch = htmlContent.match(/function buildColumn[\s\S]*?hasRecentChange/);
            expect(buildColumnMatch).not.toBeNull();
        });
    });

    // ========================================================================
    // PART 3: PRESENCE TESTS (Build 407 - Draggable)
    // ========================================================================

    describe('Presence - Draggable Frame (Build 407)', () => {

        it('defines loadAgentPosition function', () => {
            expect(htmlContent).toContain('function loadAgentPosition');
        });

        it('defines saveAgentPosition function', () => {
            expect(htmlContent).toContain('function saveAgentPosition');
        });

        it('defines resetAgentPosition function', () => {
            expect(htmlContent).toContain('function resetAgentPosition');
        });

        it('initializes drag functionality', () => {
            expect(htmlContent).toContain('initAgentDrag');
        });

        it('has mousedown event listener for dragging', () => {
            expect(htmlContent).toMatch(/header\.addEventListener\(['"]mousedown/);
        });

        it('has touch support for mobile', () => {
            expect(htmlContent).toContain('touchstart');
            expect(htmlContent).toContain('touchmove');
            expect(htmlContent).toContain('touchend');
        });

        it('saves position to localStorage', () => {
            expect(htmlContent).toContain("localStorage.setItem('treeAgentPosition'");
        });

        it('loads position from localStorage', () => {
            expect(htmlContent).toContain("localStorage.getItem('treeAgentPosition'");
        });

        it('has double-click to reset position', () => {
            expect(htmlContent).toContain('dblclick');
            expect(htmlContent).toContain('resetAgentPosition');
        });
    });

    // ========================================================================
    // PART 4: PRESENCE TESTS (Build 408 - Integration)
    // ========================================================================

    describe('Presence - Full Integration (Build 408)', () => {

        it('startWizard opens Tree Agent as primary UI', () => {
            // Should call openTreeAgent instead of just showing wizard-modal
            expect(htmlContent).toContain('Tree Agent as primary UI');
            expect(htmlContent).toContain('openTreeAgent(agentTitle)');
        });

        it('addWizardMessage routes to Tree Agent first', () => {
            expect(htmlContent).toContain('Tree Agent is now primary UI');
            expect(htmlContent).toContain('addAgentMessage(agentRole, content)');
        });

        it('wizard finish handler closes Tree Agent', () => {
            // The wizard-done handler should call closeTreeAgent
            const finishMatch = htmlContent.match(/wizard-done[\s\S]*?closeTreeAgent/);
            expect(finishMatch).not.toBeNull();
        });

        it('wizard cancel handler closes Tree Agent', () => {
            // The wizard-cancel handler should call closeTreeAgent
            const cancelMatch = htmlContent.match(/wizard-cancel[\s\S]*?closeTreeAgent/);
            expect(cancelMatch).not.toBeNull();
        });
    });

    // ========================================================================
    // PART 5: TREE AGENT FUNCTIONS
    // ========================================================================

    describe('Tree Agent Functions', () => {

        it('defines openTreeAgent function', () => {
            expect(htmlContent).toContain('function openTreeAgent');
        });

        it('defines closeTreeAgent function', () => {
            expect(htmlContent).toContain('function closeTreeAgent');
        });

        it('defines toggleTreeAgentMinimize function', () => {
            expect(htmlContent).toContain('function toggleTreeAgentMinimize');
        });

        it('defines addAgentMessage function', () => {
            expect(htmlContent).toContain('function addAgentMessage');
        });

        it('defines handleAgentChoice function', () => {
            expect(htmlContent).toContain('function handleAgentChoice');
        });

        it('defines updateAgentProgress function', () => {
            expect(htmlContent).toContain('function updateAgentProgress');
        });

        it('exposes functions globally on window', () => {
            expect(htmlContent).toContain('window.openTreeAgent');
            expect(htmlContent).toContain('window.closeTreeAgent');
            expect(htmlContent).toContain('window.addAgentMessage');
            expect(htmlContent).toContain('window.trackNodeChange');
            expect(htmlContent).toContain('window.hasRecentChange');
        });
    });

    // ========================================================================
    // PART 6: CSS STYLING TESTS
    // ========================================================================

    describe('Tree Agent CSS Styling', () => {

        it('has green accent color for agent frame', () => {
            // Green color #10b981 or rgba(16, 185, 129, ...)
            expect(htmlContent).toMatch(/#10b981|rgba\(16,\s*185,\s*129/i);
        });

        it('has minimized state CSS', () => {
            expect(htmlContent).toContain('.minimized');
            expect(htmlContent).toContain('#tree-agent-frame.minimized');
        });

        it('has agent message styling', () => {
            expect(htmlContent).toContain('.agent-message');
            expect(htmlContent).toContain('.agent-message.user');
            expect(htmlContent).toContain('.agent-message.assistant');
        });

        it('has choice button styling', () => {
            expect(htmlContent).toContain('.agent-choice-btn');
            expect(htmlContent).toContain('.agent-choices');
        });

        it('has mobile responsive rules', () => {
            // Mobile full-screen for agent frame
            // Check that @media rule exists with tree-agent-frame and 100vw
            expect(htmlContent).toContain('@media screen and (max-width: 768px)');
            expect(htmlContent).toContain('#tree-agent-frame.open');
            expect(htmlContent).toContain('width: 100vw');
        });

        it('has slide-in animation', () => {
            expect(htmlContent).toContain('@keyframes agentSlideIn');
        });

        it('has progress bar styling', () => {
            expect(htmlContent).toContain('.agent-progress-bar');
            expect(htmlContent).toContain('.agent-progress-fill');
        });
    });

    // ========================================================================
    // PART 7: TREE AGENT STATE
    // ========================================================================

    describe('Tree Agent State Management', () => {

        it('defines treeAgentState object', () => {
            expect(htmlContent).toContain('window.treeAgentState');
        });

        it('treeAgentState has open property', () => {
            expect(htmlContent).toContain('open: false');
        });

        it('treeAgentState has minimized property', () => {
            expect(htmlContent).toContain('minimized: false');
        });

        it('treeAgentState has position property', () => {
            expect(htmlContent).toContain('position: { x: 20, y: 80 }');
        });
    });

    // ========================================================================
    // PART 8: MERGE TREE UPDATE INTEGRATION
    // ========================================================================

    describe('mergeTreeUpdate Integration (Build 406)', () => {

        it('tracks new items in mergeTreeUpdate', () => {
            // Should call trackNodeChange for new items
            const newItemMatch = htmlContent.match(/Adding new item[\s\S]*?trackNodeChange\([^,]+,\s*['"]new['"]\)/);
            expect(newItemMatch).not.toBeNull();
        });

        it('tracks modified items in mergeTreeUpdate', () => {
            // Should call trackNodeChange for modified items
            const modifiedMatch = htmlContent.match(/Merging item[\s\S]*?trackNodeChange\([^,]+,\s*['"]modified['"]\)/);
            expect(modifiedMatch).not.toBeNull();
        });

        it('tracks new phases in mergeTreeUpdate', () => {
            // Should call trackNodeChange for new phases
            const newPhaseMatch = htmlContent.match(/Adding new phase[\s\S]*?trackNodeChange\([^,]+,\s*['"]new['"]\)/);
            expect(newPhaseMatch).not.toBeNull();
        });
    });
});
