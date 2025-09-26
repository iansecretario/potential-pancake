
$(document).ready(function () {
    // Detect if we're running in Thinkific environment
    var isThinkific = (typeof CoursePlayerV2 !== "undefined" || 
                      window.location.hostname.includes('thinkific') ||
                      $('body').hasClass('thinkific') ||
                      $('.thinkific-content').length > 0);
    
    function addEnhancedClipboardFunctionality() {
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
            // 2. Pre elements inside terminal blocks
            else if ($this.closest('.terminal-block').length > 0) {
                var terminalBlock = $this.closest('.terminal-block');
                var hasTerminalCommand = terminalBlock.find('pre.terminal-command').length > 0;
                
                if (hasTerminalCommand) {
                    shouldAddClipboard = $this.hasClass('terminal-command');
                } else {
                    shouldAddClipboard = true;
                }
            }
            // 3. Pre elements inside IDE blocks
            else if ($this.closest('.ide-block').length > 0) {
                shouldAddClipboard = true;
            }
            // 4. Standalone pre elements
            else if ($this.closest('.terminal-block').length === 0 && 
                     $this.closest('.ide-block').length === 0) {
                var text = $this.text().trim();
                if (text.length > 0 && !text.match(/^\\s*(Starting|PORT|tcp|open|service|Nmap)/i)) {
                    shouldAddClipboard = true;
                }
            }

            if (!shouldAddClipboard) {
                return;
            }
            
            // Create the clipboard button
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

            // Enhanced click functionality with perfect visual preservation
            buttonHtml.on("click", function (e) {
                e.preventDefault();
                e.stopPropagation();
                
                var text = getEnhancedClipboardText($this);

                // Copy to clipboard
                navigator.clipboard.writeText(text).then(function () {
                    // Success feedback
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
                    console.error("Enhanced clipboard write failed:", err);
                    
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

            // Position the button appropriately
            var $buttonParent = $this;
            var $terminalBlock = $this.closest('.terminal-block');
            var $ideBlock = $this.closest('.ide-block');
            
            if ($terminalBlock.length > 0) {
                $buttonParent = $terminalBlock;
                if ($terminalBlock.css('position') === 'static') {
                    $terminalBlock.css('position', 'relative');
                }
                if ($terminalBlock.find('.clipboard-button').length > 0) {
                    return;
                }
            }
            else if ($ideBlock.length > 0) {
                $buttonParent = $ideBlock;
                if ($ideBlock.css('position') === 'static') {
                    $ideBlock.css('position', 'relative');
                }
                if ($ideBlock.find('.clipboard-button').length > 0) {
                    return;
                }
            } else {
                if ($this.css('position') === 'static') {
                    $this.css('position', 'relative');
                }
            }

            $buttonParent.append(buttonHtml);

            // Enhanced hover functionality
            var $hoverTarget = $this;
            if ($terminalBlock.length > 0) {
                $hoverTarget = $terminalBlock;
            } else if ($ideBlock.length > 0) {
                $hoverTarget = $ideBlock;
            }
            
            $hoverTarget.hover(
                function () {
                    buttonHtml.stop().fadeIn(200).css({
                        'transform': 'translateY(0)',
                        'opacity': '1'
                    });
                },
                function () {
                    buttonHtml.stop().fadeOut(150);
                }
            );
        });
    }

    // Enhanced clipboard text extraction with perfect visual preservation
    function getEnhancedClipboardText($preElement) {
        // Check if this is inside an IDE block with line numbers
        var $ideBlock = $preElement.closest('.ide-block');
        if ($ideBlock.length > 0) {
            return getIdeCodeWithLineNumbers($preElement);
        }
        
        return getPerfectVisualText($preElement);
    }
    
    // Perfect visual text extraction - maintains EXACT formatting as displayed
    function getPerfectVisualText($element) {
        var $clone = $element.clone();
        $clone.find('.clipboard-button').remove();
        
        var element = $clone[0];
        var text = '';
        
        // Method 1: Use innerText for perfect visual preservation
        if (typeof element.innerText === 'string') {
            text = element.innerText;
        }
        // Method 2: Fallback to textContent
        else if (typeof element.textContent === 'string') {
            text = element.textContent;
        }
        // Method 3: Last resort - jQuery text
        else {
            text = $clone.text();
        }
        
        // Only remove truly invisible characters, preserve ALL visual formatting
        return cleanInvisibleCharacters(text);
    }
    
    // Specialized IDE code extraction that handles line numbers intelligently
    function getIdeCodeWithLineNumbers($preElement) {
        var $ideBlock = $preElement.closest('.ide-block');
        
        // Method 1: Try to find separate line number and code containers
        var $lineNumbers = $ideBlock.find('.line-numbers, .line-number');
        var $codeContent = $ideBlock.find('.code-content, .code, pre');
        
        if ($lineNumbers.length > 0 && $codeContent.length > 0) {
            // Extract code content without line numbers
            return getPerfectVisualText($codeContent.last());
        }
        
        // Method 2: Handle inline line numbers (numbers at start of each line)
        var fullText = getPerfectVisualText($preElement);
        var lines = fullText.split('\n');
        var codeLines = [];
        var hasLineNumbers = false;
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            
            // Check if line starts with a number followed by whitespace
            var lineNumberMatch = line.match(/^\s*(\d+)\s+(.*)$/);
            if (lineNumberMatch) {
                hasLineNumbers = true;
                var lineNumber = parseInt(lineNumberMatch[1]);
                var codeContent = lineNumberMatch[2];
                
                // Only include if the line number makes sense (sequential)
                if (lineNumber === i + 1 || lineNumber === codeLines.length + 1) {
                    codeLines.push(codeContent);
                } else {
                    // Not a line number, include the whole line
                    codeLines.push(line);
                }
            } else if (line.match(/^\s*\d+\s*$/) && hasLineNumbers) {
                // Line with just a number - skip it (it's likely a line number on its own)
                continue;
            } else {
                // Regular line, keep as is
                codeLines.push(line);
            }
        }
        
        // If we found line numbers, return the cleaned code
        if (hasLineNumbers && codeLines.length > 0) {
            return codeLines.join('\n');
        }
        
        // Method 3: Fallback to regular text extraction
        return fullText;
    }
    
    // Clean only invisible/control characters that don't affect visual layout
    function cleanInvisibleCharacters(text) {
        if (!text) return text;
        
        // Remove zero-width characters that are truly invisible
        text = text.replace(/[\u200B-\u200D\uFEFF]/g, '');
        
        // Convert non-breaking spaces to regular spaces (preserves the space)
        text = text.replace(/\u00A0/g, ' ');
        
        // DON'T remove any newlines or whitespace - preserve EVERYTHING visual
        return text;
    }

    // Enhanced global function for manual triggering
    window.addEnhancedClipboardFunctionality = addEnhancedClipboardFunctionality;

    // Apply enhanced clipboard functionality on page load
    addEnhancedClipboardFunctionality();

    // Handle dynamic content changes - Thinkific compatibility
    if (typeof CoursePlayerV2 !== "undefined") {
        CoursePlayerV2.on("hooks:contentDidChange", function () {
            setTimeout(addEnhancedClipboardFunctionality, 1000);
        });
    }

    // Enhanced MutationObserver for dynamic content
    if (typeof MutationObserver !== "undefined") {
        var observer = new MutationObserver(function(mutations) {
            var shouldReapply = false;
            
            mutations.forEach(function(mutation) {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach(function(node) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            if (node.tagName === 'PRE' || $(node).find('pre').length > 0) {
                                shouldReapply = true;
                            }
                        }
                    });
                }
            });
            
            if (shouldReapply) {
                setTimeout(addEnhancedClipboardFunctionality, 100);
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    console.log('CWR Enhanced Clipboard loaded - Perfect visual preservation enabled');
});
