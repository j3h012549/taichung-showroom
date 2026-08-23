const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db/schema');
const { uid } = require('../db/helpers');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

function publicRow(row) {
  if (!row) return row;
  return { id: row.id, name: row.name, role: row.role, username: row.username, createdAt: row.createdAt };
}

router.get('/', requireAdmin, (req, res) => {
  res.json(db.prepare('SELECT * FROM accounts ORDER BY createdAt').all().map(publicRow));
});

router.post('/', requireAdmin, (req, res) => {
  const f = req.body || {};
  const name = (f.name || '').trim();
  const username = (f.username || '').trim();
  const password = f.password || '';
  const role = f.role === 'admin' ? 'admin' : 'staff';
  if (!name || !username || !password) return res.status(400).json({ error: '姓名、帳號、密碼都要填' });
  const existing = db.prepare('SELECT id FROM accounts WHERE username = ?').get(username);
  if (existing) return res.status(409).json({ error: '這個帳號已經有人使用了' });
  const id = uid('acc');
  db.prepare('INSERT INTO accounts (id, name, role, username, passwordHash, createdAt) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, name, role, username, bcrypt.hashSync(password, 10), Date.now());
  res.status(201).json(publicRow(db.prepare('SELECT * FROM accounts WHERE id = ?').get(id)));
});

router.patch('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '找不到這個帳號' });
  const f = req.body || {};
  const name = f.name != null ? String(f.name).trim() : existing.name;
  const username = f.username != null ? String(f.username).trim() : existing.username;
  const role = f.role === 'admin' || f.role === 'staff' ? f.role : existing.role;
  const passwordHash = f.password ? bcrypt.hashSync(f.password, 10) : existing.passwordHash;
  db.prepare('UPDATE accounts SET name=?, role=?, username=?, passwordHash=? WHERE id=?')
    .run(name, role, username, passwordHash, req.params.id);
  res.json(publicRow(db.prepare('SELECT * FROM accounts WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM accounts WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
