const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// Protected routes
router.use(authenticateToken);

router.post('/', OrderController.createOrder);
router.get('/', OrderController.getAllOrders);
router.get('/search', OrderController.searchOrders);
router.get('/:id', OrderController.getOrder);
router.put('/:id', OrderController.updateOrder);
router.put('/:id/status', OrderController.updateOrderStatus);
router.delete('/:id', OrderController.deleteOrder);

module.exports = router;