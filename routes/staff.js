const express = require('express');
const db = require('../db/schema');
const { uid } = require('../db/helpers');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, (req, res) => {
  res.json(db.prepare('SELECT * FROM staff ORDER BY name').all());
});

router.post('/', requireLogin, (req, res) => {
  const name = (req.body && req.body.name || '').trim();
  if (!name) return res.status(400).json({ error: '請輸入姓名' });
  const id = uid('staff');
  db.prepare('INSERT INTO staff (id, name, commissionRate, createdAt) VALUES (?, ?, 0, ?)').run(id, name, Date.now());
  res.status(201).json(db.prepare('SELECT * FROM staff WHERE id = ?').get(id));
});

router.patch('/:id', requireLogin, (req, res) => {
  const name = (req.body && req.body.name || '').trim();
  db.prepare('UPDATE staff SET name = ? WHERE id = ?').run(name, req.params.id);
  res.json(db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id));
});

// 抽成％數只有管理員能改
router.patch('/:id/commission', requireAdmin, (req, res) => {
  const rate = Number(req.body && req.body.commissionRate) || 0;
  db.prepare('UPDATE staff SET commissionRate = ? WHERE id = ?').run(rate, req.params.id);
  res.json(db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id));
});

router.delete('/:id', requireLogin, (req, res) => {
  db.prepare('DELETE FROM staff WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
