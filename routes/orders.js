const express = require('express');
const db = require('../db/schema');
const { uid, fmtNow, parseJsonFields } = require('../db/helpers');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const JSON_FIELDS = ['payments', 'payouts', 'items'];

function rowOut(row) {
  return parseJsonFields(row, JSON_FIELDS);
}

const DEFAULTS = {
  customerId: '', customerName: '', customerPhone: '',
  brand: '', staffId: '', staffName: '',
  dealDate: '', totalPrice: 0, cost: null, commissionRate: null,
  payments: [], payouts: [], items: [], taxRate: 0,
  orderStatus: 'in_progress', notes: ''
};

// 案件管理整組都需要管理員登入
router.get('/', requireAdmin, (req, res) => {
  const rows = db.prepare('SELECT * FROM orders ORDER BY createdAt DESC').all();
  res.json(rows.map(rowOut));
});

router.post('/', requireAdmin, (req, res) => {
  const f = Object.assign({}, DEFAULTS, req.body || {});
  const id = uid('order');
  const now = Date.now();
  db.prepare(
    `INSERT INTO orders (id, customerId, customerName, customerPhone, brand, staffId, staffName,
      dealDate, totalPrice, cost, commissionRate, payments, payouts, items, taxRate, orderStatus, notes,
      createdAt, createdAtLabel)
     VALUES (@id, @customerId, @customerName, @customerPhone, @brand, @staffId, @staffName,
      @dealDate, @totalPrice, @cost, @commissionRate, @payments, @payouts, @items, @taxRate, @orderStatus, @notes,
      @createdAt, @createdAtLabel)`
  ).run({
    id,
    customerId: f.customerId, customerName: f.customerName, customerPhone: f.customerPhone,
    brand: f.brand, staffId: f.staffId, staffName: f.staffName,
    dealDate: f.dealDate, totalPrice: f.totalPrice, cost: f.cost, commissionRate: f.commissionRate,
    payments: JSON.stringify(f.payments), payouts: JSON.stringify(f.payouts), items: JSON.stringify(f.items),
    taxRate: f.taxRate, orderStatus: f.orderStatus, notes: f.notes,
    createdAt: now, createdAtLabel: fmtNow()
  });
  res.status(201).json(rowOut(db.prepare('SELECT * FROM orders WHERE id = ?').get(id)));
});

router.patch('/:id', requireAdmin, (req, res) => {
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: '找不到這筆訂單' });
  const patch = req.body || {};
  const merged = Object.assign({}, existing, patch);
  JSON_FIELDS.forEach((f) => { if (f in patch) merged[f] = JSON.stringify(patch[f]); });
  // node:sqlite 的具名參數不接受物件裡多餘的欄位，只能傳 SQL 裡真正用到的那幾個
  const params = {
    id: merged.id, customerId: merged.customerId, customerName: merged.customerName, customerPhone: merged.customerPhone,
    brand: merged.brand, staffId: merged.staffId, staffName: merged.staffName, dealDate: merged.dealDate,
    totalPrice: merged.totalPrice, cost: merged.cost, commissionRate: merged.commissionRate,
    payments: merged.payments, payouts: merged.payouts, items: merged.items,
    taxRate: merged.taxRate, orderStatus: merged.orderStatus, notes: merged.notes
  };
  db.prepare(
    `UPDATE orders SET customerId=@customerId, customerName=@customerName, customerPhone=@customerPhone,
      brand=@brand, staffId=@staffId, staffName=@staffName, dealDate=@dealDate, totalPrice=@totalPrice,
      cost=@cost, commissionRate=@commissionRate, payments=@payments, payouts=@payouts, items=@items,
      taxRate=@taxRate, orderStatus=@orderStatus, notes=@notes WHERE id=@id`
  ).run(params);
  res.json(rowOut(db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id)));
});

router.delete('/:id', requireAdmin, (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
