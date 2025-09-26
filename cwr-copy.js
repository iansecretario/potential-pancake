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

    // Smart content detection function
    function getClipboardText($preElement) {
        // Check if this is a terminal command (has terminal-command class)
        if ($preElement.hasClass('terminal-command')) {
            return $preElement.text().trim();
        }

        // Check if this is inside a terminal block
        var terminalBlock = $preElement.closest('.terminal-block');
        if (terminalBlock.length > 0) {
            // Look for terminal-command class within the terminal block
            var terminalCommand = terminalBlock.find('pre.terminal-command');
            if (terminalCommand.length > 0) {
                return terminalCommand.text().trim();
            }
            
            // Fallback: extract command from terminal content
            return extractTerminalCommand($preElement);
        }

        // Check if this is inside an IDE block
        var ideBlock = $preElement.closest('.ide-block');
        if (ideBlock.length > 0) {
            // Find the pre.ide-content element within the IDE block
            var ideContent = ideBlock.find('pre.ide-content');
            if (ideContent.length > 0) {
                // Use innerText which better preserves formatting including empty lines
                // If innerText is not available (some browsers), fall back to textContent
                var elem = ideContent[0];
                var content = elem.innerText;
                
                // If innerText is undefined (might happen in some contexts), use textContent
                if (content === undefined) {
                    content = elem.textContent;
                }
                
                return content;
            }
            // Otherwise use the legacy extraction method
            return extractIdeCode($preElement);
        }

        // Default behavior for other pre elements
        return $preElement.clone()
            .find('.clipboard-button')
            .remove()
            .end()
            .text()
            .trim()
            .replace(/\s+$/gm, '') // Remove trailing whitespace from lines
            .replace(/^\\s*\\n/, ''); // Remove leading empty lines
    }

    // Extract terminal command without prompt
    function extractTerminalCommand($preElement) {
        var fullText = $preElement.text();
        var lines = fullText.split('\\n');
        var commands = [];
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line) {
                // Skip common prompt patterns
                if (line.match(/^[\\w@\\-\\.]+[:#\\$]\\s/)) {
                    // Extract command after prompt
                    var commandMatch = line.match(/^[\\w@\\-\\.\\(\\)\\[\\]\\s~]+[:#\\$]\\s+(.+)$/);
                    if (commandMatch && commandMatch[1]) {
                        commands.push(commandMatch[1]);
                    }
                } else if (line.match(/^┌──|^└──/)) {
                    // Skip Kali Linux fancy prompt decorations
                    continue;
                } else if (line.match(/^\\s*[>#\\$]\\s/)) {
                    // Handle simple prompts
                    var simpleCommand = line.replace(/^\\s*[>#\\$]\\s+/, '');
                    if (simpleCommand) {
                        commands.push(simpleCommand);
                    }
                } else if (!line.match(/^[\\w@\\-\\.\\s\\(\\)\\[\\]~]+[:#\\$]\\s*$/) && 
                          !line.match(/Starting|Nmap|PORT|tcp|open|service/)) {
                    // This looks like output, skip it unless it's a clear command
                    if (line.match(/^[a-zA-Z][\\w\\-\\.]+/)) {
                        commands.push(line);
                    }
                }
            }
        }
        
        return commands.length > 0 ? commands.join('\\n') : fullText.trim();
    }

    // Extract IDE code without line numbers
    function extractIdeCode($preElement) {
        // Check if it's a pre.ide-content element (new format without line numbers)
        if ($preElement.hasClass('ide-content')) {
            // Use innerText for better whitespace preservation
            var elem = $preElement[0];
            var content = elem.innerText;
            
            // Fallback to textContent if innerText is not available
            if (content === undefined) {
                content = elem.textContent;
            }
            
            return content;
        }
        
        // For legacy format, clone and process
        var $clone = $preElement.clone();
        
        // Remove clipboard button
        $clone.find('.clipboard-button').remove();
        
        // Legacy format with line numbers embedded in the text
        var text = $clone.text();
        
        // Split into lines and process
        var lines = text.split('\n');
        var codeLines = [];
        
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            
            // Skip line numbers (lines that start with just numbers and whitespace)
            if (line.match(/^\s*\d+\s*$/)) {
                continue;
            }
            
            // Remove line numbers from the beginning of lines
            var cleanLine = line.replace(/^\s*\d+\s+/, '');
            
            // IMPORTANT: Preserve empty lines
            codeLines.push(cleanLine);
        }
        
        return codeLines.join('\n');
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
