/**
 * TreeListy Screen Awareness Extension
 * Background Service Worker
 *
 * Connects to MCP Bridge via WebSocket and handles screen capture requests.
 */

// Configuration
const DEFAULT_BRIDGE_PORT = 3456;
const INITIAL_RECONNECT_DELAY = 5000;
const MAX_RECONNECT_DELAY = 300000; // 5 minutes max
const HEARTBEAT_INTERVAL = 30000;

// State
let ws = null;
let clientId = null;
let isConnected = false;
let reconnectTimer = null;
let heartbeatTimer = null;
let reconnectDelay = INITIAL_RECONNECT_DELAY;
let consecutiveFailures = 0;

// Generate unique client ID
function generateClientId() {
  return 'ext-' + crypto.randomUUID().slice(0, 8);
}

// Get pairing token from storage
async function getPairingToken() {
  const result = await chrome.storage.local.get(['pairingToken', 'bridgePort']);
  return {
    token: result.pairingToken || 'treelisty-local', // Default token for dev
    port: result.bridgePort || DEFAULT_BRIDGE_PORT
  };
}

// Connect to MCP Bridge
async function connectToBridge() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    return; // Already connected
  }

  const config = await getPairingToken();
  clientId = generateClientId();

  try {
    ws = new WebSocket(`ws://localhost:${config.port}`);

    ws.onopen = () => {
      console.log('[TreeListy Ext] Connected to bridge');
      isConnected = true;
      // Reset backoff on successful connection
      reconnectDelay = INITIAL_RECONNECT_DELAY;
      consecutiveFailures = 0;

      // Send handshake
      ws.send(JSON.stringify({
        type: 'handshake',
        clientType: 'extension',
        clientId: clientId,
        pairingToken: config.token,
        capabilities: [
          {
            name: 'capture_screen',
            version: '1.0',
            riskLevel: 'read',
            requiresGesture: true,
            dataTypes: ['screenshot']
          },
          {
            name: 'extract_dom',
            version: '1.0',
            riskLevel: 'read',
            requiresGesture: false,
            dataTypes: ['domText']
          },
          {
            name: 'list_tabs',
            version: '1.0',
            riskLevel: 'read',
            requiresGesture: false,
            dataTypes: ['tabMetadata']
          }
        ]
      }));

      // Start heartbeat
      startHeartbeat();

      // Update badge
      chrome.action.setBadgeText({ text: '' });
      chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);
        await handleMessage(message);
      } catch (err) {
        console.error('[TreeListy Ext] Message parse error:', err);
      }
    };

    ws.onclose = () => {
      console.log('[TreeListy Ext] Disconnected from bridge');
      isConnected = false;
      stopHeartbeat();
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      scheduleReconnect();
    };

    ws.onerror = (err) => {
      // Only log first few failures, then stay quiet
      consecutiveFailures++;
      if (consecutiveFailures <= 3) {
        console.warn('[TreeListy Ext] Bridge not available (attempt ' + consecutiveFailures + '). Start bridge with: node packages/treelisty-mcp-bridge/src/bridge.js');
      } else if (consecutiveFailures === 4) {
        console.warn('[TreeListy Ext] Bridge still unavailable. Will retry silently every ' + Math.round(reconnectDelay/1000) + 's. Click extension icon to retry now.');
      }
      // Don't log after that - reduces console spam
    };

  } catch (err) {
    console.error('[TreeListy Ext] Connection failed:', err);
    scheduleReconnect();
  }
}

// Handle incoming messages from bridge
async function handleMessage(message) {
  const { type, id, action, params } = message;

  if (type === 'handshake_ack') {
    console.log('[TreeListy Ext] Handshake acknowledged');
    return;
  }

  if (type === 'request') {
    let result;

    try {
      switch (action) {
        case 'capture_screen':
          result = await captureScreen(params);
          break;
        case 'extract_dom':
          result = await extractDom(params);
          break;
        case 'list_tabs':
          result = await listTabs(params);
          break;
        default:
          result = { error: `Unknown action: ${action}` };
      }
    } catch (err) {
      result = { error: err.message };
    }

    // Send response
    ws.send(JSON.stringify({
      type: 'response',
      id: id,
      result: result
    }));
  }
}

// Capture screenshot of visible tab
async function captureScreen(params = {}) {
  try {
    // Get active tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      return { error: 'No active tab found' };
    }

    // Capture visible tab as PNG
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' });

    // Compress the image
    const compressed = await compressImage(dataUrl, {
      maxWidth: params.maxWidth || 1600,
      quality: params.quality || 0.6
    });

    // Build provenance
    const provenance = {
      domain: new URL(tab.url).hostname,
      tabTitle: tab.title,
      tabId: tab.id,
      tabUrl: tab.url,
      capturedAt: new Date().toISOString(),
      dataTypes: ['screenshot'],
      compressed: true,
      dimensions: compressed.dimensions
    };

    return {
      success: true,
      screenshot: compressed.dataUrl,
      provenance: provenance
    };

  } catch (err) {
    console.error('[TreeListy Ext] Capture error:', err);
    return { error: err.message };
  }
}

// Compress image using OffscreenCanvas (service worker compatible)
async function compressImage(dataUrl, options) {
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();

  // Create ImageBitmap (works in service workers, unlike Image)
  const imageBitmap = await createImageBitmap(blob);

  // Calculate new dimensions
  let width = imageBitmap.width;
  let height = imageBitmap.height;

  if (width > options.maxWidth) {
    height = Math.round(height * (options.maxWidth / width));
    width = options.maxWidth;
  }

  // Create canvas and draw
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(imageBitmap, 0, 0, width, height);

  // Convert to JPEG blob
  const jpegBlob = await canvas.convertToBlob({
    type: 'image/jpeg',
    quality: options.quality
  });

  // Convert blob to base64
  const reader = new FileReader();
  const resultDataUrl = await new Promise((resolve) => {
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(jpegBlob);
  });

  return {
    dataUrl: resultDataUrl,
    dimensions: { width, height }
  };
}

// Extract DOM text from active tab
async function extractDom(params = {}) {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      return { error: 'No active tab found' };
    }

    // Execute script to extract content
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        return {
          text: document.body.innerText,
          title: document.title,
          url: window.location.href,
          // Optional: get selected text
          selection: window.getSelection()?.toString() || ''
        };
      }
    });

    const content = results[0]?.result;

    if (!content) {
      return { error: 'Could not extract page content' };
    }

    const provenance = {
      domain: new URL(tab.url).hostname,
      tabTitle: content.title,
      tabId: tab.id,
      capturedAt: new Date().toISOString(),
      dataTypes: ['domText'],
      charCount: content.text.length,
      hasSelection: content.selection.length > 0
    };

    return {
      success: true,
      domText: content.text,
      selection: content.selection,
      provenance: provenance
    };

  } catch (err) {
    console.error('[TreeListy Ext] Extract error:', err);
    return { error: err.message };
  }
}

// List open tabs
async function listTabs(params = {}) {
  try {
    const tabs = await chrome.tabs.query({});

    const tabList = tabs.map(tab => ({
      id: tab.id,
      title: tab.title,
      url: tab.url,
      domain: new URL(tab.url).hostname,
      active: tab.active,
      windowId: tab.windowId
    }));

    return {
      success: true,
      tabs: tabList,
      count: tabList.length,
      capturedAt: new Date().toISOString()
    };

  } catch (err) {
    console.error('[TreeListy Ext] List tabs error:', err);
    return { error: err.message };
  }
}

// Heartbeat to keep connection alive
function startHeartbeat() {
  stopHeartbeat();
  heartbeatTimer = setInterval(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ping', clientId }));
    }
  }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

// Reconnection logic with exponential backoff
function scheduleReconnect() {
  if (reconnectTimer) return;

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connectToBridge();
  }, reconnectDelay);

  // Exponential backoff: 5s → 10s → 20s → 40s → ... → 5min max
  reconnectDelay = Math.min(reconnectDelay * 2, MAX_RECONNECT_DELAY);
}

// Extension icon click handler - manual capture
chrome.action.onClicked.addListener(async (tab) => {
  if (!isConnected) {
    // Reset backoff on manual retry
    reconnectDelay = INITIAL_RECONNECT_DELAY;
    consecutiveFailures = 0;
    // Try to connect
    await connectToBridge();
    return;
  }

  // Trigger capture and send to bridge
  const result = await captureScreen({});

  if (result.success) {
    // Notify bridge of manual capture
    ws.send(JSON.stringify({
      type: 'manual_capture',
      clientId: clientId,
      result: result
    }));

    console.log('[TreeListy Ext] Manual capture sent');
  }
});

// Initialize on load
connectToBridge();

// Reconnect when service worker wakes up
chrome.runtime.onStartup.addListener(() => {
  connectToBridge();
});

// Handle messages from options page
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'get_status') {
    sendResponse({
      connected: isConnected,
      clientId: clientId
    });
    return true;
  }

  if (message.type === 'reconnect') {
    // Reset backoff on manual reconnect from options page
    reconnectDelay = INITIAL_RECONNECT_DELAY;
    consecutiveFailures = 0;
    connectToBridge();
    sendResponse({ ok: true });
    return true;
  }
});
