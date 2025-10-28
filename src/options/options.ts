/**
 * Options page logic for TweetYoink extension
 * Feature: 003-config-endpoint
 */

import { getConfig, saveConfig, getCustomHeaders, saveCustomHeaders } from '../services/config-service';
import type { HeaderEntry } from '../types/config';

// Load saved configuration
async function loadOptions() {
  const config = await getConfig();

  (document.getElementById('endpoint-url') as HTMLInputElement).value = config.endpointUrl;
  (document.getElementById('post-timeout') as HTMLInputElement).value = config.postTimeoutSeconds.toString();
  (document.getElementById('enable-polling') as HTMLInputElement).checked = config.enablePolling;
  (document.getElementById('polling-interval') as HTMLInputElement).value = config.pollingIntervalSeconds.toString();

  // Load custom headers
  await loadCustomHeaders();

  await updatePermissionStatus();
}

// Save configuration
async function handleSave() {
  const endpointUrl = (document.getElementById('endpoint-url') as HTMLInputElement).value.trim();
  const postTimeoutSeconds = parseInt((document.getElementById('post-timeout') as HTMLInputElement).value);
  const enablePolling = (document.getElementById('enable-polling') as HTMLInputElement).checked;
  const pollingIntervalSeconds = parseInt((document.getElementById('polling-interval') as HTMLInputElement).value);

  try {
    // Save config
    await saveConfig({
      endpointUrl,
      postTimeoutSeconds,
      enablePolling,
      pollingIntervalSeconds,
    });

    // Save custom headers
    await saveCurrentHeaders();

    showStatus('Configuration saved successfully!', 'success');

    // Request permission if endpoint URL changed
    if (endpointUrl) {
      await requestPermissionForEndpoint(endpointUrl);
    }
  } catch (error) {
    showStatus(`Error: ${(error as Error).message}`, 'error');
  }
}

// Request host permission
async function requestPermissionForEndpoint(url: string) {
  try {
    const parsedUrl = new URL(url);
    const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}/*`;

    const granted = await chrome.permissions.request({ origins: [origin] });

    if (granted) {
      showStatus('Permission granted for endpoint domain', 'success');
    } else {
      showStatus('Permission denied - extension cannot POST to this domain', 'error');
    }

    await updatePermissionStatus();
  } catch (error) {
    showStatus(`Invalid URL: ${(error as Error).message}`, 'error');
  }
}

// Update permission status display
async function updatePermissionStatus() {
  const endpointUrl = (document.getElementById('endpoint-url') as HTMLInputElement).value.trim();
  const statusEl = document.getElementById('permission-status')!;

  if (!endpointUrl) {
    statusEl.textContent = '';
    statusEl.className = '';
    return;
  }

  try {
    const parsedUrl = new URL(endpointUrl);
    const origin = `${parsedUrl.protocol}//${parsedUrl.hostname}/*`;

    const hasPermission = await chrome.permissions.contains({ origins: [origin] });

    if (hasPermission) {
      statusEl.textContent = '✓ Permission granted';
      statusEl.className = 'granted';
    } else {
      statusEl.textContent = '✗ Permission required';
      statusEl.className = 'denied';
    }
  } catch {
    statusEl.textContent = '';
    statusEl.className = '';
  }
}

// Test connection to endpoint
async function testConnection() {
  const endpointUrl = (document.getElementById('endpoint-url') as HTMLInputElement).value.trim();

  if (!endpointUrl) {
    showStatus('Please enter an endpoint URL first', 'error');
    return;
  }

  const button = document.getElementById('test-connection') as HTMLButtonElement;
  button.disabled = true;
  button.textContent = 'Testing...';

  try {
    // Send test message to service worker
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_ENDPOINT',
      url: endpointUrl
    });

    if (response.success) {
      showStatus('Connection successful!', 'success');
    } else {
      showStatus(`Connection failed: ${response.error}`, 'error');
    }
  } catch (error) {
    showStatus(`Test failed: ${(error as Error).message}`, 'error');
  } finally {
    button.disabled = false;
    button.textContent = 'Test Connection';
  }
}

// Show status message
function showStatus(message: string, type: 'success' | 'error') {
  const statusEl = document.getElementById('status-message')!;
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;

  // Only auto-hide success messages, keep errors visible
  if (type === 'success') {
    setTimeout(() => {
      statusEl.className = 'status-message';
      statusEl.textContent = '';
    }, 5000);
  }
  // Errors stay visible until next action
}

// Custom headers management
async function loadCustomHeaders() {
  const customHeaders = await getCustomHeaders();
  const headersList = document.getElementById('headers-list')!;
  headersList.innerHTML = '';

  customHeaders.headers.forEach((header, index) => {
    addHeaderRow(header, index);
  });
}

function addHeaderRow(header: HeaderEntry | null = null, index?: number) {
  const headersList = document.getElementById('headers-list')!;
  const row = document.createElement('div');
  row.className = 'header-row';
  row.dataset.index = index !== undefined ? index.toString() : Date.now().toString();

  const keyInput = document.createElement('input');
  keyInput.type = 'text';
  keyInput.placeholder = 'Header name (e.g., Authorization)';
  keyInput.value = header?.key || '';
  keyInput.className = 'header-key';

  const valueInput = document.createElement('input');
  valueInput.type = 'text';
  valueInput.placeholder = 'Header value';
  valueInput.value = header?.value || '';
  valueInput.className = 'header-value';

  const enabledLabel = document.createElement('label');
  const enabledCheckbox = document.createElement('input');
  enabledCheckbox.type = 'checkbox';
  enabledCheckbox.checked = header?.enabled !== false;
  enabledCheckbox.className = 'header-enabled';
  enabledLabel.appendChild(enabledCheckbox);
  enabledLabel.appendChild(document.createTextNode('Enabled'));

  const sensitiveLabel = document.createElement('label');
  const sensitiveCheckbox = document.createElement('input');
  sensitiveCheckbox.type = 'checkbox';
  sensitiveCheckbox.checked = header?.sensitive || false;
  sensitiveCheckbox.className = 'header-sensitive';
  sensitiveLabel.appendChild(sensitiveCheckbox);
  sensitiveLabel.appendChild(document.createTextNode('Sensitive'));

  const removeBtn = document.createElement('button');
  removeBtn.textContent = '×';
  removeBtn.className = 'button button-icon';
  removeBtn.title = 'Remove header';
  removeBtn.addEventListener('click', () => {
    row.remove();
  });

  row.appendChild(keyInput);
  row.appendChild(valueInput);
  row.appendChild(enabledLabel);
  row.appendChild(sensitiveLabel);
  row.appendChild(removeBtn);

  headersList.appendChild(row);
}

async function saveCurrentHeaders() {
  const headersList = document.getElementById('headers-list')!;
  const rows = headersList.querySelectorAll('.header-row');

  const headers: HeaderEntry[] = [];

  rows.forEach(row => {
    const key = (row.querySelector('.header-key') as HTMLInputElement).value.trim();
    const value = (row.querySelector('.header-value') as HTMLInputElement).value.trim();
    const enabled = (row.querySelector('.header-enabled') as HTMLInputElement).checked;
    const sensitive = (row.querySelector('.header-sensitive') as HTMLInputElement).checked;

    if (key && value) {
      headers.push({ key, value, enabled, sensitive });
    }
  });

  await saveCustomHeaders({ headers });
}

// Event listeners
document.getElementById('save-config')!.addEventListener('click', handleSave);
document.getElementById('test-connection')!.addEventListener('click', testConnection);
document.getElementById('add-header')!.addEventListener('click', () => addHeaderRow());
document.getElementById('grant-permission')!.addEventListener('click', async () => {
  const url = (document.getElementById('endpoint-url') as HTMLInputElement).value.trim();
  if (url) {
    await requestPermissionForEndpoint(url);
  } else {
    showStatus('Please enter an endpoint URL first', 'error');
  }
});

// Update permission status when URL changes
document.getElementById('endpoint-url')!.addEventListener('input', updatePermissionStatus);

// Load options on page load
document.addEventListener('DOMContentLoaded', loadOptions);
