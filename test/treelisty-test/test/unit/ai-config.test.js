/**
 * AI Configuration Tests
 * 
 * Tests for AI settings, persona tuning, and dialectic mode.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { 
    defaultAIConfig, 
    dialecticAIConfig, 
    criticalAIConfig,
    cloneTree,
    complexTree
} from '../fixtures/trees.js';

// Import from extracted module
import { 
    getAIConfig, 
    applyPersonaTuning,
    setCapexTree,
    createTestTree
} from '../treelisty-core.js';

describe('AI Configuration', () => {
    
    beforeEach(() => {
        // Reset tree state before each test
        setCapexTree(createTestTree());
    });

    describe('getAIConfig()', () => {
        
        it('should return default config when tree has no aiConfig', () => {
            setCapexTree(createTestTree({ aiConfig: undefined }));
            
            const config = getAIConfig();
            
            expect(config.tone).toBe('neutral');
            expect(config.verbosity).toBe('concise');
            expect(config.creativity).toBe(0.5);
            expect(config.dialecticMode).toBe(false);
            expect(config.customInstructions).toBe('');
        });

        it('should return default config when aiConfig is empty object', () => {
            setCapexTree(createTestTree({ aiConfig: {} }));
            
            const config = getAIConfig();
            
            expect(config.tone).toBe('neutral');
            expect(config.dialecticMode).toBe(false);
        });

        it('should merge saved config with defaults', () => {
            setCapexTree(createTestTree({
                aiConfig: {
                    tone: 'critical',
                    dialecticMode: true
                    // Missing: verbosity, creativity, customInstructions
                }
            }));
            
            const config = getAIConfig();
            
            // Overridden values
            expect(config.tone).toBe('critical');
            expect(config.dialecticMode).toBe(true);
            
            // Default values
            expect(config.verbosity).toBe('concise');
            expect(config.creativity).toBe(0.5);
            expect(config.customInstructions).toBe('');
        });

        it('should preserve all custom config values', () => {
            const tree = cloneTree(complexTree);
            setCapexTree(tree);
            
            const config = getAIConfig();
            
            expect(config.tone).toBe('critical');
            expect(config.dialecticMode).toBe(true);
            expect(config.customInstructions).toBe('Be thorough');
        });

        it('should handle creativity as number', () => {
            setCapexTree(createTestTree({
                aiConfig: { creativity: 0.8 }
            }));
            
            const config = getAIConfig();
            
            expect(config.creativity).toBe(0.8);
            expect(typeof config.creativity).toBe('number');
        });
    });

    describe('applyPersonaTuning()', () => {
        const basePrompt = 'You are an expert project manager.';

        // Helper to set up tree with specific AI config
        function setupAIConfig(config) {
            setCapexTree(createTestTree({ aiConfig: config }));
        }

        describe('tone injection', () => {
            it('should not modify prompt for neutral tone', () => {
                setupAIConfig(defaultAIConfig);
                const tuned = applyPersonaTuning(basePrompt);

                // May contain verbosity tuning but not tone
                expect(tuned).not.toContain('Red Team');
                expect(tuned).not.toContain('Socratic');
                expect(tuned).not.toContain('high-energy');
            });

            it('should inject critical tone', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    tone: 'critical'
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).toContain('Red Team');
                expect(tuned).toContain('Challenge assumptions');
            });

            it('should inject socratic tone', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    tone: 'socratic'
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).toContain('probing questions');
            });

            it('should inject enthusiastic tone', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    tone: 'enthusiastic'
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).toContain('high-energy');
                expect(tuned).toContain('encouraging');
            });
        });

        describe('verbosity injection', () => {
            it('should inject concise style', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    verbosity: 'concise'
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).toContain('brief');
            });

            it('should inject verbose style', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    verbosity: 'verbose'
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).toContain('thorough');
                expect(tuned).toContain('detailed');
            });

            it('should not inject for balanced verbosity', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    verbosity: 'balanced'
                });
                const tuned = applyPersonaTuning(basePrompt);

                // Should only have base prompt (maybe with dialectic if enabled)
                expect(tuned).not.toContain('brief');
                expect(tuned).not.toContain('thorough');
            });
        });

        describe('dialectic mode', () => {
            it('should inject dialectic prompt when enabled', () => {
                setupAIConfig(dialecticAIConfig);
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).toContain('DIALECTIC MODE');
            });

            it('should require identifying assumptions', () => {
                setupAIConfig(dialecticAIConfig);
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned.toLowerCase()).toContain('assumption');
            });

            it('should require counter-argument', () => {
                setupAIConfig(dialecticAIConfig);
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned.toLowerCase()).toContain('counter-argument');
            });

            it('should not inject dialectic when disabled', () => {
                setupAIConfig(defaultAIConfig);
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).not.toContain('DIALECTIC');
            });

            it('should work with other settings combined', () => {
                setupAIConfig(criticalAIConfig);
                const tuned = applyPersonaTuning(basePrompt);

                // Should have both critical tone and dialectic mode
                expect(tuned).toContain('Red Team');
                expect(tuned).toContain('DIALECTIC');
            });
        });

        describe('custom instructions', () => {
            it('should inject custom instructions', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    customInstructions: 'Always use TypeScript examples'
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).toContain('Always use TypeScript examples');
            });

            it('should not inject empty custom instructions', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    customInstructions: ''
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).not.toContain('USER PRIORITY');
            });

            it('should not inject whitespace-only instructions', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    customInstructions: '   \n  '
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).not.toContain('USER PRIORITY');
            });

            it('should mark custom instructions as priority', () => {
                setupAIConfig({
                    ...defaultAIConfig,
                    customInstructions: 'Test instruction'
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).toContain('PRIORITY');
            });
        });

        describe('prompt composition', () => {
            it('should prepend tuning to base prompt', () => {
                setupAIConfig(criticalAIConfig);
                const tuned = applyPersonaTuning(basePrompt);

                // Base prompt should still be present
                expect(tuned).toContain(basePrompt);

                // Tuning should come before base prompt
                const tuningIndex = tuned.indexOf('ROLE ADAPTATION');
                const baseIndex = tuned.indexOf(basePrompt);
                expect(tuningIndex).toBeLessThan(baseIndex);
            });

            it('should return base prompt unchanged when no tuning needed', () => {
                setupAIConfig({
                    tone: 'neutral',
                    verbosity: 'balanced',
                    creativity: 0.5,
                    dialecticMode: false,
                    customInstructions: ''
                });
                const tuned = applyPersonaTuning(basePrompt);

                expect(tuned).toBe(basePrompt);
            });

            it('should handle empty base prompt', () => {
                setupAIConfig(criticalAIConfig);
                const tuned = applyPersonaTuning('');

                expect(tuned).toContain('Red Team');
            });
        });
    });
});
