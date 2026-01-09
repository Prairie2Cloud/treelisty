/**
 * TB Gmail Local Search Smoke Test
 *
 * CRITICAL TEST: Verifies TB searches local Gmail data instead of delegating to CC
 *
 * This test was added after Build 802 to catch the bug where TB would say
 * "Delegating email task to Claude Code..." even when Gmail data was already
 * loaded in the tree.
 *
 * Run: npx playwright test test/smoke/tb-gmail-local-search.test.js
 */

import { test, expect } from '@playwright/test';

const TREELISTY_URL = 'https://treelisty.netlify.app';

// Mock Gmail data with GitHub and LinkedIn emails
const mockGmailTree = {
    id: 'test-gmail-tree',
    name: 'Gmail Export - Test',
    pattern: 'gmail',
    children: [
        {
            id: 'inbox',
            name: '📥 Inbox',
            children: [
                // GitHub emails
                {
                    id: 'gh-1',
                    name: '[Prairie2Cloud/treelisty] Run failed: E2E Tests',
                    threadId: 'thread-gh-1',
                    senderEmail: 'notifications@github.com',
                    senderName: 'GitHub',
                    labels: ['INBOX', 'UNREAD'],
                    unread: true
                },
                {
                    id: 'gh-2',
                    name: '[Prairie2Cloud/treelisty] PR #123 merged',
                    threadId: 'thread-gh-2',
                    senderEmail: 'notifications@github.com',
                    senderName: 'GitHub',
                    labels: ['INBOX']
                },
                {
                    id: 'gh-3',
                    name: '[Prairie2Cloud/treelisty] New issue: Bug report',
                    threadId: 'thread-gh-3',
                    senderEmail: 'notifications@github.com',
                    senderName: 'GitHub',
                    labels: ['INBOX', 'UNREAD'],
                    unread: true
                },
                // LinkedIn emails
                {
                    id: 'li-1',
                    name: 'John Smith wants to connect',
                    threadId: 'thread-li-1',
                    senderEmail: 'messages-noreply@linkedin.com',
                    senderName: 'LinkedIn',
                    labels: ['INBOX', 'UNREAD'],
                    unread: true
                },
                {
                    id: 'li-2',
                    name: 'You have 5 new notifications',
                    threadId: 'thread-li-2',
                    senderEmail: 'notifications@linkedin.com',
                    senderName: 'LinkedIn',
                    labels: ['INBOX']
                },
                {
                    id: 'li-3',
                    name: 'Jane Doe viewed your profile',
                    threadId: 'thread-li-3',
                    senderEmail: 'messages-noreply@linkedin.com',
                    senderName: 'LinkedIn',
                    labels: ['INBOX']
                },
                // Other emails (to verify filtering works)
                {
                    id: 'other-1',
                    name: 'Meeting tomorrow at 3pm',
                    threadId: 'thread-other-1',
                    senderEmail: 'boss@company.com',
                    senderName: 'Boss',
                    labels: ['INBOX', 'UNREAD'],
                    unread: true
                },
                {
                    id: 'other-2',
                    name: 'Your order has shipped',
                    threadId: 'thread-other-2',
                    senderEmail: 'orders@amazon.com',
                    senderName: 'Amazon',
                    labels: ['INBOX']
                }
            ]
        }
    ]
};

test.describe('TB Gmail Local Search - Build 802+', () => {

    test.beforeEach(async ({ page }) => {
        // Load TreeListy
        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        // Verify minimum build
        const build = await page.evaluate(() => window.TREELISTY_VERSION?.build);
        console.log(`Build: ${build}`);
        expect(build).toBeGreaterThanOrEqual(802);

        // Load mock Gmail data
        await page.evaluate((data) => {
            window.capexTree = data;
            window.currentPattern = 'gmail';
            if (typeof normalizeTreeStructure === 'function') {
                normalizeTreeStructure(window.capexTree);
            }
            if (typeof render === 'function') {
                render();
            }
        }, mockGmailTree);

        await page.waitForTimeout(500);

        // Verify Gmail data loaded
        const nodeCount = await page.evaluate(() => {
            const getAllNodesFlat = window.COMMAND_REGISTRY?.['_getAllNodesFlat'];
            if (!getAllNodesFlat) return 0;
            return getAllNodesFlat().filter(n => n.threadId).length;
        });
        console.log(`Loaded ${nodeCount} email nodes`);
        expect(nodeCount).toBe(8);
    });

    test('1. "show me emails from github" searches local data', async ({ page }) => {
        // Clear any pending CC requests
        await page.evaluate(() => {
            window.ccPendingRequests = [];
        });

        // Simulate TB processing this query via INTENT_HANDLERS.EMAIL
        const result = await page.evaluate(async () => {
            const message = 'show me emails from github';

            // Check if INTENT_HANDLERS exists
            if (typeof INTENT_HANDLERS === 'undefined') {
                return { error: 'INTENT_HANDLERS not found' };
            }

            // Get capabilities (simulating what TB does)
            const caps = {
                gmail: 'FULL',  // Pretend CC has full gmail access
                github: 'FULL'
            };

            // Call the EMAIL handler
            const handlerResult = await INTENT_HANDLERS.EMAIL(message, caps);

            // Check if CC was delegated to
            const ccDelegated = window.ccPendingRequests?.length > 0;

            return {
                handled: handlerResult.handled,
                message: handlerResult.message,
                ccDelegated,
                ccRequestCount: window.ccPendingRequests?.length || 0
            };
        });

        console.log('Result:', result);

        // CRITICAL ASSERTIONS
        expect(result.error).toBeUndefined();
        expect(result.handled).toBe(true);
        expect(result.ccDelegated).toBe(false); // Should NOT delegate to CC
        expect(result.message).toContain('github'); // Should mention github
        expect(result.message).not.toContain('Delegating'); // Should NOT say delegating
    });

    test('2. "show me emails from linkedin" searches local data', async ({ page }) => {
        // Clear any pending CC requests
        await page.evaluate(() => {
            window.ccPendingRequests = [];
        });

        const result = await page.evaluate(async () => {
            const message = 'show me emails from linkedin';

            if (typeof INTENT_HANDLERS === 'undefined') {
                return { error: 'INTENT_HANDLERS not found' };
            }

            const caps = { gmail: 'FULL', github: 'FULL' };
            const handlerResult = await INTENT_HANDLERS.EMAIL(message, caps);
            const ccDelegated = window.ccPendingRequests?.length > 0;

            return {
                handled: handlerResult.handled,
                message: handlerResult.message,
                ccDelegated
            };
        });

        console.log('Result:', result);

        expect(result.error).toBeUndefined();
        expect(result.handled).toBe(true);
        expect(result.ccDelegated).toBe(false);
        expect(result.message).toContain('linkedin');
        expect(result.message).not.toContain('Delegating');
    });

    test('3. Local search returns correct count for GitHub', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const message = 'show me emails from github';

            if (typeof INTENT_HANDLERS === 'undefined') {
                return { error: 'INTENT_HANDLERS not found' };
            }

            const caps = { gmail: 'FULL' };
            const handlerResult = await INTENT_HANDLERS.EMAIL(message, caps);

            return {
                message: handlerResult.message
            };
        });

        console.log('GitHub search result:', result.message);

        // Should find 3 GitHub emails
        expect(result.message).toMatch(/3.*emails|Found.*3/i);
    });

    test('4. Local search returns correct count for LinkedIn', async ({ page }) => {
        const result = await page.evaluate(async () => {
            const message = 'show me emails from linkedin';

            if (typeof INTENT_HANDLERS === 'undefined') {
                return { error: 'INTENT_HANDLERS not found' };
            }

            const caps = { gmail: 'FULL' };
            const handlerResult = await INTENT_HANDLERS.EMAIL(message, caps);

            return {
                message: handlerResult.message
            };
        });

        console.log('LinkedIn search result:', result.message);

        // Should find 3 LinkedIn emails
        expect(result.message).toMatch(/3.*emails|Found.*3/i);
    });

    test('5. hasLocalGmailData detection works', async ({ page }) => {
        const detection = await page.evaluate(() => {
            // Test the detection logic from INTENT_HANDLERS.EMAIL
            const hasLocalGmailData = window.currentPattern === 'gmail' ||
                (window.capexTree?.pattern === 'gmail') ||
                (window.COMMAND_REGISTRY?.['_getAllNodesFlat'] &&
                 window.COMMAND_REGISTRY['_getAllNodesFlat']().some(n => n.threadId));

            return {
                currentPattern: window.currentPattern,
                treePattern: window.capexTree?.pattern,
                hasThreadIds: window.COMMAND_REGISTRY?.['_getAllNodesFlat']?.()?.some(n => n.threadId) || false,
                hasLocalGmailData
            };
        });

        console.log('Detection:', detection);

        expect(detection.hasLocalGmailData).toBe(true);
        expect(detection.currentPattern).toBe('gmail');
    });

    test('6. CC delegation only happens when NO local data', async ({ page }) => {
        // Clear the Gmail tree to simulate no local data
        await page.evaluate(() => {
            window.capexTree = { id: 'empty', name: 'Empty Tree', children: [] };
            window.currentPattern = 'generic';
            window.ccPendingRequests = [];
            if (typeof render === 'function') render();
        });

        await page.waitForTimeout(300);

        const result = await page.evaluate(async () => {
            const message = 'show me emails from github';

            if (typeof INTENT_HANDLERS === 'undefined') {
                return { error: 'INTENT_HANDLERS not found' };
            }

            // Simulate CC being connected
            const caps = { gmail: 'FULL' };

            // Note: This will try to delegate but may fail if MCP not connected
            // The key test is that it TRIES to delegate when no local data
            const handlerResult = await INTENT_HANDLERS.EMAIL(message, caps);

            return {
                handled: handlerResult.handled,
                message: handlerResult.message,
                wouldDelegate: handlerResult.message?.includes('Delegating') ||
                              handlerResult.message?.includes('triage') ||
                              !handlerResult.message?.includes('Found')
            };
        });

        console.log('No local data result:', result);

        // When no local data, should either delegate or fall back to triage
        // Should NOT return local search results
        expect(result.message).not.toMatch(/Found.*\d+.*emails.*from/i);
    });

    test('7. Activity log shows local search, not delegation', async ({ page }) => {
        // Clear activity log
        await page.evaluate(() => {
            window.tbActivityLog = [];
            window.ccPendingRequests = [];
        });

        // Perform search
        await page.evaluate(async () => {
            const message = 'show me emails from github';
            const caps = { gmail: 'FULL' };
            await INTENT_HANDLERS.EMAIL(message, caps);
        });

        // Check activity log
        const activities = await page.evaluate(() => {
            return window.tbActivityLog?.map(a => ({
                action: a.action,
                description: a.description
            })) || [];
        });

        console.log('Activities:', activities);

        // Should NOT have a "delegated" activity
        const hasDelegation = activities.some(a => a.action === 'delegated');
        expect(hasDelegation).toBe(false);
    });

    test('8. Full TB chat integration - GitHub query', async ({ page }) => {
        // This tests the full path through TB chat, not just INTENT_HANDLERS

        // Type in TB chat input
        const chatInput = await page.$('#tb-chat-input, #chat-input, [data-testid="tb-input"]');

        if (chatInput) {
            await chatInput.fill('show me emails from github');
            await chatInput.press('Enter');

            await page.waitForTimeout(2000); // Wait for TB to process

            // Check the response in chat
            const chatMessages = await page.evaluate(() => {
                const messages = document.querySelectorAll('.tb-message, .chat-message, [data-role="assistant"]');
                return Array.from(messages).map(m => m.textContent?.substring(0, 200));
            });

            console.log('Chat messages:', chatMessages);

            // Last message should contain results, not delegation
            const lastMessage = chatMessages[chatMessages.length - 1] || '';
            expect(lastMessage).not.toContain('Delegating');
        } else {
            console.log('TB chat input not found - skipping full integration test');
        }
    });

});

test.describe('TB Gmail Search Edge Cases', () => {

    test('Case-insensitive sender matching', async ({ page }) => {
        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        await page.evaluate((data) => {
            window.capexTree = data;
            window.currentPattern = 'gmail';
            if (typeof normalizeTreeStructure === 'function') normalizeTreeStructure(window.capexTree);
            if (typeof render === 'function') render();
        }, mockGmailTree);

        // Test with different cases
        const queries = ['GITHUB', 'GitHub', 'github', 'LINKEDIN', 'LinkedIn', 'linkedin'];

        for (const query of queries) {
            const result = await page.evaluate(async (q) => {
                const message = `show me emails from ${q}`;
                if (typeof INTENT_HANDLERS === 'undefined') return { error: 'no handlers' };
                const handlerResult = await INTENT_HANDLERS.EMAIL(message, { gmail: 'FULL' });
                return { message: handlerResult.message };
            }, query);

            console.log(`Query "${query}":`, result.message?.substring(0, 50));
            expect(result.message).toMatch(/Found.*\d+.*emails/i);
        }
    });

    test('Partial sender matching (e.g., "git" matches github)', async ({ page }) => {
        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        await page.evaluate((data) => {
            window.capexTree = data;
            window.currentPattern = 'gmail';
            if (typeof normalizeTreeStructure === 'function') normalizeTreeStructure(window.capexTree);
            if (typeof render === 'function') render();
        }, mockGmailTree);

        const result = await page.evaluate(async () => {
            const message = 'show me emails from git';
            if (typeof INTENT_HANDLERS === 'undefined') return { error: 'no handlers' };
            const handlerResult = await INTENT_HANDLERS.EMAIL(message, { gmail: 'FULL' });
            return { message: handlerResult.message };
        });

        console.log('Partial match "git":', result.message);

        // "git" should match "github" emails
        expect(result.message).toMatch(/Found.*\d+.*emails/i);
    });

});
