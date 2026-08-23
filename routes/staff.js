const express = require('express');
const db = require('../db/schema');
const { uid } = require('../db/helpers');
const { requireLogin, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireLogin, (req, res) => {
  res.json(db.prepare('SELECT * FROM staff ORDER BY name').all());
});

router.post('/', requireLogin, (req, res) => {
  const f = req.body || {};
  const name = (f.name || '').trim();
  if (!name) return res.status(400).json({ error: '請輸入姓名' });
  const id = uid('staff');
  const commissionRate = (f.commissionRate === undefined || f.commissionRate === null || f.commissionRate === '')
    ? 0 : (Number(f.commissionRate) || 0);
  db.prepare(
    `INSERT INTO staff (id, name, commissionRate, brand, supervisor, department, createdAt)
     VALUES (@id, @name, @commissionRate, @brand, @supervisor, @department, @createdAt)`
  ).run({
    id, name, commissionRate,
    brand: f.brand || '', supervisor: f.supervisor || '', department: f.department || '',
    createdAt: Date.now()
  });
  res.status(201).json(db.prepare('SELECT * FROM staff WHERE id = ?').get(id));
});

router.patch('/:id', requireLogin, (req, res) => {
  const existing = db.prepare('SELECT * FROM staff WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '找不到這位同仁' });
  const patch = req.body || {};
  const merged = Object.assign({}, existing, patch);
  if ('name' in patch) merged.name = (patch.name || '').trim();
  const params = {
    id: merged.id, name: merged.name,
    brand: merged.brand || '', supervisor: merged.supervisor || '', department: merged.department || ''
  };
  db.prepare(
    'UPDATE staff SET name=@name, brand=@brand, supervisor=@supervisor, department=@department WHERE id=@id'
  ).run(params);
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
