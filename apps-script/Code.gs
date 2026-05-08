// ═══════════════════════════════════════════════════════════════════════════
// WARKOP POS — Google Apps Script Backend API
// Versi: 2.0 | Integrasi: GitHub Pages ↔ Google Sheets (2 arah)
// Deploy sebagai: Web App → Execute as: Me → Who has access: Anyone
// ═══════════════════════════════════════════════════════════════════════════

// ─── KONFIGURASI ────────────────────────────────────────────────────────────
const CONFIG = {
  ownerEmail:     'owner@gmail.com',        // ← GANTI dengan email owner
  warkopNama:     'Warkop Pak Budi',        // ← GANTI dengan nama warkop
  jamLaporan:     21,                       // Kirim laporan jam 21.00 WIB
  batasSelisih:   0.10,                     // Alert bila selisih opname > 10%
  timezone:       'Asia/Jakarta',
  // Sheet names (harus sama persis dengan nama tab di Google Sheets)
  sheets: {
    barang:     'MASTER_BARANG',
    bom:        'BOM',
    opname:     'STOK_OPNAME',
    transaksi:  'TRANSAKSI_POS',
    stokHarian: 'STOK_HARIAN',
    reorder:    'REORDER_POINT',
    laporan:    'LAPORAN_HARIAN',
  }
};

// ─── CORS HEADERS ───────────────────────────────────────────────────────────
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
}

function okJson(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function errJson(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── ROUTER: GET ────────────────────────────────────────────────────────────
function doGet(e) {
  try {
    const action = e.parameter.action || '';
    switch (action) {
      case 'ping':           return okJson({ status: 'online', time: new Date().toISOString() });
      case 'getBarang':      return okJson(getBarang());
      case 'getBOM':         return okJson(getBOM(e.parameter.menuId));
      case 'getStokHarian':  return okJson(getStokHarian());
      case 'getOpname':      return okJson(getOpname(e.parameter.tanggal));
      case 'getTransaksi':   return okJson(getTransaksi(e.parameter.tanggal));
      case 'getReorder':     return okJson(getReorder());
      case 'getLaporan':     return okJson(getLaporan(e.parameter.tanggal));
      case 'getSummary':     return okJson(getDashboardSummary());
      default:               return errJson('Action tidak dikenal: ' + action);
    }
  } catch (err) {
    return errJson('GET Error: ' + err.message);
  }
}

// ─── ROUTER: POST ───────────────────────────────────────────────────────────
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || '';
    switch (action) {
      case 'saveOpname':     return okJson(saveOpname(body.data));
      case 'saveTransaksi':  return okJson(saveTransaksi(body.data));
      case 'updateStok':     return okJson(updateStok(body.data));
      case 'saveBarang':     return okJson(saveBarang(body.data));
      case 'updateBarang':   return okJson(updateBarang(body.data));
      case 'deleteBarang':   return okJson(deleteBarang(body.data));
      case 'scanPDT':        return okJson(handleScanPDT(body.barcode));
      case 'sendLaporan':    return okJson(kirimLaporanHarian());
      case 'authLogin':          return okJson(authLogin(body.data));
      case 'authAddUser':        return okJson(authAddUser(body.data));
      case 'authChangePassword': return okJson(authChangePassword(body.data));
      case 'authResetPassword':  return okJson(authResetPassword(body.data));
      case 'authToggleUser':     return okJson(authToggleUser(body.data));
      case 'authUpdateUser':     return okJson(authUpdateUser(body.data));
      default:               return errJson('Action tidak dikenal: ' + action);
    }
  } catch (err) {
    return errJson('POST Error: ' + err.message);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// READ FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function getBarang() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.barang);
  if (!ws) throw new Error('Sheet MASTER_BARANG tidak ditemukan');
  const rows = ws.getDataRange().getValues();
  const headers = rows[1]; // baris 2 = header
  return rows.slice(2).filter(r => r[0]).map(r => ({
    id:        r[0],
    nama:      r[1],
    kategori:  r[2],
    supplier:  r[3],
    satuanBesar: r[4],
    satuan:    r[5],
    konversi:  r[6],
    hBeli:     r[7],
    hJual:     r[8],
    stok:      r[9],
    min:       r[10],
    safety:    r[11],
    lead:      r[12],
    avgDaily:  r[13],
    rop:       r[14],
    status:    r[15],
  }));
}

function getBOM(menuId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.bom);
  if (!ws) throw new Error('Sheet BOM tidak ditemukan');
  const rows = ws.getDataRange().getValues().slice(3).filter(r => r[0]);
  if (menuId) {
    return rows.filter(r => r[0] === menuId).map(r => ({
      kodeMenu: r[0], namaMenu: r[1], hargaJual: r[2],
      barcodeB: r[3], namaBahan: r[4], satuan: r[5],
      qty: r[6], hargaPerSatuan: r[7], hppBahan: r[8], ket: r[9]
    }));
  }
  // Group by menu
  const menus = {};
  rows.forEach(r => {
    if (!menus[r[0]]) menus[r[0]] = { kodeMenu: r[0], namaMenu: r[1], hargaJual: r[2], bom: [] };
    menus[r[0]].bom.push({ barcodeB: r[3], namaBahan: r[4], satuan: r[5], qty: r[6], hppBahan: r[8] });
  });
  return Object.values(menus);
}

function getStokHarian() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.stokHarian);
  if (!ws) throw new Error('Sheet STOK_HARIAN tidak ditemukan');
  const rows = ws.getDataRange().getValues().slice(2).filter(r => r[0]);
  return rows.map(r => ({
    id: r[0], nama: r[1], satuan: r[2],
    stokAwal: r[3], masuk: r[4], pemakaian: r[5],
    selisih: r[6], stokAkhir: r[7], status: r[8]
  }));
}

function getOpname(tanggal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.opname);
  if (!ws) throw new Error('Sheet STOK_OPNAME tidak ditemukan');
  const rows = ws.getDataRange().getValues().slice(2).filter(r => r[0]);
  const filtered = tanggal
    ? rows.filter(r => {
        const d = r[0] instanceof Date ? r[0].toLocaleDateString('id-ID') : String(r[0]);
        return d.includes(tanggal);
      })
    : rows;
  return filtered.map(r => ({
    tanggal: r[0], shift: r[1], petugas: r[2],
    barcode: r[3], nama: r[4], satuan: r[5],
    stokSistem: r[6], stokFisik: r[7],
    selisih: r[8], pctSelisih: r[9],
    keterangan: r[10], statusApproval: r[11]
  }));
}

function getTransaksi(tanggal) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.transaksi);
  if (!ws) throw new Error('Sheet TRANSAKSI_POS tidak ditemukan');
  const rows = ws.getDataRange().getValues().slice(2).filter(r => r[0]);
  const filtered = tanggal
    ? rows.filter(r => {
        const d = r[1] instanceof Date ? r[1].toLocaleDateString('id-ID') : String(r[1]);
        return d.includes(tanggal);
      })
    : rows;
  return filtered.map(r => ({
    noTrx: r[0], tanggal: r[1], waktu: r[2], shift: r[3],
    kodeMenu: r[4], namaMenu: r[5], tipe: r[6],
    qty: r[7], hargaSatuan: r[8], total: r[9], kasir: r[10]
  }));
}

function getReorder() {
  const barang = getBarang();
  return barang.map(b => {
    const rop = (b.avgDaily * b.lead) + b.safety;
    const selisih = b.stok - rop;
    let status = '✓ AMAN';
    if (b.stok <= rop) status = '⚠ REORDER SEKARANG!';
    else if (b.stok <= b.min) status = '⚡ SEGERA REORDER';
    return { ...b, rop, selisih, rekomendasiBeli: b.stok <= rop ? Math.max(0, rop * 3 - b.stok) : 0, status };
  });
}

function getDashboardSummary() {
  const today = new Date().toLocaleDateString('id-ID');
  const transaksi = getTransaksi(today);
  const stok = getStokHarian();
  const reorder = getReorder();

  const totalPenjualan = transaksi.reduce((s, t) => s + (Number(t.total) || 0), 0);
  const jumlahTrx = transaksi.length;
  const kritis = reorder.filter(r => r.status.includes('REORDER')).length;
  const hampirHabis = reorder.filter(r => r.status.includes('SEGERA')).length;

  // Pareto: top menus
  const menuMap = {};
  transaksi.forEach(t => {
    if (!menuMap[t.namaMenu]) menuMap[t.namaMenu] = { nama: t.namaMenu, total: 0, qty: 0 };
    menuMap[t.namaMenu].total += Number(t.total) || 0;
    menuMap[t.namaMenu].qty += Number(t.qty) || 0;
  });
  const topMenus = Object.values(menuMap).sort((a, b) => b.total - a.total).slice(0, 5);

  return {
    tanggal: today,
    totalPenjualan,
    jumlahTrx,
    kritis,
    hampirHabis,
    topMenus,
    stokKritis: reorder.filter(r => r.status.includes('REORDER')).map(r => ({
      nama: r.nama, stok: r.stok, rop: r.rop, satuan: r.satuan
    }))
  };
}

function getLaporan(tanggal) {
  const tgl = tanggal || new Date().toLocaleDateString('id-ID');
  const summary = getDashboardSummary();
  const opname = getOpname(tgl);
  const selisihItems = opname.filter(o => Math.abs(Number(o.pctSelisih)) > CONFIG.batasSelisih);

  // Kesimpulan otomatis
  const kesimpulan = `Tanggal ${tgl}: terdapat ${summary.kritis} bahan baku mencapai reorder point, ` +
    `${summary.topMenus.slice(0,3).map(m=>m.nama).join(', ')} menyumbang penjualan terbesar, ` +
    (selisihItems.length > 0
      ? `ditemukan selisih stok pada ${selisihItems.map(s=>s.nama).join(', ')} — perlu audit internal.`
      : `tidak ditemukan selisih stok signifikan.`);

  return { summary, opname, selisihItems, kesimpulan };
}

// ═══════════════════════════════════════════════════════════════════════════
// WRITE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function saveOpname(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.opname);
  if (!ws) throw new Error('Sheet STOK_OPNAME tidak ditemukan');

  const {tanggal, shift, petugas, barcode, nama, satuan, stokSistem, stokFisik, keterangan} = data;
  const selisih = Number(stokFisik) - Number(stokSistem);
  const pct = stokSistem > 0 ? selisih / stokSistem : 0;
  const status = Math.abs(pct) > CONFIG.batasSelisih ? '⚠ PERLU APPROVAL' : '✓ OK';

  // Cari baris kosong pertama setelah header
  const lastRow = ws.getLastRow() + 1;
  ws.getRange(lastRow, 1, 1, 12).setValues([[
    tanggal || new Date(), shift, petugas, barcode, nama, satuan,
    Number(stokSistem), Number(stokFisik),
    selisih, pct, keterangan || '', status
  ]]);

  // Update stok di MASTER_BARANG jika ada selisih
  if (selisih !== 0 && barcode) {
    updateStokByBarcode(barcode, Number(stokFisik));
  }

  // Kirim notif ke owner jika selisih besar
  if (Math.abs(pct) > CONFIG.batasSelisih) {
    kirimAlertSelisih(nama, stokSistem, stokFisik, pct);
  }

  return { row: lastRow, selisih, status };
}

function saveTransaksi(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.transaksi);
  if (!ws) throw new Error('Sheet TRANSAKSI_POS tidak ditemukan');

  // data = array of cart items
  const items = Array.isArray(data) ? data : [data];
  const now = new Date();
  const noTrx = 'TRX-' + now.getTime().toString().slice(-6);
  const waktu = Utilities.formatDate(now, CONFIG.timezone, 'HH:mm:ss');
  const tanggal = Utilities.formatDate(now, CONFIG.timezone, 'dd/MM/yyyy');
  const jam = Number(Utilities.formatDate(now, CONFIG.timezone, 'HH'));
  const shift = jam < 14 ? 'Pagi' : jam < 22 ? 'Siang' : 'Malam';

  const lastRow = ws.getLastRow() + 1;
  const rows = items.map(item => [
    noTrx, tanggal, waktu, shift,
    item.kodeMenu, item.namaMenu, item.tipe || 'Dine-in',
    Number(item.qty), Number(item.harga),
    Number(item.qty) * Number(item.harga),
    item.kasir || 'Karyawan'
  ]);
  ws.getRange(lastRow, 1, rows.length, 11).setValues(rows);

  // Kurangi stok via BOM
  items.forEach(item => {
    if (item.bom && Array.isArray(item.bom)) {
      item.bom.forEach(b => {
        kurangiStokBahan(b.barcode, Number(b.qty) * Number(item.qty));
      });
    }
  });

  return { noTrx, jumlahItem: items.length, totalRows: lastRow };
}

function updateStok(data) {
  // data = { barcode, stokBaru }
  return updateStokByBarcode(data.barcode, data.stokBaru);
}

function updateStokByBarcode(barcode, stokBaru) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.barang);
  const data = ws.getDataRange().getValues();
  for (let i = 2; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(barcode).trim()) {
      ws.getRange(i + 1, 10).setValue(stokBaru); // kolom J = stok
      return { updated: true, row: i + 1, stokBaru };
    }
  }
  return { updated: false, error: 'Barcode tidak ditemukan: ' + barcode };
}

function kurangiStokBahan(barcode, jumlah) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.barang);
  const data = ws.getDataRange().getValues();
  for (let i = 2; i < data.length; i++) {
    if (String(data[i][0]).trim() === String(barcode).trim()) {
      const stokLama = Number(data[i][9]) || 0;
      const stokBaru = Math.max(0, stokLama - jumlah);
      ws.getRange(i + 1, 10).setValue(stokBaru);
      return { barcode, stokLama, stokBaru, berkurang: jumlah };
    }
  }
  return { error: 'Barcode tidak ditemukan: ' + barcode };
}

function saveBarang(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.barang);
  const lastRow = ws.getLastRow() + 1;
  ws.getRange(lastRow, 1, 1, 14).setValues([[
    data.id, data.nama, data.kategori, data.supplier,
    data.satuanBesar || data.satuan, data.satuan, data.konversi || 1,
    data.hBeli, data.hJual || 0, data.stok,
    data.min, data.safety, data.lead, data.avgDaily
  ]]);
  return { saved: true, row: lastRow };
}

function updateBarang(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.barang);
  const rows = ws.getDataRange().getValues();
  for (let i = 2; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) {
      ws.getRange(i + 1, 1, 1, 14).setValues([[
        data.id, data.nama, data.kategori, data.supplier,
        data.satuanBesar || data.satuan, data.satuan, data.konversi || 1,
        data.hBeli, data.hJual || 0, data.stok,
        data.min, data.safety, data.lead, data.avgDaily
      ]]);
      return { updated: true, row: i + 1 };
    }
  }
  return { updated: false, error: 'ID tidak ditemukan: ' + data.id };
}

function deleteBarang(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ws = ss.getSheetByName(CONFIG.sheets.barang);
  const rows = ws.getDataRange().getValues();
  for (let i = 2; i < rows.length; i++) {
    if (String(rows[i][0]).trim() === String(data.id).trim()) {
      ws.deleteRow(i + 1);
      return { deleted: true, row: i + 1 };
    }
  }
  return { deleted: false, error: 'ID tidak ditemukan: ' + data.id };
}

// ─── SCAN PDT ───────────────────────────────────────────────────────────────
function handleScanPDT(barcode) {
  if (!barcode) return { error: 'Barcode kosong' };
  const barang = getBarang();
  const item = barang.find(b => String(b.id).trim() === String(barcode).trim());
  if (!item) return { found: false, barcode, error: 'Barcode tidak ditemukan di master data' };
  return {
    found: true,
    barcode,
    nama: item.nama,
    satuan: item.satuan,
    stok: item.stok,
    min: item.min,
    rop: (item.avgDaily * item.lead) + item.safety,
    status: item.status
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EMAIL & NOTIFIKASI
// ═══════════════════════════════════════════════════════════════════════════

function kirimAlertSelisih(nama, sistem, fisik, pct) {
  const pctStr = (pct * 100).toFixed(1);
  try {
    GmailApp.sendEmail(
      CONFIG.ownerEmail,
      `[ALERT WARKOP] Selisih stok ${nama} = ${pctStr}%`,
      `Ditemukan selisih stok signifikan:\n\nBarang: ${nama}\nStok Sistem: ${sistem}\nStok Fisik: ${fisik}\nSelisih: ${pctStr}%\n\nSegera lakukan audit internal.`,
      {
        htmlBody: `<div style="font-family:Arial;max-width:500px">
          <h3 style="color:#DC2626">⚠ Alert Selisih Stok</h3>
          <table style="width:100%;border-collapse:collapse">
            <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Barang</td><td style="padding:8px">${nama}</td></tr>
            <tr><td style="padding:8px;font-weight:bold">Stok Sistem</td><td style="padding:8px">${sistem}</td></tr>
            <tr style="background:#f5f5f5"><td style="padding:8px;font-weight:bold">Stok Fisik</td><td style="padding:8px">${fisik}</td></tr>
            <tr style="background:#FCEBEB"><td style="padding:8px;font-weight:bold;color:#DC2626">Selisih</td><td style="padding:8px;color:#DC2626;font-weight:bold">${pctStr}%</td></tr>
          </table>
          <p style="color:#666;margin-top:12px">Mohon segera lakukan audit internal dan approval opname.</p>
        </div>`
      }
    );
  } catch(e) { Logger.log('Email error: ' + e.message); }
}

function kirimLaporanHarian() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const laporan = getLaporan();
  const tgl = laporan.summary.tanggal;
  const s = laporan.summary;

  const htmlBody = `
  <div style="font-family:Arial;max-width:600px;color:#333">
    <div style="background:#1D9E75;color:white;padding:16px 20px;border-radius:8px 8px 0 0">
      <h2 style="margin:0;font-size:18px">☕ ${CONFIG.warkopNama}</h2>
      <div style="font-size:13px;opacity:.8;margin-top:4px">Laporan Harian — ${tgl}</div>
    </div>
    <div style="border:1px solid #e5e5e5;border-top:none;padding:16px;border-radius:0 0 8px 8px">

      <h3 style="color:#1D9E75;font-size:14px;margin-bottom:8px">📊 Ringkasan Penjualan</h3>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <tr style="background:#f9f9f9"><td style="padding:8px;border:1px solid #eee">Total Penjualan</td>
          <td style="padding:8px;border:1px solid #eee;font-weight:bold;color:#1D9E75">Rp ${s.totalPenjualan.toLocaleString('id-ID')}</td></tr>
        <tr><td style="padding:8px;border:1px solid #eee">Jumlah Transaksi</td>
          <td style="padding:8px;border:1px solid #eee">${s.jumlahTrx}</td></tr>
        <tr style="background:#f9f9f9"><td style="padding:8px;border:1px solid #eee">Barang Kritis Reorder</td>
          <td style="padding:8px;border:1px solid #eee;color:#DC2626;font-weight:bold">${s.kritis} item</td></tr>
      </table>

      <h3 style="color:#1D9E75;font-size:14px;margin:16px 0 8px">🏆 Top Menu Hari Ini</h3>
      ${s.topMenus.map((m,i) => `
        <div style="display:flex;justify-content:space-between;padding:6px 10px;background:${i%2?'#f9f9f9':'#fff'};border-radius:4px;font-size:12px">
          <span>${i+1}. ${m.nama}</span>
          <span style="font-weight:bold">Rp ${m.total.toLocaleString('id-ID')} (${m.qty} pcs)</span>
        </div>`).join('')}

      ${s.stokKritis.length > 0 ? `
      <h3 style="color:#DC2626;font-size:14px;margin:16px 0 8px">⚠ Stok Wajib Reorder</h3>
      ${s.stokKritis.map(b => `
        <div style="display:flex;justify-content:space-between;padding:6px 10px;background:#FCEBEB;border-radius:4px;font-size:12px;margin-bottom:4px">
          <span style="font-weight:bold">${b.nama}</span>
          <span>Stok: ${b.stok} ${b.satuan} | ROP: ${b.rop} ${b.satuan}</span>
        </div>`).join('')}` : ''}

      <div style="margin-top:16px;padding:12px;background:#E1F5EE;border-radius:6px;font-size:12px;line-height:1.6;color:#0F6E56">
        <strong>Kesimpulan:</strong> ${laporan.kesimpulan}
      </div>

      <div style="margin-top:12px;font-size:11px;color:#999;text-align:center">
        Dikirim otomatis oleh WarkopPOS · ${new Date().toLocaleString('id-ID')}
      </div>
    </div>
  </div>`;

  // Export sheet laporan sebagai PDF
  let attachments = [];
  try {
    const sheetId = ss.getSheetByName(CONFIG.sheets.laporan).getSheetId();
    const pdfUrl = `https://docs.google.com/spreadsheets/d/${ss.getId()}/export?format=pdf&gid=${sheetId}&portrait=true&fitw=true`;
    const pdf = UrlFetchApp.fetch(pdfUrl, {
      headers: { 'Authorization': 'Bearer ' + ScriptApp.getOAuthToken() }
    }).getBlob().setName(`Laporan_Warkop_${tgl.replace(/\//g,'-')}.pdf`);
    attachments = [pdf];
  } catch(e) { Logger.log('PDF export error: ' + e.message); }

  GmailApp.sendEmail(
    CONFIG.ownerEmail,
    `[WarkopPOS] Laporan Harian ${tgl} — Penjualan Rp ${s.totalPenjualan.toLocaleString('id-ID')}`,
    laporan.kesimpulan,
    { htmlBody, attachments }
  );

  return { sent: true, to: CONFIG.ownerEmail, tanggal: tgl };
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIGGER SETUP
// ═══════════════════════════════════════════════════════════════════════════

// Jalankan fungsi ini SATU KALI untuk mengaktifkan trigger harian
function setupTrigger() {
  // Hapus trigger lama
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));

  // Trigger laporan harian jam 21.00 WIB
  ScriptApp.newTrigger('kirimLaporanHarian')
    .timeBased()
    .atHour(CONFIG.jamLaporan)
    .everyDays(1)
    .inTimezone(CONFIG.timezone)
    .create();

  // Trigger cek stok kritis setiap 6 jam
  ScriptApp.newTrigger('cekStokKritis')
    .timeBased()
    .everyHours(6)
    .create();

  Logger.log('✅ Trigger berhasil dibuat!');
  SpreadsheetApp.getUi().alert('✅ Trigger berhasil! Laporan otomatis setiap pukul 21.00 WIB.');
}

function cekStokKritis() {
  const reorder = getReorder();
  const kritis = reorder.filter(r => r.status.includes('REORDER SEKARANG'));
  if (kritis.length === 0) return;

  const list = kritis.map(r => `• ${r.nama}: stok ${r.stok} ${r.satuan}, ROP ${r.rop}`).join('\n');
  GmailApp.sendEmail(
    CONFIG.ownerEmail,
    `[ALERT WARKOP] ${kritis.length} bahan kritis perlu reorder!`,
    `Bahan berikut wajib dipesan segera:\n\n${list}\n\nCek dashboard: https://USERNAME.github.io/warkop-dashboard`,
    {
      htmlBody: `<div style="font-family:Arial;max-width:500px">
        <h3 style="color:#DC2626">⚠ ${kritis.length} Bahan Wajib Reorder!</h3>
        ${kritis.map(r => `<div style="padding:8px;background:#FCEBEB;margin:4px 0;border-radius:4px;font-size:13px">
          <strong>${r.nama}</strong> — Stok: ${r.stok} ${r.satuan} | ROP: ${r.rop}
        </div>`).join('')}
      </div>`
    }
  );
}

// ─── TEST FUNCTION ───────────────────────────────────────────────────────────
function testAPI() {
  Logger.log('=== TEST SCAN PDT ===');
  Logger.log(JSON.stringify(handleScanPDT('WK-001')));
  Logger.log('=== TEST SUMMARY ===');
  Logger.log(JSON.stringify(getDashboardSummary()));
  Logger.log('=== TEST REORDER ===');
  const rop = getReorder();
  Logger.log('Barang kritis: ' + rop.filter(r=>r.status.includes('REORDER')).length);
}

// ═══════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT — Multi-device Login via Google Sheets
// Sheet: USERS (tambahkan tab baru di Spreadsheet)
// Kolom: ID | Nama | Username | PasswordHash | Role | Aktif | MustChangePwd | CreatedAt | UpdatedAt | LastLoginAt | LastLoginIP
// ═══════════════════════════════════════════════════════════════════════════

const USERS_SHEET = 'USERS';

// Pastikan sheet USERS ada, buat jika belum
function ensureUsersSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let ws = ss.getSheetByName(USERS_SHEET);
  if (!ws) {
    ws = ss.insertSheet(USERS_SHEET);
    // Header row
    const headers = ['ID','Nama','Username','PasswordHash','Role','Aktif','MustChangePwd','CreatedAt','UpdatedAt','LastLoginAt','LastLoginDevice'];
    ws.getRange(1, 1, 1, headers.length).setValues([headers]);
    ws.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    ws.setFrozenRows(1);

    // Seed default users (password hash dihitung di Apps Script)
    // owner123  → hash via SHA-256
    // karyawan123 → hash via SHA-256
    const now = new Date().toISOString();
    const ownerHash   = computeSHA256('owner123');
    const karyawanHash = computeSHA256('karyawan123');
    ws.getRange(2, 1, 2, 11).setValues([
      ['USR-001','Pemilik','owner',     ownerHash,    'owner',    'TRUE','TRUE', now, now, '', 'init'],
      ['USR-002','Karyawan 1','karyawan1',karyawanHash,'karyawan','TRUE','TRUE', now, now, '', 'init'],
    ]);
    Logger.log('Sheet USERS dibuat & seed default users.');
  }
  return ws;
}

// SHA-256 di Apps Script (Utilities.computeDigest)
function computeSHA256(text) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text, Utilities.Charset.UTF_8);
  return bytes.map(b => ('0' + (b < 0 ? b + 256 : b).toString(16)).slice(-2)).join('');
}

// ── READ ALL USERS ──────────────────────────────────────────────────────────
function getAllUsers() {
  const ws = ensureUsersSheet();
  const rows = ws.getDataRange().getValues();
  if (rows.length <= 1) return [];
  return rows.slice(1).filter(r => r[0]).map(r => ({
    id:             String(r[0]),
    nama:           r[1],
    username:       String(r[2]).toLowerCase(),
    passwordHash:   String(r[3]),
    role:           r[4],
    aktif:          String(r[5]).toUpperCase() === 'TRUE',
    mustChangePwd:  String(r[6]).toUpperCase() === 'TRUE',
    createdAt:      r[7],
    updatedAt:      r[8],
    lastLoginAt:    r[9],
    lastLoginDevice:r[10],
  }));
}

function getUserRow(username) {
  const ws = ensureUsersSheet();
  const rows = ws.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][2]).toLowerCase() === String(username).toLowerCase().trim()) {
      return { rowIndex: i + 1, data: rows[i] };
    }
  }
  return null;
}

// ── LOGIN ───────────────────────────────────────────────────────────────────
function authLogin(data) {
  const { username, passwordHash, device } = data;
  if (!username || !passwordHash) return { ok: false, error: 'Username/password kosong.' };

  const found = getUserRow(username);
  if (!found) return { ok: false, error: 'Username tidak ditemukan.' };

  const row = found.data;
  const aktif = String(row[5]).toUpperCase() === 'TRUE';
  if (!aktif) return { ok: false, error: 'Akun dinonaktifkan. Hubungi owner.' };

  const storedHash = String(row[3]);
  if (storedHash !== passwordHash) {
    return { ok: false, error: 'Password salah.' };
  }

  // Update lastLoginAt
  const ws = ensureUsersSheet();
  ws.getRange(found.rowIndex, 10).setValue(new Date().toISOString()); // LastLoginAt
  ws.getRange(found.rowIndex, 11).setValue(device || 'web');          // LastLoginDevice

  return {
    ok: true,
    user: {
      id:           String(row[0]),
      nama:         row[1],
      username:     String(row[2]).toLowerCase(),
      role:         row[4],
      mustChangePwd: String(row[6]).toUpperCase() === 'TRUE',
    }
  };
}

// ── GET USERS (owner only) ──────────────────────────────────────────────────
function getUsersForOwner() {
  return getAllUsers().map(u => ({
    id: u.id, nama: u.nama, username: u.username,
    role: u.role, aktif: u.aktif, mustChangePwd: u.mustChangePwd,
    createdAt: u.createdAt, lastLoginAt: u.lastLoginAt, lastLoginDevice: u.lastLoginDevice,
    // JANGAN kirim passwordHash!
  }));
}

// ── ADD USER ─────────────────────────────────────────────────────────────────
function authAddUser(data) {
  const { nama, username, passwordHash, role } = data;
  if (!nama || !username || !passwordHash) return { ok: false, error: 'Data tidak lengkap.' };

  ensureUsersSheet();
  const existing = getUserRow(username);
  if (existing) return { ok: false, error: 'Username sudah digunakan.' };

  const ws = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  const now = new Date().toISOString();
  const newId = 'USR-' + Date.now();
  ws.appendRow([newId, nama, username.toLowerCase(), passwordHash, role || 'karyawan', 'TRUE', 'TRUE', now, now, '', '']);
  return { ok: true, id: newId };
}

// ── CHANGE PASSWORD ──────────────────────────────────────────────────────────
function authChangePassword(data) {
  const { username, oldHash, newHash } = data;
  if (!username || !oldHash || !newHash) return { ok: false, error: 'Data tidak lengkap.' };

  const found = getUserRow(username);
  if (!found) return { ok: false, error: 'User tidak ditemukan.' };
  if (String(found.data[3]) !== oldHash) return { ok: false, error: 'Password lama salah.' };

  const ws = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  ws.getRange(found.rowIndex, 4).setValue(newHash);        // PasswordHash
  ws.getRange(found.rowIndex, 7).setValue('FALSE');         // MustChangePwd = false
  ws.getRange(found.rowIndex, 9).setValue(new Date().toISOString()); // UpdatedAt
  return { ok: true };
}

// ── RESET PASSWORD (owner only) ───────────────────────────────────────────────
function authResetPassword(data) {
  const { targetUsername, newHash } = data;
  if (!targetUsername || !newHash) return { ok: false, error: 'Data tidak lengkap.' };

  const found = getUserRow(targetUsername);
  if (!found) return { ok: false, error: 'User tidak ditemukan.' };

  const ws = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(USERS_SHEET);
  ws.getRange(found.rowIndex, 4).setValue(newHash);
  ws.getRange(found.rowIndex, 7).setValue('TRUE'); // MustChangePwd = true
  ws.getRange(found.rowIndex, 9).setValue(new Date().toISOString());
  return { ok: true };
}

// ── TOGGLE AKTIF ─────────────────────────────────────────────────────────────
function authToggleUser(data) {
  const { userId } = data;
  const ws = ensureUsersSheet();
  const rows = ws.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(userId)) {
      const current = String(rows[i][5]).toUpperCase() === 'TRUE';
      ws.getRange(i + 1, 6).setValue(current ? 'FALSE' : 'TRUE');
      ws.getRange(i + 1, 9).setValue(new Date().toISOString());
      return { ok: true, aktif: !current };
    }
  }
  return { ok: false, error: 'User tidak ditemukan.' };
}

// ── UPDATE USER ───────────────────────────────────────────────────────────────
function authUpdateUser(data) {
  const { userId, nama, role } = data;
  const ws = ensureUsersSheet();
  const rows = ws.getDataRange().getValues();
  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][0]) === String(userId)) {
      if (nama) ws.getRange(i + 1, 2).setValue(nama);
      if (role) ws.getRange(i + 1, 5).setValue(role);
      ws.getRange(i + 1, 9).setValue(new Date().toISOString());
      return { ok: true };
    }
  }
  return { ok: false, error: 'User tidak ditemukan.' };
}

// ── REGISTER ACTION KE ROUTER ────────────────────────────────────────────────
// Tambahkan case-case ini ke doGet dan doPost yang sudah ada

// Tambahan untuk doGet — paste di dalam switch(action) di doGet():
// case 'getUsers':      return okJson(getUsersForOwner());
// case 'pingAuth':      return okJson({ ok: true, sheet: USERS_SHEET });

// Tambahan untuk doPost — paste di dalam switch(action) di doPost():
// case 'authLogin':         return okJson(authLogin(body.data));
// case 'authAddUser':       return okJson(authAddUser(body.data));
// case 'authChangePassword':return okJson(authChangePassword(body.data));
// case 'authResetPassword': return okJson(authResetPassword(body.data));
// case 'authToggleUser':    return okJson(authToggleUser(body.data));
// case 'authUpdateUser':    return okJson(authUpdateUser(body.data));

// ── SETUP: jalankan sekali untuk buat sheet USERS ───────────────────────────
function setupUsersSheet() {
  ensureUsersSheet();
  SpreadsheetApp.getUi().alert('✅ Sheet USERS berhasil dibuat dengan 2 akun default!\n\nOwner: owner / owner123\nKaryawan: karyawan1 / karyawan123\n\nSegera ganti password setelah login pertama.');
}

// ── TEST ─────────────────────────────────────────────────────────────────────
function testAuth() {
  ensureUsersSheet();
  const hash = computeSHA256('owner123');
  Logger.log('Hash owner123: ' + hash);
  const result = authLogin({ username: 'owner', passwordHash: hash, device: 'test' });
  Logger.log('Login result: ' + JSON.stringify(result));
}
