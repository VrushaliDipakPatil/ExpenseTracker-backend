const express = require('express');
const db = require('./utils/db-connection');

const expenseRoutes = require('./routes/expenseRoute');
const userRoutes = require('./routes/userRoute');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.use("/expenses", expenseRoutes);
app.use("/users", userRoutes);

db.sync({force:false}).then(() => {
  app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
}).catch((err) => {
  console.error('Error synchronizing database:', err);
});

