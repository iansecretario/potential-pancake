$(document).ready(function () {
    
    // Advanced function to detect and preserve empty lines in code blocks/terminals
    function getTextWithPreservedEmptyLines($element) {
        var $clone = $element.clone();
        $clone.find('.clipboard-button').remove();
        var element = $clone[0];
        
        // Method 1: Use HTML parsing to detect <br> tags and empty lines
        var htmlContent = element.innerHTML;
        if (htmlContent) {
            // Replace <br> tags with placeholder markers
            var markerText = htmlContent.replace(/<br\s*\/?>/gi, '___NEWLINE___');
            
            // Create temporary element to extract text
            var tempDiv = document.createElement('div');
            tempDiv.innerHTML = markerText;
            var rawText = tempDiv.textContent || tempDiv.innerText || '';
            
            // Convert markers back to actual newlines
            var textWithNewlines = rawText.replace(/___NEWLINE___/g, '\n');
            
            // Clean up and return
            return cleanPreservedText(textWithNewlines);
        }
        
        // Method 2: Manual DOM traversal to detect empty lines
        return traverseAndPreserveLines(element);
    }
    
    // Advanced DOM traversal that detects visual line breaks
    function traverseAndPreserveLines(element) {
        var lines = [];
        var currentLine = '';
        
        function traverseNode(node) {
            if (node.nodeType === Node.TEXT_NODE) {
                var text = node.textContent || node.nodeValue || '';
                currentLine += text;
            }
            else if (node.nodeType === Node.ELEMENT_NODE) {
                var tagName = node.tagName.toLowerCase();
                
                // Handle line break elements
                if (tagName === 'br') {
                    lines.push(currentLine);
                    currentLine = '';
                }
                // Handle div elements that typically create new lines
                else if (tagName === 'div' || tagName === 'p') {
                    if (currentLine.trim() || lines.length > 0) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    
                    // Recursively process children
                    for (var i = 0; i < node.childNodes.length; i++) {
                        traverseNode(node.childNodes[i]);
                    }
                    
                    // Add line break after div/p
                    if (currentLine.trim() || node.childNodes.length === 0) {
                        lines.push(currentLine);
                        currentLine = '';
                    }
                    return; // Don't process children again
                }
                else {
                    // Process children of other elements
                    for (var i = 0; i < node.childNodes.length; i++) {
                        traverseNode(node.childNodes[i]);
                    }
                }
            }
        }
        
        // Start traversal
        traverseNode(element);
        
        // Add final line if any content remains
        if (currentLine.length > 0 || lines.length === 0) {
            lines.push(currentLine);
        }
        
        return lines.join('\n');
    }
    
    // Method 3: CSS-aware line detection using computed styles
    function getVisualLines($element) {
        var element = $element[0];
        var computedStyle = window.getComputedStyle(element);
        var whiteSpace = computedStyle.whiteSpace;
        
        // If white-space is 'pre' or similar, try to preserve exact formatting
        if (whiteSpace && whiteSpace.match(/pre/)) {
            return getPreFormattedText($element);
        }
        
        return getTextWithPreservedEmptyLines($element);
    }
    
    // Specialized function for pre-formatted text
    function getPreFormattedText($element) {
        var $clone = $element.clone();
        $clone.find('.clipboard-button').remove();
        var element = $clone[0];
        
        // Try multiple approaches for pre-formatted content
        var methods = [
            function() { return element.innerText; },
            function() { return element.textContent; },
            function() { return parsePreFormattedHTML(element); }
        ];
        
        for (var i = 0; i < methods.length; i++) {
            try {
                var result = methods[i]();
                if (result && result.trim()) {
                    return cleanPreservedText(result);
                }
            } catch (e) {
                continue;
            }
        }
        
        return '';
    }
    
    // Parse HTML structure to maintain pre formatting
    function parsePreFormattedHTML(element) {
        var html = element.innerHTML;
        
        // Handle common patterns that represent line breaks
        var patterns = [
            { regex: /<br\s*\/?>/gi, replacement: '\n' },
            { regex: /<\/div>\s*<div[^>]*>/gi, replacement: '\n' },
            { regex: /<\/p>\s*<p[^>]*>/gi, replacement: '\n\n' },
            { regex: /<div[^>]*>\s*<\/div>/gi, replacement: '\n' }
        ];
        
        var processedHTML = html;
        patterns.forEach(function(pattern) {
            processedHTML = processedHTML.replace(pattern.regex, pattern.replacement);
        });
        
        // Create temporary element to extract text
        var tempDiv = document.createElement('div');
        tempDiv.innerHTML = processedHTML;
        var text = tempDiv.textContent || tempDiv.innerText || '';
        
        return text;
    }
    
    // Clean up preserved text while maintaining structure
    function cleanPreservedText(text) {
        if (!text) return text;
        
        // Only remove invisible unicode characters
        text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
        
        // Convert non-breaking spaces to regular spaces
        text = text.replace(/\u00A0/g, ' ');
        
        // Normalize line endings but preserve empty lines
        text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        
        return text;
    }
    
    // Enhanced clipboard function that detects code blocks and terminals
    function getEnhancedClipboardText($element) {
        // Detect if this is a code block, terminal, or IDE block
        var isCodeBlock = $element.is('pre') || 
                         $element.closest('.code-block, .terminal-block, .ide-block').length > 0 ||
                         $element.hasClass('code') || 
                         $element.hasClass('terminal') ||
                         $element.hasClass('ide');
        
        if (isCodeBlock) {
            console.log('Detected code block - using enhanced newline preservation');
            return getVisualLines($element);
        }
        
        // For non-code blocks, use standard extraction
        var $clone = $element.clone();
        $clone.find('.clipboard-button').remove();
        var element = $clone[0];
        return element.innerText || element.textContent || $element.text();
    }
    
    // Make functions globally available
    window.getTextWithPreservedEmptyLines = getTextWithPreservedEmptyLines;
    window.getVisualLines = getVisualLines;
    window.getEnhancedClipboardText = getEnhancedClipboardText;
    
    console.log('CWR Newline Preservation loaded - Enhanced empty line detection enabled');
});
