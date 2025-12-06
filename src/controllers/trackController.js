const Order = require('../models/orderModel');

class TrackController {
    static async trackOrder(req, res) {
        try {
            const { id } = req.params;
            const order = await Order.findById(id);
            
            if (!order) {
                return res.status(404).json({ 
                    error: 'Order not found',
                    status: 'not_found'
                });
            }

            const history = await Order.getStatusHistory(id);

            // Public response (exclude sensitive info)
            const publicOrder = {
                id: order.id,
                customer_name: order.customer_name,
                origin: order.origin,
                destination: order.destination,
                current_status: order.current_status,
                updated_at: order.updated_at,
                history: history.map(item => ({
                    status: item.status,
                    note: item.note,
                    changed_at: item.changed_at
                }))
            };

            res.json(publicOrder);
        } catch (error) {
            console.error('Track order error:', error);
            res.status(500).json({ 
                error: 'Failed to track order',
                status: 'error'
            });
        }
    }
}

module.exports = TrackController;