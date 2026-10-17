const express = require('express');
const db = require('./utils/db-connection');

const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoute');
const storeRoutes = require('./routes/storeRoutes');
const cors = require('cors');
const app = express();
const port = 3000;

require('./models'); // Import the models to establish relationships

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!');
});


app.use("/users", userRoutes);
app.use("/expenses", expenseRoutes);
app.use("/store", storeRoutes);

db.sync({force:true}).then(() => {
  app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
}).catch((err) => {
  console.error('Error synchronizing database:', err);
});

