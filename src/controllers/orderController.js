const Order = require('../models/orderModel');

class OrderController {
    static async createOrder(req, res) {
        try {
            const {
                customer_name,
                phone,
                address,
                origin,
                destination,
                current_status = 'pending',
                metadata
            } = req.body;

            if (!customer_name || !phone || !address || !origin || !destination) {
                return res.status(400).json({ 
                    error: 'Missing required fields' 
                });
            }

            const orderId = await Order.create({
                customer_name,
                phone,
                address,
                origin,
                destination,
                current_status,
                metadata
            });

            const order = await Order.findById(orderId);
            
            res.status(201).json({
                message: 'Order created successfully',
                order
            });
        } catch (error) {
            console.error('Create order error:', error);
            res.status(500).json({ 
                error: 'Failed to create order' 
            });
        }
    }

    static async getOrder(req, res) {
        try {
            const { id } = req.params;
            const order = await Order.findById(id);
            
            if (!order) {
                return res.status(404).json({ 
                    error: 'Order not found' 
                });
            }

            const history = await Order.getStatusHistory(id);
            order.history = history;

            res.json(order);
        } catch (error) {
            console.error('Get order error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch order' 
            });
        }
    }

    static async getAllOrders(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            
            const result = await Order.findAll(page, limit);
            res.json(result);
        } catch (error) {
            console.error('Get all orders error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch orders' 
            });
        }
    }

    static async updateOrder(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ 
                    error: 'No update data provided' 
                });
            }

            const updated = await Order.update(id, updateData);
            
            if (!updated) {
                return res.status(404).json({ 
                    error: 'Order not found or no changes made' 
                });
            }

            const order = await Order.findById(id);
            res.json({
                message: 'Order updated successfully',
                order
            });
        } catch (error) {
            console.error('Update order error:', error);
            res.status(500).json({ 
                error: 'Failed to update order' 
            });
        }
    }

    static async updateOrderStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, note } = req.body;

            if (!status) {
                return res.status(400).json({ 
                    error: 'Status is required' 
                });
            }

            const validStatuses = [
                'pending', 'processing', 'shipped', 
                'in_transit', 'out_for_delivery', 
                'delivered', 'cancelled'
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    error: 'Invalid status' 
                });
            }

            const updated = await Order.updateStatus(id, status, note || '');
            
            if (!updated) {
                return res.status(404).json({ 
                    error: 'Order not found' 
                });
            }

            const order = await Order.findById(id);
            const history = await Order.getStatusHistory(id);

            res.json({
                message: 'Order status updated successfully',
                order: {
                    ...order,
                    history
                }
            });
        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({ 
                error: 'Failed to update status' 
            });
        }
    }

    static async deleteOrder(req, res) {
        try {
            const { id } = req.params;
            const deleted = await Order.delete(id);
            
            if (!deleted) {
                return res.status(404).json({ 
                    error: 'Order not found' 
                });
            }

            res.json({ 
                message: 'Order deleted successfully' 
            });
        } catch (error) {
            console.error('Delete order error:', error);
            res.status(500).json({ 
                error: 'Failed to delete order' 
            });
        }
    }

    static async searchOrders(req, res) {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (!q) {
                return res.status(400).json({ 
                    error: 'Search term required' 
                });
            }

            const orders = await Order.searchOrders(q, page, limit);
            res.json({ orders });
        } catch (error) {
            console.error('Search orders error:', error);
            res.status(500).json({ 
                error: 'Failed to search orders' 
            });
        }
    }
}

module.exports = OrderController;