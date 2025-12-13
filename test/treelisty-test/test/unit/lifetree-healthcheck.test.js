/**
 * LifeTree Health Check Tests (Build 392+)
 *
 * Part 1: Presence tests - verify affordances exist in treeplexity.html
 * Part 2: Functional tests - verify detection/fix logic works correctly
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Import functional test utilities
import {
    cleanLifeTree,
    lifeTreeWithEmptyPhases,
    lifeTreeWithRedundantPeriods,
    lifeTreeWithChronologyIssues,
    lifeTreeWithSparseEvents,
    lifeTreeWithMultipleIssues,
    detectEmptyPhases,
    detectRedundantPeriods,
    detectChronologyIssues,
    detectSparseEvents,
    runHealthCheck,
    deletePhase,
    consolidatePhases,
    fixChronology
} from '../fixtures/lifetree-fixtures.js';
import { cloneTree } from '../fixtures/trees.js';

// ============================================================================
// PART 1: PRESENCE TESTS (verify affordances exist in HTML)
// ============================================================================

describe('LifeTree Health Check - Presence (Build 392)', () => {
    let htmlContent;

    beforeAll(() => {
        const htmlPath = resolve(__dirname, '../../../../treeplexity.html');
        htmlContent = readFileSync(htmlPath, 'utf-8');
    });

    it('includes TreeBeard health check command trigger', () => {
        const hasHealthCheckTrigger = /health check/i.test(htmlContent);
        expect(hasHealthCheckTrigger).toBe(true);
    });

    it('exposes prioritized LifeTree fix actions', () => {
        expect(htmlContent).toContain('🧹 Pri 1: Consolidate Legacy');
        expect(htmlContent).toContain('🔄 Pri 2: Fix Order');
    });

    it('supports delete_phase action hook for health fixes', () => {
        const deletePhaseMatch = htmlContent.match(/delete_phase/);
        expect(deletePhaseMatch).not.toBeNull();
    });

    it('registers lifetree_health_check in COMMAND_REGISTRY', () => {
        expect(htmlContent).toContain("'lifetree_health_check'");
    });

    it('registers supplementary fix commands', () => {
        expect(htmlContent).toContain("'lifetree_consolidate_legacy'");
        expect(htmlContent).toContain("'lifetree_fix_chronology'");
        expect(htmlContent).toContain("'lifetree_fill_empty'");
        expect(htmlContent).toContain("'lifetree_enrich_sparse'");
    });

    it('has intent detection for health check requests', () => {
        expect(htmlContent).toContain('needsHealthCheck');
    });
});

// ============================================================================
// PART 2: FUNCTIONAL TESTS (verify detection logic works)
// ============================================================================

describe('LifeTree Health Check - Detection Logic', () => {

    describe('detectEmptyPhases()', () => {

        it('returns empty array for clean tree', () => {
            const result = detectEmptyPhases(cleanLifeTree);
            expect(result).toEqual([]);
        });

        it('detects phases with no items', () => {
            const result = detectEmptyPhases(lifeTreeWithEmptyPhases);
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('phase-empty');
            expect(result[0].name).toContain('Missing Years');
        });

        it('handles tree with no children', () => {
            const result = detectEmptyPhases({ id: 'root' });
            expect(result).toEqual([]);
        });

        it('handles null items array', () => {
            const tree = {
                children: [
                    { id: 'p1', name: 'Phase', items: null }
                ]
            };
            const result = detectEmptyPhases(tree);
            expect(result).toHaveLength(1);
        });
    });

    describe('detectRedundantPeriods()', () => {

        it('returns empty array for clean tree', () => {
            const result = detectRedundantPeriods(cleanLifeTree);
            expect(result).toEqual([]);
        });

        it('detects phases with duplicate names', () => {
            const result = detectRedundantPeriods(lifeTreeWithRedundantPeriods);
            expect(result).toHaveLength(1);
            expect(result[0].name).toBe('childhood');
            expect(result[0].phases).toHaveLength(2);
        });

        it('normalizes names by stripping date parentheses', () => {
            const tree = {
                children: [
                    { id: 'p1', name: 'Youth (1990-2000)', items: [{}] },
                    { id: 'p2', name: 'Youth (2000-2010)', items: [{}] }
                ]
            };
            const result = detectRedundantPeriods(tree);
            expect(result).toHaveLength(1);
            expect(result[0].phases).toHaveLength(2);
        });

        it('is case-insensitive', () => {
            const tree = {
                children: [
                    { id: 'p1', name: 'Childhood', items: [{}] },
                    { id: 'p2', name: 'CHILDHOOD', items: [{}] }
                ]
            };
            const result = detectRedundantPeriods(tree);
            expect(result).toHaveLength(1);
        });
    });

    describe('detectChronologyIssues()', () => {

        it('returns empty array for clean tree', () => {
            const result = detectChronologyIssues(cleanLifeTree);
            expect(result).toEqual([]);
        });

        it('detects out-of-order phases by event date', () => {
            const result = detectChronologyIssues(lifeTreeWithChronologyIssues);
            expect(result).toHaveLength(1);
            expect(result[0].issue).toContain('earlier than previous');
        });

        it('handles phases without dates gracefully', () => {
            const tree = {
                children: [
                    { id: 'p1', name: 'Phase 1', items: [{}] },
                    { id: 'p2', name: 'Phase 2', items: [{}] }
                ]
            };
            const result = detectChronologyIssues(tree);
            expect(result).toEqual([]);
        });

        it('extracts years from various date formats', () => {
            const tree = {
                children: [
                    { id: 'p1', name: 'P1', items: [{ eventDate: '2020' }] },
                    { id: 'p2', name: 'P2', items: [{ eventDate: 'March 15, 1990' }] } // Earlier!
                ]
            };
            const result = detectChronologyIssues(tree);
            expect(result).toHaveLength(1);
        });
    });

    describe('detectSparseEvents()', () => {

        it('returns empty array for well-populated tree', () => {
            const result = detectSparseEvents(cleanLifeTree);
            expect(result).toEqual([]);
        });

        it('detects items missing required fields', () => {
            const result = detectSparseEvents(lifeTreeWithSparseEvents);
            expect(result).toHaveLength(1);
            expect(result[0].missing).toContain('eventDate');
            expect(result[0].missing).toContain('description');
        });

        it('includes phase context in results', () => {
            const result = detectSparseEvents(lifeTreeWithSparseEvents);
            expect(result[0].phase).toContain('Childhood');
        });
    });

    describe('runHealthCheck()', () => {

        it('reports healthy for clean tree', () => {
            const report = runHealthCheck(cleanLifeTree);
            expect(report.isHealthy()).toBe(true);
        });

        it('reports unhealthy for tree with issues', () => {
            const report = runHealthCheck(lifeTreeWithMultipleIssues);
            expect(report.isHealthy()).toBe(false);
        });

        it('aggregates all issue types', () => {
            const report = runHealthCheck(lifeTreeWithMultipleIssues);
            expect(report.emptyPhases.length).toBeGreaterThan(0);
            expect(report.redundantPeriods.length).toBeGreaterThan(0);
            expect(report.chronologyIssues.length).toBeGreaterThan(0);
            expect(report.sparseEvents.length).toBeGreaterThan(0);
        });
    });
});

// ============================================================================
// PART 3: FUNCTIONAL TESTS (verify fix actions work)
// ============================================================================

describe('LifeTree Health Check - Fix Actions', () => {

    describe('deletePhase()', () => {

        it('removes phase from tree', () => {
            const tree = JSON.parse(JSON.stringify(lifeTreeWithEmptyPhases));
            const initialCount = tree.children.length;

            const result = deletePhase(tree, 'phase-empty');

            expect(result).toBe(true);
            expect(tree.children.length).toBe(initialCount - 1);
            expect(tree.children.find(p => p.id === 'phase-empty')).toBeUndefined();
        });

        it('returns false for non-existent phase', () => {
            const tree = JSON.parse(JSON.stringify(cleanLifeTree));
            const result = deletePhase(tree, 'does-not-exist');
            expect(result).toBe(false);
        });

        it('handles tree without children', () => {
            const result = deletePhase({ id: 'root' }, 'any');
            expect(result).toBe(false);
        });
    });

    describe('consolidatePhases()', () => {

        it('merges items from duplicate phases into first', () => {
            const tree = JSON.parse(JSON.stringify(lifeTreeWithRedundantPeriods));
            const redundant = detectRedundantPeriods(tree)[0];
            const firstPhase = redundant.phases[0];
            const initialItemCount = firstPhase.items.length;

            consolidatePhases(tree, redundant.phases);

            // First phase should have items from both
            expect(firstPhase.items.length).toBeGreaterThan(initialItemCount);
            // Second phase should be deleted
            expect(tree.children.find(p => p.id === 'phase-childhood-2')).toBeUndefined();
        });

        it('returns count of consolidated phases', () => {
            const tree = JSON.parse(JSON.stringify(lifeTreeWithRedundantPeriods));
            const redundant = detectRedundantPeriods(tree)[0];

            const count = consolidatePhases(tree, redundant.phases);

            expect(count).toBe(1); // One phase merged into another
        });

        it('handles single-phase group gracefully', () => {
            const count = consolidatePhases({ children: [] }, [{ id: 'single' }]);
            expect(count).toBe(0);
        });
    });

    describe('fixChronology()', () => {

        it('reorders phases by earliest event date', () => {
            const tree = JSON.parse(JSON.stringify(lifeTreeWithChronologyIssues));

            // Before fix: Youth (2015) comes before Childhood (1990)
            expect(tree.children[0].name).toContain('Youth');

            fixChronology(tree);

            // After fix: Childhood (1990) should come first
            expect(tree.children[0].name).toContain('Childhood');
        });

        it('updates phase indices after reorder', () => {
            const tree = JSON.parse(JSON.stringify(lifeTreeWithChronologyIssues));

            fixChronology(tree);

            tree.children.forEach((phase, index) => {
                expect(phase.phase).toBe(index);
            });
        });

        it('handles phases without dates', () => {
            const tree = {
                children: [
                    { id: 'p1', name: 'A', items: [] },
                    { id: 'p2', name: 'B', items: [{ eventDate: '2000' }] }
                ]
            };

            // Should not throw
            expect(() => fixChronology(tree)).not.toThrow();
        });
    });
});

// ============================================================================
// PART 4: INTEGRATION TESTS (full workflow)
// ============================================================================

describe('LifeTree Health Check - Integration', () => {

    it('can detect and fix all issues in problematic tree', () => {
        const tree = JSON.parse(JSON.stringify(lifeTreeWithMultipleIssues));

        // Initial health check
        let report = runHealthCheck(tree);
        expect(report.isHealthy()).toBe(false);

        // Fix 1: Delete empty phases
        for (const phase of report.emptyPhases) {
            deletePhase(tree, phase.id);
        }

        // Fix 2: Consolidate redundant periods
        report = runHealthCheck(tree); // Re-check after deletions
        for (const group of report.redundantPeriods) {
            consolidatePhases(tree, group.phases);
        }

        // Fix 3: Fix chronology
        fixChronology(tree);

        // After fixes, empty phases and redundant periods should be resolved
        const finalReport = runHealthCheck(tree);
        expect(finalReport.emptyPhases).toHaveLength(0);
        expect(finalReport.redundantPeriods).toHaveLength(0);
        expect(finalReport.chronologyIssues).toHaveLength(0);
    });

    it('clean tree remains unchanged after fix attempts', () => {
        const tree = JSON.parse(JSON.stringify(cleanLifeTree));
        const originalJson = JSON.stringify(tree);

        // Run fixes on clean tree
        const report = runHealthCheck(tree);
        for (const phase of report.emptyPhases) {
            deletePhase(tree, phase.id);
        }
        fixChronology(tree);

        // Tree should be structurally unchanged (only phase indices might update)
        expect(tree.children.length).toBe(cleanLifeTree.children.length);
        expect(runHealthCheck(tree).isHealthy()).toBe(true);
    });
});
