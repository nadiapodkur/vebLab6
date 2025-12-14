
(function() {
    'use strict';


    const REFRESH_INTERVAL = 5000;

    const triggerButtons = document.getElementById('triggerButtons');
    const btnShowAll = document.getElementById('btnShowAll');
    const toastPreviewArea = document.getElementById('toastPreviewArea');
    const refreshStatus = document.getElementById('refreshStatus');
    const lastUpdate = document.getElementById('lastUpdate');
    const toastCount = document.getElementById('toastCount');
    const containers = {
        'top-right': document.getElementById('toastContainerTopRight'),
        'top-left': document.getElementById('toastContainerTopLeft'),
        'bottom-right': document.getElementById('toastContainerBottomRight'),
        'bottom-left': document.getElementById('toastContainerBottomLeft')
    };

    let currentToasts = [];
    let lastTimestamp = null;
    let refreshIntervalId = null;
    function init() {
        btnShowAll.addEventListener('click', showAllToasts);

        loadToasts();

        startAutoRefresh();
    }
    function loadToasts() {
        fetch('api/load.php')
        .then(function(response) {
            return response.json();
        })
        .then(function(data) {
            if (data.timestamp !== lastTimestamp) {
                lastTimestamp = data.timestamp;
                currentToasts = data.toasts || [];
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

    function getTypeColor(type) {
        const colors = {
            'success': '#28a745',
            'error': '#dc3545',
            'warning': '#ffc107',
            'info': '#17a2b8'
        };
        return colors[type] || '#6c757d';
    }
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
    function getButtonClass(type) {
        const classes = {
            'success': 'success',
            'error': 'primary',
            'warning': 'secondary',
            'info': 'primary'
        };
        return classes[type] || 'secondary';
    }

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

    function showToast(toastData) {
        const container = containers[toastData.position];
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast ' + toastData.type;

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

        const body = document.createElement('div');
        body.className = 'toast-body';
        body.textContent = toastData.message;

        toast.appendChild(header);
        toast.appendChild(body);

        container.appendChild(toast);

        toast.offsetHeight;

        toast.classList.add('show');

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
    function updateLastUpdateTime() {
        const now = new Date();
        lastUpdate.textContent = formatTime(now);
    }

    function formatTime(date) {
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return hours + ':' + minutes + ':' + seconds;
    }
    function startAutoRefresh() {
        refreshStatus.textContent = 'Active';

        refreshIntervalId = setInterval(function() {
            loadToasts();
        }, REFRESH_INTERVAL);
    }
    function stopAutoRefresh() {
        if (refreshIntervalId) {
            clearInterval(refreshIntervalId);
            refreshIntervalId = null;
        }
        refreshStatus.textContent = 'Stopped';
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

    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            stopAutoRefresh();
        } else {
            startAutoRefresh();
            loadToasts(); 
        }
    });
})();
