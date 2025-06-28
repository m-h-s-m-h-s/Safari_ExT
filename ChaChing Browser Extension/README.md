# ChaChing Browser Extension - Safari Extension

A Safari extension that detects supported brands on e-commerce websites and helps users find better deals from similar merchants with much better pricing.

## Features

- **Automatic Brand Detection**: Detects thousands of supported brands when browsing e-commerce sites
- **Product Page Detection**: Only shows UI on actual product pages, not homepages or category pages
- **Smart Detection**: Uses multiple signals to accurately identify product pages:
  - Required action buttons (Add to Cart, Buy Now, etc.)
  - Product pricing information
  - Product images and galleries
  - URL patterns
  - Breadcrumb navigation
  - Shipping/delivery information
- **Non-Intrusive**: Excludes non-shopping sites (social media, news, banking, etc.)

## Project Structure

```
ChaChing Browser Extension/
├── ChaChing Browser Extension/              # macOS app container
│   ├── AppDelegate.swift
│   ├── ViewController.swift              # Native UI for extension management
│   └── Resources/
│       └── Base.lproj/Main.html         # Placeholder HTML
├── Safari Extension/                        # Safari Web Extension
│   ├── Resources/
│   │   ├── manifest.json                # Extension manifest (uses root paths)
│   │   ├── *.js, *.css, *.html         # Runtime files (copied from src/)
│   │   └── src/                         # Development source files
│   │       ├── background/
│   │       │   └── main.js              # Background service worker
│   │       ├── content/
│   │       │   ├── brand-detector.js    # Brand detection logic
│   │       │   ├── pdp-detector.js      # Product page detection
│   │       │   ├── runner.js            # Detection orchestrator
│   │       │   ├── content_main.js      # Main UI injection
│   │       │   ├── content_styles.css   # UI styles
│   │       │   └── brands.js            # Supported brands list
│   │       ├── popup/
│   │       │   ├── index.html           # Extension popup
│   │       │   ├── popup.js             # Popup logic
│   │       │   └── styles.css           # Popup styles
│   │       ├── shared/
│   │       │   └── utils.js             # Shared utilities
│   │       └── assets/
│   │           ├── ChaChing_Logo.png    # Extension icon
│   │           └── BrandList.csv        # Brand database
│   └── SafariWebExtensionHandler.swift  # Safari extension handler
├── ChaChing Browser ExtensionTests/      # Unit tests
├── ChaChing Browser ExtensionUITests/    # UI tests
└── README.md                            # This file
```

## Safari Extension Architecture

### Why is there a Safari Extension folder inside the ChaChing Browser Extension folder?

This structure is **required by Apple** for Safari extensions. Unlike Chrome or Firefox extensions, Safari extensions on macOS must be distributed as part of a containing macOS application. 

This structure is **required by Apple** for Safari extensions. Here's why this two-part structure exists:

1. **Container App** (`ChaChing Browser Extension/`)
   - A regular macOS app that "contains" the Safari extension
   - Required for Mac App Store distribution
   - Provides the user interface to:
     - Enable/disable the extension
     - Show setup instructions
     - Manage extension settings
   - This is what users see when they launch the app from the dock

2. **Safari Extension** (`Safari Extension/`)
   - The actual browser extension that runs inside Safari
   - Contains all extension code (JavaScript, HTML, CSS)
   - Must be embedded within the container app
   - Safari loads this component when browsing websites

### Key Differences from Other Browsers

| Feature | Chrome/Firefox | Safari |
|---------|---------------|--------|
| Distribution | Standalone extension | Part of macOS app |
| Installation | From browser store | From Mac App Store |
| Code signing | Optional | Required |
| Container app | Not needed | Required |

This architecture provides enhanced security and a consistent macOS user experience, but requires the nested folder structure you see in this project.

## Important: Safari File Structure

Safari extensions require files to be in the root of the Resources directory. The `src/` subdirectories are for development organization only. During build or manually, files must be copied from `src/` subdirectories to the root `Resources/` directory.

**The manifest.json references files WITHOUT the src/ prefix** (e.g., `"main.js"` not `"src/background/main.js"`).

## How It Works

1. **Page Load Detection**: When a page loads, the background script checks if it's a shopping site
2. **Script Injection**: Injects detection scripts into eligible pages
3. **Brand Detection**: Identifies if the page belongs to a supported brand
4. **PDP Detection**: Determines if it's a product detail page using multiple signals
5. **UI Injection**: Only shows the ChaChing UI if both:
   - Brand is supported (isSupported === true)
   - It's a product page (isPdp === true)

## Detection Logic

### Brand Detection
- Analyzes page content for brand indicators
- Checks domain, title, meta tags, and visible text
- Uses voting system for accuracy

### Product Page Detection (PDP)
- **Required**: Action buttons (Add to Cart, Buy Now, etc.)
- **Scoring System** (75 points needed):
  - Action buttons: Required (no points if missing)
  - Product price: 35 points
  - Product images: 20 points
  - URL patterns: 25 points
  - Breadcrumbs: 15 points
  - Shipping info: 15 points
  - Reviews: 10 points
  - Product title: 10 points

## Building and Testing

### Prerequisites
- macOS 11.0 or later
- Xcode 12.0 or later
- Safari 14.0 or later

### Build Steps
1. Open `ChaChing Browser Extension.xcodeproj` in Xcode
2. Ensure JavaScript files are in the `Safari Extension/Resources/` directory
3. Select your development team in project settings
4. Verify app settings:
   - Bundle ID: `com.MHS.ChaChing-Browser-Extension`
   - Extension Bundle ID: `com.MHS.ChaChing-Browser-Extension.Extension`
   - App Icons Source: `AppIcon`
   - Category: Utilities
5. Clean build folder (Shift+⌘+K) if you've made structural changes
6. Build the project (⌘B)
7. Run the app (⌘R)

### Testing in Safari
1. Enable Developer menu in Safari (Preferences > Advanced)
2. Allow unsigned extensions (Develop > Allow Unsigned Extensions)
3. Open Safari Preferences > Extensions
4. Enable "ChaChing Browser Extension"
5. Visit supported e-commerce sites to test

### Debugging
- Open Safari Web Inspector (right-click > Inspect Element)
- Check Console for extension logs
- All components log with prefixes: [Background], [Detector], [PdpDetector], [RUNNER]

## Recent Updates

### Version 2.3.0 (Latest)
- **Renamed** from "ChaChing Brand Matcher" to "ChaChing Browser Extension"
- **App Store Ready**: Added LSApplicationCategoryType for submission
- **New App Icons**: Complete icon set including required 512x512@2x
- **Fixed Bundle Identifiers**: Updated to `com.MHS.ChaChing-Browser-Extension`
- **UI Updates**: Refreshed branding and messaging
- **Folder Structure Cleanup**: Renamed "ChaChing Browser Extension Extension" to "Safari Extension" for clarity
- **Documentation**: Added Safari extension architecture explanation

### Version 2.2.0
- Fixed Safari-specific compatibility issues
- Added isPdp check to prevent UI on non-product pages
- Improved PDP detection accuracy
- Added requirement for action buttons on product pages
- Expanded excluded domains list
- Enhanced logging for better debugging

### Key Fixes
- Safari tab update listener compatibility
- UI only shows on actual product pages (requires isPdp === true)
- Better handling of non-shopping sites
- Correct file path handling (no src/ prefix in manifest)
- Fixed "Open Safari Extensions" button after rename

## Known Issues
- Some dynamic single-page applications may require page refresh
- Certain sites with heavy JavaScript may delay detection

## App Store Submission

The app is configured for Mac App Store submission with:

### Required Configuration
- ✅ Bundle Identifier: `com.MHS.ChaChing-Browser-Extension`
- ✅ App Category: `public.app-category.utilities`
- ✅ All icon sizes (16x16 through 512x512@2x)
- ✅ Hardened Runtime enabled
- ✅ Proper entitlements

### Submission Checklist
1. Archive the app in Xcode (Product → Archive)
2. Validate the archive before submission
3. Upload to App Store Connect
4. Complete app metadata and screenshots
5. Submit for review

## Development Notes

### File Organization
- Extension files are in `Safari Extension/Resources/`
- Development files can be organized in `src/` subdirectories
- Safari requires runtime files to be in the root of the Resources directory
- The containing app files are in `ChaChing Browser Extension/`
- Test files are in their respective test directories
- Manifest.json must reference files without subdirectory prefixes
- Background script uses programmatic injection

### Safari Differences from Chrome
- `chrome.tabs.onUpdated` may not always provide `changeInfo.status`
- Service worker syntax differs (`scripts: ["main.js"]` instead of `service_worker`)
- No support for `chrome.notifications` API
- Files must be in root directory, not subdirectories

## Support
For issues or questions, please contact the ChaChing development team. 