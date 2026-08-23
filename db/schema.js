const db = require('./database');

db.exec(`
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  brands TEXT DEFAULT '[]',
  status TEXT DEFAULT 'visited',
  staffName TEXT DEFAULT '',
  date TEXT DEFAULT '',
  slot TEXT DEFAULT '',
  createdAt INTEGER,
  createdAtLabel TEXT
);

CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  commissionRate REAL DEFAULT 0,
  brand TEXT DEFAULT '',
  supervisor TEXT DEFAULT '',
  department TEXT DEFAULT '',
  createdAt INTEGER
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  customerId TEXT DEFAULT '',
  customerName TEXT DEFAULT '',
  customerPhone TEXT DEFAULT '',
  brand TEXT DEFAULT '',
  staffId TEXT DEFAULT '',
  staffName TEXT DEFAULT '',
  dealDate TEXT DEFAULT '',
  totalPrice REAL DEFAULT 0,
  cost REAL,
  commissionRate REAL,
  payments TEXT DEFAULT '[]',
  payouts TEXT DEFAULT '[]',
  items TEXT DEFAULT '[]',
  taxRate REAL DEFAULT 0,
  orderStatus TEXT DEFAULT 'in_progress',
  notes TEXT DEFAULT '',
  createdAt INTEGER,
  createdAtLabel TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT DEFAULT '',
  role TEXT DEFAULT 'staff',
  username TEXT UNIQUE,
  passwordHash TEXT,
  createdAt INTEGER
);
`);

/* 升級用：如果是舊版本已經在用的資料庫（staff 資料表已經存在、但還沒有這幾欄），
   用 ALTER TABLE 補上欄位。新安裝的資料庫因為上面 CREATE TABLE 已經包含這些欄位，
   這裡會直接因為欄位已存在而失敗，用 try/catch 忽略即可。 */
['brand', 'supervisor', 'department'].forEach(function(col){
  try { db.exec("ALTER TABLE staff ADD COLUMN " + col + " TEXT DEFAULT ''"); } catch (e) { /* 欄位已存在，略過 */ }
});

module.exports = db;
