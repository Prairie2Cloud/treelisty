// Options page script

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved settings
  const settings = await chrome.storage.local.get(['bridgePort', 'pairingToken']);

  document.getElementById('port').value = settings.bridgePort || 3456;
  document.getElementById('token').value = settings.pairingToken || 'treelisty-local';

  // Check connection status
  updateStatus();

  // Save button
  document.getElementById('save').addEventListener('click', async () => {
    const port = parseInt(document.getElementById('port').value) || 3456;
    const token = document.getElementById('token').value || 'treelisty-local';

    await chrome.storage.local.set({
      bridgePort: port,
      pairingToken: token
    });

    showToast();

    // Trigger reconnect with new settings
    chrome.runtime.sendMessage({ type: 'reconnect' });

    // Update status after a moment
    setTimeout(updateStatus, 1000);
  });

  // Reconnect button
  document.getElementById('reconnect').addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'reconnect' });
    setTimeout(updateStatus, 1000);
  });
});

async function updateStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'get_status' });

    const statusEl = document.getElementById('status');
    const textEl = document.getElementById('status-text');

    if (response.connected) {
      statusEl.className = 'status connected';
      textEl.textContent = `Connected (${response.clientId})`;
    } else {
      statusEl.className = 'status disconnected';
      textEl.textContent = 'Disconnected - Check bridge is running';
    }
  } catch (err) {
    console.error('Status check failed:', err);
  }
}

function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2000);
}
