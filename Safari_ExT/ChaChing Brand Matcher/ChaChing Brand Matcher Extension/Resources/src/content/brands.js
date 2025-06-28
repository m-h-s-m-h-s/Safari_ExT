/**
 * brands.js - Dynamically loads and manages the list of supported brands.
 *
 * This module fetches the `BrandList.csv` file, parses it, and creates a global,
 * quickly-searchable Map of supported brands. It also assigns a static cashback
 * percentage to each brand as it's loaded.
 *
 * This asynchronous loading ensures that the brand list can be updated easily
 * by modifying the CSV file without needing to redeploy the entire extension.
 *
 * @module brands
 */

async function loadBrands() {
  try {
    const response = await fetch(chrome.runtime.getURL('BrandList.csv'));
    const csvText = await response.text();
    
    // Parse CSV: skip header, trim whitespace, remove quotes, and filter out empty lines.
    const brandNames = csvText
      .split('\n')
      .slice(1) 
      .map(name => name.trim().replace(/"/g, ''))
      .filter(Boolean);

    // Create brand objects with a static cashback value
    const brands = brandNames.map(name => ({
      name,
      cashback: 33
    }));

    // We use a Map for O(1) lookups, mapping a normalized version of the name
    // to the full brand object (which contains the original name for display).
    window.SUPPORTED_BRANDS_MAP = new Map(brands.map(brand => [normalizeBrand(brand.name), brand]));

    // We also expose an array of just the normalized brand names (the keys) for matching operations.
    window.SUPPORTED_BRANDS_ARRAY = Array.from(window.SUPPORTED_BRANDS_MAP.keys());

    ChachingUtils.log('info', 'Brands', `${window.SUPPORTED_BRANDS_ARRAY.length} brands loaded successfully.`);
  } catch (error) {
    ChachingUtils.log('error', 'Brands', 'Failed to load or parse BrandList.csv.', error);
    // Initialize with empty data to prevent errors in other scripts
    window.SUPPORTED_BRANDS_MAP = new Map();
    window.SUPPORTED_BRANDS_ARRAY = [];
  }
}

// Making the load function available to other scripts.
if (typeof window !== 'undefined') {
  window.loadBrands = loadBrands;
} 