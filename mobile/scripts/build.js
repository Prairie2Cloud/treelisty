#!/usr/bin/env node

/**
 * TreeListy Mobile Build Script
 *
 * Copies treeplexity.html to www/index.html and injects Capacitor bridge code.
 * Run: npm run build
 */

const fs = require('fs');
const path = require('path');

const SOURCE = path.join(__dirname, '..', '..', 'treeplexity.html');
const DEST_DIR = path.join(__dirname, '..', 'www');
const DEST = path.join(DEST_DIR, 'index.html');

// Capacitor bridge code to inject before </body>
const CAPACITOR_BRIDGE = `
<!-- Capacitor Native Bridge (Build Script Injected) -->
<script>
(function() {
    'use strict';

    // Only run in Capacitor native environment
    if (!window.Capacitor?.isNativePlatform()) {
        console.log('[Capacitor] Running in web mode');
        return;
    }

    console.log('[Capacitor] Running in native mode');

    // Import plugins
    const { Haptics } = window.Capacitor.Plugins;
    const { Keyboard } = window.Capacitor.Plugins;
    const { StatusBar } = window.Capacitor.Plugins;
    const { SplashScreen } = window.Capacitor.Plugins;
    const { App } = window.Capacitor.Plugins;

    // =========================================================================
    // HAPTIC FEEDBACK
    // =========================================================================
    window.triggerHaptic = async (style = 'light') => {
        if (!Haptics) return;
        try {
            const styles = {
                light: 'Light',
                medium: 'Medium',
                heavy: 'Heavy',
                success: 'Success',
                warning: 'Warning',
                error: 'Error'
            };
            await Haptics.impact({ style: styles[style] || 'Light' });
        } catch (e) {
            console.warn('[Capacitor] Haptics error:', e);
        }
    };

    // =========================================================================
    // KEYBOARD HANDLING
    // =========================================================================
    if (Keyboard) {
        // Track keyboard state
        let keyboardHeight = 0;

        Keyboard.addListener('keyboardWillShow', (info) => {
            keyboardHeight = info.keyboardHeight;
            document.documentElement.style.setProperty('--keyboard-height', keyboardHeight + 'px');
            document.body.classList.add('keyboard-open');
            console.log('[Capacitor] Keyboard opening:', keyboardHeight);
        });

        Keyboard.addListener('keyboardWillHide', () => {
            keyboardHeight = 0;
            document.documentElement.style.setProperty('--keyboard-height', '0px');
            document.body.classList.remove('keyboard-open');
            console.log('[Capacitor] Keyboard closing');
        });

        // Expose keyboard control
        window.hideKeyboard = () => Keyboard.hide();
        window.showKeyboard = () => Keyboard.show();
    }

    // =========================================================================
    // STATUS BAR
    // =========================================================================
    if (StatusBar) {
        // Set status bar style to match app theme
        StatusBar.setStyle({ style: 'Dark' });
        StatusBar.setBackgroundColor({ color: '#1a1a2e' });
    }

    // =========================================================================
    // SPLASH SCREEN
    // =========================================================================
    if (SplashScreen) {
        // Hide splash after app is ready
        window.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                SplashScreen.hide();
                console.log('[Capacitor] Splash screen hidden');
            }, 500);
        });
    }

    // =========================================================================
    // APP LIFECYCLE
    // =========================================================================
    if (App) {
        // Handle app state changes
        App.addListener('appStateChange', ({ isActive }) => {
            console.log('[Capacitor] App state:', isActive ? 'active' : 'background');
            if (isActive) {
                // App came to foreground - could refresh data here
                document.dispatchEvent(new CustomEvent('capacitor:resume'));
            } else {
                // App went to background - save state
                document.dispatchEvent(new CustomEvent('capacitor:pause'));
            }
        });

        // Handle back button (Android)
        App.addListener('backButton', ({ canGoBack }) => {
            if (canGoBack) {
                window.history.back();
            } else {
                // Optionally minimize app instead of closing
                App.minimizeApp();
            }
        });
    }

    // =========================================================================
    // SAFE AREA INSETS
    // =========================================================================
    // iOS notch/Dynamic Island handling
    const setSafeAreas = () => {
        const root = document.documentElement;
        root.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
        root.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
        root.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
        root.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
    };
    setSafeAreas();

    // =========================================================================
    // NATIVE READY EVENT
    // =========================================================================
    document.dispatchEvent(new CustomEvent('capacitor:ready'));
    console.log('[Capacitor] Bridge initialized');

})();
</script>
`;

// CSS additions for native app
const CAPACITOR_CSS = `
<!-- Capacitor Native Styles (Build Script Injected) -->
<style>
/* Safe area handling for iOS notch/Dynamic Island */
:root {
    --safe-area-top: env(safe-area-inset-top);
    --safe-area-bottom: env(safe-area-inset-bottom);
    --safe-area-left: env(safe-area-inset-left);
    --safe-area-right: env(safe-area-inset-right);
    --keyboard-height: 0px;
}

/* Adjust main container for safe areas */
body.capacitor-native {
    padding-top: var(--safe-area-top);
    padding-bottom: var(--safe-area-bottom);
    padding-left: var(--safe-area-left);
    padding-right: var(--safe-area-right);
}

/* Keyboard open state */
body.keyboard-open {
    /* Shrink content when keyboard is open */
}

body.keyboard-open .tree-view-container {
    padding-bottom: var(--keyboard-height);
}

/* Disable pull-to-refresh on iOS (we handle refresh ourselves) */
body {
    overscroll-behavior-y: none;
}

/* Disable text selection highlight on tap (iOS) */
* {
    -webkit-tap-highlight-color: transparent;
    -webkit-touch-callout: none;
}

/* Fix iOS input zoom */
input, textarea, select {
    font-size: 16px !important;
}

/* Keyboard accessory bar (future) */
.keyboard-accessory-bar {
    position: fixed;
    bottom: var(--keyboard-height);
    left: 0;
    right: 0;
    height: 44px;
    background: var(--bg-secondary, #2a2a4a);
    border-top: 1px solid var(--border, #3a3a5a);
    display: none;
    flex-direction: row;
    align-items: center;
    justify-content: space-around;
    padding: 0 16px;
    z-index: 10000;
}

body.keyboard-open .keyboard-accessory-bar {
    display: flex;
}

.keyboard-accessory-bar button {
    width: 44px;
    height: 36px;
    border: none;
    background: var(--bg-tertiary, #3a3a6a);
    border-radius: 6px;
    color: var(--text-primary, #fff);
    font-size: 18px;
    cursor: pointer;
}

.keyboard-accessory-bar button:active {
    background: var(--accent, #6366f1);
}
</style>
`;

function build() {
    console.log('TreeListy Mobile Build');
    console.log('======================');

    // Check source exists
    if (!fs.existsSync(SOURCE)) {
        console.error('ERROR: treeplexity.html not found at:', SOURCE);
        process.exit(1);
    }

    // Ensure www directory exists
    if (!fs.existsSync(DEST_DIR)) {
        fs.mkdirSync(DEST_DIR, { recursive: true });
        console.log('Created:', DEST_DIR);
    }

    // Read source
    console.log('Reading:', SOURCE);
    let html = fs.readFileSync(SOURCE, 'utf8');

    // Check if already injected (avoid double injection)
    if (html.includes('Capacitor Native Bridge')) {
        console.log('Capacitor bridge already present, skipping injection');
    } else {
        // Inject CSS before </head>
        html = html.replace('</head>', CAPACITOR_CSS + '\n</head>');
        console.log('Injected: Capacitor CSS');

        // Inject JS before </body>
        html = html.replace('</body>', CAPACITOR_BRIDGE + '\n</body>');
        console.log('Injected: Capacitor bridge');
    }

    // Add capacitor-native class to body for CSS targeting
    html = html.replace('<body', '<body class="capacitor-native"');

    // Write output
    fs.writeFileSync(DEST, html);
    console.log('Written:', DEST);

    // Copy any additional assets if needed
    // (welcome JSON, icons, etc.)
    const assets = [
        'welcome-to-treelisty.json',
        'assets/treelisty-icon.png'
    ];

    for (const asset of assets) {
        const srcPath = path.join(__dirname, '..', '..', asset);
        const destPath = path.join(DEST_DIR, asset);

        if (fs.existsSync(srcPath)) {
            // Ensure destination directory exists
            const destDir = path.dirname(destPath);
            if (!fs.existsSync(destDir)) {
                fs.mkdirSync(destDir, { recursive: true });
            }
            fs.copyFileSync(srcPath, destPath);
            console.log('Copied:', asset);
        }
    }

    console.log('======================');
    console.log('Build complete!');
    console.log('Next: npm run sync && npm run ios');
}

build();
