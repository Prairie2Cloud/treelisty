/**
 * AI Model Provider Tests (Build 392+)
 *
 * Part 1: Presence tests - verify model options exist in HTML
 * Part 2: Structure tests - verify MODEL_DEFINITIONS structure is correct
 * Part 3: Wiring tests - verify provider selection flows correctly
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Model Providers', () => {
    let htmlContent;
    let modelDefinitions;

    beforeAll(() => {
        const htmlPath = resolve(__dirname, '../../../../treeplexity.html');
        htmlContent = readFileSync(htmlPath, 'utf-8');

        // Extract MODEL_DEFINITIONS from HTML for structural testing
        const modelDefMatch = htmlContent.match(/const\s+MODEL_DEFINITIONS\s*=\s*(\{[\s\S]*?\n\s*\});/);
        if (modelDefMatch) {
            try {
                // Clean up for eval (this is safe for test purposes only)
                const cleanDef = modelDefMatch[1]
                    .replace(/\/\/.*$/gm, '') // Remove comments
                    .replace(/,(\s*[}\]])/g, '$1'); // Remove trailing commas
                modelDefinitions = eval('(' + cleanDef + ')');
            } catch (e) {
                modelDefinitions = null;
            }
        }
    });

    // ========================================================================
    // PART 1: PRESENCE TESTS
    // ========================================================================

    describe('Presence (Build 392)', () => {

        it('includes GPT-5.2 options in the dropdown', () => {
            expect(htmlContent).toContain('value="user-gpt52-pro"');
            expect(htmlContent).toContain('value="user-gpt52"');
            expect(htmlContent).toContain('value="user-gpt52-chat"');
        });

        it('documents GPT-5.2 models in provider definitions', () => {
            expect(htmlContent).toContain('GPT-5.2 Pro (Dec 2025)');
            expect(htmlContent).toContain('GPT-5.2 (Dec 2025)');
            expect(htmlContent).toContain('GPT-5.2 Chat');
        });

        it('includes all major provider families', () => {
            // Claude models
            expect(htmlContent).toContain('claude-sonnet');
            expect(htmlContent).toContain('claude-opus');

            // Gemini models
            expect(htmlContent).toContain('gemini-2');

            // GPT models
            expect(htmlContent).toContain('gpt-4');
            expect(htmlContent).toContain('gpt-5');
        });
    });

    // ========================================================================
    // PART 2: STRUCTURE TESTS
    // ========================================================================

    describe('MODEL_DEFINITIONS Structure', () => {

        it('extracts MODEL_DEFINITIONS successfully', () => {
            expect(modelDefinitions).not.toBeNull();
            expect(typeof modelDefinitions).toBe('object');
        });

        it('GPT-5.2 Pro has required fields', () => {
            const model = modelDefinitions?.['user-gpt52-pro'];
            expect(model).toBeDefined();
            expect(model.provider).toBe('openai');
            expect(model.model).toBe('gpt-5.2-pro');
            expect(model.modelId).toBe('gpt-5.2-pro');
            expect(model.useServerKey).toBe(false);
            expect(model.description).toContain('GPT-5.2 Pro');
        });

        it('GPT-5.2 base has required fields', () => {
            const model = modelDefinitions?.['user-gpt52'];
            expect(model).toBeDefined();
            expect(model.provider).toBe('openai');
            expect(model.model).toBe('gpt-5.2');
            expect(model.modelId).toBe('gpt-5.2');
        });

        it('GPT-5.2 Chat has required fields', () => {
            const model = modelDefinitions?.['user-gpt52-chat'];
            expect(model).toBeDefined();
            expect(model.provider).toBe('openai');
            expect(model.model).toBe('gpt-5.2-chat-latest');
            expect(model.modelId).toBe('gpt-5.2-chat-latest');
        });

        it('all GPT-5.2 models use openai provider', () => {
            const gpt52Models = Object.entries(modelDefinitions || {})
                .filter(([key]) => key.includes('gpt52'));

            expect(gpt52Models.length).toBeGreaterThanOrEqual(3);

            for (const [key, model] of gpt52Models) {
                expect(model.provider).toBe('openai');
            }
        });

        it('all models have consistent structure', () => {
            const requiredFields = ['provider', 'model', 'modelId', 'useServerKey', 'description'];

            for (const [key, model] of Object.entries(modelDefinitions || {})) {
                for (const field of requiredFields) {
                    expect(model[field], `${key} missing ${field}`).toBeDefined();
                }
            }
        });
    });

    // ========================================================================
    // PART 3: WIRING TESTS
    // ========================================================================

    describe('Provider Wiring', () => {

        it('openai provider models map to OpenAI API pattern', () => {
            const openaiModels = Object.entries(modelDefinitions || {})
                .filter(([_, m]) => m.provider === 'openai');

            expect(openaiModels.length).toBeGreaterThan(0);

            for (const [key, model] of openaiModels) {
                // OpenAI models should NOT use server key (user provides their own)
                expect(model.useServerKey).toBe(false);
                // Model ID should be a valid OpenAI model string (gpt-*, o1*, o3*, o4*, chatgpt-*)
                expect(model.modelId).toMatch(/^(gpt-|chatgpt-|o1|o3|o4)/);
            }
        });

        it('claude provider models use correct API pattern', () => {
            const claudeModels = Object.entries(modelDefinitions || {})
                .filter(([_, m]) => m.provider === 'anthropic');

            expect(claudeModels.length).toBeGreaterThan(0);

            for (const [key, model] of claudeModels) {
                // Claude models should have claude in the model ID
                expect(model.modelId).toMatch(/claude/);
            }
        });

        it('gemini provider models use correct API pattern', () => {
            const geminiModels = Object.entries(modelDefinitions || {})
                .filter(([_, m]) => m.provider === 'gemini');

            expect(geminiModels.length).toBeGreaterThan(0);

            for (const [key, model] of geminiModels) {
                // Gemini models should have gemini in the model ID
                expect(model.modelId).toMatch(/gemini/);
            }
        });

        it('dropdown options map to valid MODEL_DEFINITIONS keys', () => {
            // Extract dropdown option values from HTML
            const optionMatches = htmlContent.matchAll(/value="(user-[^"]+)"/g);
            const dropdownKeys = [...optionMatches].map(m => m[1]);

            expect(dropdownKeys.length).toBeGreaterThan(0);

            for (const key of dropdownKeys) {
                if (modelDefinitions) {
                    expect(modelDefinitions[key], `Dropdown option ${key} not in MODEL_DEFINITIONS`).toBeDefined();
                }
            }
        });

        it('each provider has at least one model', () => {
            const providers = new Set(
                Object.values(modelDefinitions || {}).map(m => m.provider)
            );

            // Should have at least OpenAI, Anthropic, Gemini
            expect(providers.size).toBeGreaterThanOrEqual(3);
            expect(providers.has('openai')).toBe(true);
            expect(providers.has('anthropic')).toBe(true);
            expect(providers.has('gemini')).toBe(true);
        });
    });

    // ========================================================================
    // PART 4: API ENDPOINT TESTS
    // ========================================================================

    describe('API Endpoint Configuration', () => {

        it('has OpenAI API endpoint configured', () => {
            expect(htmlContent).toContain('api.openai.com');
        });

        it('has Anthropic API endpoint configured', () => {
            expect(htmlContent).toContain('api.anthropic.com');
        });

        it('has Google AI endpoint configured', () => {
            expect(htmlContent).toContain('generativelanguage.googleapis.com');
        });

        it('includes streaming support for providers', () => {
            // Check for streaming-related code
            expect(htmlContent).toContain('stream');
            // Check for SSE or streaming response handling
            expect(htmlContent).toMatch(/stream.*true|EventSource|reader.*read/i);
        });
    });

    // ========================================================================
    // PART 5: ERROR HANDLING
    // ========================================================================

    describe('Provider Error Handling', () => {

        it('has error handling for invalid API keys', () => {
            expect(htmlContent).toMatch(/api.key|apiKey|invalid.*key/i);
        });

        it('has rate limit handling', () => {
            expect(htmlContent).toMatch(/rate.limit|429|too.many.requests/i);
        });

        it('has timeout handling', () => {
            expect(htmlContent).toMatch(/timeout|timed?.out/i);
        });
    });
});
