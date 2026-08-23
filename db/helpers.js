function uid(prefix) {
  return prefix + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function fmtNow() {
  var d = new Date();
  function pad(n) { return String(n).padStart(2, '0'); }
  return d.getFullYear() + '/' + pad(d.getMonth() + 1) + '/' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
}

// 把 SQLite 讀出來的一列資料裡，儲存成 JSON 字串的陣列欄位（例如 brands、items、payments）還原成陣列
function parseJsonFields(row, fields) {
  if (!row) return row;
  var out = Object.assign({}, row);
  fields.forEach(function (f) {
    try { out[f] = JSON.parse(row[f]); } catch (e) { out[f] = []; }
    if (!Array.isArray(out[f])) out[f] = [];
  });
  return out;
}

module.exports = { uid, fmtNow, parseJsonFields };
