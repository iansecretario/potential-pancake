/**
 * Enhanced Copy Functionality for CWR Platform
 * Supports <pre> tags and IDE components with perfect whitespace preservation
 * No hardcoded content patterns - uses element structure and attributes
 */

class CWRCopyManager {
    constructor() {
        this.initializeClipboardButtons();
        this.setupMutationObserver();
    }

    /**
     * Initialize clipboard functionality on page load
     */
    initializeClipboardButtons() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.addClipboardButtons());
        } else {
            this.addClipboardButtons();
        }
    }

    /**
     * Setup mutation observer to handle dynamically added content
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        this.processNewElements(node);
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Process newly added elements for clipboard functionality
     */
    processNewElements(element) {
        // Process the element itself
        if (this.shouldAddClipboard(element)) {
            this.addClipboardButton(element);
        }

        // Process child elements
        const copyableElements = this.findCopyableElements(element);
        copyableElements.forEach(el => this.addClipboardButton(el));
    }

    /**
     * Add clipboard buttons to all eligible elements
     */
    addClipboardButtons() {
        const copyableElements = this.findCopyableElements(document.body);
        copyableElements.forEach(element => {
            this.addClipboardButton(element);
        });
    }

    /**
     * Find all elements that should have clipboard functionality
     */
    findCopyableElements(container) {
        const elements = [];
        
        // Find all <pre> tags
        const preElements = container.querySelectorAll('pre');
        preElements.forEach(pre => {
            if (this.shouldAddClipboard(pre)) {
                elements.push(pre);
            }
        });

        // Find IDE components
        const ideElements = container.querySelectorAll('.ide-block, .code-editor, .editor-component');
        ideElements.forEach(ide => {
            const preInIde = ide.querySelector('pre');
            if (preInIde && this.shouldAddClipboard(preInIde)) {
                elements.push(preInIde);
            }
        });

        // Find terminal blocks
        const terminalElements = container.querySelectorAll('.terminal-block');
        terminalElements.forEach(terminal => {
            const preInTerminal = terminal.querySelector('pre, .terminal-content');
            if (preInTerminal && this.shouldAddClipboard(preInTerminal)) {
                elements.push(preInTerminal);
            }
        });

        // Find code snippet blocks
        const codeSnippets = container.querySelectorAll('.code-snippet-block pre, .code-block pre');
        codeSnippets.forEach(code => {
            if (this.shouldAddClipboard(code)) {
                elements.push(code);
            }
        });

        return elements;
    }

    /**
     * Determine if an element should have clipboard functionality
     * Uses element structure and attributes rather than content patterns
     */
    shouldAddClipboard(element) {
        // Skip if already has clipboard button
        if (element.querySelector('.cwr-copy-btn') || 
            element.parentElement?.querySelector('.cwr-copy-btn')) {
            return false;
        }

        // Skip if explicitly marked as no-copy
        if (element.hasAttribute('data-no-copy') || 
            element.closest('[data-no-copy]')) {
            return false;
        }

        // Check element types and contexts
        const tagName = element.tagName.toLowerCase();
        
        // Always include <pre> tags with meaningful content
        if (tagName === 'pre') {
            const text = element.textContent?.trim();
            return text && text.length > 0;
        }

        // Include elements with code-related classes
        const codeClasses = [
            'terminal-content', 'code-content', 'command-content',
            'editor-content', 'source-code', 'script-content'
        ];
        
        if (codeClasses.some(cls => element.classList.contains(cls))) {
            const text = element.textContent?.trim();
            return text && text.length > 0;
        }

        // Include elements in code containers
        const inCodeContainer = element.closest(
            '.terminal-block, .ide-block, .code-editor, .code-snippet-block, ' +
            '.editor-component, .command-block, .script-block'
        );
        
        if (inCodeContainer && (tagName === 'pre' || tagName === 'code')) {
            const text = element.textContent?.trim();
            return text && text.length > 0;
        }

        return false;
    }

    /**
     * Add a clipboard button to an element
     */
    addClipboardButton(element) {
        // Create button container
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'cwr-copy-container';
        buttonContainer.style.cssText = `
            position: relative;
            display: inline-block;
            width: 100%;
        `;

        // Create the copy button
        const copyButton = document.createElement('button');
        copyButton.className = 'cwr-copy-btn';
        copyButton.innerHTML = '<i class="fas fa-copy"></i>';
        copyButton.title = 'Copy to clipboard';
        copyButton.style.cssText = `
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(0, 0, 0, 0.7);
            color: #fff;
            border: 1px solid #555;
            border-radius: 4px;
            padding: 4px 8px;
            cursor: pointer;
            font-size: 12px;
            z-index: 1000;
            transition: all 0.2s ease;
        `;

        // Add hover effects
        copyButton.addEventListener('mouseenter', () => {
            copyButton.style.background = 'rgba(61, 209, 165, 0.8)';
            copyButton.style.borderColor = '#3DD1A5';
        });

        copyButton.addEventListener('mouseleave', () => {
            copyButton.style.background = 'rgba(0, 0, 0, 0.7)';
            copyButton.style.borderColor = '#555';
        });

        // Add click handler
        copyButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.copyElementContent(element, copyButton);
        });

        // Position the element and button
        const parent = element.parentElement;
        if (parent) {
            // Wrap element in container if not already wrapped
            parent.insertBefore(buttonContainer, element);
            buttonContainer.appendChild(element);
            buttonContainer.appendChild(copyButton);
            
            // Ensure parent has relative positioning for absolute button
            const parentStyle = window.getComputedStyle(parent);
            if (parentStyle.position === 'static') {
                parent.style.position = 'relative';
            }
        }
    }

    /**
     * Copy element content with perfect whitespace preservation
     */
    async copyElementContent(element, button) {
        try {
            const textToCopy = this.extractTextContent(element);
            
            if (!textToCopy) {
                this.showFeedback(button, 'error', 'No content to copy');
                return;
            }

            // Try modern clipboard API first
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(textToCopy);
                this.showFeedback(button, 'success', `Copied ${textToCopy.length} characters`);
            } else {
                // Fallback to selection-based copy
                this.fallbackCopy(textToCopy, button);
            }

        } catch (error) {
            console.error('Copy failed:', error);
            this.showFeedback(button, 'error', 'Copy failed');
        }
    }

    /**
     * Extract text content with preserved formatting
     */
    extractTextContent(element) {
        // Method 1: Try textContent first (preserves whitespace best)
        let content = element.textContent;
        
        // Method 2: If textContent is empty, try innerText
        if (!content || content.trim().length === 0) {
            content = element.innerText;
        }

        // Method 3: If still empty, manually extract from HTML
        if (!content || content.trim().length === 0) {
            content = this.extractFromHTML(element);
        }

        return content;
    }

    /**
     * Manually extract text from HTML while preserving whitespace
     */
    extractFromHTML(element) {
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );

        let textContent = '';
        let node;

        while (node = walker.nextNode()) {
            textContent += node.textContent;
        }

        return textContent;
    }

    /**
     * Fallback copy method using temporary textarea
     */
    fallbackCopy(text, button) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.cssText = `
            position: fixed;
            top: -9999px;
            left: -9999px;
            width: 1px;
            height: 1px;
            padding: 0;
            border: none;
            outline: none;
            white-space: pre;
            font-size: 12pt;
        `;

        document.body.appendChild(textarea);
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                this.showFeedback(button, 'success', `Copied ${text.length} characters`);
            } else {
                this.showFeedback(button, 'error', 'Copy command failed');
            }
        } catch (err) {
            console.error('Fallback copy failed:', err);
            this.showFeedback(button, 'error', 'Copy failed');
        } finally {
            document.body.removeChild(textarea);
        }
    }

    /**
     * Show visual feedback for copy operations
     */
    showFeedback(button, type, message) {
        const originalIcon = button.innerHTML;
        const originalBackground = button.style.background;
        const originalBorderColor = button.style.borderColor;

        // Update button appearance based on result
        if (type === 'success') {
            button.innerHTML = '<i class="fas fa-check"></i>';
            button.style.background = 'rgba(34, 197, 94, 0.8)';
            button.style.borderColor = '#22c55e';
        } else {
            button.innerHTML = '<i class="fas fa-times"></i>';
            button.style.background = 'rgba(239, 68, 68, 0.8)';
            button.style.borderColor = '#ef4444';
        }

        // Show tooltip if available
        if (message) {
            button.title = message;
        }

        // Reset after 1.5 seconds
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.style.background = originalBackground;
            button.style.borderColor = originalBorderColor;
            button.title = 'Copy to clipboard';
        }, 1500);

        // Log activity if available
        if (window.logActivity) {
            window.logActivity(message, type);
        }
    }

    /**
     * Remove clipboard functionality from an element
     */
    removeClipboardButton(element) {
        const container = element.closest('.cwr-copy-container');
        if (container) {
            const parent = container.parentElement;
            const copyBtn = container.querySelector('.cwr-copy-btn');
            
            if (parent && copyBtn) {
                parent.insertBefore(element, container);
                container.remove();
            }
        }
    }

    /**
     * Refresh all clipboard buttons
     */
    refreshClipboard() {
        // Remove existing buttons
        const existingButtons = document.querySelectorAll('.cwr-copy-btn');
        existingButtons.forEach(btn => btn.remove());

        // Re-add buttons
        this.addClipboardButtons();
    }
}

// Global functions for external access
window.CWRCopyManager = CWRCopyManager;

// Initialize when DOM is ready
let cwrCopyManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        cwrCopyManager = new CWRCopyManager();
    });
} else {
    cwrCopyManager = new CWRCopyManager();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CWRCopyManager;
}
