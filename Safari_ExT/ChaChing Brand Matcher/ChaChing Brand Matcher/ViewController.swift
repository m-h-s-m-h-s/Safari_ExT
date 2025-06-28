//
//  ViewController.swift
//  ChaChing Brand Matcher
//
//  Created by MHS on 6/28/25.
//

import Cocoa
import SafariServices

let extensionBundleIdentifier = "com.MHS.ChaChing-Brand-Matcher.Extension"

class ViewController: NSViewController {

    private var statusLabel: NSTextField!
    private var instructionsView: NSView!
    private var successView: NSView!

    override func viewDidLoad() {
        super.viewDidLoad()

        // Set up the view
        view.wantsLayer = true
        view.layer?.backgroundColor = NSColor(red: 0.96, green: 0.96, blue: 0.97, alpha: 1.0).cgColor
        
        // Create main container
        let containerView = NSView()
        containerView.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(containerView)
        
        // Create logo/icon view
        let iconView = NSImageView()
        if let icon = NSImage(named: "AppIcon") {
            iconView.image = icon
        } else {
            // Fallback to a system icon
            iconView.image = NSImage(named: NSImage.applicationIconName)
        }
        iconView.imageScaling = .scaleProportionallyUpOrDown
        iconView.translatesAutoresizingMaskIntoConstraints = false
        
        // Create title label
        let titleLabel = NSTextField(labelWithString: "ChaChing - Safari Extension")
        titleLabel.font = NSFont.systemFont(ofSize: 28, weight: .semibold)
        titleLabel.alignment = .center
        titleLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Create subtitle
        let subtitleLabel = NSTextField(labelWithString: "Find better deals from thousands of brands")
        subtitleLabel.font = NSFont.systemFont(ofSize: 16)
        subtitleLabel.alignment = .center
        subtitleLabel.textColor = NSColor.secondaryLabelColor
        subtitleLabel.translatesAutoresizingMaskIntoConstraints = false
        
        // Create instructions view (shown when extension is off)
        instructionsView = createInstructionsView()
        instructionsView.translatesAutoresizingMaskIntoConstraints = false
        
        // Create success view (shown when extension is on)
        successView = createSuccessView()
        successView.translatesAutoresizingMaskIntoConstraints = false
        
        // Add all subviews
        containerView.addSubview(iconView)
        containerView.addSubview(titleLabel)
        containerView.addSubview(subtitleLabel)
        containerView.addSubview(instructionsView)
        containerView.addSubview(successView)
        
        // Set up constraints
        NSLayoutConstraint.activate([
            containerView.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 40),
            containerView.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -40),
            containerView.topAnchor.constraint(equalTo: view.topAnchor, constant: 30),
            containerView.bottomAnchor.constraint(equalTo: view.bottomAnchor, constant: -30),
            
            iconView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            iconView.topAnchor.constraint(equalTo: containerView.topAnchor),
            iconView.widthAnchor.constraint(equalToConstant: 80),
            iconView.heightAnchor.constraint(equalToConstant: 80),
            
            titleLabel.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            titleLabel.topAnchor.constraint(equalTo: iconView.bottomAnchor, constant: 20),
            titleLabel.leadingAnchor.constraint(greaterThanOrEqualTo: containerView.leadingAnchor),
            titleLabel.trailingAnchor.constraint(lessThanOrEqualTo: containerView.trailingAnchor),
            
            subtitleLabel.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 8),
            subtitleLabel.leadingAnchor.constraint(greaterThanOrEqualTo: containerView.leadingAnchor),
            subtitleLabel.trailingAnchor.constraint(lessThanOrEqualTo: containerView.trailingAnchor),
            
            instructionsView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            instructionsView.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 40),
            instructionsView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            instructionsView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor),
            
            successView.centerXAnchor.constraint(equalTo: containerView.centerXAnchor),
            successView.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 40),
            successView.leadingAnchor.constraint(equalTo: containerView.leadingAnchor),
            successView.trailingAnchor.constraint(equalTo: containerView.trailingAnchor)
        ])
        
        // Initially hide both views
        instructionsView.isHidden = true
        successView.isHidden = true
        
        // Check extension state
        checkExtensionState()
    }
    
    private func createInstructionsView() -> NSView {
        let view = NSView()
        
        // Stack view for vertical layout
        let stackView = NSStackView()
        stackView.orientation = .vertical
        stackView.alignment = .leading
        stackView.spacing = 12
        stackView.translatesAutoresizingMaskIntoConstraints = false
        
        // Step 1
        let step1Label = NSTextField(labelWithString: "To enable ChaChing:")
        step1Label.font = NSFont.systemFont(ofSize: 18, weight: .medium)
        
        let step1Text = createStepText("1. Click the button below to open Safari Extensions")
        let step2Text = createStepText("2. Check the box next to ChaChing Brand Matcher")
        let step3Text = createStepText("3. Click \"Always Allow on Every Website\"")
        
        // Add steps to stack
        stackView.addArrangedSubview(step1Label)
        stackView.setCustomSpacing(16, after: step1Label)
        stackView.addArrangedSubview(step1Text)
        stackView.addArrangedSubview(step2Text)
        stackView.addArrangedSubview(step3Text)
        
        // Permission explanation box
        let permissionBox = NSBox()
        permissionBox.boxType = .custom
        permissionBox.fillColor = NSColor.white
        permissionBox.borderColor = NSColor(red: 0.9, green: 0.9, blue: 0.9, alpha: 1.0)
        permissionBox.borderWidth = 1
        permissionBox.cornerRadius = 8
        permissionBox.titlePosition = .noTitle
        
        // Permission content stack
        let permissionStack = NSStackView()
        permissionStack.orientation = .vertical
        permissionStack.alignment = .leading
        permissionStack.spacing = 8
        permissionStack.edgeInsets = NSEdgeInsets(top: 16, left: 16, bottom: 16, right: 16)
        
        let permissionTitle = NSTextField(labelWithString: "Why these permissions?")
        permissionTitle.font = NSFont.systemFont(ofSize: 14, weight: .semibold)
        
        let permissionText = NSTextField(wrappingLabelWithString: "ChaChing needs to see the websites you visit to automatically detect when you're shopping and find better deals from similar merchants with much better pricing.")
        permissionText.font = NSFont.systemFont(ofSize: 13)
        permissionText.textColor = NSColor.secondaryLabelColor
        permissionText.preferredMaxLayoutWidth = 420
        
        permissionStack.addArrangedSubview(permissionTitle)
        permissionStack.addArrangedSubview(permissionText)
        
        permissionBox.contentView = permissionStack
        
        // Add permission box to main stack
        stackView.setCustomSpacing(24, after: step3Text)
        stackView.addArrangedSubview(permissionBox)
        
        // Button
        let button = NSButton(title: "Open Safari Extensions", target: self, action: #selector(openPreferences))
        button.bezelStyle = .rounded
        if #available(macOS 11.0, *) {
            button.controlSize = .large
        } else {
            button.controlSize = .regular
            button.font = NSFont.systemFont(ofSize: 14)
        }
        button.keyEquivalent = "\r"
        
        // Button container for centering
        let buttonContainer = NSView()
        buttonContainer.addSubview(button)
        button.translatesAutoresizingMaskIntoConstraints = false
        
        NSLayoutConstraint.activate([
            button.centerXAnchor.constraint(equalTo: buttonContainer.centerXAnchor),
            button.topAnchor.constraint(equalTo: buttonContainer.topAnchor),
            button.bottomAnchor.constraint(equalTo: buttonContainer.bottomAnchor),
            button.widthAnchor.constraint(greaterThanOrEqualToConstant: 200)
        ])
        
        stackView.setCustomSpacing(30, after: permissionBox)
        stackView.addArrangedSubview(buttonContainer)
        
        // Add stack to view
        view.addSubview(stackView)
        
        NSLayoutConstraint.activate([
            stackView.topAnchor.constraint(equalTo: view.topAnchor),
            stackView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            stackView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            stackView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            
            permissionBox.widthAnchor.constraint(equalTo: stackView.widthAnchor),
            buttonContainer.widthAnchor.constraint(equalTo: stackView.widthAnchor)
        ])
        
        return view
    }
    
    private func createSuccessView() -> NSView {
        let view = NSView()
        
        let checkmark = NSTextField(labelWithString: "✅")
        checkmark.font = NSFont.systemFont(ofSize: 60)
        checkmark.alignment = .center
        checkmark.translatesAutoresizingMaskIntoConstraints = false
        
        let successLabel = NSTextField(labelWithString: "You're all set!")
        successLabel.font = NSFont.systemFont(ofSize: 24, weight: .semibold)
        successLabel.alignment = .center
        successLabel.translatesAutoresizingMaskIntoConstraints = false
        
        let descriptionLabel = NSTextField(wrappingLabelWithString: "ChaChing is now active. Shop normally, and we'll notify you when better deals from similar merchants with much better pricing are available.")
        descriptionLabel.font = NSFont.systemFont(ofSize: 16)
        descriptionLabel.alignment = .center
        descriptionLabel.textColor = NSColor.secondaryLabelColor
        descriptionLabel.translatesAutoresizingMaskIntoConstraints = false
        
        let manageButton = NSButton(title: "Manage Extension Settings", target: self, action: #selector(openPreferences))
        manageButton.bezelStyle = .rounded
        manageButton.translatesAutoresizingMaskIntoConstraints = false
        
        view.addSubview(checkmark)
        view.addSubview(successLabel)
        view.addSubview(descriptionLabel)
        view.addSubview(manageButton)
        
        NSLayoutConstraint.activate([
            checkmark.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            checkmark.topAnchor.constraint(equalTo: view.topAnchor),
            
            successLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            successLabel.topAnchor.constraint(equalTo: checkmark.bottomAnchor, constant: 20),
            
            descriptionLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            descriptionLabel.topAnchor.constraint(equalTo: successLabel.bottomAnchor, constant: 16),
            descriptionLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            descriptionLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            
            manageButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            manageButton.topAnchor.constraint(equalTo: descriptionLabel.bottomAnchor, constant: 30),
            manageButton.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        
        return view
    }
    
    private func createStepText(_ text: String) -> NSTextField {
        let label = NSTextField(labelWithString: text)
        label.font = NSFont.systemFont(ofSize: 15)
        label.textColor = NSColor.labelColor
        return label
    }
    
    private func checkExtensionState() {
        SFSafariExtensionManager.getStateOfSafariExtension(withIdentifier: extensionBundleIdentifier) { (state, error) in
            DispatchQueue.main.async {
                if let state = state, error == nil {
                    if state.isEnabled {
                        self.instructionsView.isHidden = true
                        self.successView.isHidden = false
                    } else {
                        self.instructionsView.isHidden = false
                        self.successView.isHidden = true
                    }
                } else {
                    // Show instructions by default if we can't determine state
                    self.instructionsView.isHidden = false
                    self.successView.isHidden = true
                }
            }
        }
    }
    
    @objc func openPreferences() {
        SFSafariApplication.showPreferencesForExtension(withIdentifier: extensionBundleIdentifier) { error in
            if error == nil {
                // Don't quit immediately - let user see the result
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                    // Re-check the state when coming back
                    self.checkExtensionState()
                }
            }
        }
    }

}
