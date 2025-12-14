
(function() {
    'use strict';

    const toastList = document.getElementById('toastList');
    const btnAddToast = document.getElementById('btnAddToast');
    const btnSave = document.getElementById('btnSave');
    const btnPreview = document.getElementById('btnPreview');
    const statusMessage = document.getElementById('statusMessage');
    const toastItemTemplate = document.getElementById('toastItemTemplate');

    const containers = {
        'top-right': document.getElementById('toastContainerTopRight'),
        'top-left': document.getElementById('toastContainerTopLeft'),
        'bottom-right': document.getElementById('toastContainerBottomRight'),
        'bottom-left': document.getElementById('toastContainerBottomLeft')
    };

    let toastCounter = 0;
    function init() {
        btnAddToast.addEventListener('click', addToastItem);
        btnSave.addEventListener('click', saveToasts);
        btnPreview.addEventListener('click', previewToasts);

        loadExistingToasts();

        setTimeout(function() {
            if (toastList.children.length === 0) {
                addToastItem();
            }
        }, 500);
    }
    function addToastItem(toastData) {
        toastCounter++;

        const template = toastItemTemplate.content.cloneNode(true);
        const toastItem = template.querySelector('.toast-item');

        const toastId = 'toast-' + toastCounter + '-' + Date.now();
        toastItem.dataset.toastId = toastId;

        toastItem.querySelector('.number').textContent = toastList.children.length + 1;

        if (toastData) {
            toastItem.querySelector('.toast-title-input').value = toastData.title || '';
            toastItem.querySelector('.toast-message-input').value = toastData.message || '';
            toastItem.querySelector('.toast-type-select').value = toastData.type || 'success';
            toastItem.querySelector('.toast-position-select').value = toastData.position || 'top-right';
            toastItem.querySelector('.toast-duration-input').value = toastData.duration || 5000;
            toastItem.querySelector('.toast-autohide-input').checked = toastData.autoHide !== false;
        }

        toastItem.querySelector('.btn-delete-toast').addEventListener('click', function() {
            deleteToastItem(toastItem);
        });

        toastList.appendChild(toastItem);

        updateToastNumbers();
    }
    function deleteToastItem(toastItem) {
        if (toastList.children.length > 1) {
            toastItem.remove();
            updateToastNumbers();
        } else {
            showStatus('You need at least one toast item', 'error');
        }
    }

    function updateToastNumbers() {
        const items = toastList.querySelectorAll('.toast-item');
        items.forEach(function(item, index) {
            item.querySelector('.number').textContent = index + 1;
        });
    }

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

    function saveToasts() {
        const toasts = collectToastData();

        const validation = validateToasts(toasts);
        if (!validation.valid) {
            showStatus(validation.message, 'error');
            return;
        }

        const data = {
            timestamp: Date.now(),
            toasts: toasts
        };

        showStatus('Saving...', 'info');
        btnSave.disabled = true;

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

    function loadExistingToasts() {
        fetch('api/load.php')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.toasts && data.toasts.length > 0) {
                toastList.innerHTML = '';
                toastCounter = 0;
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

    function previewToasts() {
        const toasts = collectToastData();
        const validation = validateToasts(toasts);
        if (!validation.valid) {
            showStatus(validation.message, 'error');
            return;
        }

        Object.values(containers).forEach(function(container) {
            container.innerHTML = '';
        });

        toasts.forEach(function(toastData, index) {
            setTimeout(function() {
                showToast(toastData);
            }, index * 200);
        });
    }

    function showToast(toastData) {
        const container = containers[toastData.position];
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast ' + toastData.type;
        toast.innerHTML =
            '<div class="toast-header">' +
                '<span class="toast-title">' + escapeHtml(toastData.title) + '</span>' +
                '<button class="toast-close">&times;</button>' +
            '</div>' +
            '<div class="toast-body">' + escapeHtml(toastData.message) + '</div>';

        container.appendChild(toast);
        toast.offsetHeight;
        toast.classList.add('show');

        toast.querySelector('.toast-close').addEventListener('click', function() {
            hideToast(toast);
        });

        if (toastData.autoHide) {
            setTimeout(function() {
                hideToast(toast);
            }, toastData.duration);
        }
    }
    function hideToast(toast) {
        toast.classList.remove('show');
        toast.classList.add('hiding');

        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    function showStatus(message, type) {
        statusMessage.textContent = message;
        statusMessage.className = 'status-message show ' + type;

        setTimeout(function() {
            statusMessage.classList.remove('show');
        }, 5000);
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
