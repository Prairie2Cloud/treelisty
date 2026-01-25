#!/usr/bin/env python3
"""
NBLM Integration Test Suite - Build 877
Tests NotebookLM integration Phase 1: Foundation

Tests:
1. MCP Bridge connection
2. NBLM MCP server health
3. TB command pattern matching
4. Synthesizer module structure
5. Fallback provider configuration
"""

import subprocess
import json
import time
import sys
import os
import re

# Fix Windows console encoding
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Add color support
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def print_test(name, passed, details=""):
    status = f"{Colors.GREEN}[PASS]{Colors.RESET}" if passed else f"{Colors.RED}[FAIL]{Colors.RESET}"
    print(f"  {status} {name}")
    if details and not passed:
        print(f"         {Colors.YELLOW}{details}{Colors.RESET}")

def print_section(name):
    print(f"\n{Colors.BOLD}{Colors.BLUE}=== {name} ==={Colors.RESET}")

def run_command(cmd, timeout=30):
    """Run a shell command and return output"""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=timeout
        )
        return result.stdout + result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "TIMEOUT", -1
    except Exception as e:
        return str(e), -1

# ============================================================
# Test Suite
# ============================================================

results = {"passed": 0, "failed": 0, "skipped": 0}

def test(name, condition, details=""):
    global results
    if condition:
        results["passed"] += 1
    else:
        results["failed"] += 1
    print_test(name, condition, details)
    return condition

print(f"\n{Colors.BOLD}NBLM Integration Test Suite - Build 877{Colors.RESET}")
print("=" * 50)

# ============================================================
# 1. MCP Configuration Tests
# ============================================================
print_section("1. MCP Configuration")

# Check if notebooklm MCP is configured
output, code = run_command("claude mcp list 2>&1")
nblm_configured = "notebooklm" in output.lower()
test("notebooklm-mcp configured in Claude", nblm_configured,
     "Run: claude mcp add notebooklm npx notebooklm-mcp@latest")

nblm_connected = "notebooklm" in output.lower() and "connected" in output.lower()
test("notebooklm-mcp shows as connected", nblm_connected,
     "MCP may need restart or auth setup")

# Check treelisty MCP
treelisty_configured = "treelisty" in output.lower()
test("treelisty-mcp configured", treelisty_configured)

# ============================================================
# 2. Synthesizer Module Structure
# ============================================================
print_section("2. Synthesizer Module Structure")

base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
synthesizer_path = os.path.join(base_path, "packages", "treelisty-mcp-bridge", "src", "synthesizer")
notebooklm_path = os.path.join(base_path, "packages", "treelisty-mcp-bridge", "src", "notebooklm")

# Check synthesizer files exist
synth_files = ["abstract-synthesizer.js", "nblm-provider.js", "llm-fallback-provider.js", "index.js"]
for f in synth_files:
    path = os.path.join(synthesizer_path, f)
    test(f"synthesizer/{f} exists", os.path.exists(path), f"Missing: {path}")

# Check notebooklm files exist
nblm_files = ["sync.js", "query.js", "index.js"]
for f in nblm_files:
    path = os.path.join(notebooklm_path, f)
    test(f"notebooklm/{f} exists", os.path.exists(path), f"Missing: {path}")

# ============================================================
# 3. Synthesizer Code Verification
# ============================================================
print_section("3. Synthesizer Code Verification")

# Check abstract-synthesizer.js has key classes
abstract_path = os.path.join(synthesizer_path, "abstract-synthesizer.js")
if os.path.exists(abstract_path):
    with open(abstract_path, 'r', encoding='utf-8') as f:
        content = f.read()

    test("SynthesisProvider class defined", "class SynthesisProvider" in content)
    test("SynthesizerManager class defined", "class SynthesizerManager" in content)
    test("Circuit breaker threshold defined", "circuitBreakerThreshold" in content)
    test("getActiveProvider method exists", "getActiveProvider()" in content)
    test("execute method with fallback", "async execute(method" in content)
else:
    test("abstract-synthesizer.js readable", False, "File not found")

# Check nblm-provider.js
nblm_provider_path = os.path.join(synthesizer_path, "nblm-provider.js")
if os.path.exists(nblm_provider_path):
    with open(nblm_provider_path, 'r', encoding='utf-8') as f:
        content = f.read()

    test("NBLMProvider extends SynthesisProvider", "extends SynthesisProvider" in content)
    test("MCP stdio communication", "stdio" in content.lower())
    test("callTool method for MCP", "callTool" in content)
else:
    test("nblm-provider.js readable", False, "File not found")

# Check llm-fallback-provider.js
fallback_path = os.path.join(synthesizer_path, "llm-fallback-provider.js")
if os.path.exists(fallback_path):
    with open(fallback_path, 'r', encoding='utf-8') as f:
        content = f.read()

    test("LLMFallbackProvider extends SynthesisProvider", "extends SynthesisProvider" in content)
    test("Gemini API integration", "gemini" in content.lower() or "generativelanguage" in content.lower())
    test("getCapabilities returns degraded mode", "podcasts: false" in content)
else:
    test("llm-fallback-provider.js readable", False, "File not found")

# ============================================================
# 4. NotebookLM Module Verification
# ============================================================
print_section("4. NotebookLM Module Verification")

# Check sync.js
sync_path = os.path.join(notebooklm_path, "sync.js")
if os.path.exists(sync_path):
    with open(sync_path, 'r', encoding='utf-8') as f:
        content = f.read()

    test("NBLMSyncManager class defined", "class NBLMSyncManager" in content)
    test("PII filter patterns defined", "SENSITIVE_PATTERNS" in content)
    test("containsSensitivePII function", "containsSensitivePII" in content)
    test("cleanupExpiredSources method", "cleanupExpiredSources" in content)
    test("48h max age default", "48" in content)
else:
    test("sync.js readable", False, "File not found")

# Check query.js
query_path = os.path.join(notebooklm_path, "query.js")
if os.path.exists(query_path):
    with open(query_path, 'r', encoding='utf-8') as f:
        content = f.read()

    test("NBLMQueryManager class defined", "class NBLMQueryManager" in content)
    test("formatCitations method", "formatCitations" in content)
    test("followUp method for context", "followUp" in content)
    test("queryHistory tracking", "queryHistory" in content)
else:
    test("query.js readable", False, "File not found")

# ============================================================
# 5. TreeBeard Command Integration
# ============================================================
print_section("5. TreeBeard Command Integration")

treeplexity_path = os.path.join(base_path, "treeplexity.html")
if os.path.exists(treeplexity_path):
    with open(treeplexity_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check directMappings patterns
    test("nblm_query pattern in directMappings", "command: 'nblm_query'" in content)
    test("nblm_list_notebooks pattern", "command: 'nblm_list_notebooks'" in content)
    test("nblm_select pattern", "command: 'nblm_select'" in content)
    test("nblm_health pattern", "command: 'nblm_health'" in content)
    test("nblm_status pattern", "command: 'nblm_status'" in content)

    # Check COMMAND_REGISTRY handlers
    test("nblm_query handler in COMMAND_REGISTRY", "'nblm_query': async" in content)
    test("nblm_list_notebooks handler", "'nblm_list_notebooks': async" in content)
    test("nblm_select handler", "'nblm_select': async" in content)
    test("nblm_health handler", "'nblm_health': async" in content)
    test("nblm_status handler", "'nblm_status': async" in content)

    # Check keyword groups
    test("'nblm' keyword group defined", "'nblm': [" in content)
    test("'notebooklm' keyword group defined", "'notebooklm': [" in content)

    # Check Build 877 marker
    test("Build 877 marker present", "BUILD 877" in content)
else:
    test("treeplexity.html readable", False, "File not found")

# ============================================================
# 6. PII Filter Patterns
# ============================================================
print_section("6. PII Filter Patterns")

if os.path.exists(sync_path):
    with open(sync_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check specific PII patterns
    pii_patterns = [
        "password reset",
        "verification code",
        "2FA|MFA|OTP",
        "security alert",
        "sign-in attempt"
    ]

    for pattern in pii_patterns:
        test(f"PII filter: '{pattern}'", pattern.lower() in content.lower())
else:
    for pattern in pii_patterns:
        test(f"PII filter: '{pattern}'", False, "sync.js not found")

# ============================================================
# 7. Node.js Module Load Test
# ============================================================
print_section("7. Node.js Module Load Test")

# Test that synthesizer module can be required
node_test = '''
try {
    const path = require('path');
    const synthPath = path.join(__dirname, 'packages/treelisty-mcp-bridge/src/synthesizer');
    const { createSynthesizerManager, SynthesisProvider, SynthesizerManager } = require(synthPath);

    console.log('SYNTH_LOAD_OK');

    if (typeof createSynthesizerManager === 'function') {
        console.log('CREATE_MANAGER_OK');
    }
    if (typeof SynthesisProvider === 'function') {
        console.log('PROVIDER_CLASS_OK');
    }
    if (typeof SynthesizerManager === 'function') {
        console.log('MANAGER_CLASS_OK');
    }
} catch (e) {
    console.log('SYNTH_LOAD_FAIL: ' + e.message);
}
'''

# Write temp test file
temp_test_path = os.path.join(base_path, "_temp_nblm_test.js")
with open(temp_test_path, 'w') as f:
    f.write(node_test)

output, code = run_command(f'cd "{base_path}" && node _temp_nblm_test.js')

test("Synthesizer module loads in Node.js", "SYNTH_LOAD_OK" in output,
     output.split('\n')[0] if "FAIL" in output else "")
test("createSynthesizerManager exported", "CREATE_MANAGER_OK" in output)
test("SynthesisProvider class exported", "PROVIDER_CLASS_OK" in output)
test("SynthesizerManager class exported", "MANAGER_CLASS_OK" in output)

# Cleanup temp file
try:
    os.remove(temp_test_path)
except:
    pass

# Test notebooklm module
node_test2 = '''
try {
    const path = require('path');
    const nblmPath = path.join(__dirname, 'packages/treelisty-mcp-bridge/src/notebooklm');
    const { NBLMSyncManager, NBLMQueryManager, containsSensitivePII } = require(nblmPath);

    console.log('NBLM_LOAD_OK');

    if (typeof NBLMSyncManager === 'function') {
        console.log('SYNC_MANAGER_OK');
    }
    if (typeof NBLMQueryManager === 'function') {
        console.log('QUERY_MANAGER_OK');
    }
    if (typeof containsSensitivePII === 'function') {
        // Test PII filter
        const hasPII = containsSensitivePII('Your verification code is 123456', '');
        console.log('PII_FILTER_OK:' + hasPII);
    }
} catch (e) {
    console.log('NBLM_LOAD_FAIL: ' + e.message);
}
'''

with open(temp_test_path, 'w') as f:
    f.write(node_test2)

output, code = run_command(f'cd "{base_path}" && node _temp_nblm_test.js')

test("NotebookLM module loads in Node.js", "NBLM_LOAD_OK" in output,
     output.split('\n')[0] if "FAIL" in output else "")
test("NBLMSyncManager class exported", "SYNC_MANAGER_OK" in output)
test("NBLMQueryManager class exported", "QUERY_MANAGER_OK" in output)
test("PII filter correctly detects verification codes", "PII_FILTER_OK:true" in output)

# Cleanup
try:
    os.remove(temp_test_path)
except:
    pass

# ============================================================
# Summary
# ============================================================
print(f"\n{Colors.BOLD}{'=' * 50}{Colors.RESET}")
total = results["passed"] + results["failed"]
pass_rate = (results["passed"] / total * 100) if total > 0 else 0

if results["failed"] == 0:
    print(f"{Colors.GREEN}{Colors.BOLD}ALL TESTS PASSED!{Colors.RESET}")
else:
    print(f"{Colors.YELLOW}Tests: {results['passed']}/{total} passed ({pass_rate:.1f}%){Colors.RESET}")

print(f"\n  {Colors.GREEN}Passed: {results['passed']}{Colors.RESET}")
print(f"  {Colors.RED}Failed: {results['failed']}{Colors.RESET}")

if results["failed"] > 0:
    print(f"\n{Colors.YELLOW}Fix failing tests before proceeding to Phase 2{Colors.RESET}")
    sys.exit(1)
else:
    print(f"\n{Colors.GREEN}Phase 1 Foundation verified. Ready for Phase 2!{Colors.RESET}")
    sys.exit(0)
