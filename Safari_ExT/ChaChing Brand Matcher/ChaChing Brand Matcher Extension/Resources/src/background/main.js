console.log("[Background] Script loaded at", new Date().toISOString());
/**
 * @file src/background/main.js
 * @description The background service worker for the ChaChing Extension.
 *
 * This script is the persistent "brain" of the extension. It is event-driven
 * and is responsible for programmatically injecting scripts into tabs when
 * the user navigates to a relevant page.
 *
 * Key Responsibilities:
 * - Handling extension lifecycle events (onInstalled, onUpdated).
 * - Listening for tab updates to trigger the injection flow.
 * - Programmatically injecting detector scripts onto a page.
 * - Conditionally injecting the UI (content script and CSS) if a supported brand is found.
 * - Storing tab-specific data (e.g., the detected brand) for the popup.
 * - Creating the right-click context menu.
 * - Aggregating analytics events.
 *
 * @version 2.2.0
 */

/**
 * A central configuration object for settings used throughout the background script.
 * @const {Object}
 */
const CONFIG = {
  ANALYTICS_ENABLED: true, // A global flag to enable or disable analytics logging.
  BADGE_COLORS: {
    DETECTED: '#4CAF50', // The color for the badge when a product is found.
    ERROR: '#F44336'    // A color for potential error states.
  }
};

/**
 * A Map to store product detection data on a per-tab basis.
 * The key is the tab ID (number), and the value is the detection result object.
 * This is used to pass data to the popup when it opens.
 * @type {Map<number, Object>}
 */
const detectedProducts = new Map();

/**
 * A list of domains to exclude from script injection.
 * Includes top non-shopping sites to avoid unnecessary processing.
 * @const {string[]}
 */
const EXCLUDED_DOMAINS = [
  // Original exclusions
  'chaching.me',
  'localhost',
  '127.0.0.1',
  
  // Search engines
  'google.com',
  'bing.com',
  'yahoo.com',
  'duckduckgo.com',
  'baidu.com',
  'yandex.com',
  
  // Social media
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'linkedin.com',
  'pinterest.com',
  'tiktok.com',
  'snapchat.com',
  'reddit.com',
  'tumblr.com',
  'discord.com',
  
  // Video/streaming
  'youtube.com',
  'netflix.com',
  'twitch.tv',
  'vimeo.com',
  'dailymotion.com',
  'hulu.com',
  'disneyplus.com',
  'hbomax.com',
  'peacocktv.com',
  'paramountplus.com',
  'spotify.com',
  'soundcloud.com',
  'pandora.com',
  
  // Communication
  'gmail.com',
  'outlook.com',
  'yahoo.com',
  'mail.google.com',
  'messenger.com',
  'whatsapp.com',
  'telegram.org',
  'slack.com',
  'zoom.us',
  'teams.microsoft.com',
  
  // News/media
  'cnn.com',
  'bbc.com',
  'nytimes.com',
  'theguardian.com',
  'wsj.com',
  'forbes.com',
  'bloomberg.com',
  'reuters.com',
  'apnews.com',
  'npr.org',
  'foxnews.com',
  'nbcnews.com',
  'washingtonpost.com',
  'usatoday.com',
  'time.com',
  
  // Reference/education
  'wikipedia.org',
  'wikimedia.org',
  'archive.org',
  'britannica.com',
  'dictionary.com',
  'thesaurus.com',
  'coursera.org',
  'udemy.com',
  'edx.org',
  'khanacademy.org',
  'duolingo.com',
  
  // Developer/tech
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'stackoverflow.com',
  'developer.mozilla.org',
  'w3schools.com',
  'codepen.io',
  'jsfiddle.net',
  'replit.com',
  
  // Productivity/business
  'docs.google.com',
  'drive.google.com',
  'dropbox.com',
  'notion.so',
  'trello.com',
  'asana.com',
  'monday.com',
  'airtable.com',
  'salesforce.com',
  
  // Banking/finance (non-shopping)
  'paypal.com',
  'chase.com',
  'bankofamerica.com',
  'wellsfargo.com',
  'citibank.com',
  'americanexpress.com',
  'capitalone.com',
  'discover.com',
  'mint.com',
  'creditkarma.com',
  
  // Government
  'irs.gov',
  'usa.gov',
  'state.gov',
  'cdc.gov',
  'nih.gov',
  
  // Adult content
  'pornhub.com',
  'xvideos.com',
  'xnxx.com',
  
  // Gaming (non-shopping)
  'steampowered.com',
  'epicgames.com',
  'roblox.com',
  'minecraft.net',
  
  // Other popular non-shopping sites
  'weather.com',
  'weather.gov',
  'imdb.com',
  'yelp.com',
  'tripadvisor.com',
  'airbnb.com',
  'booking.com',
  'expedia.com',
  'zillow.com',
  'realtor.com',
  'indeed.com',
  'glassdoor.com',
  'craigslist.org'
];

/**
* Listens for the `onInstalled` event, which fires when the extension is first
* installed, updated to a new version, or when the browser is updated.
*/
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Background] onInstalled event fired. Reason:', details.reason);
  
  // On first installation, set up the default user preferences in storage.
  if (details.reason === 'install') {
    // Check if we've already set up the extension to prevent duplicate actions
    chrome.storage.sync.get(['installDate'], (result) => {
      if (!result.installDate) {
        // First time install - set preferences and open welcome page
        chrome.storage.sync.set({
          enabled: true,
          autoShow: true,
          minConfidence: 50,
          blacklistedDomains: [],
          installDate: new Date().toISOString(),
          version: chrome.runtime.getManifest().version
        }, () => {
          console.log('[Background] Default preferences have been set.');
          
          // Welcome page disabled for development
          // chrome.tabs.create({
          //   url: 'https://chaching.me/welcome?source=safari-extension'
          // });
        });
      } else {
        console.log('[Background] Extension already installed, skipping welcome page.');
      }
    });
  }
  
  // If the extension was updated, we can perform migration tasks or show a notification.
  if (details.reason === 'update') {
    const { previousVersion, currentVersion } = {
      previousVersion: details.previousVersion,
      currentVersion: chrome.runtime.getManifest().version
    };
    
    console.log(`[Background] Extension updated from v${previousVersion} to v${currentVersion}.`);
    
    // Example: Show an update notification if it's a major version change.
    if (previousVersion && previousVersion.split('.')[0] !== currentVersion.split('.')[0]) {
      showUpdateNotification(currentVersion);
    }
  }

  // Create the right-click context menu item upon installation.
  // This is placed inside onInstalled to ensure it's only created once.
  chrome.contextMenus.create({
    id: 'search-chaching',
    title: 'Search "%s" on ChaChing', // '%s' is a placeholder for the selected text.
    contexts: ['selection'] // This menu item will only appear when text is selected.
  });
});

/**
 * Handles the DETECTION_COMPLETE message from runner.js
 * @param {Object} data - The detection results
 * @param {chrome.tabs.Tab} tab - The tab that sent the message
 */
async function handleDetectionComplete(data, tab) {
  const { brandResult, isPdp } = data;
  const tabId = tab.id;
  
  if (brandResult && brandResult.isSupported && isPdp) {
    console.log(`[Background] Supported brand "${brandResult.brand}" found on PDP for tab ${tabId}. Injecting UI...`);
    
    // Store the result for the popup
    detectedProducts.set(tabId, {
      ...brandResult,
      isPdp: isPdp,
      detectedAt: new Date().toISOString(),
      tabId: tabId,
      domain: new URL(tab.url).hostname
    });
    
    try {
      // Inject the UI (CSS and main content script)
      await chrome.scripting.insertCSS({
        target: { tabId: tabId },
        files: ["content_styles.css"],
      });

      await chrome.scripting.executeScript({
        target: { tabId: tabId },
        files: ["content_main.js"],
      });
      
      console.log(`[Background] UI injected successfully for tab ${tabId}`);
    } catch (error) {
      console.error(`[Background] Failed to inject UI for tab ${tabId}:`, error);
    }
  } else {
    if (brandResult && brandResult.isSupported && !isPdp) {
      console.log(`[Background] Supported brand found but NOT on a PDP for tab ${tabId}. Skipping UI injection.`);
    } else {
      console.log(`[Background] No supported brand found on tab ${tabId}.`);
    }
    // Clear any old data for this tab
    if (detectedProducts.has(tabId)) {
      detectedProducts.delete(tabId);
    }
  }
}

/**
 * The central message listener for the extension. It handles all communication
 * from content scripts and the popup UI.
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('[Background] Message received:', { type: request.type, sender_tab: sender.tab?.id });
  
  switch (request.type) {
    // The runner.js script has completed detection
    case 'DETECTION_COMPLETE':
      handleDetectionComplete(request.data, sender.tab);
      sendResponse({ success: true });
      break;
      
    // Detection encountered an error
    case 'DETECTION_ERROR':
      console.error('[Background] Detection error:', request.error);
      sendResponse({ success: true });
      break;
    
    // A content script is sending an analytics event to be logged.
    case 'TRACK_EVENT':
      trackAnalyticsEvent(request.data);
      sendResponse({ success: true });
      break;
      
    // The popup is requesting the data for its current tab.
    case 'GET_TAB_DATA':
      const tabData = detectedProducts.get(sender.tab?.id);
      sendResponse({ success: true, data: tabData });
      break;
      
    default:
      console.warn('[Background] Received an unknown message type:', request.type);
      sendResponse({ success: false, error: 'Unknown message type' });
  }
  
  return true; // Required for asynchronous `sendResponse`.
});

/**
 * Listens for when a tab is updated (e.g., the user navigates to a new URL).
 * This is now the main trigger for our brand detection and UI injection logic.
 * It ensures our UI loads last, preventing other extensions from overlaying it.
 */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log('[Background] Tab update detected:', { tabId, changeInfo, url: tab?.url });
  console.log('[Background] Tab onUpdated fired! TabId:', tabId, 'ChangeInfo:', JSON.stringify(changeInfo), 'Tab URL:', tab?.url);
  
  // Safari doesn't always provide changeInfo.status, so we need to check for URL changes too
  // We want to run when status is 'complete' OR when the URL has changed (Safari behavior)
  if (changeInfo.status !== 'complete' && !changeInfo.url) {
    console.log('[Background] Skipping - status:', changeInfo.status, 'url:', changeInfo.url);
    return;
  }
  
  // Safari doesn't always provide the URL in the tab object, so we need to query for it
  try {
    const tabInfo = await chrome.tabs.get(tabId);
    if (!tabInfo.url) {
      console.log('[Background] No URL available for tab:', tabId);
      return;
    }
    
    // Check if the URL's domain is on our exclusion list.
    const url = new URL(tabInfo.url);
    if (EXCLUDED_DOMAINS.some(domain => url.hostname.includes(domain))) {
      console.log(`[Background] Skipping tab ${tabId} on excluded domain: ${url.hostname}`);
      return;
    }
    
    // Update tab object with the URL for the rest of the function
    tab = tabInfo;
  } catch (error) {
    console.warn(`[Background] Could not get tab info or parse URL:`, error);
    return;
  }

  console.log(`[Background] Tab ${tabId} updated to complete status. Running detector...`);

  try {
    // Inject all detection scripts including runner.js which will orchestrate the detection
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      files: [
        "utils.js",
        "brands.js",
        "brand-detector.js",
        "pdp-detector.js",
        "runner.js"
      ],
    });
    
    // The runner.js will send a DETECTION_COMPLETE message when done
    console.log(`[Background] Detection scripts injected into tab ${tabId}. Waiting for results...`);
    
  } catch (error) {
    // This can happen if the page is a special Chrome page, has content security
    // policies that block injection, or has already been invalidated (e.g., user navigated away).
    console.warn(`[Background] Could not inject scripts into tab ${tabId}:`, error.message);
  }
});

/**
 * Listens for when a tab is closed. We use this to perform garbage collection
 * and remove the data for the closed tab from our `detectedProducts` Map.
 */
chrome.tabs.onRemoved.addListener((tabId) => {
  if (detectedProducts.has(tabId)) {
    detectedProducts.delete(tabId);
    console.log(`[Background] Cleaned up data for closed tab: ${tabId}`);
  }
});

/**
 * A mock analytics tracking function. In a real-world scenario, this would send
 * data to a service like Google Analytics, Mixpanel, or a private analytics endpoint.
 * For now, it just logs the event to the console.
 *
 * @param {Object} eventData - The event data to be logged.
 */
function trackAnalyticsEvent(eventData) {
  if (!CONFIG.ANALYTICS_ENABLED) return;
  
  // Enrich the event data with common properties for better context.
  const enrichedData = {
    ...eventData,
    extensionVersion: chrome.runtime.getManifest().version,
    userAgent: navigator.userAgent,
    timestamp: new Date().toISOString()
  };
  
  console.log('[Background] Analytics Event:', enrichedData);
  
  // TODO: Replace with a real analytics service call.
  // Example: fetch('https://analytics.chaching.me/track', { method: 'POST', body: JSON.stringify(enrichedData) });
}

/**
 * Shows a system notification to the user. Used here to announce updates.
 *
 * @param {string} version - The new version number to display in the message.
 */
function showUpdateNotification(version) {
  // Safari doesn't support chrome.notifications API
  if (chrome.notifications && chrome.notifications.create) {
    chrome.notifications.create('update-notification', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('ChaChing_Logo.png'),
      title: 'ChaChing Searcher Updated!',
      message: `Extension updated to version ${version}. Click to see what's new!`,
      buttons: [{ title: 'View Changes' }],
      priority: 1
    });
  } else {
    // Fallback: just open the changelog page directly for Safari
    console.log(`[Background] Extension updated to version ${version}. Opening changelog.`);
    chrome.tabs.create({ url: 'https://chaching.me/extension-changelog' });
  }
}

/**
 * Listens for clicks on buttons within our created notifications.
 */
if (chrome.notifications && chrome.notifications.onButtonClicked) {
  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId === 'update-notification' && buttonIndex === 0) {
      // Open the changelog page when the "View Changes" button is clicked.
      chrome.tabs.create({ url: 'https://chaching.me/extension-changelog' });
    }
  });
}

/**
 * Listens for clicks on the context menu item we created.
 */
chrome.contextMenus.onClicked.addListener((info, tab) => {
  // Ensure the click was on our specific menu item and that text was selected.
  if (info.menuItemId === 'search-chaching' && info.selectionText) {
    // Sanitize and format the selected text for the search query.
    const query = info.selectionText
      .replace(/[^\w\s\-\.']/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '+');
    const searchUrl = `https://chaching.me/us/search?query=${query}`;
    
    chrome.tabs.create({ url: searchUrl });
    
    trackAnalyticsEvent({
      event: 'context_menu_search',
      // Truncate search text for privacy in analytics.
      searchText: info.selectionText.substring(0, 50)
    });
  }
});

/**
 * A periodic task that runs to clean up any stale data from the `detectedProducts` Map.
 * This is a safeguard against memory leaks if the `onRemoved` or `onUpdated` tab
 * listeners were to fail for any reason.
 */
setInterval(() => {
  const now = Date.now();
  const MAX_AGE = 30 * 60 * 1000; // 30 minutes in milliseconds.
  
  for (const [tabId, data] of detectedProducts.entries()) {
    const detectedTime = new Date(data.detectedAt).getTime();
    if (now - detectedTime > MAX_AGE) {
      detectedProducts.delete(tabId);
      console.log(`[Background] Cleaned up stale data for tab (via setInterval): ${tabId}`);
    }
  }
}, 5 * 60 * 1000); // Run this cleanup task every 5 minutes.

console.log('[Background] Service worker initialized successfully.');

// Test if we can access tabs API
setTimeout(() => {
  console.log('[Background] Testing tabs API access...');
  chrome.tabs.query({}, (tabs) => {
    console.log('[Background] Current tabs count:', tabs.length);
    if (tabs.length > 0) {
      console.log('[Background] First tab URL:', tabs[0].url);
    }
  });
}, 2000); 