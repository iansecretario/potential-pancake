/*!
 * CWR Clipboard Functionality
 * 
 * ⚠️  IMPORTANT: CDN HOSTING REQUIRED
 * This JavaScript file MUST be hosted via CDN for optimal performance
 * and to ensure all CWR modules receive updates automatically.
 * 
 * Features:
 * - Smart clipboard detection for terminals, IDEs, and code blocks
 * - Universal terminal theme support (Kali, PowerShell, CMD, etc.)
 * - IDE theme compatibility (VS Code, Sublime, Atom, etc.)
 * - Elevated privileges banner integration
 * - Dynamic content loading support (Thinkific, MutationObserver)
 * 
 * Dependencies:
 * - jQuery 3.x+
 * - Font Awesome 6.x+ (for icons)
 * - Modern browser with Clipboard API support
 * 
 * Usage:
 * - Automatically initializes on DOM ready
 * - Manual trigger: window.addClipboardFunctionality()
 * 
 * Last Updated: 2025-09-25
 * Version: 2.0.0
 * 
 * ⚠️  DEPLOYMENT REMINDER:
 * After any modifications to this file:
 * 1. Test across all terminal and IDE themes
 * 2. Verify dynamic content compatibility  
 * 3. Update version number above
 * 4. Deploy to CDN immediately
 * 5. Update documentation in README-CLIPBOARD.md
 */

$(document).ready(function () {
    function addClipboardFunctionality() {
        // Add clipboard functionality to relevant <pre> elements
        $("pre").each(function () {
            var $this = $(this);

            // Skip if clipboard button is already added
            if ($this.find(".clipboard-button").length > 0) {
                return;
            }

            // Only add clipboard to specific types of pre elements
            var shouldAddClipboard = false;
            
            // 1. Pre elements with terminal-command class
            if ($this.hasClass('terminal-command')) {
                shouldAddClipboard = true;
            }
            // 2. Pre elements inside terminal blocks (but not if they're just output)
            else if ($this.closest('.terminal-block').length > 0) {
                // Only add to terminal blocks if this pre contains actual commands
                var terminalBlock = $this.closest('.terminal-block');
                var hasTerminalCommand = terminalBlock.find('pre.terminal-command').length > 0;
                
                // If there's a specific terminal-command pre, only add button to that one
                if (hasTerminalCommand) {
                    shouldAddClipboard = $this.hasClass('terminal-command');
                } else {
                    // Legacy terminal without specific command pre - add button to main pre
                    shouldAddClipboard = true;
                }
            }
            // 3. Pre elements inside IDE blocks
            else if ($this.closest('.ide-block').length > 0) {
                shouldAddClipboard = true;
            }
            // 4. Standalone pre elements (not inside terminal or IDE blocks)
            else if ($this.closest('.terminal-block').length === 0 && 
                     $this.closest('.ide-block').length === 0) {
                // Check if it looks like code or command content
                var text = $this.text().trim();
                if (text.length > 0 && !text.match(/^\s*(Starting|PORT|tcp|open|service|Nmap)/i)) {
                    shouldAddClipboard = true;
                }
            }

            if (!shouldAddClipboard) {
                return;
            }
            
            // Create the clipboard button with improved styling
                var buttonHtml = $(
                    '<button class="clipboard-button" style="' +
                    'position: absolute; ' +
                    'top: 0.5rem; ' +
                    'right: 0.5rem; ' +
                    'z-index: 10000; ' +
                    'color: #3DD1A5; ' +
                    'background: rgba(0, 0, 0, 0.7); ' +
                    'border: 1px solid rgba(61, 209, 165, 0.3); ' +
                    'border-radius: 4px; ' +
                    'padding: 0.5rem; ' +
                    'cursor: pointer; ' +
                    'font-size: 0.875rem; ' +
                    'transition: all 0.3s ease; ' +
                    'display: none; ' +
                    'backdrop-filter: blur(10px); ' +
                    'box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);' +
                    '" title="Copy to clipboard">' +
                    '<i class="fa fa-clipboard" aria-hidden="true"></i>' +
                    '</button>'
                );

                // Enhanced click functionality with smart content detection
                buttonHtml.on("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    var text = getClipboardText($this);

                    // Copy to clipboard
                    navigator.clipboard.writeText(text).then(function () {
                        // Success feedback with improved animation
                        buttonHtml.html('<i class="fa fa-check" aria-hidden="true"></i>')
                                 .css({
                                     'color': '#22c55e',
                                     'border-color': 'rgba(34, 197, 94, 0.5)',
                                     'background': 'rgba(34, 197, 94, 0.1)'
                                 });
                        
                        setTimeout(function () {
                            buttonHtml.html('<i class="fa fa-clipboard" aria-hidden="true"></i>')
                                     .css({
                                         'color': '#3DD1A5',
                                         'border-color': 'rgba(61, 209, 165, 0.3)',
                                         'background': 'rgba(0, 0, 0, 0.7)'
                                     });
                        }, 2000);
                    }).catch(function (err) {
                        console.error("Clipboard write failed:", err);
                        
                        // Error feedback
                        buttonHtml.html('<i class="fa fa-exclamation-triangle" aria-hidden="true"></i>')
                                 .css({
                                     'color': '#ef4444',
                                     'border-color': 'rgba(239, 68, 68, 0.5)',
                                     'background': 'rgba(239, 68, 68, 0.1)'
                                 });
                        
                        setTimeout(function () {
                            buttonHtml.html('<i class="fa fa-clipboard" aria-hidden="true"></i>')
                                     .css({
                                         'color': '#3DD1A5',
                                         'border-color': 'rgba(61, 209, 165, 0.3)',
                                         'background': 'rgba(0, 0, 0, 0.7)'
                                     });
                        }, 2000);
                    });
                });

                // Determine where to position the button
                var $buttonParent = $this;
                var $terminalBlock = $this.closest('.terminal-block');
                var $ideBlock = $this.closest('.ide-block');
                
                // If this is inside a terminal block, position button on the terminal block
                if ($terminalBlock.length > 0) {
                    $buttonParent = $terminalBlock;
                    // Ensure terminal block is positioned relatively
                    if ($terminalBlock.css('position') === 'static') {
                        $terminalBlock.css('position', 'relative');
                    }
                    // Check if terminal block already has a clipboard button
                    if ($terminalBlock.find('.clipboard-button').length > 0) {
                        return; // Skip if button already exists on this terminal
                    }
                }
                // If this is inside an IDE block, position button on the IDE block
                else if ($ideBlock.length > 0) {
                    $buttonParent = $ideBlock;
                    // Ensure IDE block is positioned relatively
                    if ($ideBlock.css('position') === 'static') {
                        $ideBlock.css('position', 'relative');
                    }
                    // Check if IDE block already has a clipboard button
                    if ($ideBlock.find('.clipboard-button').length > 0) {
                        return; // Skip if button already exists on this IDE
                    }
                } else {
                    // For standalone elements, ensure parent is positioned relatively
                    if ($this.css('position') === 'static') {
                        $this.css('position', 'relative');
                    }
                }

                // Append the button to the appropriate parent
                $buttonParent.append(buttonHtml);

                // Enhanced hover functionality with better positioning
                var $hoverTarget = $this;
                if ($terminalBlock.length > 0) {
                    $hoverTarget = $terminalBlock;
                } else if ($ideBlock.length > 0) {
                    $hoverTarget = $ideBlock;
                }
                
                $hoverTarget.hover(
                    function () {
                        // Show button with fade in
                        buttonHtml.stop().fadeIn(200).css({
                            'transform': 'translateY(0)',
                            'opacity': '1'
                        });
                        
                        // Adjust position based on content height and type
                        if ($terminalBlock.length > 0) {
                            // For terminal blocks, position relative to the header
                            buttonHtml.css('top', '0.5rem');
                        } else if ($ideBlock.length > 0) {
                            // For IDE blocks, position in top-right corner
                            buttonHtml.css('top', '0.5rem');
                        } else {
                            // For standalone elements, use original logic
                            var targetHeight = $hoverTarget.outerHeight();
                            if (targetHeight < 60) {
                                buttonHtml.css('top', '0.25rem');
                            } else {
                                buttonHtml.css('top', '0.5rem');
                            }
                        }
                    },
                    function () {
                        // Hide button with fade out
                        buttonHtml.stop().fadeOut(150);
                    }
                );

                // Handle scrolling within elements
                $hoverTarget.on('scroll', function() {
                    if ($hoverTarget.is(':hover')) {
                        buttonHtml.css('display', 'block');
                    }
                });
        });
    }
    }

    // Smart content detection function with selective whitespace preservation
    function getClipboardText($preElement) {
        // Check if this is a terminal command (has terminal-command class)
        if ($preElement.hasClass('terminal-command')) {
            // For terminal commands, preserve exact content including leading/trailing spaces
            return getPreservedText($preElement);
        }

        // Check if this is inside a terminal block
        var terminalBlock = $preElement.closest('.terminal-block');
        if (terminalBlock.length > 0) {
            // Look for terminal-command class within the terminal block
            var terminalCommand = terminalBlock.find('pre.terminal-command');
            if (terminalCommand.length > 0) {
                return getPreservedText(terminalCommand);
            }
            
            // Fallback: extract command from terminal content with preservation
            return extractTerminalCommand($preElement);
        }

        // Check if this is inside an IDE block
        var ideBlock = $preElement.closest('.ide-block');
        if (ideBlock.length > 0) {
            // For IDE blocks, preserve whitespace and formatting
            return extractIdeCode($preElement);
        }

        // Default behavior for other pre elements - normal cleanup
        return getStandardText($preElement);
    }
    
    // Standard text extraction with normal cleanup for non-IDE/terminal elements
    function getStandardText($element) {
        return $element.clone()
            .find('.clipboard-button')
            .remove()
            .end()
            .text()
            .trim()
            .replace(/\s+$/gm, '') // Remove trailing whitespace from lines
            .replace(/^\s*\n/, ''); // Remove leading empty lines
    }
    
    // Enhanced text extraction with perfect whitespace preservation
    function getPreservedText($element) {
        // Method 1: Try to use textContent which preserves whitespace best
        var textContent = $element[0].textContent;
        
        // Remove clipboard button content if present
        var $clone = $element.clone();
        $clone.find('.clipboard-button').remove();
        
        // Method 2: Use the cleaned clone if textContent failed
        if (!textContent || textContent.trim().length === 0) {
            textContent = $clone[0].textContent || $clone[0].innerText || $clone.text();
        } else {
            // Remove button text from main content
            var buttonText = $element.find('.clipboard-button').text();
            if (buttonText) {
                textContent = textContent.replace(buttonText, '');
            }
        }
        
        // Method 3: Manual extraction using TreeWalker for ultimate accuracy
        if (!textContent || textContent.trim().length === 0) {
            textContent = extractTextWithTreeWalker($clone[0]);
        }
        
        return textContent;
    }
    
    // Manual text extraction using TreeWalker to preserve exact whitespace
    function extractTextWithTreeWalker(element) {
        if (!element || !document.createTreeWalker) {
            return element ? (element.textContent || element.innerText || '') : '';
        }
        
        var walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT,
            null,
            false
        );
        
        var textContent = '';
        var node;
        
        while (node = walker.nextNode()) {
            // Skip text nodes that are inside clipboard buttons
            if (!$(node).closest('.clipboard-button').length) {
                textContent += node.textContent;
            }
        }
        
        return textContent;
    }

    // Extract terminal command without prompt - preserve newlines
    function extractTerminalCommand($preElement) {
        // For terminal blocks, preserve the exact content but clean prompts
        var fullText = getPreservedText($preElement);
        var lines = fullText.split('\n');
        var commands = [];
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            var trimmedLine = line.trim();
            
            if (trimmedLine) {
                // Skip common prompt patterns but preserve the command structure
                if (trimmedLine.match(/^[\w@\-\.]+[:#\$]\s/)) {
                    // Extract command after prompt, preserving original spacing
                    var commandMatch = line.match(/^.*?[:#\$]\s+(.*)$/);
                    if (commandMatch && commandMatch[1]) {
                        commands.push(commandMatch[1]);
                    }
                } else if (trimmedLine.match(/^┌──|^└──/)) {
                    // Skip Kali Linux fancy prompt decorations
                    continue;
                } else if (trimmedLine.match(/^\s*[>#\$]\s/)) {
                    // Handle simple prompts, preserve spacing after prompt
                    var simpleCommand = line.replace(/^\s*[>#\$]\s+/, '');
                    if (simpleCommand) {
                        commands.push(simpleCommand);
                    }
                } else if (!trimmedLine.match(/^[\w@\-\.\s\(\)\[\]~]+[:#\$]\s*$/) && 
                          !trimmedLine.match(/Starting|Nmap|PORT|tcp|open|service/)) {
                    // This looks like a command or code, preserve it with original spacing
                    commands.push(line);
                }
            } else {
                // Preserve empty lines for formatting
                commands.push(line);
            }
        }
        
        return commands.length > 0 ? commands.join('\n') : fullText;
    }

    // Extract IDE code preserving exact formatting and indentation
    function extractIdeCode($preElement) {
        // First try to get the exact content with preserved whitespace
        var fullText = getPreservedText($preElement);
        
        // Check if this IDE block has line numbers that need to be removed
        var hasLineNumbers = $preElement.closest('.ide-block').find('.line-number').length > 0;
        
        if (!hasLineNumbers) {
            // No line numbers to worry about, return exact content
            return fullText;
        }
        
        // Handle IDE blocks with line numbers - preserve formatting while removing numbers
        var lines = fullText.split('\n');
        var codeLines = [];
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            
            // Skip lines that are just line numbers (pure numbers with optional whitespace)
            if (line.match(/^\s*\d+\s*$/)) {
                continue;
            }
            
            // For lines with line numbers at start, remove just the number but preserve indentation
            if (line.match(/^\s*\d+\s+/)) {
                // Extract everything after the line number while preserving the original indentation structure
                var cleanLine = line.replace(/^\s*\d+\s/, '');
                codeLines.push(cleanLine);
            } else {
                // Line doesn't start with a number, keep it exactly as is
                codeLines.push(line);
            }
        }
        
        return codeLines.length > 0 ? codeLines.join('\n') : fullText;
    }

    // Enhanced global function for manual triggering
    window.addClipboardFunctionality = addClipboardFunctionality;

    // Apply clipboard functionality on page load
    addClipboardFunctionality();

    // Handle dynamic content changes - Thinkific CoursePlayerV2 compatibility
    if (typeof CoursePlayerV2 !== "undefined") {
        CoursePlayerV2.on("hooks:contentDidChange", function () {
            setTimeout(addClipboardFunctionality, 1000);
        });
    }

    // Additional fallback for dynamic content using MutationObserver
    if (typeof MutationObserver !== "undefined") {
        var observer = new MutationObserver(function(mutations) {
            var shouldReapply = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Check if new pre elements were added
                            if (node.tagName === 'PRE' || $(node).find('pre').length > 0) {
                                shouldReapply = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldReapply) {
                setTimeout(addClipboardFunctionality, 100);
            }
        });

        // Start observing the document for changes
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    // Handle window resize for better positioning
    $(window).on('resize', function() {
        $('.clipboard-button').each(function() {
            var $button = $(this);
            var $pre = $button.closest('pre');
            
            if ($pre.length > 0) {
                var preHeight = $pre.outerHeight();
                if (preHeight < 60) {
                    $button.css('top', '0.25rem');
                } else {
                    $button.css('top', '0.5rem');
                }
            }
        });
    });
});
