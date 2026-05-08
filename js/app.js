/* ═══════════════════════════════════════════════════
   WARKOP POS — app.js (Global State & Utilities)
   ═══════════════════════════════════════════════════ */

window.WarkopApp = (() => {

  /* ── STATE ── */
  const state = {
    role: localStorage.getItem('warkop_role') || 'owner',
    barang: [
      { id:'WK-001', nama:'Kopi Bubuk',      kategori:'Bahan Baku',   satuan:'gram',   stok:1200, min:500,  safety:300, lead:1,   avgDaily:200,  hBeli:120,   hJual:0,     supplier:'CV Kopi Nusantara' },
      { id:'WK-002', nama:'Susu Cair',        kategori:'Bahan Baku',   satuan:'ml',     stok:800,  min:1000, safety:500, lead:1,   avgDaily:1500, hBeli:18,    hJual:0,     supplier:'Depot Susu Segar' },
      { id:'WK-003', nama:'Gula Pasir',       kategori:'Bahan Baku',   satuan:'gram',   stok:3000, min:1000, safety:500, lead:1,   avgDaily:300,  hBeli:14,    hJual:0,     supplier:'Toko Sembako Jaya' },
      { id:'WK-004', nama:'Gula Aren Cair',   kategori:'Bahan Baku',   satuan:'ml',     stok:2100, min:1000, safety:600, lead:1,   avgDaily:300,  hBeli:25,    hJual:0,     supplier:'CV Kopi Nusantara' },
      { id:'WK-005', nama:'Teh Celup',        kategori:'Bahan Baku',   satuan:'pcs',    stok:50,   min:25,   safety:10,  lead:2,   avgDaily:5,    hBeli:320,   hJual:0,     supplier:'Toko Sembako Jaya' },
      { id:'WK-006', nama:'Matcha Powder',    kategori:'Bahan Baku',   satuan:'gram',   stok:500,  min:200,  safety:100, lead:3,   avgDaily:50,   hBeli:180,   hJual:0,     supplier:'Online' },
      { id:'WK-007', nama:'Creamer',          kategori:'Bahan Baku',   satuan:'gram',   stok:800,  min:300,  safety:150, lead:2,   avgDaily:100,  hBeli:55,    hJual:0,     supplier:'Depot Susu Segar' },
      { id:'WK-008', nama:'Es Batu',          kategori:'Bahan Baku',   satuan:'bag',    stok:4,    min:5,    safety:3,   lead:0.5, avgDaily:8,    hBeli:8000,  hJual:0,     supplier:'Pembuat Es Pak Ali' },
      { id:'WK-009', nama:'Indomie',          kategori:'Bahan Baku',   satuan:'pcs',    stok:80,   min:40,   safety:20,  lead:1,   avgDaily:20,   hBeli:3000,  hJual:0,     supplier:'Toko Sembako Jaya' },
      { id:'WK-010', nama:'Telur Ayam',       kategori:'Bahan Baku',   satuan:'pcs',    stok:60,   min:30,   safety:15,  lead:1,   avgDaily:20,   hBeli:2500,  hJual:0,     supplier:'Peternak Pak Budi' },
      { id:'WK-011', nama:'Roti Tawar',       kategori:'Bahan Baku',   satuan:'lembar', stok:40,   min:20,   safety:10,  lead:1,   avgDaily:20,   hBeli:1200,  hJual:0,     supplier:'Toko Roti Sari' },
      { id:'WK-012', nama:'Saus Sambal',      kategori:'Bahan Baku',   satuan:'sachet', stok:40,   min:20,   safety:10,  lead:2,   avgDaily:10,   hBeli:750,   hJual:0,     supplier:'Toko Sembako Jaya' },
      { id:'WK-013', nama:'Minyak Goreng',    kategori:'Bahan Baku',   satuan:'ml',     stok:2000, min:1000, safety:500, lead:2,   avgDaily:50,   hBeli:18,    hJual:0,     supplier:'Toko Sembako Jaya' },
      { id:'WK-020', nama:'Air Mineral 600ml',kategori:'Barang Jual',  satuan:'pcs',    stok:48,   min:24,   safety:12,  lead:1,   avgDaily:12,   hBeli:2500,  hJual:5000,  supplier:'Distributor AMDK' },
      { id:'WK-021', nama:'Snack Chitato',    kategori:'Barang Jual',  satuan:'pcs',    stok:20,   min:10,   safety:5,   lead:2,   avgDaily:3,    hBeli:7000,  hJual:12000, supplier:'Distributor Snack' },
      { id:'WK-030', nama:'Cup Plastik 22oz', kategori:'Inventaris',   satuan:'pcs',    stok:85,   min:100,  safety:50,  lead:2,   avgDaily:80,   hBeli:500,   hJual:0,     supplier:'Grosir Plastik Jaya' },
      { id:'WK-031', nama:'Sedotan',          kategori:'Inventaris',   satuan:'pcs',    stok:200,  min:100,  safety:50,  lead:2,   avgDaily:150,  hBeli:200,   hJual:0,     supplier:'Grosir Plastik Jaya' },
      { id:'WK-032', nama:'Gas LPG 3kg',      kategori:'Inventaris',   satuan:'tabung', stok:0.8,  min:1,    safety:1,   lead:0.1, avgDaily:0.5,  hBeli:22000, hJual:0,     supplier:'Toko Gas Pak Budi' },
      { id:'WK-033', nama:'Tisu',             kategori:'Inventaris',   satuan:'lembar', stok:400,  min:200,  safety:100, lead:3,   avgDaily:100,  hBeli:300,   hJual:0,     supplier:'Grosir Plastik Jaya' },
      { id:'WK-034', nama:'Gelas Plastik',    kategori:'Inventaris',   satuan:'pcs',    stok:120,  min:100,  safety:50,  lead:2,   avgDaily:60,   hBeli:400,   hJual:0,     supplier:'Grosir Plastik Jaya' },
    ],
    menus: [
      { id:'MN-001', nama:'Es Kopi Susu',  harga:18000, emoji:'☕', bom:[
        { barang:'WK-001', qty:20 }, { barang:'WK-004', qty:30 },
        { barang:'WK-002', qty:100 }, { barang:'WK-008', qty:0.05 },
        { barang:'WK-030', qty:1 }, { barang:'WK-031', qty:1 }
      ]},
      { id:'MN-002', nama:'Kopi Hitam',    harga:10000, emoji:'☕', bom:[
        { barang:'WK-001', qty:15 }, { barang:'WK-003', qty:10 }, { barang:'WK-034', qty:1 }
      ]},
      { id:'MN-003', nama:'Matcha Latte',  harga:22000, emoji:'🍵', bom:[
        { barang:'WK-006', qty:15 }, { barang:'WK-002', qty:150 },
        { barang:'WK-003', qty:20 }, { barang:'WK-008', qty:0.05 },
        { barang:'WK-030', qty:1 }
      ]},
      { id:'MN-004', nama:'Indomie Telur', harga:15000, emoji:'🍜', bom:[
        { barang:'WK-009', qty:1 }, { barang:'WK-010', qty:1 },
        { barang:'WK-013', qty:10 }, { barang:'WK-012', qty:1 }, { barang:'WK-032', qty:0.02 }
      ]},
      { id:'MN-005', nama:'Roti Bakar',    harga:12000, emoji:'🍞', bom:[
        { barang:'WK-011', qty:4 }, { barang:'WK-013', qty:5 },
        { barang:'WK-003', qty:15 }, { barang:'WK-032', qty:0.01 }
      ]},
      { id:'MN-006', nama:'Air Mineral',   harga:5000,  emoji:'💧', bom:[{ barang:'WK-020', qty:1 }]},
    ],
    suppliers: [
      { nama:'CV Kopi Nusantara',   kontak:'08123456789', barang:'Kopi Bubuk, Gula Aren', lead:'1 hari',  status:'Aktif' },
      { nama:'Depot Susu Segar',    kontak:'08234567890', barang:'Susu Cair, Creamer',    lead:'1 hari',  status:'Aktif' },
      { nama:'Toko Gas Pak Budi',   kontak:'08345678901', barang:'Gas LPG 3kg',            lead:'2 jam',   status:'Aktif' },
      { nama:'Grosir Plastik Jaya', kontak:'08456789012', barang:'Cup, Sedotan, Kantong',  lead:'2 hari',  status:'Review' },
      { nama:'Toko Sembako Jaya',   kontak:'08567890123', barang:'Gula, Indomie, Saus',    lead:'1 hari',  status:'Aktif' },
      { nama:'Pembuat Es Pak Ali',  kontak:'08678901234', barang:'Es Batu',                lead:'30 menit',status:'Aktif' },
    ],
    transaksi: [],
    opname: [],
  };

  /* ── UTILS ── */
  const fmt = (n) => 'Rp ' + Math.round(n).toLocaleString('id-ID');
  const fmtNum = (n) => parseFloat(n).toLocaleString('id-ID', { maximumFractionDigits: 2 });
  const now = () => new Date();

  function rop(item) {
    return (item.avgDaily * item.lead) + item.safety;
  }

  function stockStatus(item) {
    const r = rop(item);
    if (item.stok <= r) return 'reorder';
    if (item.stok <= item.min) return 'warning';
    return 'ok';
  }

  /* ── TOAST ── */
  let toastTimer;
  function toast(msg, type = 'success') {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3000);
  }

  /* ── ROLE ── */
  function switchRole(role) {
    state.role = role;
    localStorage.setItem('warkop_role', role);
    applyRole();
    toast(role === 'owner' ? 'Login sebagai Owner ✓' : 'Login sebagai Karyawan', role === 'owner' ? 'success' : 'warning');
  }

  function applyRole() {
    const isOwner = state.role === 'owner';
    const pill = document.getElementById('rolePill');
    const label = document.getElementById('roleLabel');
    const sel = document.getElementById('roleSwitch');
    if (pill) pill.style.color = isOwner ? 'var(--accent-green)' : 'var(--accent-blue)';
    if (label) label.textContent = isOwner ? 'Owner' : 'Karyawan';
    if (sel) sel.value = state.role;

    document.querySelectorAll('.owner-only').forEach(el => {
      el.classList.toggle('locked', !isOwner);
    });
  }

  /* ── CLOCK ── */
  function updateClock() {
    const el = document.getElementById('clockDisplay');
    if (!el) return;
    const n = new Date();
    el.textContent = n.toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' })
      + ' ' + n.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
  }

  /* ── SIDEBAR TOGGLE ── */
  function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    sb && sb.classList.toggle('open');
  }

  /* ── ANIMATIONS ── */
  function initAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
  }

  /* ── SEND REPORT ── */
  function sendReport() {
    toast('Laporan PDF terkirim ke email owner pukul 21.00 WIB ✉', 'success');
  }

  /* ── STOK OPNAME SIMULATION ── */
  let scanCursor = 0;
  function simulateScan(inputId, namaId, stokSistemId) {
    const item = state.barang[scanCursor % state.barang.length];
    scanCursor++;
    const barcodeEl = document.getElementById(inputId);
    const namaEl = document.getElementById(namaId);
    const stokEl = document.getElementById(stokSistemId);
    if (barcodeEl) barcodeEl.value = item.id;
    if (namaEl) namaEl.value = item.nama;
    if (stokEl) stokEl.value = item.stok;
    toast(`Scan: ${item.nama} (${item.id}) — Stok: ${fmtNum(item.stok)} ${item.satuan}`, 'success');
    return item;
  }

  /* ── HPP CALCULATION ── */
  function calcHPP(menuId) {
    const menu = state.menus.find(m => m.id === menuId);
    if (!menu) return 0;
    return menu.bom.reduce((sum, b) => {
      const item = state.barang.find(i => i.id === b.barang);
      return sum + (item ? item.hBeli * b.qty : 0);
    }, 0);
  }

  /* ── INIT ── */
  function init() {
    applyRole();
    updateClock();
    setInterval(updateClock, 1000);
    initAnimations();
    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
      const sb = document.getElementById('sidebar');
      const toggle = document.querySelector('.menu-toggle');
      if (sb && sb.classList.contains('open') && !sb.contains(e.target) && !toggle?.contains(e.target)) {
        sb.classList.remove('open');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);

  return { state, fmt, fmtNum, rop, stockStatus, toast, switchRole, toggleSidebar, sendReport, simulateScan, calcHPP };
})();
