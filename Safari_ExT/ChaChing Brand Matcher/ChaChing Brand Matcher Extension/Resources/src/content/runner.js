// An async function to orchestrate the detection process on the page.
async function runDetection() {
  console.log('[RUNNER] Starting detection.');
  try {
    // First, wait for the `loadBrands` function (from brands.js) to complete.
    await window.loadBrands();

    // Now that we have the brands, we can run the detectors.
    const brandDetector = new BrandDetector();
    const pdpDetector = new PdpDetector();

    const brandResult = brandDetector.detectBrandOnPage();
    const isPdp = pdpDetector.isProductPage();

    console.log('[RUNNER] Detection complete. Sending results to background.', { brandResult, isPdp });

    // Send a message to the background script with the results.
    chrome.runtime.sendMessage({
      type: 'DETECTION_COMPLETE',
      data: {
        brandResult: brandResult,
        isPdp: isPdp
      }
    });

  } catch (error) {
    console.error('[RUNNER] Error during detection:', error);
    chrome.runtime.sendMessage({
      type: 'DETECTION_ERROR',
      error: error.message
    });
  }
}

// Immediately execute the main function when this script is injected.
runDetection();