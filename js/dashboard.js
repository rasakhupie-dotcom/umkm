/* ═══════════════════════════════════════
   WARKOP POS — dashboard.js
   ═══════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  buildHourlyChart();
});

function buildHourlyChart() {
  const el = document.getElementById('hourlyChart');
  if (!el) return;
  const hours = [
    {h:'07',v:30},{h:'08',v:65},{h:'09',v:90},{h:'10',v:100},
    {h:'11',v:75},{h:'12',v:50},{h:'13',v:55},{h:'14',v:80},
    {h:'15',v:60},{h:'16',v:35}
  ];
  el.innerHTML = hours.map(({h,v}) => `
    <div class="chart-bar">
      <div class="chart-bar-inner ${v===100?'peak':''}" style="height:${v}%"></div>
      <span class="chart-bar-label">${h}</span>
    </div>
  `).join('');
}
