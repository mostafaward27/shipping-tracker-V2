class AdminDashboard {
    constructor() {
        this.apiBaseUrl = '/api';
        this.token = localStorage.getItem('adminToken');
        this.currentPage = 1;
        this.totalPages = 1;
        this.currentEditingOrder = null;
        this.init();
    }

    init() {
        // Check if user is logged in
        if (this.token) {
            this.showDashboard();
        } else {
            this.showLogin();
        }

        // Setup login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Setup create order form
        document.getElementById('createOrderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createOrder();
        });

        // Setup edit order form
        document.getElementById('editOrderForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateOrder();
        });
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const messageDiv = document.getElementById('loginMessage');
        const submitBtn = document.querySelector('#loginForm button[type="submit"]');

        // Reset message
        messageDiv.className = 'alert d-none';
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Authenticating...';
        submitBtn.disabled = true;

        try {
            const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Login failed');
            }

            // Save token and user info
            this.token = data.token;
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('adminUser', JSON.stringify(data.user));

            this.showMessage('success', 'Login successful! Redirecting...');
            setTimeout(() => this.showDashboard(), 1000);

        } catch (error) {
            messageDiv.textContent = error.message;
            messageDiv.className = 'alert alert-danger';
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    logout() {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        this.token = null;
        this.showLogin();
        this.showMessage('info', 'Logged out successfully');
    }

    showLogin() {
        document.getElementById('loginScreen').classList.remove('d-none');
        document.getElementById('dashboard').classList.add('d-none');
    }

    showDashboard() {
        document.getElementById('loginScreen').classList.add('d-none');
        document.getElementById('dashboard').classList.remove('d-none');
        
        // Set current user
        const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
        document.getElementById('currentUser').textContent = user.username || 'Admin';
        
        // Load orders by default
        this.showOrders();
    }

    async showOrders(page = 1) {
        this.currentPage = page;
        this.hideAllSections();
        document.getElementById('ordersSection').classList.remove('d-none');
        
        await this.loadOrders(page);
    }

    showCreateOrder() {
        this.hideAllSections();
        document.getElementById('createOrderSection').classList.remove('d-none');
    }

    showEditOrder() {
        this.hideAllSections();
        document.getElementById('editOrderSection').classList.remove('d-none');
        this.clearEditForm();
    }

    async loadOrders(page = 1) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/orders?page=${page}&limit=10`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.logout();
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error('Failed to load shipments');
            }

            const data = await response.json();
            this.displayOrders(data.orders);
            this.setupPagination(data.total, data.limit, page);

        } catch (error) {
            this.showMessage('danger', error.message);
        }
    }

    displayOrders(orders) {
        const tbody = document.getElementById('ordersTable');
        tbody.innerHTML = '';

        if (!orders || orders.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" class="text-center text-muted py-4">
                        <i class="bi bi-inbox fs-1 mb-3 d-block"></i>
                        No shipments found
                    </td>
                </tr>
            `;
            return;
        }

        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>#${order.id}</strong></td>
                <td>${order.customer_name}</td>
                <td>${order.phone}</td>
                <td>${order.destination}</td>
                <td>
                    <span class="badge-status badge-${order.current_status}">
                        ${this.getStatusText(order.current_status)}
                    </span>
                </td>
                <td>${new Date(order.created_at).toLocaleDateString()}</td>
                <td>
                    <div class="btn-group btn-group-sm action-buttons">
                        <button class="btn btn-outline-primary" onclick="dashboard.viewOrder(${order.id})" 
                                title="View Details">
                            <i class="bi bi-eye"></i>
                        </button>
                        <button class="btn btn-outline-warning" onclick="dashboard.editOrder(${order.id})" 
                                title="Edit Shipment">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-outline-danger" onclick="dashboard.deleteOrder(${order.id})" 
                                title="Delete Shipment">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    setupPagination(total, limit, currentPage) {
        const totalPages = Math.ceil(total / limit);
        this.totalPages = totalPages;
        
        const pagination = document.getElementById('pagination');
        pagination.innerHTML = '';

        if (totalPages <= 1) return;

        // Previous button
        const prevItem = document.createElement('li');
        prevItem.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
        prevItem.innerHTML = `
            <a class="page-link" href="#" onclick="dashboard.showOrders(${currentPage - 1})">
                <i class="bi bi-chevron-left"></i>
            </a>
        `;
        pagination.appendChild(prevItem);

        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        if (startPage > 1) {
            const firstItem = document.createElement('li');
            firstItem.className = 'page-item';
            firstItem.innerHTML = `<a class="page-link" href="#" onclick="dashboard.showOrders(1)">1</a>`;
            pagination.appendChild(firstItem);
            
            if (startPage > 2) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                ellipsisItem.innerHTML = `<span class="page-link">...</span>`;
                pagination.appendChild(ellipsisItem);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            const pageItem = document.createElement('li');
            pageItem.className = `page-item ${i === currentPage ? 'active' : ''}`;
            pageItem.innerHTML = `
                <a class="page-link" href="#" onclick="dashboard.showOrders(${i})">${i}</a>
            `;
            pagination.appendChild(pageItem);
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const ellipsisItem = document.createElement('li');
                ellipsisItem.className = 'page-item disabled';
                ellipsisItem.innerHTML = `<span class="page-link">...</span>`;
                pagination.appendChild(ellipsisItem);
            }
            
            const lastItem = document.createElement('li');
            lastItem.className = 'page-item';
            lastItem.innerHTML = `<a class="page-link" href="#" onclick="dashboard.showOrders(${totalPages})">${totalPages}</a>`;
            pagination.appendChild(lastItem);
        }

        // Next button
        const nextItem = document.createElement('li');
        nextItem.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
        nextItem.innerHTML = `
            <a class="page-link" href="#" onclick="dashboard.showOrders(${currentPage + 1})">
                <i class="bi bi-chevron-right"></i>
            </a>
        `;
        pagination.appendChild(nextItem);
    }

    async searchOrders() {
        const searchTerm = document.getElementById('searchOrders').value;
        
        if (!searchTerm.trim()) {
            await this.loadOrders(1);
            return;
        }

        try {
            const response = await fetch(
                `${this.apiBaseUrl}/orders/search?q=${encodeURIComponent(searchTerm)}`, 
                {
                    headers: { 'Authorization': `Bearer ${this.token}` }
                }
            );

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();
            this.displayOrders(data.orders);
            
            // Clear pagination for search results
            document.getElementById('pagination').innerHTML = '';

            this.showMessage('info', `Found ${data.orders.length} shipment(s)`);

        } catch (error) {
            this.showMessage('danger', error.message);
        }
    }

    async createOrder() {
        const orderData = {
            customer_name: document.getElementById('customerName').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            origin: document.getElementById('origin').value,
            destination: document.getElementById('destination').value,
            current_status: document.getElementById('initialStatus').value,
            metadata: this.parseMetadata(document.getElementById('metadata').value)
        };

        // Validation
        if (!orderData.customer_name || !orderData.phone || !orderData.address || 
            !orderData.origin || !orderData.destination) {
            this.showMessage('warning', 'Please fill in all required fields');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to create shipment');
            }

            const data = await response.json();
            this.showMessage('success', 'Shipment created successfully!');
            document.getElementById('createOrderForm').reset();

            // Show the new shipment
            await this.viewOrder(data.order.id);

        } catch (error) {
            this.showMessage('danger', error.message);
        }
    }

    parseMetadata(metadataString) {
        if (!metadataString.trim()) return null;
        
        try {
            return JSON.parse(metadataString);
        } catch {
            this.showMessage('warning', 'Invalid JSON format in metadata field');
            return null;
        }
    }

    async loadOrderForEdit() {
        const orderId = document.getElementById('editOrderId').value;
        
        if (!orderId) {
            this.showMessage('warning', 'Please enter a shipment ID');
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Shipment not found');
            }

            const order = await response.json();
            this.currentEditingOrder = order;
            this.populateEditForm(order);
            
            // Show edit form
            document.getElementById('editForm').classList.remove('d-none');

        } catch (error) {
            this.showMessage('danger', error.message);
            this.clearEditForm();
        }
    }

    populateEditForm(order) {
        // Fill form fields with order data
        document.getElementById('editCustomerName').value = order.customer_name;
        document.getElementById('editPhone').value = order.phone;
        document.getElementById('editAddress').value = order.address;
        document.getElementById('editOrigin').value = order.origin;
        document.getElementById('editDestination').value = order.destination;
        document.getElementById('editStatus').value = order.current_status;
        
        // Set metadata if exists
        if (order.metadata) {
            document.getElementById('editMetadata').value = JSON.stringify(order.metadata, null, 2);
        } else {
            document.getElementById('editMetadata').value = '';
        }
        
        // Reset status update fields
        document.getElementById('newStatus').value = '';
        document.getElementById('statusNote').value = '';
    }

    clearEditForm() {
        document.getElementById('editOrderId').value = '';
        document.getElementById('editForm').classList.add('d-none');
        this.currentEditingOrder = null;
        
        // Clear all form fields
        const form = document.getElementById('editOrderForm');
        if (form) form.reset();
    }

    cancelEdit() {
        this.clearEditForm();
        this.showMessage('info', 'Edit cancelled');
    }

    async updateOrder() {
        if (!this.currentEditingOrder) {
            this.showMessage('warning', 'No shipment loaded for editing');
            return;
        }

        const orderId = this.currentEditingOrder.id;
        const newStatus = document.getElementById('newStatus').value;
        const statusNote = document.getElementById('statusNote').value;

        // Prepare update data
        const updateData = {
            customer_name: document.getElementById('editCustomerName').value,
            phone: document.getElementById('editPhone').value,
            address: document.getElementById('editAddress').value,
            origin: document.getElementById('editOrigin').value,
            destination: document.getElementById('editDestination').value,
            current_status: document.getElementById('editStatus').value,
            metadata: this.parseMetadata(document.getElementById('editMetadata').value)
        };

        // Validation
        if (!updateData.customer_name || !updateData.phone || !updateData.address || 
            !updateData.origin || !updateData.destination) {
            this.showMessage('warning', 'Please fill in all required fields');
            return;
        }

        try {
            // First update the order details
            const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update shipment');
            }

            // If new status is selected, update status separately
            if (newStatus && newStatus !== this.currentEditingOrder.current_status) {
                await this.updateOrderStatus(orderId, newStatus, statusNote);
                this.showMessage('success', 'Shipment details and status updated successfully!');
            } else {
                this.showMessage('success', 'Shipment details updated successfully!');
            }

            // Clear form and reload
            this.clearEditForm();
            await this.showOrders(this.currentPage);

        } catch (error) {
            this.showMessage('danger', error.message);
        }
    }

    async updateOrderStatus(orderId, status, note = '') {
        try {
            const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ status, note })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to update status');
            }

        } catch (error) {
            throw error;
        }
    }

    async editOrder(orderId) {
        // Load the order and show edit section
        this.showEditOrder();
        document.getElementById('editOrderId').value = orderId;
        await this.loadOrderForEdit();
    }

    async viewOrder(orderId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                throw new Error('Failed to load shipment details');
            }

            const order = await response.json();
            this.showOrderModal(order);

        } catch (error) {
            this.showMessage('danger', error.message);
        }
    }

    showOrderModal(order) {
        // Create modal HTML
        const modalHtml = `
            <div class="modal fade" id="orderModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-box-seam me-2"></i>Shipment Details #${order.id}
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="row mb-4">
                                <div class="col-md-6">
                                    <h6>Customer Information</h6>
                                    <div class="card card-body bg-light">
                                        <p class="mb-2"><strong>Name:</strong> ${order.customer_name}</p>
                                        <p class="mb-2"><strong>Phone:</strong> ${order.phone}</p>
                                        <p class="mb-0"><strong>Address:</strong> ${order.address}</p>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <h6>Shipping Information</h6>
                                    <div class="card card-body bg-light">
                                        <p class="mb-2"><strong>Origin:</strong> ${order.origin}</p>
                                        <p class="mb-2"><strong>Destination:</strong> ${order.destination}</p>
                                        <p class="mb-0"><strong>Status:</strong> 
                                            <span class="badge-status badge-${order.current_status} ms-2">
                                                ${this.getStatusText(order.current_status)}
                                            </span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row mb-4">
                                <div class="col-12">
                                    <h6>Timestamps</h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <p class="mb-1"><strong>Created:</strong> ${new Date(order.created_at).toLocaleString()}</p>
                                        </div>
                                        <div class="col-md-6">
                                            <p class="mb-1"><strong>Last Updated:</strong> ${new Date(order.updated_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <h6>Status History</h6>
                            <div class="timeline">
                                ${order.history && order.history.length > 0 ? 
                                    order.history.map(item => `
                                        <div class="timeline-item">
                                            <div class="timeline-date">
                                                <i class="bi bi-calendar me-1"></i>
                                                ${new Date(item.changed_at).toLocaleString()}
                                            </div>
                                            <div class="timeline-status">
                                                ${this.getStatusText(item.status)}
                                            </div>
                                            ${item.note ? `
                                                <div class="timeline-note">
                                                    <i class="bi bi-chat-left-text me-1"></i>${item.note}
                                                </div>
                                            ` : ''}
                                        </div>
                                    `).join('') : 
                                    '<p class="text-muted text-center py-4">No status history available</p>'
                                }
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                            <button type="button" class="btn btn-warning" onclick="dashboard.editOrder(${order.id})" data-bs-dismiss="modal">
                                <i class="bi bi-pencil me-1"></i>Edit
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add modal to body
        document.body.insertAdjacentHTML('beforeend', modalHtml);
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('orderModal'));
        modal.show();
        
        // Remove modal after hiding
        document.getElementById('orderModal').addEventListener('hidden.bs.modal', () => {
            document.getElementById('orderModal').remove();
        });
    }

    async deleteOrder(orderId) {
        if (!confirm('Are you sure you want to delete this shipment? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBaseUrl}/orders/${orderId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${this.token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to delete shipment');
            }

            this.showMessage('success', 'Shipment deleted successfully!');
            await this.loadOrders(this.currentPage);

        } catch (error) {
            this.showMessage('danger', error.message);
        }
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

    hideAllSections() {
        document.getElementById('ordersSection').classList.add('d-none');
        document.getElementById('createOrderSection').classList.add('d-none');
        document.getElementById('editOrderSection').classList.add('d-none');
    }

    showMessage(type, text) {
        const messageArea = document.getElementById('messageArea');
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${text}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        messageArea.appendChild(alertDiv);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentNode === messageArea) {
                messageArea.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Initialize dashboard
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new AdminDashboard();
});