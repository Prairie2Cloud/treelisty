/**
 * Version Consistency Tests (Build 328)
 *
 * Ensures all version declarations in treeplexity.html are in sync.
 * This test reads the source file and verifies:
 * 1. Header comment build number matches TREELISTY_VERSION.build
 * 2. There are no hardcoded CURRENT_BUILD values (should use global)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('Version Consistency', () => {
    let htmlContent;

    beforeAll(() => {
        // Read the main HTML file
        const htmlPath = resolve(__dirname, '../../../../treeplexity.html');
        htmlContent = readFileSync(htmlPath, 'utf-8');
    });

    it('should have TREELISTY_VERSION defined at the top of the file', () => {
        const versionMatch = htmlContent.match(/window\.TREELISTY_VERSION\s*=\s*\{[\s\S]*?build:\s*(\d+)/);
        expect(versionMatch).not.toBeNull();
        expect(parseInt(versionMatch[1])).toBeGreaterThan(0);
    });

    it('should have header comment build number matching TREELISTY_VERSION.build', () => {
        // Extract build from header comment: "TreeListy v2.17.0 | Build XXX"
        const headerMatch = htmlContent.match(/TreeListy v[\d.]+ \| Build (\d+)/);
        expect(headerMatch).not.toBeNull();
        const headerBuild = parseInt(headerMatch[1]);

        // Extract build from TREELISTY_VERSION object
        const versionMatch = htmlContent.match(/window\.TREELISTY_VERSION\s*=\s*\{[\s\S]*?build:\s*(\d+)/);
        expect(versionMatch).not.toBeNull();
        const globalBuild = parseInt(versionMatch[1]);

        expect(headerBuild).toBe(globalBuild);
    });

    it('should use TREELISTY_VERSION in version check, not hardcoded value', () => {
        // The version check should use window.TREELISTY_VERSION?.build
        // NOT a hardcoded const CURRENT_BUILD = XXX
        const usesGlobalVersion = htmlContent.includes('window.TREELISTY_VERSION?.build');
        expect(usesGlobalVersion).toBe(true);

        // Should NOT have hardcoded CURRENT_BUILD = number (except in comments)
        // Look for the pattern outside of comments
        const hardcodedMatch = htmlContent.match(/const\s+CURRENT_BUILD\s*=\s*\d+\s*;/);
        expect(hardcodedMatch).toBeNull();
    });

    it('should have version display element using TREELISTY_VERSION', () => {
        // The version display should be populated dynamically, not hardcoded
        const versionDisplayMatch = htmlContent.match(/id="version-display"[\s\S]*?<!-- Populated by TREELISTY_VERSION -->/);
        expect(versionDisplayMatch).not.toBeNull();
    });

    it('should have consistent major version across all declarations', () => {
        // Extract major version from TREELISTY_VERSION
        const majorMatch = htmlContent.match(/window\.TREELISTY_VERSION\s*=\s*\{[\s\S]*?major:\s*['"]([^'"]+)['"]/);
        expect(majorMatch).not.toBeNull();
        const majorVersion = majorMatch[1];

        // Header should also have this version
        const headerMatch = htmlContent.match(/TreeListy v([\d.]+) \| Build/);
        expect(headerMatch).not.toBeNull();
        expect(headerMatch[1]).toBe(majorVersion);
    });
});
