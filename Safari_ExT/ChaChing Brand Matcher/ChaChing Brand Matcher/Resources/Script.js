function show(enabled, useSettingsInsteadOfPreferences) {
    console.log("show() called with:", enabled, useSettingsInsteadOfPreferences);
    
    if (typeof enabled === "boolean") {
        // Extension state is known
        document.body.classList.toggle("state-on", enabled);
        document.body.classList.toggle("state-off", !enabled);
        // Hide unknown state when we know the actual state
        document.body.classList.add("state-known");
    } else {
        // Extension state is unknown or there was an error
        // Keep showing the default unknown state
        document.body.classList.remove("state-on");
        document.body.classList.remove("state-off");
        document.body.classList.remove("state-known");
    }
}

function openPreferences() {
    webkit.messageHandlers.controller.postMessage("open-preferences");
}

// Set initial state to prevent flashing
document.body.classList.add("state-off");
document.body.classList.add("state-known");

document.addEventListener("DOMContentLoaded", function() {
    // Query the extension state immediately
    webkit.messageHandlers.controller.postMessage("query");
    
    // Handle all buttons with class "open-preferences"
    document.querySelectorAll(".open-preferences").forEach(button => {
        button.addEventListener("click", openPreferences);
    });
    
    // Handle external links - open in default browser
    document.querySelectorAll("a[href^='http']").forEach(link => {
        link.addEventListener("click", function(event) {
            event.preventDefault();
            // For macOS app, we need to use a different approach
            // The link will be handled by the native code
            webkit.messageHandlers.controller.postMessage("open-url:" + this.href);
        });
    });
    
});
