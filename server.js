require('./db/seed'); // 第一次啟動、資料庫是空的時候，自動建立預設帳號

const path = require('path');
const express = require('express');
const session = require('express-session');

const authRoutes = require('./routes/auth');
const customerRoutes = require('./routes/customers');
const staffRoutes = require('./routes/staff');
const orderRoutes = require('./routes/orders');
const accountRoutes = require('./routes/accounts');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'taichung-showroom-dev-secret-please-change',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 天
    httpOnly: true,
    sameSite: 'lax'
  }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use('/api', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/accounts', accountRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(PORT, () => {
  console.log('展間客戶總覽伺服器已啟動：http://localhost:' + PORT);
});
