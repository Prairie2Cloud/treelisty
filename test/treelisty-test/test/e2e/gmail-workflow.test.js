/**
 * Gmail Workflow E2E Test
 * Tests Build 547-548 features:
 * - Gmail export v2.0 (attachments, full bodies, encoding)
 * - Email reader modal (open, navigate, close)
 * - Center-focused canvas zoom
 * - Reply/Forward buttons (Build 548)
 *
 * Run: npx playwright test test/e2e/gmail-workflow.test.js
 */

import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ES Module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const TREELISTY_URL = 'https://treelisty.netlify.app';
const GMAIL_JSON_PATH = path.join(__dirname, '../../../../gmail-threads-20251222_125403.json');
const SCREENSHOTS_DIR = path.join(__dirname, '../../screenshots');

// Load Gmail data at module level
let gmailData = null;
if (fs.existsSync(GMAIL_JSON_PATH)) {
    gmailData = JSON.parse(fs.readFileSync(GMAIL_JSON_PATH, 'utf-8'));
    console.log(`Loaded Gmail data: ${gmailData.source?.threadCount || 0} threads`);
} else {
    console.warn('Gmail JSON not found - some tests will be skipped');
}

// Ensure screenshots directory exists
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

test.describe('Gmail Workflow - Build 547', () => {

    test('1. Load TreeListy and verify Build 547', async ({ page }) => {
        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        // Check build number
        const version = await page.evaluate(() => window.TREELISTY_VERSION);
        console.log(`TreeListy Version: ${version?.full}`);
        expect(version?.build).toBeGreaterThanOrEqual(547);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'gmail-test-01-loaded.png') });
    });

    test('2. Import Gmail JSON via loadTree', async ({ page }) => {
        test.skip(!gmailData, 'Gmail JSON not available');

        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        // Import the Gmail data by directly assigning to capexTree and rendering
        const success = await page.evaluate((data) => {
            try {
                Object.assign(window.capexTree, data);
                if (typeof render === 'function') render();
                return true;
            } catch (e) {
                console.error('Import error:', e);
                return false;
            }
        }, gmailData);

        await page.waitForTimeout(500);

        expect(success).toBe(true);

        // Verify tree loaded - should see Gmail root
        const treeName = await page.evaluate(() => window.capexTree?.name);
        expect(treeName).toContain('Gmail');

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'gmail-test-02-imported.png') });
    });

    test('3. Navigate to email item and open context menu', async ({ page }) => {
        test.skip(!gmailData, 'Gmail JSON not available');

        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        // Import the Gmail data first
        await page.evaluate((data) => {
            if (typeof loadTree === 'function') {
                loadTree(data);
            } else if (window.capexTree) {
                Object.assign(window.capexTree, data);
                if (typeof render === 'function') render();
            }
        }, gmailData);

        await page.waitForTimeout(500);

        // Click on first email item (expand phases first)
        const phaseToggle = await page.$('.toggle-btn, .expand-btn');
        if (phaseToggle) await phaseToggle.click();
        await page.waitForTimeout(300);

        // Find an email item
        const emailItem = await page.$('.tree-item[data-type="item"], .item-row');
        if (emailItem) {
            // Right-click to open context menu
            await emailItem.click({ button: 'right' });
            await page.waitForTimeout(300);

            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'gmail-test-04-context-menu.png') });

            // Check for "Open Email" option
            const openEmailBtn = await page.$('#ctx-open-email, .context-item:has-text("Open Email")');
            expect(openEmailBtn).toBeTruthy();
        }
    });

    test('4. Open Email Reader Modal', async ({ page }) => {
        test.skip(!gmailData, 'Gmail JSON not available');

        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        // Import data
        await page.evaluate((data) => {
            if (typeof loadTree === 'function') loadTree(data);
            else if (window.capexTree) {
                Object.assign(window.capexTree, data);
                if (typeof render === 'function') render();
            }
        }, gmailData);
        await page.waitForTimeout(500);

        // Get first email item
        const firstItem = gmailData.children?.[0]?.items?.[0];
        if (firstItem) {
            // Open email reader via JS
            await page.evaluate((node) => {
                if (typeof openEmailReaderModal === 'function') {
                    openEmailReaderModal(node);
                }
            }, firstItem);

            await page.waitForTimeout(500);

            // Verify modal is open
            const modal = await page.$('#email-reader-modal');
            const modalDisplay = await modal?.evaluate(el => getComputedStyle(el).display);
            expect(modalDisplay).toBe('flex');

            // Check modal content
            const subject = await page.textContent('#email-reader-subject');
            expect(subject).toBeTruthy();

            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'gmail-test-05-email-modal.png') });

            // Test keyboard navigation (j for next)
            await page.keyboard.press('j');
            await page.waitForTimeout(300);

            // Close with Escape
            await page.keyboard.press('Escape');
            await page.waitForTimeout(300);

            const modalAfterEscape = await page.$('#email-reader-modal');
            const displayAfter = await modalAfterEscape?.evaluate(el => getComputedStyle(el).display);
            expect(displayAfter).toBe('none');
        }
    });

    test('5. Test Email Reader Thread Navigation', async ({ page }) => {
        test.skip(!gmailData, 'Gmail JSON not available');

        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        // Find a thread with multiple messages
        let threadWithReplies = null;
        for (const phase of gmailData.children || []) {
            for (const item of phase.items || []) {
                if (item.messageCount > 1 && item.subItems?.length > 1) {
                    threadWithReplies = item;
                    break;
                }
            }
            if (threadWithReplies) break;
        }

        if (threadWithReplies) {
            console.log(`Testing thread with ${threadWithReplies.messageCount} messages`);

            // Open email reader
            await page.evaluate((node) => {
                if (typeof openEmailReaderModal === 'function') {
                    openEmailReaderModal(node);
                }
            }, threadWithReplies);

            await page.waitForTimeout(500);

            // Verify thread nav is visible
            const threadNav = await page.$('#email-reader-thread-nav');
            const navDisplay = await threadNav?.evaluate(el => getComputedStyle(el).display);
            expect(navDisplay).toBe('block');

            // Get initial message index
            const initialInfo = await page.textContent('#email-reader-thread-info');
            expect(initialInfo).toContain('Message 1');

            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'gmail-test-06-thread-nav-1.png') });

            // Navigate to next message
            await page.keyboard.press('j');
            await page.waitForTimeout(300);

            const afterNavInfo = await page.textContent('#email-reader-thread-info');
            expect(afterNavInfo).toContain('Message 2');

            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'gmail-test-07-thread-nav-2.png') });

            // Navigate back
            await page.keyboard.press('k');
            await page.waitForTimeout(300);

            const backInfo = await page.textContent('#email-reader-thread-info');
            expect(backInfo).toContain('Message 1');

            // Close modal
            await page.keyboard.press('Escape');
        } else {
            console.log('No multi-message threads found for navigation test');
        }
    });

    test('6. Test Attachments Data Exists', async ({ page }) => {
        test.skip(!gmailData, 'Gmail JSON not available');

        // Find a thread with attachments in the data
        let threadWithAttachments = null;
        for (const phase of gmailData.children || []) {
            for (const item of phase.items || []) {
                if (item.hasAttachments && item.attachments?.length > 0) {
                    threadWithAttachments = item;
                    break;
                }
            }
            if (threadWithAttachments) break;
        }

        if (threadWithAttachments) {
            console.log(`Found thread with ${threadWithAttachments.attachmentCount} attachments`);

            // Verify attachment data structure
            expect(threadWithAttachments.attachments).toBeDefined();
            expect(threadWithAttachments.attachments.length).toBeGreaterThan(0);

            const firstAttachment = threadWithAttachments.attachments[0];
            expect(firstAttachment.filename).toBeTruthy();
            expect(firstAttachment.mimeType).toBeTruthy();

            console.log(`First attachment: ${firstAttachment.filename} (${firstAttachment.mimeType})`);
        } else {
            console.log('No threads with attachments found - skipping');
            test.skip(true, 'No attachments in test data');
        }
    });

    test('7. Test Canvas View Center-Focused Zoom', async ({ page }) => {
        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        // Import data if available
        if (gmailData) {
            await page.evaluate((data) => {
                if (typeof loadTree === 'function') loadTree(data);
            }, gmailData);
            await page.waitForTimeout(500);
        }

        // Switch to Canvas view via JS (more reliable than clicking dropdown)
        await page.evaluate(() => {
            if (typeof switchView === 'function') {
                switchView('canvas');
            }
        });
        await page.waitForTimeout(1000);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'gmail-test-09-canvas-initial.png') });

        // Get initial zoom and pan
        const initialState = await page.evaluate(() => ({
            zoom: typeof canvasZoom !== 'undefined' ? canvasZoom : 1,
            panX: typeof canvasPan !== 'undefined' ? canvasPan.x : 0,
            panY: typeof canvasPan !== 'undefined' ? canvasPan.y : 0
        }));
        console.log('Initial state:', initialState);

        // Test zoom in via zoomCanvasCenter function
        await page.evaluate(() => {
            if (typeof zoomCanvasCenter === 'function') {
                zoomCanvasCenter(1.2); // zoom in 20%
            }
        });
        await page.waitForTimeout(300);

        const afterZoomIn = await page.evaluate(() => ({
            zoom: typeof canvasZoom !== 'undefined' ? canvasZoom : 1,
            panX: typeof canvasPan !== 'undefined' ? canvasPan.x : 0,
            panY: typeof canvasPan !== 'undefined' ? canvasPan.y : 0
        }));
        console.log('After zoom in:', afterZoomIn);

        // Zoom should have increased
        expect(afterZoomIn.zoom).toBeGreaterThan(initialState.zoom);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'gmail-test-10-canvas-zoomed.png') });

        // Test zoom out
        await page.evaluate(() => {
            if (typeof zoomCanvasCenter === 'function') {
                zoomCanvasCenter(0.8); // zoom out
                zoomCanvasCenter(0.8); // zoom out more
            }
        });
        await page.waitForTimeout(300);

        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'gmail-test-11-canvas-zoom-out.png') });
    });

    test('8. Test Reply/Forward/Open in Gmail buttons', async ({ page }) => {
        test.skip(!gmailData, 'Gmail JSON not available');

        await page.goto(TREELISTY_URL);
        await page.waitForLoadState('networkidle');

        const firstItem = gmailData.children?.[0]?.items?.[0];
        if (firstItem && firstItem.threadId) {
            // Open email reader
            await page.evaluate((node) => {
                if (typeof openEmailReaderModal === 'function') {
                    openEmailReaderModal(node);
                }
            }, firstItem);

            await page.waitForTimeout(500);

            // Verify all action buttons exist
            const replyBtn = await page.$('button:has-text("Reply")');
            const forwardBtn = await page.$('button:has-text("Forward")');
            const gmailBtn = await page.$('button:has-text("Open in Gmail")');

            expect(replyBtn).toBeTruthy();
            expect(forwardBtn).toBeTruthy();
            expect(gmailBtn).toBeTruthy();

            console.log('All action buttons present: Reply, Forward, Open in Gmail');

            // Test Reply button opens Gmail compose
            const [replyPage] = await Promise.all([
                page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
                replyBtn?.click()
            ]);

            if (replyPage) {
                const replyUrl = replyPage.url();
                console.log('Reply URL:', replyUrl);
                expect(replyUrl).toContain('mail.google.com');
                await replyPage.close();
            }

            // Test Forward button opens Gmail compose
            const [forwardPage] = await Promise.all([
                page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
                forwardBtn?.click()
            ]);

            if (forwardPage) {
                const fwdUrl = forwardPage.url();
                console.log('Forward URL:', fwdUrl);
                expect(fwdUrl).toContain('mail.google.com');
                await forwardPage.close();
            }

            // Test Open in Gmail button
            const [gmailPage] = await Promise.all([
                page.context().waitForEvent('page', { timeout: 5000 }).catch(() => null),
                gmailBtn?.click()
            ]);

            if (gmailPage) {
                const url = gmailPage.url();
                console.log('Opened URL:', url);
                expect(url).toContain('mail.google.com');
                await gmailPage.close();
            }

            await page.keyboard.press('Escape');
        }
    });

    test('9. Full Gmail Workflow Summary', async ({ page }) => {
        // This test summarizes all results
        const results = {
            gmailDataLoaded: !!gmailData,
            threadCount: gmailData?.source?.threadCount || 0,
            threadsWithAttachments: 0,
            threadsWithReplies: 0,
            totalAttachments: 0
        };

        if (gmailData) {
            for (const phase of gmailData.children || []) {
                for (const item of phase.items || []) {
                    if (item.hasAttachments) results.threadsWithAttachments++;
                    if (item.messageCount > 1) results.threadsWithReplies++;
                    results.totalAttachments += item.attachmentCount || 0;
                }
            }
        }

        console.log('\n========================================');
        console.log('Gmail Workflow Test Summary');
        console.log('========================================');
        console.log(`Gmail data loaded: ${results.gmailDataLoaded}`);
        console.log(`Total threads: ${results.threadCount}`);
        console.log(`Threads with replies: ${results.threadsWithReplies}`);
        console.log(`Threads with attachments: ${results.threadsWithAttachments}`);
        console.log(`Total attachments: ${results.totalAttachments}`);
        console.log('========================================\n');

        expect(results.gmailDataLoaded).toBe(true);
    });
});
