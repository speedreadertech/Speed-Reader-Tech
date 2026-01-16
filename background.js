/**
 * Speed Reader Extension - Background Script
 * Handles context menu, keyboard shortcuts, and script injection
 */

// Create context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'speedread-selection',
    title: 'Speed Read Selection',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'speedread-selection' && info.selectionText) {
    await injectAndOpen(tab.id, info.selectionText);
  }
});

// Handle keyboard shortcut (Ctrl+Shift+R / Cmd+Shift+R)
chrome.commands.onCommand.addListener(async (command, tab) => {
  if (command === 'speed-read-selection') {
    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => window.getSelection().toString().trim()
      });
      
      const selectedText = results?.[0]?.result;
      if (selectedText) {
        await injectAndOpen(tab.id, selectedText);
      }
    } catch (err) {
      console.error('[Speed Reader] Shortcut failed:', err);
    }
  }
});

async function injectAndOpen(tabId, text) {
  try {
    // Try sending message first (script might already be loaded on Twitter)
    try {
      await chrome.tabs.sendMessage(tabId, { action: 'ping' });
      await chrome.tabs.sendMessage(tabId, { action: 'openReader', text });
    } catch {
      // Script not loaded, inject it first
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      
      // Small delay to let script initialize
      await new Promise(r => setTimeout(r, 50));
      await chrome.tabs.sendMessage(tabId, { action: 'openReader', text });
    }
  } catch (err) {
    console.error('[Speed Reader] Injection failed:', err);
  }
}
