/**
 * CebuLandMarket - Private Visitor Analytics
 * Tracks page views using GoatCounter (free, privacy-friendly).
 *
 * SETUP:
 * 1. Go to https://www.goatcounter.com/ and sign up (free)
 * 2. Choose a code name, e.g. "cebulandmarket"
 * 3. Replace YOUR_GOATCOUNTER_CODE below with your code
 * 4. View your dashboard at: https://cebulandmarket.goatcounter.com
 *
 * SECRET ADMIN PANEL:
 * Add ?admin=<your-key> to any page URL to see live visitor count
 */

// GoatCounter code (change this after signing up)
var GC_CODE = 'cebulandmarket';

// Admin key (lightly obfuscated — not in plain text)
var ADMIN_KEY = atob('Y2xtMjAyNQ==');

// ==========================================
// GOATCOUNTER TRACKING
// ==========================================
if (GC_CODE !== 'YOUR_GOATCOUNTER_CODE') {
  var gcScript = document.createElement('script');
  gcScript.async = true;
  gcScript.dataset.goatcounter = 'https://' + GC_CODE + '.goatcounter.com/count';
  gcScript.src = '//gc.zgo.at/count.js';
  document.head.appendChild(gcScript);
}

// ==========================================
// LOCAL VISITOR TRACKING (works without GoatCounter too)
// ==========================================
(function() {
  var STORAGE_KEY = 'clm_analytics';

  function getStats() {
    try {
      var data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      if (!data.totalViews) {
        data = {
          totalViews: 0,
          uniqueDays: [],
          pages: {},
          firstVisit: new Date().toISOString(),
          lastVisit: null
        };
      }
      return data;
    } catch(e) {
      return { totalViews: 0, uniqueDays: [], pages: {}, firstVisit: new Date().toISOString(), lastVisit: null };
    }
  }

  function saveStats(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch(e) {}
  }

  // Track this page view
  var stats = getStats();
  stats.totalViews++;
  stats.lastVisit = new Date().toISOString();

  var today = new Date().toISOString().split('T')[0];
  if (stats.uniqueDays.indexOf(today) === -1) {
    stats.uniqueDays.push(today);
  }

  var page = window.location.pathname.split('/').pop() || 'index.html';
  stats.pages[page] = (stats.pages[page] || 0) + 1;

  saveStats(stats);

  // ==========================================
  // ADMIN PANEL (secret URL)
  // ==========================================
  var params = new URLSearchParams(window.location.search);
  if (params.get('admin') === ADMIN_KEY) {
    showAdminPanel(stats);
  }

  function showAdminPanel(stats) {
    var panel = document.createElement('div');
    panel.id = 'adminPanel';
    panel.style.cssText = 'position:fixed; bottom:0; left:0; right:0; background:#1a1a2e; color:#fff; padding:16px 24px; z-index:9999; font-family:monospace; font-size:13px; box-shadow:0 -4px 20px rgba(0,0,0,0.3);';

    var pagesHtml = '';
    var pageNames = Object.keys(stats.pages);
    pageNames.sort(function(a,b) { return stats.pages[b] - stats.pages[a]; });
    pageNames.forEach(function(p) {
      pagesHtml += '<span style="margin-right:16px;">' + p + ': <strong>' + stats.pages[p] + '</strong></span>';
    });

    panel.innerHTML =
      '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">' +
        '<div style="display:flex; gap:24px; flex-wrap:wrap;">' +
          '<span>Total Views: <strong style="color:#f5a623; font-size:16px;">' + stats.totalViews + '</strong></span>' +
          '<span>Active Days: <strong style="color:#f5a623;">' + stats.uniqueDays.length + '</strong></span>' +
          '<span>First Visit: <strong>' + (stats.firstVisit ? stats.firstVisit.split('T')[0] : 'N/A') + '</strong></span>' +
        '</div>' +
        '<div>' +
          '<span style="margin-right:12px;">Pages: ' + pagesHtml + '</span>' +
          (GC_CODE !== 'YOUR_GOATCOUNTER_CODE'
            ? '<a href="https://' + GC_CODE + '.goatcounter.com" target="_blank" style="color:#f5a623; text-decoration:underline; margin-right:12px;">Full Dashboard</a>'
            : '') +
          '<button onclick="document.getElementById(\'adminPanel\').remove()" style="background:#e74c3c; color:#fff; border:none; padding:4px 12px; border-radius:4px; cursor:pointer;">Close</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(panel);
  }
})();
