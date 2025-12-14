/**
 * Toast Editor - JavaScript
 * Handles form management and saving toasts to server
 */

(function() {
    'use strict';

    // DOM Elements
    const toastList = document.getElementById('toastList');
    const btnAddToast = document.getElementById('btnAddToast');
    const btnSave = document.getElementById('btnSave');
    const btnPreview = document.getElementById('btnPreview');
    const statusMessage = document.getElementById('statusMessage');
    const toastItemTemplate = document.getElementById('toastItemTemplate');

    // Toast containers for preview
    const containers = {
        'top-right': document.getElementById('toastContainerTopRight'),
        'top-left': document.getElementById('toastContainerTopLeft'),
        'bottom-right': document.getElementById('toastContainerBottomRight'),
        'bottom-left': document.getElementById('toastContainerBottomLeft')
    };

    // Counter for unique IDs
    let toastCounter = 0;

    /**
     * Initialize the editor
     */
    function init() {
        // Bind event listeners
        btnAddToast.addEventListener('click', addToastItem);
        btnSave.addEventListener('click', saveToasts);
        btnPreview.addEventListener('click', previewToasts);

        // Load existing toasts from server
        loadExistingToasts();

        // Add one toast item by default if none loaded
        setTimeout(function() {
            if (toastList.children.length === 0) {
                addToastItem();
            }
        }, 500);
    }

    /**
     * Add a new toast item to the form
     */
    function addToastItem(toastData) {
        toastCounter++;

        // Clone the template
        const template = toastItemTemplate.content.cloneNode(true);
        const toastItem = template.querySelector('.toast-item');

        // Set unique ID
        const toastId = 'toast-' + toastCounter + '-' + Date.now();
        toastItem.dataset.toastId = toastId;

        // Update number display
        toastItem.querySelector('.number').textContent = toastList.children.length + 1;

        // If we have data, populate the fields
        if (toastData) {
            toastItem.querySelector('.toast-title-input').value = toastData.title || '';
            toastItem.querySelector('.toast-message-input').value = toastData.message || '';
            toastItem.querySelector('.toast-type-select').value = toastData.type || 'success';
            toastItem.querySelector('.toast-position-select').value = toastData.position || 'top-right';
            toastItem.querySelector('.toast-duration-input').value = toastData.duration || 5000;
            toastItem.querySelector('.toast-autohide-input').checked = toastData.autoHide !== false;
        }

        // Bind delete button
        toastItem.querySelector('.btn-delete-toast').addEventListener('click', function() {
            deleteToastItem(toastItem);
        });

        // Add to list
        toastList.appendChild(toastItem);

        // Update all numbers
        updateToastNumbers();
    }

    /**
     * Delete a toast item from the form
     */
    function deleteToastItem(toastItem) {
        if (toastList.children.length > 1) {
            toastItem.remove();
            updateToastNumbers();
        } else {
            showStatus('You need at least one toast item', 'error');
        }
    }

    /**
     * Update the numbers displayed on each toast item
     */
    function updateToastNumbers() {
        const items = toastList.querySelectorAll('.toast-item');
        items.forEach(function(item, index) {
            item.querySelector('.number').textContent = index + 1;
        });
    }

    /**
     * Collect all toast data from the form
     */
    function collectToastData() {
        const toasts = [];
        const items = toastList.querySelectorAll('.toast-item');

        items.forEach(function(item) {
            toasts.push({
                id: item.dataset.toastId,
                title: item.querySelector('.toast-title-input').value.trim(),
                message: item.querySelector('.toast-message-input').value.trim(),
                type: item.querySelector('.toast-type-select').value,
                position: item.querySelector('.toast-position-select').value,
                duration: parseInt(item.querySelector('.toast-duration-input').value, 10),
                autoHide: item.querySelector('.toast-autohide-input').checked
            });
        });

        return toasts;
    }

    /**
     * Validate toast data
     */
    function validateToasts(toasts) {
        for (let i = 0; i < toasts.length; i++) {
            const toast = toasts[i];
            if (!toast.title) {
                return { valid: false, message: 'Toast #' + (i + 1) + ' is missing a title' };
            }
            if (!toast.message) {
                return { valid: false, message: 'Toast #' + (i + 1) + ' is missing a message' };
            }
            if (toast.duration < 1000 || toast.duration > 30000) {
                return { valid: false, message: 'Toast #' + (i + 1) + ' duration must be between 1000ms and 30000ms' };
            }
        }
        return { valid: true };
    }

    /**
     * Save toasts to server
     */
    function saveToasts() {
        const toasts = collectToastData();

        // Validate
        const validation = validateToasts(toasts);
        if (!validation.valid) {
            showStatus(validation.message, 'error');
            return;
        }

        // Prepare data
        const data = {
            timestamp: Date.now(),
            toasts: toasts
        };

        // Show saving status
        showStatus('Saving...', 'info');
        btnSave.disabled = true;

        // Send to server
        fetch('api/save.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(function(response) {
            return response.json();
        })
        .then(function(result) {
            btnSave.disabled = false;
            if (result.success) {
                showStatus('Toasts saved successfully!', 'success');
            } else {
                showStatus('Error: ' + (result.error || 'Unknown error'), 'error');
            }
        })
        .catch(function(error) {
            btnSave.disabled = false;
            showStatus('Network error: ' + error.message, 'error');
        });
    }

    /**
     * Load existing toasts from server
     */
    function loadExistingToasts() {
        fetch('api/load.php')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.toasts && data.toasts.length > 0) {
                // Clear current list
                toastList.innerHTML = '';
                toastCounter = 0;

                // Add each toast
                data.toasts.forEach(function(toastData) {
                    addToastItem(toastData);
                });

                showStatus('Loaded ' + data.toasts.length + ' toast(s) from server', 'success');
            }
        })
        .catch(function(error) {
            console.log('Could not load existing toasts:', error.message);
        });
    }

    /**
     * Preview all toasts
     */
    function previewToasts() {
        const toasts = collectToastData();

        // Validate
        const validation = validateToasts(toasts);
        if (!validation.valid) {
            showStatus(validation.message, 'error');
            return;
        }

        // Clear all containers
        Object.values(containers).forEach(function(container) {
            container.innerHTML = '';
        });

        // Show each toast with a small delay
        toasts.forEach(function(toastData, index) {
            setTimeout(function() {
                showToast(toastData);
            }, index * 200);
        });
    }

    /**
     * Show a single toast notification
     */
    function showToast(toastData) {
        const container = containers[toastData.position];
        if (!container) return;

        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast ' + toastData.type;
        toast.innerHTML =
            '<div class="toast-header">' +
                '<span class="toast-title">' + escapeHtml(toastData.title) + '</span>' +
                '<button class="toast-close">&times;</button>' +
            '</div>' +
            '<div class="toast-body">' + escapeHtml(toastData.message) + '</div>';

        // Add to container
        container.appendChild(toast);

        // Trigger reflow for animation
        toast.offsetHeight;

        // Show toast
        toast.classList.add('show');

        // Bind close button
        toast.querySelector('.toast-close').addEventListener('click', function() {
            hideToast(toast);
        });

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

        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    /**
     * Show status message
     */
    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message show ' + type;

        // Auto-hide after 5 seconds
        setTimeout(function() {
            statusMessage.classList.remove('show');
        }, 5000);
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
})();
