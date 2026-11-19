
const express = require('express');
const router = express.Router();

const orderController = require('../controller/orderController');
const requireAuth = require('../middleware/auth');

router.post('/create', requireAuth, orderController.createOrder);
router.post('/verify', requireAuth, orderController.verifyPayment);
router.get('/latest', requireAuth, orderController.getLatestOrder);

module.exports = router;
