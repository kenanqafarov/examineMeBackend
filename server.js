require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/Auth');
const userRoutes = require('./routes/user');
const examRoutes = require('./routes/exam');

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/exams', examRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB uğurla qoşuldu ✓'))
  .catch(err => console.error('MongoDB xətası:', err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server http://localhost:${PORT} üzərində işləyir`);
});