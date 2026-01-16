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

// INJECT CONTENT SCRIPT ON EVERY PAGE LOAD
// This ensures the floating button always works
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only inject when page is fully loaded
  if (changeInfo.status !== 'complete') return;
  
  // Skip chrome:// and other restricted URLs
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || 
      tab.url.startsWith('about:') || tab.url.startsWith('edge://') || tab.url.startsWith('brave://')) {
    return;
  }
  
  try {
    // Check if script is already loaded
    await chrome.tabs.sendMessage(tabId, { action: 'ping' });
  } catch {
    // Script not loaded, inject it
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['content.js']
      });
      console.log('[Speed Reader] Injected into tab', tabId);
    } catch (err) {
      // Injection failed (restricted page), ignore
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'speedread-selection' && info.selectionText) {
    await injectAndOpen(tab.id, info.selectionText);
  }
});

// Handle keyboard shortcut (Alt+S / Option+S)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'speed-read-selection') {
    try {
      // Get the currently active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) return;
      
      // Get selected text from the page
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
