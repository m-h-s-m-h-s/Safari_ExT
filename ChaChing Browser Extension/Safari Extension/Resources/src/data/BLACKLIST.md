# ChaChing Browser Extension Blacklist System

## Overview

The ChaChing Browser Extension uses a two-tier blacklist system to prevent the extension from running on certain websites:

### 1. System Blacklist (excluded-domains.json)
- **Purpose**: Prevents ALL script injection on non-shopping sites
- **Location**: `/src/data/excluded-domains.json`
- **Behavior**: Extension scripts are never injected on these domains
- **Maintenance**: Edit the JSON file directly

### 2. User Blacklist (Chrome Storage)
- **Purpose**: User-configurable blacklist for specific sites
- **Location**: Stored in Chrome sync storage
- **Behavior**: Scripts run but UI is hidden on these domains
- **Maintenance**: Users can add/remove domains via extension settings

## How the System Blacklist Works

1. When a tab loads, the extension checks if the domain is in `excluded-domains.json`
2. If found, NO scripts are injected - the extension completely ignores the site
3. This prevents any performance impact on non-shopping sites like YouTube, Gmail, etc.

## Updating the System Blacklist

To add or remove domains from the system blacklist:

1. Open `/src/data/excluded-domains.json`
2. Add/remove domains from the `domains` array
3. Save the file
4. Reload the extension in Safari

### Example:
```json
{
  "domains": [
    "youtube.com",
    "newsite.com"  // Add new domain here
  ]
}
```

## Categories Currently Blacklisted

- **Search engines**: Google, Bing, Yahoo, etc.
- **Social media**: Facebook, Twitter, Instagram, Reddit, etc.
- **Video/streaming**: YouTube, Netflix, Twitch, etc.
- **Communication**: Gmail, Outlook, WhatsApp, Slack, etc.
- **News/media**: CNN, BBC, NYTimes, etc.
- **Reference/education**: Wikipedia, Coursera, Khan Academy, etc.
- **Developer/tech**: GitHub, Stack Overflow, etc.
- **Productivity/business**: Google Docs, Notion, Trello, etc.
- **Banking/finance**: PayPal, Chase, Bank of America, etc.
- **Government**: IRS, CDC, state.gov, etc.
- **Gaming**: Steam, Epic Games, Roblox, etc.
- **Other non-shopping**: Weather, IMDB, Yelp, etc.

## Testing Blacklist Functionality

To verify the blacklist is working:

1. Open the browser console
2. Navigate to a blacklisted site (e.g., youtube.com)
3. Look for: `[Background] Skipping tab X on excluded domain: youtube.com`
4. Verify NO ChaChing scripts are loaded on the page

## Important Notes

- The blacklist uses partial domain matching (`url.hostname.includes(domain)`)
- This means `youtube.com` will match:
  - www.youtube.com
  - m.youtube.com
  - music.youtube.com
  - Any subdomain of youtube.com
- Be careful not to blacklist domains that might have shopping subdomains
- The extension has a fallback list of essential domains if the JSON file fails to load 