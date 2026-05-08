/* ═══════════════════════════════════════════════════════════════════════
   WARKOP POS — api.js
   Connector: GitHub Pages Dashboard ↔ Google Apps Script ↔ Google Sheets
   Semua komunikasi data lewat file ini.
   ═══════════════════════════════════════════════════════════════════════ */

window.WarkopAPI = (() => {

  // ─── KONFIGURASI ────────────────────────────────────────────────────────
  // Ganti SCRIPT_URL dengan URL dari Apps Script setelah deploy
  // Format: https://script.google.com/macros/s/XXXXXXXX/exec
  const SCRIPT_URL = localStorage.getItem('warkop_api_url') || '';

  let _url = SCRIPT_URL;

  // Cache sederhana untuk mengurangi request
  const _cache = {};
  const CACHE_TTL = 30000; // 30 detik

  // ─── STATUS ─────────────────────────────────────────────────────────────
  let _isOnline = false;
  let _lastSync = null;

  // ─── CORE REQUEST ────────────────────────────────────────────────────────
  async function _get(action, params = {}) {
    if (!_url) throw new Error('API URL belum dikonfigurasi. Buka Pengaturan → isikan URL Apps Script.');

    const cacheKey = action + JSON.stringify(params);
    const cached = _cache[cacheKey];
    if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${_url}?${qs}`, {
      method: 'GET',
      redirect: 'follow',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Respons tidak ok');

    _cache[cacheKey] = { data: json.data, ts: Date.now() };
    _isOnline = true;
    _lastSync = new Date();
    _updateSyncIndicator(true);
    return json.data;
  }

  async function _post(action, data = {}) {
    if (!_url) throw new Error('API URL belum dikonfigurasi.');
    const res = await fetch(_url, {
      method: 'POST',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' }, // Apps Script needs text/plain for CORS
      body: JSON.stringify({ action, data }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || 'Respons tidak ok');
    // Invalidate related cache
    Object.keys(_cache).forEach(k => delete _cache[k]);
    _isOnline = true;
    _lastSync = new Date();
    _updateSyncIndicator(true);
    return json.data;
  }

  // ─── SYNC INDICATOR ──────────────────────────────────────────────────────
  function _updateSyncIndicator(online) {
    const el = document.getElementById('syncStatus');
    if (!el) return;
    el.textContent = online
      ? '● Terhubung Sheets'
      : '○ Offline (data lokal)';
    el.style.color = online ? 'var(--accent-green)' : 'var(--accent-amber)';
    if (_lastSync) {
      const el2 = document.getElementById('lastSync');
      if (el2) el2.textContent = 'Sync: ' + _lastSync.toLocaleTimeString('id-ID', {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    }
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────────────

  /** Cek koneksi ke Apps Script */
  async function ping() {
    try {
      const res = await _get('ping');
      _isOnline = true;
      return true;
    } catch (e) {
      _isOnline = false;
      _updateSyncIndicator(false);
      return false;
    }
  }

  /** Ambil semua master barang dari Sheets */
  async function getBarang() {
    return _get('getBarang');
  }

  /** Ambil BOM semua menu atau satu menu */
  async function getBOM(menuId = null) {
    return _get('getBOM', menuId ? { menuId } : {});
  }

  /** Ambil saldo stok harian */
  async function getStokHarian() {
    return _get('getStokHarian');
  }

  /** Ambil data opname (opsional filter tanggal: 'DD/MM/YYYY') */
  async function getOpname(tanggal = null) {
    return _get('getOpname', tanggal ? { tanggal } : {});
  }

  /** Ambil riwayat transaksi POS */
  async function getTransaksi(tanggal = null) {
    return _get('getTransaksi', tanggal ? { tanggal } : {});
  }

  /** Ambil status reorder semua barang */
  async function getReorder() {
    return _get('getReorder');
  }

  /** Ambil ringkasan dashboard */
  async function getSummary() {
    return _get('getSummary');
  }

  /** Ambil laporan harian */
  async function getLaporan(tanggal = null) {
    return _get('getLaporan', tanggal ? { tanggal } : {});
  }

  /** Simpan hasil opname ke Sheets */
  async function saveOpname(data) {
    return _post('saveOpname', data);
  }

  /** Simpan transaksi POS + kurangi stok BOM otomatis */
  async function saveTransaksi(items) {
    return _post('saveTransaksi', items);
  }

  /** Update stok satu barang */
  async function updateStok(barcode, stokBaru) {
    return _post('updateStok', { barcode, stokBaru });
  }

  /** Tambah barang baru ke master */
  async function saveBarang(data) {
    return _post('saveBarang', data);
  }

  /** Edit data barang */
  async function updateBarang(data) {
    return _post('updateBarang', data);
  }

  /** Hapus barang dari master */
  async function deleteBarang(id) {
    return _post('deleteBarang', { id });
  }

  /**
   * SCAN PDT — Lookup barcode langsung ke Sheets
   * Dipanggil saat PDT scan dan tombol simulasi scan
   */
  async function scanPDT(barcode) {
    return _post('scanPDT', undefined); // special: post with barcode field
  }

  // Khusus scan — pakai GET agar lebih cepat
  async function lookupBarcode(barcode) {
    return _get('ping') // dummy, actual:
      .catch(() => null)
      .then(() => _get('getBarang'))
      .then(barang => {
        if (!Array.isArray(barang)) return null;
        return barang.find(b => String(b.id).trim().toUpperCase() === String(barcode).trim().toUpperCase()) || null;
      });
  }

  /** Trigger kirim email laporan sekarang */
  async function sendLaporan() {
    return _post('sendLaporan');
  }

  // ─── KONFIGURASI URL ────────────────────────────────────────────────────
  function setUrl(url) {
    _url = url.trim();
    localStorage.setItem('warkop_api_url', _url);
    // Clear cache
    Object.keys(_cache).forEach(k => delete _cache[k]);
    _isOnline = false;
  }

  function getUrl() { return _url; }
  function isConfigured() { return !!_url; }
  function isOnline() { return _isOnline; }
  function getLastSync() { return _lastSync; }

  return {
    ping, getBarang, getBOM, getStokHarian,
    getOpname, getTransaksi, getReorder,
    getSummary, getLaporan,
    saveOpname, saveTransaksi, updateStok,
    saveBarang, updateBarang, deleteBarang,
    lookupBarcode, sendLaporan,
    setUrl, getUrl, isConfigured, isOnline, getLastSync,
  };
})();
