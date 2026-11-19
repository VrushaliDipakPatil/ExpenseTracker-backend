
const User = require('./user');
const Expenses = require('./expenses');
const Order = require('./order');

User.hasMany(Expenses, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

Expenses.belongsTo(User, {
  foreignKey: 'userId'
});

User.hasMany(Order, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

Order.belongsTo(User, {
  foreignKey: 'userId'
});

module.exports = { User, Expenses, Order };
