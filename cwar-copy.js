$(document).ready(function () {
    function addClipboardFunctionality() {
        // Add clipboard functionality to <pre> elements
        $("pre").each(function () {
            var $this = $(this);

            // Check if the clipboard button is already added
            if ($this.find(".clipboard-button").length === 0) {
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

                // Add enhanced click functionality
                buttonHtml.on("click", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Get text content and clean up
                    var text = $this.clone()
                        .find('.clipboard-button')
                        .remove()
                        .end()
                        .text()
                        .trim()
                        .replace(/\s+$/gm, '') // Remove trailing whitespace from lines
                        .replace(/^\s*\n/, ''); // Remove leading empty lines

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

                // Ensure parent is positioned relatively
                if ($this.css('position') === 'static') {
                    $this.css('position', 'relative');
                }

                // Append the button to the <pre> element
                $this.append(buttonHtml);

                // Enhanced hover functionality with better positioning
                $this.hover(
                    function () {
                        // Show button with fade in
                        buttonHtml.stop().fadeIn(200).css({
                            'transform': 'translateY(0)',
                            'opacity': '1'
                        });
                        
                        // Adjust position based on content height
                        var preHeight = $this.outerHeight();
                        if (preHeight < 60) {
                            buttonHtml.css('top', '0.25rem');
                        } else {
                            buttonHtml.css('top', '0.5rem');
                        }
                    },
                    function () {
                        // Hide button with fade out
                        buttonHtml.stop().fadeOut(150);
                    }
                );

                // Handle scrolling within pre elements
                $this.on('scroll', function() {
                    if ($this.is(':hover')) {
                        buttonHtml.css('display', 'block');
                    }
                });
            }
        });
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
