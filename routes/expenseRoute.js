
const express = require('express');
const router = express.Router();

const expenseController = require('../controller/expenseController');
const requireAuth = require('../middleware/auth');

// Only logged-in users can access expense routes
router.post('/add', requireAuth, expenseController.addExpense);
router.get('/', requireAuth, expenseController.fetchExpenses);
router.get('/:id', requireAuth, expenseController.fetchExpenseById);
router.put('/:id', requireAuth, expenseController.updateExpense);
router.delete('/:id', requireAuth, expenseController.deleteExpense);

module.exports = router;
