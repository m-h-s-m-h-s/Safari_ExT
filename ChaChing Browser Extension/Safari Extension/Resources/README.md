# ChaChing Brand Matcher Safari Extension

This directory contains the Safari Web Extension components for ChaChing Brand Matcher.

## Current Version: 2.2.0

### Recent Changes
- Fixed UI showing on non-product pages (now requires isPdp check)
- Added PDP (Product Detail Page) detection requirement
- Improved Safari compatibility
- Enhanced detection accuracy

## Architecture

### Detection Flow
1. **Background Script** (`main.js`)
   - Monitors tab updates
   - Injects detection scripts
   - Handles detection results
   - Controls UI injection (only on product pages)

2. **Detection Scripts** (injected in order)
   - `utils.js` - Utility functions
   - `brands.js` - Brand list and utilities
   - `brand-detector.js` - Brand detection logic
   - `pdp-detector.js` - Product page detection
   - `runner.js` - Orchestrates detection

3. **UI Scripts** (injected only on product pages)
   - `content_styles.css` - UI styling
   - `content_main.js` - UI logic

### Key Components

#### Brand Detection (`brand-detector.js`)
- Detects supported brands from domain, content, and metadata
- Uses voting system for accuracy
- Returns brand info and support status

#### PDP Detection (`pdp-detector.js`)
- **Required**: Action buttons (Add to Cart, Buy Now, etc.)
- **Scoring System** (75/100 points needed):
  - Product price: 35 points
  - Product images: 20 points  
  - URL patterns: 25 points
  - Breadcrumbs: 15 points
  - Shipping info: 15 points
  - Reviews: 10 points
  - Product title: 10 points

#### Runner (`runner.js`)
- Orchestrates the detection process
- Sends results to background script
- Handles errors gracefully

### Configuration

#### Excluded Domains
The extension automatically skips:
- Social media sites
- News and media sites
- Banking/finance sites
- Government sites
- Developer tools
- Non-shopping sites

See `EXCLUDED_DOMAINS` in `main.js` for full list.

#### Manifest Configuration
- Uses Manifest V3
- Service worker for background script
- Programmatic script injection
- **IMPORTANT**: All files referenced WITHOUT src/ prefix in manifest

### File Structure

**IMPORTANT**: Safari extensions require a specific file structure. During build, files from the src/ subdirectories are copied to the root Resources directory.

#### Development Structure (in src/):
```
Resources/
├── manifest.json
└── src/
    ├── background/
    │   └── main.js
    ├── content/
    │   ├── brand-detector.js
    │   ├── pdp-detector.js
    │   ├── runner.js
    │   ├── content_main.js
    │   ├── content_styles.css
    │   └── brands.js
    ├── popup/
    │   ├── index.html
    │   ├── popup.js
    │   └── styles.css
    ├── shared/
    │   └── utils.js
    └── assets/
        ├── ChaChing_Logo.png
        └── BrandList.csv
```

#### Runtime Structure (what Safari sees):
```
Resources/
├── manifest.json
├── main.js
├── utils.js
├── brands.js
├── brand-detector.js
├── pdp-detector.js
├── runner.js
├── content_main.js
├── content_styles.css
├── popup.js
├── styles.css
├── index.html
├── ChaChing_Logo.png
├── BrandList.csv
└── src/ (development files, not used at runtime)
```

### Debugging

#### Console Commands
```javascript
// Check if scripts are loaded
window.BrandDetector
window.PdpDetector

// Test detection
window.debugDetection()

// Check detection state
window.detectionState
```

#### Log Prefixes
- `[Background]` - Background script logs
- `[Detector]` - Brand detection logs
- `[PdpDetector]` - Product page detection
- `[RUNNER]` - Detection orchestration
- `[ChaChing]` - UI/content script logs

### Common Issues

1. **Scripts not injecting**
   - Check that files exist in root Resources directory
   - Verify manifest.json uses root paths (no src/ prefix)
   - Check for console errors

2. **UI showing on wrong pages**
   - Fixed: Now requires both brand match AND isPdp === true
   - Action buttons are required for PDP detection

3. **Detection not working**
   - Check if domain is excluded
   - Verify scripts loaded (console)
   - Check for JavaScript errors

### Testing Checklist

- [ ] Homepage doesn't show UI (isPdp check prevents it)
- [ ] Product pages show UI
- [ ] Category pages don't show UI
- [ ] Search pages don't show UI
- [ ] Cart/checkout don't show UI
- [ ] Console shows proper detection logs
- [ ] No JavaScript errors

### Safari-Specific Notes

1. **Tab Events**: Safari doesn't always provide `changeInfo.status`
2. **File Paths**: Must use root paths in manifest (no src/ prefix)
3. **Notifications**: Not supported, fallback to opening URLs
4. **Service Worker**: Use `"scripts": ["main.js"]` syntax
5. **Build Process**: Files must be copied from src/ to root for Safari

### Version History

#### 2.2.0 (Current)
- Added isPdp check in handleDetectionComplete
- Fixed false positives on homepages
- UI only shows when brand is supported AND isPdp is true
- Improved detection accuracy
- Enhanced Safari compatibility

#### 2.1.1
- Initial Safari port from Chrome extension
- Basic brand detection
- UI injection on all brand pages

### Development Workflow

1. Make changes in `src/` directories
2. Copy files to root Resources directory (if needed for Safari)
3. Update version in manifest.json if needed
4. Build in Xcode (⌘B)
5. Restart Safari or reload extension
6. Test on various e-commerce sites
7. Check console for errors

### Build Notes

For Safari to work properly:
- Files in src/ subdirectories are for development organization
- Safari requires files to be in the root Resources directory
- The manifest.json must reference files without src/ prefix
- Either manually copy files or use a build script

### Performance Considerations

- Scripts inject only on shopping sites
- Detection runs once per page load
- UI injects only on confirmed product pages (isPdp check)
- Cleanup on tab close prevents memory leaks

## Table of Contents
- [Overview](#overview)
- [Installation & Setup](#installation--setup)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Key Components](#key-components)
- [Safari-Specific Considerations](#safari-specific-considerations)
- [Development Guide](#development-guide)
- [Troubleshooting](#troubleshooting)

## Overview

ChaChing Brand Matcher is a Safari extension that:
- Automatically detects when users visit supported brand websites
- Shows a non-intrusive notification offering up to 33% cashback
- Works on thousands of partner brands
- Provides a native macOS app for onboarding and extension management

## Installation & Setup

### Prerequisites
- macOS 10.14 or later
- Xcode 14.0 or later
- Safari 14.0 or later

### Build Instructions

1. **Clone the repository**
   ```bash
   git clone [repository-url]
   cd ChaChing\ Brand\ Matcher
   ```

2. **Open in Xcode**
   ```bash
   open "ChaChing Brand Matcher.xcodeproj"
   ```

3. **Configure Resources folder** ⚠️ **CRITICAL STEP**
   - In Xcode, remove any existing Resources folder references
   - Right-click "ChaChing Brand Matcher Extension" → "Add Files..."
   - Navigate to `ChaChing Brand Matcher Extension/Resources`
   - **Important**: Select "Create folder references" (NOT "Create groups")
   - Ensure "ChaChing Brand Matcher Extension" target is selected
   - Click "Add"
   - Verify the Resources folder appears as a **blue folder** (not yellow)

4. **Build and Run**
   - Select your Mac as the target device
   - Press ⌘R to build and run
   - The app will open showing the onboarding screen

5. **Enable the Extension**
   - Click "Enable ChaChing Extension" in the app
   - Safari will open to Extensions preferences
   - Check the box next to "ChaChing Brand Matcher"
   - Select "Always Allow on Every Website"

## Project Structure

### macOS App (Swift)
```
ChaChing Brand Matcher/
├── AppDelegate.swift          # App lifecycle management
├── ViewController.swift       # Onboarding UI controller
├── Resources/
│   ├── Base.lproj/
│   │   └── Main.html         # Onboarding HTML interface
│   ├── Script.js             # JavaScript for onboarding
│   ├── Style.css             # Styles for onboarding
│   └── Icon.png              # App icon
└── Assets.xcassets/          # App assets
```

### Safari Extension (JavaScript)
```
ChaChing Brand Matcher Extension/
├── SafariWebExtensionHandler.swift  # Native message handler
├── Info.plist                       # Extension configuration
└── Resources/                       # ⚠️ Must be folder reference
    ├── manifest.json               # Extension manifest
    ├── main.js                     # Background script
    ├── utils.js                    # Utility functions
    ├── brands.js                   # Brand list loader
    ├── brand-detector.js           # Brand detection logic
    ├── pdp-detector.js            # Product page detector
    ├── runner.js                   # Detection orchestrator
    ├── content_main.js            # UI injection script
    ├── content_styles.css         # Notification styles
    ├── popup.js                   # Extension popup logic
    ├── popup.css                  # Extension popup styles
    ├── index.html                 # Extension popup HTML
    ├── BrandList.csv              # Supported brands database
    └── ChaChing_Logo.png          # Extension logo
```

## How It Works

### 1. Background Script (`main.js`)

The background script is the brain of the extension:

```javascript
// Monitors tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Get tab URL (Safari-specific workaround)
    const tabInfo = await chrome.tabs.get(tabId);
    
    // Skip excluded domains
    if (isExcludedDomain(tabInfo.url)) return;
    
    // Inject detection scripts
    await injectScripts(tabId);
  }
});
```

### 2. Detection Flow (`runner.js`)

The runner orchestrates the detection process:

```javascript
async function runDetection() {
  // 1. Load brand list from CSV
  await window.loadBrands();
  
  // 2. Detect brand on current page
  const brandDetector = new BrandDetector();
  const brandResult = brandDetector.detectBrandOnPage();
  
  // 3. Check if it's a product page
  const pdpDetector = new PdpDetector();
  const isPdp = pdpDetector.isProductPage();
  
  // 4. Send results to background
  chrome.runtime.sendMessage({
    type: 'DETECTION_COMPLETE',
    data: { brandResult, isPdp }
  });
}
```

### 3. Brand Detection (`brand-detector.js`)

Uses multiple strategies to identify brands:

1. **Domain Analysis**: Extracts brand from URL
2. **Structured Data**: Checks JSON-LD markup
3. **Meta Tags**: Looks for OpenGraph brand tags
4. **DOM Analysis**: Searches for brand in specific elements
5. **Title Parsing**: Extracts brand from page title

### 4. UI Notification (`content_main.js`)

Shows cashback notification when brand is detected:

```javascript
class ChachingContentScript {
  showNotification() {
    // Check if recently dismissed
    if (recentlyDismissed()) return;
    
    // Create notification element
    const notification = createNotificationElement();
    
    // Ensure it stays on top
    notification.style.zIndex = getHighestZIndex() + 1;
    
    // Add to page
    document.body.appendChild(notification);
  }
}
```

## Key Components

### Brand List Management

The extension uses a CSV file (`BrandList.csv`) containing thousands of supported brands:

```csv
Brand,Cashback
Nike,5
Adidas,7
Apple,2
...
```

### Message Passing

Communication between components:

```javascript
// Content → Background
chrome.runtime.sendMessage({
  type: 'DETECTION_COMPLETE',
  data: { brandResult, isPdp }
});

// Background → Content
chrome.tabs.sendMessage(tabId, {
  type: 'SHOW_NOTIFICATION'
});

// Popup → Background
chrome.runtime.sendMessage({
  type: 'GET_TAB_DATA'
});
```

### Storage

User preferences and state:

```javascript
// Save preferences
chrome.storage.sync.set({
  enabled: true,
  autoShow: true,
  blacklistedDomains: []
});

// Track dismissals
chrome.storage.local.set({
  [`dismissal_${url}`]: {
    timestamp: new Date().toISOString()
  }
});
```

## Safari-Specific Considerations

### 1. File Structure Flattening

Safari flattens the Resources folder structure during build:
- `src/content/brands.js` → `brands.js`
- `src/assets/logo.png` → `logo.png`

All file references must use flat paths.

### 2. API Differences

```javascript
// Chrome uses service_worker
"background": {
  "service_worker": "background.js"
}

// Safari uses scripts array
"background": {
  "scripts": ["main.js"]
}
```

### 3. Permissions

Safari requires explicit permissions:
```json
{
  "permissions": [
    "activeTab",
    "tabs",        // Required for tab monitoring
    "storage",
    "scripting",   // Required for content script injection
    "contextMenus"
  ],
  "host_permissions": [
    "https://*/*",
    "http://*/*"
  ]
}
```

### 4. Tab URL Access

Safari doesn't always provide URLs in tab update events:

```javascript
// Workaround: Explicitly query for tab info
const tabInfo = await chrome.tabs.get(tabId);
if (!tabInfo.url) return;
```

### 5. Notifications API

Safari doesn't support `chrome.notifications`:

```javascript
// Check before using
if (chrome.notifications && chrome.notifications.create) {
  chrome.notifications.create(...);
} else {
  // Fallback behavior
}
```

## Development Guide

### Adding New Brands

1. Edit `BrandList.csv`
2. Add brand name and cashback percentage
3. Rebuild extension

### Modifying Detection Logic

Edit `brand-detector.js`:

```javascript
findAllBrandCandidates() {
  // Add new detection strategy
  const customStrategy = document.querySelector('.my-brand-selector');
  if (customStrategy) {
    candidates.push(customStrategy.textContent);
  }
}
```

### Customizing Notification UI

Edit `content_main.js` and `content_styles.css`:

```javascript
createNotificationElement() {
  notification.innerHTML = `
    <div class="chaching-notification">
      <!-- Modify HTML structure -->
    </div>
  `;
}
```

### Testing

1. **Test Detection**:
   ```javascript
   // In browser console
   const detector = new BrandDetector();
   console.log(detector.detectBrandOnPage());
   ```

2. **Test Message Passing**:
   ```javascript
   // In extension background console
   chrome.runtime.onMessage.addListener((msg) => {
     console.log('Message received:', msg);
   });
   ```

3. **Debug Storage**:
   ```javascript
   // View all storage
   chrome.storage.local.get(null, (items) => {
     console.log('Local storage:', items);
   });
   ```

## Troubleshooting

### Common Issues

1. **"Failed to load resource" errors**
   - Ensure Resources folder is added as folder reference (blue, not yellow)
   - Check all file paths are flat (no subdirectories)
   - Clean build folder and rebuild

2. **Extension not detecting brands**
   - Check browser console for errors
   - Verify brand exists in BrandList.csv
   - Ensure extension has "Allow on Every Website" permission

3. **Scripts not injecting**
   - Verify manifest.json permissions
   - Check excluded domains list
   - Ensure tab status is "complete"

4. **Notification not appearing**
   - Check z-index conflicts
   - Verify dismissal timeout hasn't been triggered
   - Look for CSS conflicts with host page

### Debug Mode

Enable verbose logging:

```javascript
// In utils.js
const DEBUG = true; // Set to true for detailed logs
```

### Console Commands

Useful commands for debugging:

```javascript
// Check if extension is loaded
chrome.runtime.id

// Get current tab info
chrome.tabs.query({active: true}, (tabs) => console.log(tabs));

// Test brand detection
window.chachingContentScript.startDetection();

// Clear all storage
chrome.storage.local.clear();
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Ensure all file paths work with Safari's flat structure
5. Test on multiple websites
6. Submit a pull request

## License

[Your License Here]

## Support

For issues or questions:
- GitHub Issues: [repository-issues-url]
- Help Center: https://chaching.me/help
- Email: support@chaching.me

