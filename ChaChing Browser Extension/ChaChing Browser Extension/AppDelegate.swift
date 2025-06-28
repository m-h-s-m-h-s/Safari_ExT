//
//  AppDelegate.swift
//  ChaChing Browser Extension
//
//  Created by MHS on 6/28/25.
//

import Cocoa

@main
class AppDelegate: NSObject, NSApplicationDelegate {

    func applicationDidFinishLaunching(_ notification: Notification) {
        // Override point for customization after application launch.
        
        // Set window size for the permission instructions UI
        if let window = NSApplication.shared.windows.first {
            // Set a larger size to accommodate the permission explanation
            window.setContentSize(NSSize(width: 520, height: 600))
            
            // Center the window on screen
            window.center()
            
            // Make window non-resizable
            window.styleMask.remove(.resizable)
            
            // Set minimum and maximum sizes
            window.minSize = NSSize(width: 520, height: 600)
            window.maxSize = NSSize(width: 520, height: 600)
            
            // Set window title
            window.title = "ChaChing - Safari Extension"
        }
    }

    func applicationShouldTerminateAfterLastWindowClosed(_ sender: NSApplication) -> Bool {
        return true
    }

}
