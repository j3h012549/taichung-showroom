const bcrypt = require('bcryptjs');
const db = require('./schema');

function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function seedDefaultAccounts() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM accounts').get().c;
  if (count > 0) return;
  const now = Date.now();
  const insert = db.prepare(
    'INSERT INTO accounts (id, name, role, username, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)'
  );
  insert.run(uid('acc'), '管理員', 'admin', 'admin', bcrypt.hashSync('9999', 10), now);
  insert.run(uid('acc'), '操作人員', 'staff', 'staff', bcrypt.hashSync('1234', 10), now);
  console.log('[seed] 已建立預設帳號：admin/9999（管理員）、staff/1234（操作人員）');
}

seedDefaultAccounts();

module.exports = { seedDefaultAccounts, uid };
