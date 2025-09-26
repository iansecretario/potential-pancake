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
        // For all pre elements, prioritize perfect whitespace preservation first
        if ($preElement.is('pre')) {
            // Check if this is a terminal command (has terminal-command class)
            if ($preElement.hasClass('terminal-command')) {
                // For terminal commands, preserve exact content including leading/trailing spaces
                return getPreElementText($preElement);
            }

            // Check if this is inside a terminal block
            var terminalBlock = $preElement.closest('.terminal-block');
            if (terminalBlock.length > 0) {
                // Look for terminal-command class within the terminal block
                var terminalCommand = terminalBlock.find('pre.terminal-command');
                if (terminalCommand.length > 0) {
                    return getPreElementText(terminalCommand);
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

            // For any other pre element, use perfect whitespace preservation
            return getPreElementText($preElement);
        }

        // Default behavior for non-pre elements
        return getStandardText($preElement);
    }
    
    // Standard text extraction with normal cleanup for non-IDE/terminal elements
    function getStandardText($element) {
        var $clone = $element.clone();
        $clone.find('.clipboard-button').remove();
        
        // For pre elements, use innerText to preserve whitespace
        if ($element.is('pre') && $clone[0].innerText !== undefined) {
            return $clone[0].innerText;
        }
        
        // For other elements, use standard text extraction with cleanup
        return $clone.text()
            .trim()
            .replace(/\s+$/gm, '') // Remove trailing whitespace from lines
            .replace(/^\s*\n/, ''); // Remove leading empty lines
    }
    
    // Enhanced text extraction with perfect whitespace preservation and BR conversion
    function getPreservedText($element) {
        // Remove clipboard button content if present
        var $clone = $element.clone();
        $clone.find('.clipboard-button').remove();
        
        // Method 1: Use innerText to preserve whitespace and line breaks exactly as rendered
        var textContent;
        if ($clone[0].innerText !== undefined) {
            // innerText preserves visual formatting including whitespace and line breaks
            textContent = $clone[0].innerText;
        } else {
            // Fallback for older browsers - use textContent but try to preserve formatting
            textContent = $clone[0].textContent || $clone.text();
        }
        
        // Method 2: Fallback to textContent if innerText failed
        if (!textContent || textContent.trim().length === 0) {
            textContent = $clone[0].textContent || $clone.text();
        }
        
        // Method 3: Manual extraction using TreeWalker for ultimate accuracy
        if (!textContent || textContent.trim().length === 0) {
            textContent = extractTextWithTreeWalker($clone[0]);
        }
        
        return textContent;
    }
    
    // Specialized function for extracting text from pre elements with perfect whitespace preservation
    function getPreElementText($preElement) {
        var $clone = $preElement.clone();
        $clone.find('.clipboard-button').remove();
        
        var element = $clone[0];
        
        // Method 1: Use innerText if available (best for whitespace preservation)
        if (typeof element.innerText === 'string') {
            return element.innerText;
        }
        
        // Method 2: Use textContent as fallback
        if (typeof element.textContent === 'string') {
            return element.textContent;
        }
        
        // Method 3: Check for innerText as property (older browsers)
        if (element.innerText !== undefined && element.innerText !== null) {
            return String(element.innerText);
        }
        
        // Method 4: jQuery text() as last resort
        return $clone.text();
    }
    
    // Manual text extraction using TreeWalker to preserve exact whitespace and handle BR tags
    function extractTextWithTreeWalker(element) {
        if (!element || !document.createTreeWalker) {
            // Fallback: use innerText for better whitespace preservation
            if (element && element.innerText !== undefined) {
                return element.innerText;
            }
            return element ? (element.textContent || '') : '';
        }
        
        var walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT,
            {
                acceptNode: function(node) {
                    // Accept text nodes and BR elements
                    if (node.nodeType === Node.TEXT_NODE) {
                        // Skip text nodes that are inside clipboard buttons
                        if ($(node).closest('.clipboard-button').length) {
                            return NodeFilter.FILTER_REJECT;
                        }
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    // Accept BR elements
                    if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'br') {
                        return NodeFilter.FILTER_ACCEPT;
                    }
                    return NodeFilter.FILTER_SKIP;
                }
            },
            false
        );
        
        var textContent = '';
        var node;
        
        while (node = walker.nextNode()) {
            if (node.nodeType === Node.TEXT_NODE) {
                // Preserve text content exactly as is (including whitespace)
                textContent += node.textContent;
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName.toLowerCase() === 'br') {
                // Convert BR tags to actual newlines
                textContent += '\n';
            }
        }
        
        return textContent;
    }

    // Extract terminal command without prompt - preserve newlines
    function extractTerminalCommand($preElement) {
        // For terminal blocks, preserve the exact content but clean prompts
        var fullText = getPreElementText($preElement);
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
        var fullText = getPreElementText($preElement);
        
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
