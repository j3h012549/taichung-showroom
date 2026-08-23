const express = require('express');
const db = require('../db/schema');
const { uid, fmtNow, parseJsonFields } = require('../db/helpers');
const { requireLogin } = require('../middleware/auth');

const router = express.Router();
const JSON_FIELDS = ['brands'];

function rowOut(row) {
  return parseJsonFields(row, JSON_FIELDS);
}

// 後台客戶名單：需要登入（操作人員／管理員皆可）
router.get('/', requireLogin, (req, res) => {
  const rows = db.prepare('SELECT * FROM customers ORDER BY createdAt DESC').all();
  res.json(rows.map(rowOut));
});

// 前台客人自行登記／預約：不需要登入
router.post('/', (req, res) => {
  const f = req.body || {};
  const id = uid('cust');
  const now = Date.now();
  const rec = {
    id,
    name: f.name || '',
    phone: f.phone || '',
    email: f.email || '',
    notes: f.notes || '',
    brands: JSON.stringify(f.brands || []),
    status: f.status || 'visited',
    staffName: f.staffName || '',
    date: f.date || '',
    slot: f.slot || '',
    createdAt: now,
    createdAtLabel: fmtNow()
  };
  db.prepare(
    `INSERT INTO customers (id, name, phone, email, notes, brands, status, staffName, date, slot, createdAt, createdAtLabel)
     VALUES (@id, @name, @phone, @email, @notes, @brands, @status, @staffName, @date, @slot, @createdAt, @createdAtLabel)`
  ).run(rec);
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
  res.status(201).json(rowOut(row));
});

router.patch('/:id', requireLogin, (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '找不到這位客戶' });
  const patch = req.body || {};
  const merged = Object.assign({}, existing, patch);
  if ('brands' in patch) merged.brands = JSON.stringify(patch.brands || []);
  // node:sqlite 的具名參數不接受物件裡多餘的欄位，只能傳 SQL 裡真正用到的那幾個
  const params = {
    id: merged.id, name: merged.name, phone: merged.phone, email: merged.email, notes: merged.notes,
    brands: merged.brands, status: merged.status, staffName: merged.staffName, date: merged.date, slot: merged.slot
  };
  db.prepare(
    `UPDATE customers SET name=@name, phone=@phone, email=@email, notes=@notes, brands=@brands,
     status=@status, staffName=@staffName, date=@date, slot=@slot WHERE id=@id`
  ).run(params);
  const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  res.json(rowOut(row));
});

router.delete('/:id', requireLogin, (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
