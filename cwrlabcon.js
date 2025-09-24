/**
 * CWR Lab Connection Module
 * Manages Guacamole remote desktop connections for CyberLearn platform
 * @module cwrlabcon
 * @version 1.0.0
 */

(function(window) {
    'use strict';

    // Module namespace
    const CWRLabCon = {};

    // Configuration
    const config = {
        defaultTimeout: 30000,
        reconnectDelay: 5000,
        maxReconnectAttempts: 3,
        statusCheckInterval: 10000,
        animationDuration: 300
    };

    // Connection states
    const ConnectionState = {
        DISCONNECTED: 'disconnected',
        CONNECTING: 'connecting',
        CONNECTED: 'connected',
        ERROR: 'error',
        RECONNECTING: 'reconnecting'
    };

    // Status messages
    const StatusMessages = {
        [ConnectionState.DISCONNECTED]: 'Loading CWR lab...',
        [ConnectionState.CONNECTING]: 'Establishing secure connection...',
        [ConnectionState.CONNECTED]: 'Connected',
        [ConnectionState.ERROR]: 'Connection failed',
        [ConnectionState.RECONNECTING]: 'Reconnecting...'
    };

    /**
     * Initialize a lab container with enhanced features
     * @param {string|Element} container - Container selector or element
     * @param {Object} options - Configuration options
     */
    CWRLabCon.init = function(container, options = {}) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!element || !element.classList.contains('guac-lab-container')) {
            console.error('CWRLabCon: Invalid container element');
            return null;
        }

        // Merge options with defaults
        const settings = Object.assign({}, config, options);

        // Create unique instance ID
        const instanceId = 'cwr-guac-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        element.setAttribute('id', instanceId);

        // Initialize instance
        const instance = {
            id: instanceId,
            element: element,
            settings: settings,
            state: ConnectionState.DISCONNECTED,
            reconnectCount: 0,
            statusInterval: null
        };

        // Store instance reference
        element._cwrLabInstance = instance;

        // Setup event handlers
        setupEventHandlers(instance);

        // Start status monitoring if enabled
        if (settings.statusCheckInterval > 0) {
            startStatusMonitoring(instance);
        }

        return instance;
    };

    /**
     * Connect to Guacamole server
     * @param {string|Element} container - Container selector or element
     * @param {string} connectionUrl - Guacamole connection URL
     */
    CWRLabCon.connect = function(container, connectionUrl) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!element || !connectionUrl) {
            console.error('CWRLabCon: Invalid container or connection URL');
            return false;
        }

        const instance = element._cwrLabInstance || CWRLabCon.init(element);
        
        updateState(instance, ConnectionState.CONNECTING);
        
        // Set the connection URL
        element.setAttribute('data-guac-connection-url', connectionUrl);
        
        const iframe = element.querySelector('.guac-embed');
        const placeholder = element.querySelector('.guac-placeholder');
        
        if (iframe) {
            // Add load handler
            iframe.onload = function() {
                updateState(instance, ConnectionState.CONNECTED);
                if (placeholder) placeholder.style.display = 'none';
                iframe.style.display = 'block';
                instance.reconnectCount = 0;
                
                // Update connect button to show connected state
                const connectBtn = element.querySelector('.guac-connect-btn, [data-cwr-action="connect"]');
                if (connectBtn) {
                    connectBtn.disabled = true;
                    connectBtn.style.background = '#22c55e';
                    connectBtn.style.borderColor = 'rgba(34,197,94,0.3)';
                    connectBtn.innerHTML = '<i class="fas fa-check" style="font-size:11px;"></i><span style="font-size:13px;">Connected</span>';
                    connectBtn.style.gap = '4px';
                }
            };

            iframe.onerror = function() {
                handleConnectionError(instance);
            };

            // Set the iframe source
            iframe.src = connectionUrl;
            
            // Timeout handler
            setTimeout(function() {
                if (instance.state === ConnectionState.CONNECTING) {
                    handleConnectionError(instance);
                }
            }, instance.settings.defaultTimeout);
        }

        return true;
    };

    /**
     * Disconnect from Guacamole server
     * @param {string|Element} container - Container selector or element
     */
    CWRLabCon.disconnect = function(container) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!element) return false;

        const instance = element._cwrLabInstance;
        if (!instance) return false;

        const iframe = element.querySelector('.guac-embed');
        const placeholder = element.querySelector('.guac-placeholder');
        
        if (iframe) {
            iframe.src = '';
            iframe.style.display = 'none';
        }
        
        if (placeholder) {
            placeholder.style.display = 'block';
        }

        updateState(instance, ConnectionState.DISCONNECTED);
        stopStatusMonitoring(instance);

        return true;
    };

    /**
     * Maximize/minimize the lab view
     * @param {string|Element} container - Container selector or element
     */
    CWRLabCon.toggleMaximize = function(container) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!element) return false;

        // Use unique CWR classes for targeting
        const wrapper = element.querySelector('.guac-embed-wrapper, [data-cwr-element="embed-wrapper"]');
        const btn = element.querySelector('.guac-control-btn[onclick*="Maximize"], [data-cwr-action="maximize"]');
        
        if (!wrapper) return false;

        const isMaximized = wrapper.style.position === 'fixed';
        
        // Add/remove maximized class for CSS targeting
        element.classList.toggle('cwr-lab-maximized', !isMaximized);
        
        if (isMaximized) {
            // Restore normal view
            Object.assign(wrapper.style, {
                position: 'relative',
                top: 'auto',
                left: 'auto',
                width: '100%',
                height: '600px',
                zIndex: 'auto'
            });
            
            if (btn) {
                btn.querySelector('i').className = 'fas fa-expand';
                btn.title = 'Maximize';
            }
        } else {
            // Maximize view
            Object.assign(wrapper.style, {
                position: 'fixed',
                top: '0',
                left: '0',
                width: '100vw',
                height: '100vh',
                zIndex: '9999'
            });
            
            if (btn) {
                btn.querySelector('i').className = 'fas fa-compress';
                btn.title = 'Minimize';
            }
        }

        // Add smooth transition
        wrapper.style.transition = `all ${element._cwrLabInstance?.settings.animationDuration || 300}ms ease`;

        return true;
    };

    /**
     * Open lab in new tab
     * @param {string|Element} container - Container selector or element
     */
    CWRLabCon.openInNewTab = function(container) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!element) return false;

        const url = element.getAttribute('data-guac-connection-url');
        
        if (url) {
            window.open(url, '_blank');
            return true;
        } else {
            console.warn('CWRLabCon: No connection URL set');
            return false;
        }
    };

    /**
     * Reload the lab connection
     * @param {string|Element} container - Container selector or element
     */
    CWRLabCon.reload = function(container) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!element) return false;

        const iframe = element.querySelector('.guac-embed');
        const url = element.getAttribute('data-guac-connection-url');
        
        if (iframe && url) {
            const instance = element._cwrLabInstance;
            if (instance) {
                updateState(instance, ConnectionState.CONNECTING);
            }
            
            // Force reload by clearing and resetting src
            iframe.src = '';
            setTimeout(function() {
                iframe.src = url;
            }, 100);
            
            return true;
        }
        
        return false;
    };

    /**
     * Get current connection status
     * @param {string|Element} container - Container selector or element
     * @returns {Object} Status object with state and message
     */
    CWRLabCon.getStatus = function(container) {
        const element = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;

        if (!element) return null;

        const instance = element._cwrLabInstance;
        
        return {
            state: instance?.state || ConnectionState.DISCONNECTED,
            message: StatusMessages[instance?.state] || 'Unknown',
            connected: instance?.state === ConnectionState.CONNECTED,
            connectionUrl: element.getAttribute('data-guac-connection-url'),
            instanceId: instance?.id
        };
    };

    /**
     * Auto-connect all lab containers on page
     */
    CWRLabCon.autoConnectAll = function() {
        const containers = document.querySelectorAll('.guac-lab-container');
        let connectedCount = 0;

        containers.forEach(container => {
            const url = container.getAttribute('data-guac-connection-url');
            if (url && url.length > 0) {
                CWRLabCon.connect(container, url);
                connectedCount++;
            }
        });

        console.log(`CWRLabCon: Auto-connected ${connectedCount} lab(s)`);
        return connectedCount;
    };

    // Private helper functions

    function updateState(instance, newState) {
        if (!instance) return;
        
        instance.state = newState;
        instance.element.setAttribute('data-guac-status', newState);
        
        const statusText = instance.element.querySelector('.guac-status-text');
        if (statusText) {
            statusText.textContent = StatusMessages[newState];
            
            // Update status color based on state
            switch(newState) {
                case ConnectionState.CONNECTED:
                    statusText.style.color = '#22c55e';
                    break;
                case ConnectionState.ERROR:
                    statusText.style.color = '#ef4444';
                    break;
                case ConnectionState.CONNECTING:
                case ConnectionState.RECONNECTING:
                    statusText.style.color = '#fbbf24';
                    break;
                default:
                    statusText.style.color = '#94a3b8';
            }
        }
    }

    function handleConnectionError(instance) {
        if (!instance) return;

        if (instance.reconnectCount < instance.settings.maxReconnectAttempts) {
            instance.reconnectCount++;
            updateState(instance, ConnectionState.RECONNECTING);
            
            setTimeout(function() {
                const url = instance.element.getAttribute('data-guac-connection-url');
                if (url) {
                    CWRLabCon.connect(instance.element, url);
                }
            }, instance.settings.reconnectDelay);
        } else {
            updateState(instance, ConnectionState.ERROR);
            console.error('CWRLabCon: Maximum reconnection attempts reached');
        }
    }

    function setupEventHandlers(instance) {
        if (!instance || !instance.element) return;

        // Handle visibility changes for auto-pause/resume
        document.addEventListener('visibilitychange', function() {
            if (document.hidden && instance.state === ConnectionState.CONNECTED) {
                // Optionally pause or reduce activity when hidden
                console.log('CWRLabCon: Tab hidden, connection maintained');
            } else if (!document.hidden && instance.state === ConnectionState.CONNECTED) {
                // Resume full activity when visible
                console.log('CWRLabCon: Tab visible, connection active');
            }
        });

        // Handle connection state changes
        instance.element.addEventListener('connectionStateChange', function(event) {
            console.log('CWRLabCon: State changed to', event.detail);
        });
    }

    function startStatusMonitoring(instance) {
        if (!instance || instance.statusInterval) return;

        instance.statusInterval = setInterval(function() {
            if (instance.state === ConnectionState.CONNECTED) {
                // Check if connection is still alive
                const iframe = instance.element.querySelector('.guac-embed');
                if (iframe && iframe.src) {
                    // Connection is still active
                    console.debug('CWRLabCon: Connection healthy');
                } else {
                    // Connection lost
                    updateState(instance, ConnectionState.ERROR);
                    handleConnectionError(instance);
                }
            }
        }, instance.settings.statusCheckInterval);
    }

    function stopStatusMonitoring(instance) {
        if (instance && instance.statusInterval) {
            clearInterval(instance.statusInterval);
            instance.statusInterval = null;
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            CWRLabCon.autoConnectAll();
        });
    } else {
        // DOM already loaded
        setTimeout(CWRLabCon.autoConnectAll, 100);
    }

    // Expose to global scope
    window.CWRLabCon = CWRLabCon;

    // Also attach individual functions to window for direct onclick usage
    window.cwrGuacMaximize = function(btn) {
        const container = btn.closest('.guac-lab-container');
        if (container) {
            CWRLabCon.toggleMaximize(container);
            console.log('CWRLabCon: Maximize toggled');
        }
    };

    window.cwrGuacNewTab = function(btn) {
        const container = btn.closest('.guac-lab-container');
        if (container) {
            CWRLabCon.openInNewTab(container);
            console.log('CWRLabCon: Opening in new tab');
        }
    };

    window.cwrGuacReload = function(btn) {
        const container = btn.closest('.guac-lab-container');
        if (container) {
            CWRLabCon.reload(container);
            console.log('CWRLabCon: Reloading connection');
        }
    };
    
    // Additional selector helpers for CWR elements
    CWRLabCon.findByAction = function(action) {
        return document.querySelector(`[data-cwr-action="${action}"]`);
    };
    
    CWRLabCon.findAllByAction = function(action) {
        return document.querySelectorAll(`[data-cwr-action="${action}"]`);
    };
    
    CWRLabCon.getContainer = function(element) {
        if (typeof element === 'string') {
            // If string, try as selector
            return document.querySelector(element);
        } else if (element && element.nodeType) {
            // If DOM element, find parent container
            return element.closest('.guac-lab-container');
        }
        // Default to first container
        return document.querySelector('.guac-lab-container');
    };

    window.cwrGuacConnect = function(btn) {
        const container = btn.closest('.guac-lab-container');
        let url = container?.getAttribute('data-guac-connection-url');
        
        // If no URL is set, use a default or prompt for one
        if (!url || url === '') {
            // For demo purposes, you can set a default URL here
            // url = 'https://your-guacamole-server/guacamole/';
            console.warn('No Guacamole URL configured. Please set data-guac-connection-url attribute.');
            return;
        }
        
        if (container) {
            // Hide CWR logo, show loading indicator
            const placeholder = container.querySelector('.guac-placeholder');
            if (placeholder) {
                const logo = placeholder.querySelector('.cwr-logo');
                const readyText = placeholder.querySelectorAll('div:not(.cwr-logo):not(.loading-indicator)');
                const loadingIndicator = placeholder.querySelector('.loading-indicator');
                
                if (logo) logo.style.display = 'none';
                readyText.forEach(el => {
                    if (!el.classList.contains('loading-indicator') && !el.classList.contains('cwr-logo')) {
                        el.style.display = 'none';
                    }
                });
                if (loadingIndicator) loadingIndicator.style.display = 'block';
            }
            
            // Disable connect button and change text
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin" style="font-size:11px;"></i><span style="font-size:13px;">Wait...</span>';
            btn.style.gap = '4px';
            btn.style.background = '#64748b';
            btn.style.borderColor = 'transparent';
            
            // Enable control buttons using unique CWR selectors
            const controlBtns = container.querySelectorAll('[data-cwr-action="maximize"], [data-cwr-action="newtab"], [data-cwr-action="reload"]');
            controlBtns.forEach(cbtn => {
                cbtn.disabled = false;
                cbtn.style.opacity = '0.9';
                cbtn.style.pointerEvents = 'auto';
            });
            
            // No helper text to hide in new design
            
            // Update status
            const statusText = container.querySelector('.guac-status-text');
            if (statusText) statusText.textContent = 'Connecting...';
            
            // Connect after a brief delay to show loading state
            setTimeout(function() {
                CWRLabCon.connect(container, url);
            }, 500);
        }
    };

    window.cwrGuacAutoConnect = function() {
        return CWRLabCon.autoConnectAll();
    };

    console.log('CWRLabCon: Module loaded successfully');

})(window);