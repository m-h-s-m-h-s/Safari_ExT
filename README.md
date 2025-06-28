# Safari_ExT - ChaChing Browser Extension

A Safari browser extension that helps users find better deals while shopping online by detecting supported brands and identifying better prices from alternative merchants.

## Project Overview

This repository contains the ChaChing Browser Extension for Safari, built as a native macOS app with a Safari Web Extension.

### Key Features
- 🛍️ Automatic brand detection on e-commerce sites
- 💰 Real-time deal notifications for better prices
- 🔍 Smart product page detection
- 🛡️ Privacy-focused design
- 🎯 Non-intrusive user experience

## Repository Structure

```
Safari_ExT/                                    # Repository root
├── ChaChing Browser Extension/                # Main Xcode project folder
│   ├── ChaChing Browser Extension/           # macOS app container
│   ├── Safari Extension/                      # Safari web extension
│   ├── ChaChing Browser Extension.xcodeproj/ # Xcode project file
│   ├── ChaChing Browser ExtensionTests/      # Unit tests
│   ├── ChaChing Browser ExtensionUITests/    # UI tests
│   └── README.md                              # Detailed project documentation
├── ChaChing_Color_Negative_Brand Mark.png    # Brand logo asset
└── README.md                                  # This file
```

## Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/[your-username]/Safari_ExT.git
   cd Safari_ExT
   ```

2. **Open in Xcode**
   ```bash
   open "ChaChing Browser Extension/ChaChing Browser Extension.xcodeproj"
   ```

3. **Build and run** (Cmd+R in Xcode)

4. **Enable the extension** in Safari → Preferences → Extensions

## Understanding the Structure

### Why is there a Safari Extension folder inside ChaChing Browser Extension?

Safari extensions require a unique two-part structure:
- **Container App**: The macOS app that users download and run
- **Safari Extension**: The actual browser extension embedded within the app

This is different from Chrome/Firefox where extensions are standalone. Apple requires this structure for security and Mac App Store distribution.

## Development

For detailed development instructions, architecture details, and debugging information, see the [project README](ChaChing%20Browser%20Extension/README.md).

## Recent Updates

- ✅ Renamed from "ChaChing Brand Matcher" to "ChaChing Browser Extension"
- ✅ Added app icons for all required sizes (including 512x512@2x for App Store)
- ✅ Fixed bundle identifier references
- ✅ Added LSApplicationCategoryType for App Store submission
- ✅ Updated UI and branding
- ✅ Cleaned up folder structure:
  - Renamed "ChaChing Browser Extension Extension" to "Safari Extension"
- ✅ Removed duplicate/old project folders

## App Store Preparation

The app is configured for App Store submission with:
- Bundle ID: `com.MHS.ChaChing-Browser-Extension`
- Category: Utilities (`public.app-category.utilities`)
- All required icon sizes in Assets.xcassets

## Requirements

- macOS 11.0+
- Xcode 12.0+
- Safari 14.0+

## License

[Add your license information here]

## Support

For questions or issues, please contact the ChaChing development team or open an issue in this repository.

