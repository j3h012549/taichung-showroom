const db = require('../db/schema');

// 每次請求都用 session 存的帳號 id 去資料庫確認「目前」的身份，
// 而不是只信任登入當下存進 session 的舊資料——這樣管理員刪除帳號、或改變某人身份時，
// 對方下一次操作就會立刻反映最新狀態，不用等到他自己登出重登。
function currentAccountFresh(req) {
  if (!req.session || !req.session.account) return null;
  const row = db.prepare('SELECT id, name, role, username FROM accounts WHERE id = ?').get(req.session.account.id);
  if (!row) return null;
  req.session.account = row; // 順便同步 session 裡快取的資料
  return row;
}

function requireLogin(req, res, next) {
  const acc = currentAccountFresh(req);
  if (!acc) return res.status(401).json({ error: '尚未登入，或帳號已被移除' });
  req.account = acc;
  next();
}

function requireAdmin(req, res, next) {
  const acc = currentAccountFresh(req);
  if (!acc) return res.status(401).json({ error: '尚未登入，或帳號已被移除' });
  if (acc.role !== 'admin' && !(req.session && req.session.adminElevated)) {
    return res.status(403).json({ error: '需要管理員權限' });
  }
  req.account = acc;
  next();
}

module.exports = { requireLogin, requireAdmin };
