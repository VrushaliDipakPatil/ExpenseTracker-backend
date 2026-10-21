const express = require('express');
const db = require('./utils/db-connection');
const session = require('express-session');

const User = require('./models/user');
const Expenses = require('./models/expenses');
const expenseRoutes = require('./routes/expenseRoute');
const userRoutes = require('./routes/userRoute');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors({
  origin: 'http://127.0.0.1:5500',
  credentials: true
}));
app.use(express.json());

app.use(session({
  secret: process.env.SESSION_SECRET || 'fintrack-dev-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: false,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 2
  }
}));

app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.use("/expenses", expenseRoutes);
app.use("/users", userRoutes);
require('./models');

db.sync({force:false}).then(() => {
  app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
}).catch((err) => {
  console.error('Error synchronizing database:', err);
});

