/**
 * Toast Display - JavaScript
 * Handles fetching toasts from server and displaying them
 * Implements periodic polling for auto-updates
 */

(function() {
    'use strict';

    // Configuration
    const REFRESH_INTERVAL = 5000; // 5 seconds

    // DOM Elements
    const triggerButtons = document.getElementById('triggerButtons');
    const btnShowAll = document.getElementById('btnShowAll');
    const toastPreviewArea = document.getElementById('toastPreviewArea');
    const refreshStatus = document.getElementById('refreshStatus');
    const lastUpdate = document.getElementById('lastUpdate');
    const toastCount = document.getElementById('toastCount');

    // Toast containers
    const containers = {
        'top-right': document.getElementById('toastContainerTopRight'),
        'top-left': document.getElementById('toastContainerTopLeft'),
        'bottom-right': document.getElementById('toastContainerBottomRight'),
        'bottom-left': document.getElementById('toastContainerBottomLeft')
    };

    // State
    let currentToasts = [];
    let lastTimestamp = null;
    let refreshIntervalId = null;

    /**
     * Initialize the display page
     */
    function init() {
        // Bind event listeners
        btnShowAll.addEventListener('click', showAllToasts);

        // Initial load
        loadToasts();

        // Start periodic refresh
        startAutoRefresh();
    }

    /**
     * Load toasts from server
     */
    function loadToasts() {
        fetch('api/load.php')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            // Check if data has changed
            if (data.timestamp !== lastTimestamp) {
                lastTimestamp = data.timestamp;
                currentToasts = data.toasts || [];

                // Update UI
                updateUI();
                generateTriggerButtons();
                updateLastUpdateTime();
            }
        })
        .catch(function(error) {
            console.error('Error loading toasts:', error);
            refreshStatus.textContent = 'Error';
        });
    }

    /**
     * Update the UI with current toasts info
     */
    function updateUI() {
        toastCount.textContent = currentToasts.length;

        if (currentToasts.length > 0) {
            toastPreviewArea.innerHTML = generateToastSummary();
        } else {
            toastPreviewArea.innerHTML =
                '<div class="no-toasts-message">' +
                    '<p>No toasts loaded yet. Create some on the Editor page!</p>' +
                '</div>';
        }
    }

    /**
     * Generate HTML summary of loaded toasts
     */
    function generateToastSummary() {
        let html = '<div style="width: 100%; padding: 20px;">';
        html += '<h4 style="margin-top: 0;">Loaded Toasts:</h4>';
        html += '<table style="width: 100%; border-collapse: collapse;">';
        html += '<thead><tr style="background: #e9ecef;">';
        html += '<th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">#</th>';
        html += '<th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Title</th>';
        html += '<th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Type</th>';
        html += '<th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Position</th>';
        html += '<th style="padding: 8px; text-align: left; border: 1px solid #dee2e6;">Duration</th>';
        html += '</tr></thead><tbody>';

        currentToasts.forEach(function(toast, index) {
            html += '<tr>';
            html += '<td style="padding: 8px; border: 1px solid #dee2e6;">' + (index + 1) + '</td>';
            html += '<td style="padding: 8px; border: 1px solid #dee2e6;">' + escapeHtml(toast.title) + '</td>';
            html += '<td style="padding: 8px; border: 1px solid #dee2e6;">' +
                '<span style="display: inline-block; padding: 2px 8px; border-radius: 4px; background: ' +
                getTypeColor(toast.type) + '; color: white;">' + toast.type + '</span></td>';
            html += '<td style="padding: 8px; border: 1px solid #dee2e6;">' + toast.position + '</td>';
            html += '<td style="padding: 8px; border: 1px solid #dee2e6;">' + toast.duration + 'ms</td>';
            html += '</tr>';
        });

        html += '</tbody></table></div>';
        return html;
    }

    /**
     * Get color for toast type
     */
    function getTypeColor(type) {
        const colors = {
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107',
            'info': '#17a2b8'
        };
        return colors[type] || '#6c757d';
    }

    /**
     * Generate trigger buttons for each toast
     */
    function generateTriggerButtons() {
        triggerButtons.innerHTML = '';

        if (currentToasts.length === 0) {
            triggerButtons.innerHTML = '<p style="color: #666;">No toasts available</p>';
            return;
        }

        currentToasts.forEach(function(toast, index) {
            const button = document.createElement('button');
            button.className = 'btn btn-' + getButtonClass(toast.type);
            button.textContent = 'Show Toast #' + (index + 1) + ' (' + toast.title + ')';
            button.addEventListener('click', function() {
                showToast(toast);
            });
            triggerButtons.appendChild(button);
        });
    }

    /**
     * Get button class based on toast type
     */
    function getButtonClass(type) {
        const classes = {
            'success': 'success',
            'error': 'primary',
            'warning': 'secondary',
            'info': 'primary'
        };
        return classes[type] || 'secondary';
    }

    /**
     * Show all toasts with staggered timing
     */
    function showAllToasts() {
        if (currentToasts.length === 0) {
            alert('No toasts to show. Please create some on the Editor page.');
            return;
        }

        currentToasts.forEach(function(toast, index) {
            setTimeout(function() {
                showToast(toast);
            }, index * 300);
        });
    }

    /**
     * Show a single toast notification
     */
    function showToast(toastData) {
        const container = containers[toastData.position];
        if (!container) return;

        // Create toast element dynamically (pure JS, no frameworks)
        const toast = document.createElement('div');
        toast.className = 'toast ' + toastData.type;

        // Create header
        const header = document.createElement('div');
        header.className = 'toast-header';

        const title = document.createElement('span');
        title.className = 'toast-title';
        title.textContent = toastData.title;

        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', function() {
            hideToast(toast);
        });

        header.appendChild(title);
        header.appendChild(closeBtn);

        // Create body
        const body = document.createElement('div');
        body.className = 'toast-body';
        body.textContent = toastData.message;

        // Assemble toast
        toast.appendChild(header);
        toast.appendChild(body);

        // Add to container
        container.appendChild(toast);

        // Trigger reflow for CSS animation
        toast.offsetHeight;

        // Show with animation
        toast.classList.add('show');

        // Auto-hide if enabled
        if (toastData.autoHide) {
            setTimeout(function() {
                hideToast(toast);
            }, toastData.duration);
        }
    }

    /**
     * Hide a toast with animation
     */
    function hideToast(toast) {
        toast.classList.remove('show');
        toast.classList.add('hiding');

        // Remove after animation completes
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Update last update time display
     */
    function updateLastUpdateTime() {
        const now = new Date();
        lastUpdate.textContent = formatTime(now);
    }

    /**
     * Format time for display
     */
    function formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return hours + ':' + minutes + ':' + seconds;
    }

    /**
     * Start auto-refresh polling
     */
    function startAutoRefresh() {
        refreshStatus.textContent = 'Active';

        refreshIntervalId = setInterval(function() {
            loadToasts();
        }, REFRESH_INTERVAL);
    }

    /**
     * Stop auto-refresh polling
     */
    function stopAutoRefresh() {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
            refreshIntervalId = null;
        }
        refreshStatus.textContent = 'Stopped';
    }

    /**
     * Escape HTML to prevent XSS
     */
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Stop refresh when page is hidden (tab switch)
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            startAutoRefresh();
            loadToasts(); // Immediately check for updates
        }
    });
})();
