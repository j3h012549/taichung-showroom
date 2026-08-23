const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/schema');

const router = express.Router();

function publicAccount(acc) {
  return { id: acc.id, name: acc.name, role: acc.role, username: acc.username };
}

router.post('/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: '請輸入帳號與密碼' });
  const acc = db.prepare('SELECT * FROM accounts WHERE username = ?').get(username);
  if (!acc || !bcrypt.compareSync(password, acc.passwordHash)) {
    return res.status(401).json({ error: '帳號或密碼錯誤' });
  }
  req.session.account = publicAccount(acc);
  req.session.adminElevated = false;
  res.json({ account: req.session.account });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ ok: true }));
});

router.get('/session', (req, res) => {
  res.json({
    account: (req.session && req.session.account) || null,
    adminElevated: !!(req.session && req.session.adminElevated)
  });
});

// 「暫時解鎖」：操作人員登入狀態下，管理員在同一台裝置輸入自己的帳密，暫時查看案件管理，不用讓原本的人登出
router.post('/admin-elevate', (req, res) => {
  if (!req.session || !req.session.account) return res.status(401).json({ error: '尚未登入' });
  const { username, password } = req.body || {};
  const acc = db.prepare('SELECT * FROM accounts WHERE username = ?').get(username);
  if (!acc || acc.role !== 'admin' || !bcrypt.compareSync(password, acc.passwordHash)) {
    return res.status(401).json({ error: '管理員帳號或密碼錯誤' });
  }
  req.session.adminElevated = true;
  res.json({ ok: true });
});

router.post('/admin-delevate', (req, res) => {
  if (req.session) req.session.adminElevated = false;
  res.json({ ok: true });
});

module.exports = router;
