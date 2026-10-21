
const User = require('./user');
const Expenses = require('./expenses');

// One user can have many expenses
User.hasMany(Expenses, {
  foreignKey: 'userId',
  onDelete: 'CASCADE'
});

// Each expense belongs to one user
Expenses.belongsTo(User, {
  foreignKey: 'userId'
});

module.exports = { User, Expenses };
