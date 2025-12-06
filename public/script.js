class ShippingTracker {
    constructor() {
        this.apiBaseUrl = '/api'; // Updated for backend integration
        this.init();
    }

    init() {
        // Setup event listeners
        document.getElementById('trackBtn').addEventListener('click', () => this.trackOrder());
        document.getElementById('orderId').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.trackOrder();
        });
        
        // Hide all messages initially
        this.hideAllMessages();
    }

    async trackOrder() {
        const orderId = document.getElementById('orderId').value.trim();
        
        if (!orderId) {
            this.showError('Please enter a tracking number');
            return;
        }

        // Hide previous messages
        this.hideAllMessages();
        
        // Show loading state
        const trackBtn = document.getElementById('trackBtn');
        const originalText = trackBtn.innerHTML;
        trackBtn.innerHTML = '<span class="loading"></span> Tracking...';
        trackBtn.disabled = true;

        try {
            const response = await fetch(`${this.apiBaseUrl}/track/${orderId}`);
            const data = await response.json();

            if (!response.ok) {
                if (response.status === 404) {
                    this.showNotFound();
                } else {
                    this.showError(data.error || 'Error searching for shipment');
                }
                return;
            }

            this.displayOrderInfo(data);
            this.showResults();
            
        } catch (error) {
            console.error('Tracking error:', error);
            this.showError('Unable to connect to server. Please try again later.');
        } finally {
            trackBtn.innerHTML = originalText;
            trackBtn.disabled = false;
        }
    }

    displayOrderInfo(order) {
        // Order info
        document.getElementById('customerName').textContent = order.customer_name;
        document.getElementById('orderNumber').textContent = order.id;
        document.getElementById('orderNumberBadge').textContent = `ID: ${order.id}`;
        document.getElementById('origin').textContent = order.origin;
        document.getElementById('destination').textContent = order.destination;
        
        // Current status
        const statusElement = document.getElementById('currentStatus');
        const statusIcon = document.getElementById('statusIcon');
        
        statusElement.textContent = this.getStatusText(order.current_status);
        statusElement.className = `mb-1 ${this.getStatusClass(order.current_status)}`;
        
        // Set status icon
        statusIcon.innerHTML = this.getStatusIcon(order.current_status);
        statusIcon.className = `status-icon ${this.getStatusClass(order.current_status)}`;
        
        // Updated time
        const updatedAt = new Date(order.updated_at);
        document.getElementById('updatedAt').textContent = 
            `${updatedAt.toLocaleDateString()} ${updatedAt.toLocaleTimeString()}`;
        
        // Status history
        this.displayStatusHistory(order.history);
    }

    getStatusText(status) {
        const statusMap = {
            'pending': 'Pending',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'in_transit': 'In Transit',
            'out_for_delivery': 'Out for Delivery',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        };
        return statusMap[status] || status;
    }

    getStatusClass(status) {
        return `status-${status}`;
    }

    getStatusIcon(status) {
        const icons = {
            'pending': '<i class="bi bi-hourglass-split"></i>',
            'processing': '<i class="bi bi-gear"></i>',
            'shipped': '<i class="bi bi-truck"></i>',
            'in_transit': '<i class="bi bi-airplane"></i>',
            'out_for_delivery': '<i class="bi bi-bicycle"></i>',
            'delivered': '<i class="bi bi-check-circle"></i>',
            'cancelled': '<i class="bi bi-x-circle"></i>'
        };
        return icons[status] || '<i class="bi bi-question-circle"></i>';
    }

    displayStatusHistory(history) {
        const timeline = document.getElementById('statusHistory');
        timeline.innerHTML = '';
        
        if (!history || history.length === 0) {
            timeline.innerHTML = '<p class="text-muted text-center py-4">No tracking history available</p>';
            return;
        }
        
        history.forEach(item => {
            const date = new Date(item.changed_at);
            const timelineItem = document.createElement('div');
            timelineItem.className = 'timeline-item';
            timelineItem.innerHTML = `
                <div class="timeline-date">
                    <i class="bi bi-calendar me-1"></i>
                    ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                </div>
                <div class="timeline-status ${this.getStatusClass(item.status)}">
                    ${this.getStatusText(item.status)}
                </div>
                ${item.note ? `
                <div class="timeline-note">
                    <i class="bi bi-chat-left-text me-1"></i> ${item.note}
                </div>
                ` : ''}
            `;
            timeline.appendChild(timelineItem);
        });
    }

    showResults() {
        document.getElementById('results').classList.remove('d-none');
        document.getElementById('instructions').classList.add('d-none');
    }

    hideResults() {
        document.getElementById('results').classList.add('d-none');
        document.getElementById('instructions').classList.remove('d-none');
    }

    showError(message) {
        const errorElement = document.getElementById('errorMessage');
        document.getElementById('errorText').textContent = message;
        errorElement.classList.remove('d-none');
        this.hideResults();
        this.hideNotFound();
    }

    showNotFound() {
        document.getElementById('notFoundMessage').classList.remove('d-none');
        this.hideResults();
        this.hideError();
    }

    hideAllMessages() {
        this.hideError();
        this.hideNotFound();
        this.hideResults();
    }

    hideError() {
        document.getElementById('errorMessage').classList.add('d-none');
    }

    hideNotFound() {
        document.getElementById('notFoundMessage').classList.add('d-none');
    }
}

// Initialize tracker when page loads
document.addEventListener('DOMContentLoaded', () => {
    new ShippingTracker();
});