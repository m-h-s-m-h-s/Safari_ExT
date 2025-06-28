/**
 * @file src/content/main.js
 * @description The main content script, which acts as the on-page coordinator.
 *
 * This script is injected into every page and is responsible for:
 * 1.  Orchestrating the brand detection process.
 * 2.  Managing the state and display of the on-page notification UI.
 * 3.  Communicating with the background script to log events.
 * 4.  Handling dynamic page changes in Single-Page Applications (SPAs).
 *
 * @version 2.5.0
 */

/**
 * Manages all content script logic, state, and UI interactions.
 * An instance of this class is created when the script is first injected.
 * @class ChachingContentScript
 */
class ChachingContentScript {
  constructor() {
    /**
     * An instance of the BrandDetector class, used to analyze the current page.
     * @type {BrandDetector}
     */
    this.brandDetector = new BrandDetector();

    /**
     * An instance of the PdpDetector class, used to determine if a page is a PDP.
     * @type {PdpDetector}
     */
    this.pdpDetector = new PdpDetector();

    /**
     * Stores the most recent detection result from the detector.
     * This object contains the confidence score, whether it's a product page, and the product info.
     * @type {Object|null}
     */
    this.detectionResult = null;

    /**
     * A flag to prevent showing multiple notifications on a single page view.
     * @type {boolean}
     */
    this.notificationShown = false;

    /**
     * A cache for user preferences, loaded from `chrome.storage.sync`.
     * @type {Object}
     */
    this.preferences = {
      enabled: true,
      autoShow: true,
      minConfidence: 50,
      blacklistedDomains: []
    };

    // The entry point for the script's execution.
    this.init();
  }

  /**
   * Initializes the content script. This is the main entry point.
   * It loads user preferences, checks if the extension should run on the
   * current domain, and sets up listeners for page loads and messages.
   */
  async init() {
    try {
      // Asynchronously load brands from the CSV file. This must complete first.
      await window.loadBrands();

      // Asynchronously load preferences from storage.
      await this.loadPreferences();

      // Check if the user has disabled the extension or blacklisted the current site.
      if (!this.isEnabledForCurrentDomain()) {
        ChachingUtils.log('info', 'ContentScript', 'Extension is disabled for this domain.');
        return; // Stop execution if disabled.
      }

      // The detection logic should only run after the DOM is fully loaded.
      if (document.readyState === 'loading') {
        // If the DOM is still loading, wait for the DOMContentLoaded event.
        document.addEventListener('DOMContentLoaded', () => this.startDetection());
      } else {
        // If the DOM is already loaded, we can start immediately.
        this.startDetection();
      }

      // Set up a listener to handle messages from other parts of the extension
      // (like the popup or background script).
      chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        this.handleMessage(request, sender, sendResponse);
        return true; // `return true` is required for asynchronous sendResponse calls.
      });

      // Set up a listener for URL changes to support Single-Page Applications (SPAs).
      this.observeUrlChanges();

    } catch (error) {
      ChachingUtils.log('error', 'ContentScript', 'Initialization failed.', error);
    }
  }

  /**
   * Asynchronously loads user preferences from `chrome.storage.sync`.
   * This ensures the latest user settings are always available to the script.
   */
  async loadPreferences() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(this.preferences, (items) => {
        this.preferences = { ...this.preferences, ...items };
        ChachingUtils.log('info', 'ContentScript', 'User preferences loaded.', this.preferences);
        resolve();
      });
    });
  }

  /**
   * Checks if the extension is globally enabled and if the current website's
   * domain has not been blacklisted by the user.
   *
   * @returns {boolean} True if the extension should be active on the current domain.
   */
  isEnabledForCurrentDomain() {
    const currentDomain = ChachingUtils.extractDomain(window.location.href);
    return this.preferences.enabled && !this.preferences.blacklistedDomains.includes(currentDomain);
  }

  /**
   * Kicks off the product detection process. It uses a debounced function
   * to prevent it from running too frequently, which can happen during
   * rapid DOM changes on modern websites.
   */
  startDetection() {
    const detectPage = (isRetry = false) => {
      ChachingUtils.log('info', 'ContentScript', `Running detection... (Attempt: ${isRetry ? '2' : '1'})`);

      // We no longer check for PDP first. We check for brands on any page.
      this.detectionResult = this.brandDetector.detectBrandOnPage();
      
      // If a supported brand was found on the page...
      if (this.detectionResult && this.detectionResult.isSupported) {
        
        ChachingUtils.log('info', 'ContentScript', 'Supported brand detected on page.', this.detectionResult);

        if (this.preferences.autoShow && !this.notificationShown) {
          this.showNotification();
        }
        this.notifyBackgroundScript();
      } else {
        const currentHostname = window.location.hostname.toLowerCase();
        const specialMerchants = ['steals.com', 'beachcamera.com', 'videoshops.com', 'salonhq.com', 'pedalelectric.com'];
        const matchedMerchant = specialMerchants.find(merchant => currentHostname.includes(merchant));

        if (matchedMerchant) {
            ChachingUtils.log('info', 'ContentScript', `On a special merchant site: ${matchedMerchant}.`);
            this.detectionResult = {
                isSupported: true,
                isSpecialMerchant: true,
                productInfo: {
                    brand: matchedMerchant, 
                    title: `Up to 33% cash back at ${matchedMerchant}`,
                    cashback: 33
                }
            };
            if (this.preferences.autoShow && !this.notificationShown) {
                this.showNotification();
            }
            this.notifyBackgroundScript();
        } else if (!isRetry) {
          ChachingUtils.log('info', 'ContentScript', 'No supported brand found on first attempt. Scheduling a retry.');
          setTimeout(() => detectPage(true), 3000); // 3-second delay for the retry.
        } else {
          ChachingUtils.log('info', 'ContentScript', 'No supported brand was found on this page after retry.');
        }
      }
    };

    // Use a debounced function for the initial call to avoid running during rapid DOM changes.
    const debouncedDetect = ChachingUtils.debounce(() => detectPage(false), 500);
    debouncedDetect();
  }

  /**
   * Handles showing the on-page notification. It first checks if the user has
   * dismissed a notification on the exact same URL within the last 15 minutes.
   * The notification is designed to be persistent and must be manually dismissed.
   */
  async showNotification() {
    // Prevent duplicate notifications
    if (this.notificationShown || !this.detectionResult?.productInfo?.title) {
      return;
    }

    // Check if notification was dismissed recently on this specific URL (within 15 minutes)
    const dismissalKey = `dismissal_${window.location.href}`;
    const dismissalData = await this.getStorageData(dismissalKey);
    
    if (dismissalData) {
      const dismissalTime = new Date(dismissalData.timestamp).getTime();
      const currentTime = new Date().getTime();
      const fifteenMinutes = 15 * 60 * 1000; // 15 minutes in milliseconds
      
      if (currentTime - dismissalTime < fifteenMinutes) {
        ChachingUtils.log('info', 'ContentScript', 'Notification dismissed recently for this URL, skipping.');
        return;
      }
    }

    // Create notification element
    const notification = this.createNotificationElement();

    const setZIndex = (nodes) => {
      const highestZ = this.getHighestZIndex(nodes);
      // Ensure we don't accidentally lower our z-index if it's already high
      const currentZ = parseInt(notification.style.zIndex, 10) || 0;
      if (highestZ + 1 > currentZ) {
        notification.style.zIndex = highestZ + 1;
        ChachingUtils.log('info', 'ContentScript', `Dynamically set z-index to ${highestZ + 1}.`);
      }
    };

    // Set z-index immediately on creation
    setZIndex();
    
    // Add to page
    document.body.appendChild(notification);
    this.notificationShown = true;

    // Animate in
    setTimeout(() => {
      notification.classList.add('chaching-show');
    }, 100);

    // Re-check z-index after short delays to win wars against late-loading scripts.
    setTimeout(setZIndex, 500);
    setTimeout(setZIndex, 1500);

    // Use a MutationObserver to watch for other elements being added to the page
    // and re-assert our z-index if needed.
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // A new node was added. We check its z-index and its children's to ensure we stay on top.
          // A small delay allows the new element to be fully rendered before we check it.
          setTimeout(() => setZIndex(mutation.addedNodes), 100);
          return; // No need to check other mutations in this batch
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    // Store the observer on the notification element so we can disconnect it later
    notification.chachingObserver = observer;

    // NO AUTO-HIDE - notification stays until dismissed
  }

  /**
   * Creates the HTML structure for the notification element.
   * This now dynamically inserts the brand name and cashback percentage.
   *
   * @returns {HTMLElement} The fully-formed, but not-yet-inserted, notification element.
   */
  createNotificationElement() {
    const notification = document.createElement('div');
    notification.className = 'chaching-notification';

    if (this.detectionResult?.isSpecialMerchant) {
      const merchantName = this.detectionResult.productInfo.brand;
      notification.innerHTML = `
        <button class="chaching-btn chaching-btn-secondary" id="chaching-close">✕</button>
        <div class="chaching-notification-content">
          <div class="chaching-icon">
            <img src="${chrome.runtime.getURL('ChaChing_Logo.png')}" alt="ChaChing Logo" />
          </div>
          <div class="chaching-text">
            <div class="chaching-title">Get up to 33% Cash Back!</div>
            <div class="chaching-subtitle">Earn cashback at ${merchantName} when you shop through ChaChing.</div>
          </div>
          <div class="chaching-actions">
            <button class="chaching-btn chaching-btn-primary" id="chaching-search">
              Activate Cashback
            </button>
          </div>
        </div>
      `;
    } else {
      // The notification now focuses on the brand.
      const brandName = this.detectionResult?.productInfo?.brand || 'top brands';
      // For display purposes only, capitalize the first letter of the brand name.
      const displayBrandName = brandName.charAt(0).toUpperCase() + brandName.slice(1);

      notification.innerHTML = `
        <button class="chaching-btn chaching-btn-secondary" id="chaching-close">✕</button>
        <div class="chaching-notification-content">
          <div class="chaching-icon">
            <img src="${chrome.runtime.getURL('ChaChing_Logo.png')}" alt="ChaChing Logo" />
          </div>
          <div class="chaching-text">
            <div class="chaching-title">Up to 33% Cash Back - Big, Fast, Reliable</div>
            <div class="chaching-subtitle">On ${displayBrandName} products TODAY from a similar store</div>
            <div class="chaching-benchmark">Beat Amazon prices BEFORE Cash Back?! Discounts & coupons can also be further applied.</div>
          </div>
          <div class="chaching-actions">
            <button class="chaching-btn chaching-btn-primary" id="chaching-search">
              See it
            </button>
          </div>
        </div>
      `;
    }

    // Add event listeners. Note the close button is now at the top level.
    notification.querySelector('#chaching-search').addEventListener('click', () => {
      this.saveDismissalTime(); // Also save when searching
      this.searchOnChaching();
      this.hideNotification(notification);
    });

    notification.querySelector('#chaching-close').addEventListener('click', () => {
      this.saveDismissalTime();
      this.hideNotification(notification);
    });

    // No hover tracking needed since we don't auto-hide

    return notification;
  }

  /**
   * Finds the highest z-index on the page to ensure the notification is on top.
   * This function is robust, checking for newly added nodes and searching inside open Shadow DOMs.
   * @param {NodeList} [nodes] - An optional list of new nodes to check directly. If not provided, it scans the whole page.
   * @returns {number} The highest z-index found.
   */
  getHighestZIndex(nodes) {
    let highestIndex = 0;

    const elements = nodes || document.querySelectorAll('*');

    // Recursive function to find the max z-index in a node tree (including open shadow DOMs)
    const findHighestZ = (nodeList) => {
      for (const element of nodeList) {
        if (element.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        
        // Skip our own notification elements to avoid an infinite loop
        if (element.classList && element.classList.contains('chaching-notification')) {
          continue;
        }

        const style = window.getComputedStyle(element);
        const zIndex = parseInt(style.zIndex, 10);
        
        if (zIndex > highestIndex) {
          highestIndex = zIndex;
        }
        
        // If the element has a shadow root, and it's open, recursively search inside it.
        // We cannot search closed shadow roots, so we rely on checking the host element's z-index.
        if (element.shadowRoot && element.shadowRoot.mode === 'open') {
          findHighestZ(element.shadowRoot.querySelectorAll('*'));
        }
      }
    };

    findHighestZ(elements);
    
    // If no z-index is found, default to a very high number as a safety net.
    return Math.max(highestIndex, 2147483640);
  }

  /**
   * Truncates a string to a given length, appending an ellipsis if it was cut.
   * 
   * @param {string} str - The string to truncate.
   * @param {number} maxLength - The maximum allowed length.
   * @returns {string} The truncated string.
   */
  truncateTitle(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
  }

  /**
   * Hides and removes the notification element from the DOM with a fade-out animation.
   *
   * @param {HTMLElement} notification - The notification element to be removed.
   */
  hideNotification(notification) {
    // Disconnect the observer to prevent memory leaks when the notification is hidden.
    if (notification.chachingObserver) {
      notification.chachingObserver.disconnect();
    }

    notification.classList.remove('chaching-show');
    notification.classList.add('chaching-hide');
    
    // Wait for the CSS fade-out animation to complete before removing from the DOM.
    setTimeout(() => {
      notification.remove();
    }, 300);
  }

  /**
   * Opens the chaching.me search results page in a new tab for the detected brand.
   */
  searchOnChaching() {
    // The search is now based on the brand, if available. Fallback to title.
    const searchQuery = this.detectionResult?.productInfo?.brand || this.detectionResult?.productInfo?.title;

    if (!searchQuery) {
      ChachingUtils.log('error', 'ContentScript', 'Cannot search, no brand or title available.');
      return;
    }

    const chachingUrl = ChachingUtils.generateChachingUrl(searchQuery);
    
    // Log this action for analytics.
    this.trackEvent('search_initiated_from_notification', {
      query: searchQuery,
      type: this.detectionResult?.productInfo?.brand ? 'brand' : 'title',
      source_domain: window.location.hostname
    });

    // Open the URL in a new tab.
    window.open(chachingUrl, '_blank');
  }

  /**
   * Sends a message to the background script containing the details of the detected product.
   */
  notifyBackgroundScript() {
    chrome.runtime.sendMessage({
      type: 'BRAND_DETECTED', // Changed message type for clarity
      data: {
        url: window.location.href,
        brand: this.detectionResult.productInfo.brand,
        title: this.detectionResult.productInfo.title
      }
    });
  }

  /**
   * Handles incoming messages from other parts of the extension (popup, background).
   * This acts as the API for the content script.
   */
  handleMessage(request, sender, sendResponse) {
    ChachingUtils.log('info', 'ContentScript', 'Message received.', request);

    switch (request.type) {
      // The popup is requesting the latest detection result.
      case 'GET_DETECTION_RESULT':
        sendResponse({ success: true, data: this.detectionResult });
        break;

      // The popup wants to trigger a search.
      case 'TRIGGER_SEARCH':
        this.searchOnChaching();
        sendResponse({ success: true });
        break;

      // The popup wants to manually trigger the notification.
      case 'SHOW_NOTIFICATION':
        if (!this.notificationShown && this.detectionResult?.isProductPage) {
          this.showNotification();
        }
        sendResponse({ success: true });
        break;
      
      // The user has requested a re-scan of the page.
      case 'RE_DETECT':
        this.notificationShown = false;
        this.startDetection();
        sendResponse({ success: true });
        break;

      default:
        // Respond to unknown message types.
        sendResponse({ success: false, error: 'Unknown message type' });
    }
  }

  /**
   * Sets up an interval to check for URL changes. This is crucial for Single-Page
   * Applications (SPAs) where navigation doesn't trigger a full page reload.
   */
  observeUrlChanges() {
    let lastUrl = window.location.href;
    
    // Every second, check if the URL has changed.
    setInterval(() => {
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        ChachingUtils.log('info', 'ContentScript', 'URL change detected (SPA navigation), re-running detection.');
        
        // Reset the state for the new "page".
        this.notificationShown = false;
        this.detectionResult = null;
        
        // Clean up any old notifications that might still be on the page.
        document.querySelectorAll('.chaching-notification').forEach(el => el.remove());
        
        // Re-run the detection logic for the new content.
        setTimeout(() => this.startDetection(), 1000); // Wait a moment for the SPA to render.
      }
    }, 1000);
  }

  /**
   * A wrapper for sending analytics events to the background script.
   *
   * @param {string} eventName - The name of the event to track.
   * @param {Object} eventData - A JSON object of additional data.
   */
  trackEvent(eventName, eventData) {
    chrome.runtime.sendMessage({
      type: 'TRACK_EVENT',
      data: {
        event: eventName,
        ...eventData,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Saves the dismissal timestamp to storage for the current, specific URL.
   */
  async saveDismissalTime() {
    const dismissalKey = `dismissal_${window.location.href}`;
    const dismissalData = {
      timestamp: new Date().toISOString(),
      // Log both brand and title for better context.
      brand: this.detectionResult?.productInfo?.brand || 'Unknown',
      productTitle: this.detectionResult?.productInfo?.title || 'Unknown'
    };
    
    try {
      await chrome.storage.local.set({ [dismissalKey]: dismissalData });
      ChachingUtils.log('info', 'ContentScript', 'Dismissal time saved for this URL.', dismissalData);
    } catch (error) {
      ChachingUtils.log('error', 'ContentScript', 'Failed to save dismissal time.', error);
    }
  }

  /**
   * Gets data from Chrome storage
   * 
   * @param {string} key - Storage key
   * @returns {Promise<any>} The stored data or null
   */
  async getStorageData(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] || null);
      });
    });
  }
}

// Initialize the content script when the extension loads
if (typeof window !== 'undefined' && !window.chachingContentScript) {
  window.chachingContentScript = new ChachingContentScript();
} 