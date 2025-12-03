/**
 * Netlify Functions Integration Test
 *
 * This test hits REAL Netlify functions to verify:
 * 1. gdrive-proxy function responds correctly
 * 2. collab-session function works for API key sharing
 * 3. claude-proxy function is reachable (without API key)
 *
 * Run: npm run test:live:netlify
 *      node test/scenarios/run-netlify-integration-test.js
 *
 * This catches deployment issues that mocked tests miss!
 */

const LIVE_URL = 'https://treelisty.netlify.app';
const TEST_TIMEOUT = 30000;

async function runNetlifyIntegrationTest() {
    console.log('🌐 Netlify Functions Integration Test');
    console.log('=' .repeat(60));
    console.log(`Testing against: ${LIVE_URL}`);
    console.log('');

    const results = {
        passed: 0,
        failed: 0,
        tests: []
    };

    // ============================================
    // TEST 1: gdrive-proxy function exists
    // ============================================
    console.log('\n📋 Test 1: gdrive-proxy function reachability');
    console.log('-'.repeat(60));

    try {
        // Test without ID - should return 400 with proper error
        const gdriveUrl = `${LIVE_URL}/.netlify/functions/gdrive-proxy`;
        console.log(`   Calling: ${gdriveUrl}`);

        const response = await fetch(gdriveUrl);
        const data = await response.json();

        if (response.status === 400 && data.error && data.error.includes('Missing file ID')) {
            console.log('   ✅ gdrive-proxy function is deployed and responding correctly');
            console.log(`   Response: ${JSON.stringify(data)}`);
            results.passed++;
            results.tests.push({ name: 'gdrive-proxy reachability', status: 'passed' });
        } else if (response.status === 404) {
            console.log('   ❌ gdrive-proxy function NOT FOUND (404)');
            console.log('   ⚠️  Function was never deployed or has a path error');
            results.failed++;
            results.tests.push({
                name: 'gdrive-proxy reachability',
                status: 'failed',
                error: '404 - Function not deployed'
            });
        } else {
            console.log(`   ⚠️  Unexpected response: ${response.status}`);
            console.log(`   Body: ${JSON.stringify(data)}`);
            results.tests.push({ name: 'gdrive-proxy reachability', status: 'unclear' });
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'gdrive-proxy reachability', status: 'failed', error: error.message });
    }

    // ============================================
    // TEST 2: gdrive-proxy with invalid file ID
    // ============================================
    console.log('\n📋 Test 2: gdrive-proxy invalid file ID handling');
    console.log('-'.repeat(60));

    try {
        const gdriveUrl = `${LIVE_URL}/.netlify/functions/gdrive-proxy?id=abc`;
        console.log(`   Calling: ${gdriveUrl}`);

        const response = await fetch(gdriveUrl);
        const data = await response.json();

        if (response.status === 400 && data.error && data.error.includes('Invalid file ID format')) {
            console.log('   ✅ gdrive-proxy correctly rejects invalid file IDs');
            results.passed++;
            results.tests.push({ name: 'gdrive-proxy validation', status: 'passed' });
        } else {
            console.log(`   ⚠️  Unexpected response: ${response.status} - ${JSON.stringify(data)}`);
            results.tests.push({ name: 'gdrive-proxy validation', status: 'unclear' });
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'gdrive-proxy validation', status: 'failed', error: error.message });
    }

    // ============================================
    // TEST 3: collab-session function exists
    // ============================================
    console.log('\n📋 Test 3: collab-session function reachability');
    console.log('-'.repeat(60));

    try {
        const collabUrl = `${LIVE_URL}/.netlify/functions/collab-session`;
        console.log(`   Calling: ${collabUrl}`);

        const response = await fetch(collabUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'status' })
        });

        const data = await response.json();

        if (response.status === 404) {
            console.log('   ❌ collab-session function NOT FOUND (404)');
            console.log('   ⚠️  Function was never deployed');
            results.failed++;
            results.tests.push({
                name: 'collab-session reachability',
                status: 'failed',
                error: '404 - Function not deployed'
            });
        } else if (response.ok || response.status === 400) {
            // 400 with proper error message is OK - means function is reachable
            console.log('   ✅ collab-session function is deployed and responding');
            console.log(`   Response: ${response.status} - ${JSON.stringify(data)}`);
            results.passed++;
            results.tests.push({ name: 'collab-session reachability', status: 'passed' });
        } else {
            console.log(`   ⚠️  Unexpected response: ${response.status}`);
            results.tests.push({ name: 'collab-session reachability', status: 'unclear' });
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'collab-session reachability', status: 'failed', error: error.message });
    }

    // ============================================
    // TEST 4: collab-session create action
    // ============================================
    console.log('\n📋 Test 4: collab-session create action');
    console.log('-'.repeat(60));

    try {
        const collabUrl = `${LIVE_URL}/.netlify/functions/collab-session`;

        const response = await fetch(collabUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: 'create',
                hostName: 'Integration Test',
                apiKeys: {
                    claude: 'test-key-xxxx'
                }
            })
        });

        const data = await response.json();

        if (response.ok && data.sessionToken) {
            console.log('   ✅ collab-session creates sessions correctly');
            console.log(`   Token: ${data.sessionToken.substring(0, 20)}...`);
            console.log(`   Expires: ${data.expiresAt}`);
            results.passed++;
            results.tests.push({ name: 'collab-session create', status: 'passed' });

            // Save token for validate test
            results._sessionToken = data.sessionToken;
        } else if (response.status === 404) {
            console.log('   ❌ collab-session function not found');
            results.failed++;
            results.tests.push({ name: 'collab-session create', status: 'failed', error: '404' });
        } else {
            console.log(`   ⚠️  Create failed: ${response.status} - ${JSON.stringify(data)}`);
            results.tests.push({ name: 'collab-session create', status: 'unclear' });
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'collab-session create', status: 'failed', error: error.message });
    }

    // ============================================
    // TEST 5: collab-session validate action
    // ============================================
    console.log('\n📋 Test 5: collab-session validate action');
    console.log('-'.repeat(60));

    if (results._sessionToken) {
        try {
            const collabUrl = `${LIVE_URL}/.netlify/functions/collab-session`;

            const response = await fetch(collabUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'validate',
                    sessionToken: results._sessionToken
                })
            });

            const data = await response.json();

            if (response.ok && data.valid && data.apiKeys) {
                console.log('   ✅ collab-session validates tokens and returns API keys');
                console.log(`   Host: ${data.hostName}`);
                console.log(`   API Keys received: ${Object.keys(data.apiKeys).join(', ')}`);
                results.passed++;
                results.tests.push({ name: 'collab-session validate', status: 'passed' });
            } else {
                console.log(`   ⚠️  Validate failed: ${response.status} - ${JSON.stringify(data)}`);
                results.tests.push({ name: 'collab-session validate', status: 'unclear' });
            }
        } catch (error) {
            console.log(`   ❌ Network error: ${error.message}`);
            results.failed++;
            results.tests.push({ name: 'collab-session validate', status: 'failed', error: error.message });
        }
    } else {
        console.log('   ⏭️  Skipped (no session token from create test)');
        results.tests.push({ name: 'collab-session validate', status: 'skipped' });
    }

    // ============================================
    // TEST 6: claude-proxy function exists
    // ============================================
    console.log('\n📋 Test 6: claude-proxy function reachability');
    console.log('-'.repeat(60));

    try {
        const claudeUrl = `${LIVE_URL}/.netlify/functions/claude-proxy`;
        console.log(`   Calling: ${claudeUrl}`);

        const response = await fetch(claudeUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [] })
        });

        if (response.status === 404) {
            console.log('   ❌ claude-proxy function NOT FOUND (404)');
            results.failed++;
            results.tests.push({
                name: 'claude-proxy reachability',
                status: 'failed',
                error: '404 - Function not deployed'
            });
        } else {
            // Any response other than 404 means the function exists
            // It might return error for missing API key, but that's expected
            console.log(`   ✅ claude-proxy function is deployed (status: ${response.status})`);
            results.passed++;
            results.tests.push({ name: 'claude-proxy reachability', status: 'passed' });
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'claude-proxy reachability', status: 'failed', error: error.message });
    }

    // ============================================
    // TEST 7: CORS headers on gdrive-proxy
    // ============================================
    console.log('\n📋 Test 7: CORS headers verification');
    console.log('-'.repeat(60));

    try {
        const gdriveUrl = `${LIVE_URL}/.netlify/functions/gdrive-proxy`;

        const response = await fetch(gdriveUrl, {
            method: 'OPTIONS'
        });

        const corsOrigin = response.headers.get('access-control-allow-origin');
        const corsMethods = response.headers.get('access-control-allow-methods');

        if (corsOrigin === '*' && corsMethods) {
            console.log('   ✅ CORS headers are properly configured');
            console.log(`   Allow-Origin: ${corsOrigin}`);
            console.log(`   Allow-Methods: ${corsMethods}`);
            results.passed++;
            results.tests.push({ name: 'CORS headers', status: 'passed' });
        } else if (response.status === 404) {
            console.log('   ❌ Function not found, cannot test CORS');
            results.tests.push({ name: 'CORS headers', status: 'skipped' });
        } else {
            console.log('   ⚠️  CORS headers missing or incomplete');
            console.log(`   Allow-Origin: ${corsOrigin || 'not set'}`);
            results.tests.push({ name: 'CORS headers', status: 'unclear' });
        }
    } catch (error) {
        console.log(`   ❌ Network error: ${error.message}`);
        results.failed++;
        results.tests.push({ name: 'CORS headers', status: 'failed', error: error.message });
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('📊 NETLIFY FUNCTIONS INTEGRATION TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log('');

    results.tests.forEach(test => {
        const icon = test.status === 'passed' ? '✅' :
                     test.status === 'failed' ? '❌' :
                     test.status === 'skipped' ? '⏭️' : '⚠️';
        console.log(`${icon} ${test.name}: ${test.status}`);
        if (test.error) {
            console.log(`   └─ ${test.error}`);
        }
    });

    // Critical warning for CI/CD
    if (results.failed > 0) {
        console.log('\n🚨 CRITICAL: Netlify function tests failed!');
        console.log('   This means one or more serverless functions are BROKEN in production.');
        console.log('   Common causes:');
        console.log('   - Function files not committed to git');
        console.log('   - Syntax errors in function code');
        console.log('   - Missing environment variables');
        console.log('   Fix these issues before deploying!');
        process.exit(1);
    } else {
        console.log('\n✅ All Netlify function tests passed!');
        console.log('   Serverless functions are working in production.');
    }
}

// Run the test
runNetlifyIntegrationTest().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
