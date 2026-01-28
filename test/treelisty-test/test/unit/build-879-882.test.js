/**
 * Build 879-882 Composition Features Tests
 *
 * Tests for:
 * - Build 879: Cross-Tree Block References
 * - Build 880: HTML Export with Block Refs
 * - Build 881: Clone Views
 * - Build 882: Agent-Authored Macros (CommandTelemetry, MacroManager.createFromCommands)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Read source to extract and test functions
const htmlPath = resolve(__dirname, '../../../../treeplexity.html');
const htmlContent = readFileSync(htmlPath, 'utf-8');

describe('Build 879: Cross-Tree Block References', () => {

    it('should have resolveBlockRef function defined', () => {
        expect(htmlContent).toContain('function resolveBlockRef(');
    });

    it('resolveBlockRef should handle local refs (no colon)', () => {
        // Verify the function checks for colon to distinguish local vs cross-tree
        const match = htmlContent.match(/function resolveBlockRef\(refId\)\s*\{([\s\S]*?)\n\s{8}\}/);
        expect(match).not.toBeNull();
        const body = match[1];
        // Should check for colon
        expect(body).toContain("includes(':')");
        // Should call findNodeDeep for local refs
        expect(body).toContain('findNodeDeep');
    });

    it('resolveBlockRef should handle cross-tree refs (with colon)', () => {
        const match = htmlContent.match(/function resolveBlockRef\(refId\)\s*\{([\s\S]*?)\n\s{8}\}/);
        expect(match).not.toBeNull();
        const body = match[1];
        // Cross-tree should split on colon
        expect(body).toContain("split(':')");
        // Should reference TreeRegistry
        expect(body).toContain('TreeRegistry');
    });

    it('renderBlockRefs should support cross-tree ref syntax with colon', () => {
        // The regex in renderBlockRefs should accept colons in refIds
        const refRegex = htmlContent.match(/renderBlockRefs[\s\S]*?\(\(([^)]*)\)\)/);
        expect(refRegex).not.toBeNull();
        // Look for the updated regex pattern that accepts colons
        expect(htmlContent).toContain('a-zA-Z0-9_:-');
    });

    it('should have block-ref-external CSS class', () => {
        expect(htmlContent).toContain('.block-ref-external');
    });

    it('block-ref-external should use teal color scheme', () => {
        // Teal distinguishes cross-tree from local purple
        const cssMatch = htmlContent.match(/\.block-ref-external\s*\{([^}]+)\}/);
        expect(cssMatch).not.toBeNull();
        const css = cssMatch[1];
        // Should contain teal/turquoise color values
        expect(css).toMatch(/0,\s*1[5-9][0-9]|0,\s*2[0-5][0-9]/); // teal range
    });

    it('navigateToBlockRef should handle cross-tree navigation with consent', () => {
        // Article III: consent before switching trees
        const navMatch = htmlContent.match(/function navigateToBlockRef[\s\S]*?confirm\(/);
        expect(navMatch).not.toBeNull();
    });
});

describe('Build 880: HTML Export with Block Refs', () => {

    it('should have resolveBlockRefsForExport function', () => {
        expect(htmlContent).toContain('function resolveBlockRefsForExport(');
    });

    it('resolveBlockRefsForExport should produce anchor links for local refs', () => {
        const match = htmlContent.match(/function resolveBlockRefsForExport[\s\S]*?(?=function\s)/);
        expect(match).not.toBeNull();
        const body = match[0];
        // Local refs should become <a href="#node-...">
        expect(body).toContain('href="#node-');
    });

    it('resolveBlockRefsForExport should produce styled text for cross-tree refs', () => {
        const match = htmlContent.match(/function resolveBlockRefsForExport[\s\S]*?(?=function\s)/);
        expect(match).not.toBeNull();
        const body = match[0];
        // Cross-tree refs should become non-clickable spans
        expect(body).toContain('tl-block-ref-ext');
    });

    it('resolveBlockRefsForExport should handle broken refs', () => {
        const match = htmlContent.match(/function resolveBlockRefsForExport[\s\S]*?(?=function\s)/);
        expect(match).not.toBeNull();
        const body = match[0];
        expect(body).toContain('tl-block-ref-broken');
    });

    it('export template should include block ref CSS', () => {
        // The exported HTML template should have .tl-block-ref styles
        expect(htmlContent).toContain('.tl-block-ref');
        expect(htmlContent).toContain('.tl-block-ref-ext');
        expect(htmlContent).toContain('.tl-block-ref-broken');
    });

    it('exported nodes should have anchor IDs', () => {
        // Nodes in export should have id="node-..." for anchor linking
        const exportMatch = htmlContent.match(/exportAsStandaloneHTML[\s\S]*?node-\$\{/);
        expect(exportMatch).not.toBeNull();
    });
});

describe('Build 881: Clone Views', () => {

    it('should have createViewTree function', () => {
        expect(htmlContent).toContain('function createViewTree(');
    });

    it('createViewTree should set origin.kind to view', () => {
        const match = htmlContent.match(/function createViewTree[\s\S]*?(?=function\s)/);
        expect(match).not.toBeNull();
        const body = match[0];
        expect(body).toContain("kind: 'view'");
    });

    it('createViewTree should use CloneRegistry.createClone', () => {
        const match = htmlContent.match(/function createViewTree[\s\S]*?(?=function\s)/);
        expect(match).not.toBeNull();
        expect(match[0]).toContain('CloneRegistry.createClone');
    });

    it('createViewTree should save clone index to localStorage', () => {
        const match = htmlContent.match(/function createViewTree[\s\S]*?(?=function\s)/);
        expect(match).not.toBeNull();
        expect(match[0]).toContain('treelisty-clone-index');
    });

    it('should have showCreateViewModal function', () => {
        expect(htmlContent).toContain('function showCreateViewModal(');
    });

    it('context menu should have Create View option', () => {
        expect(htmlContent).toContain('Create View');
    });

    it('should have view-tree-badge CSS class', () => {
        expect(htmlContent).toContain('.view-tree-badge');
    });

    it('should detect view trees by origin.kind', () => {
        // Header should check for origin.kind === 'view'
        expect(htmlContent).toContain("origin.kind === 'view'");
    });
});

describe('Build 882: Agent-Authored Macros', () => {

    describe('CommandTelemetry', () => {
        it('should have CommandTelemetry object defined', () => {
            expect(htmlContent).toContain('const CommandTelemetry');
        });

        it('should have record method', () => {
            expect(htmlContent).toContain('record: function(command');
        });

        it('should have getRecent method', () => {
            expect(htmlContent).toContain('getRecent: function(');
        });

        it('should have getSequences method for pattern detection', () => {
            expect(htmlContent).toContain('getSequences: function(');
        });

        it('should have clear method', () => {
            // Must be explicitly clearable (Article V)
            const telemetryMatch = htmlContent.match(/CommandTelemetry[\s\S]*?clear:\s*function/);
            expect(telemetryMatch).not.toBeNull();
        });

        it('should NOT persist to localStorage (Article V: Anti-Enframing)', () => {
            // CommandTelemetry should be in-memory only
            const telemetrySection = htmlContent.match(/const CommandTelemetry[\s\S]*?window\.CommandTelemetry/);
            expect(telemetrySection).not.toBeNull();
            const body = telemetrySection[0];
            expect(body).not.toContain('localStorage');
        });

        it('should be exposed on window for MCP access', () => {
            expect(htmlContent).toContain('window.CommandTelemetry = CommandTelemetry');
        });

        it('should have max buffer size of 100', () => {
            expect(htmlContent).toContain('_maxSize: 100');
        });
    });

    describe('MacroManager.createFromCommands', () => {
        it('should have createFromCommands method', () => {
            expect(htmlContent).toContain('createFromCommands:');
        });

        it('createFromCommands should include provenance metadata', () => {
            const match = htmlContent.match(/createFromCommands[\s\S]*?provenance/);
            expect(match).not.toBeNull();
        });

        it('should default to ai_generated source', () => {
            const match = htmlContent.match(/createFromCommands[\s\S]*?ai_generated/);
            expect(match).not.toBeNull();
        });
    });

    describe('AI Provenance Badge', () => {
        it('should show provenance badge for AI-generated macros', () => {
            expect(htmlContent).toContain('ai-provenance-badge');
        });

        it('should have ai-provenance-badge CSS', () => {
            expect(htmlContent).toContain('.ai-provenance-badge');
        });
    });

    describe('Command Telemetry Integration', () => {
        it('should record commands in dispatch flow', () => {
            // CommandTelemetry.record should be called when commands execute
            expect(htmlContent).toContain('CommandTelemetry.record');
        });
    });
});
