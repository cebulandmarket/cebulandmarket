/* CebuVehicleMarket - App Utilities */

function formatPrice(n) {
  if (n === null || n === undefined || n === '') return '';
  return '₱' + Number(n).toLocaleString('en-PH');
}

function formatNumber(n) {
  if (n === null || n === undefined || n === '') return '';
  return Number(n).toLocaleString('en-PH');
}

function applyFee(basePrice) {
  if (!basePrice) return 0;
  return Math.round(Number(basePrice) * 1.01);
}

function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getQueryParam(name) {
  var url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function getActiveVehicles() {
  if (typeof VEHICLES_DATA === 'undefined') return [];
  return VEHICLES_DATA.filter(function(v) { return v.status === 'active' || v.status === 'sold'; });
}

function getVehicleById(id) {
  if (typeof VEHICLES_DATA === 'undefined') return null;
  for (var i = 0; i < VEHICLES_DATA.length; i++) {
    if (String(VEHICLES_DATA[i].id) === String(id)) return VEHICLES_DATA[i];
  }
  return null;
}

document.addEventListener('DOMContentLoaded', function() {
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.querySelector('.nav');
  if (toggle && nav) {
    toggle.addEventListener('click', function() {
      nav.classList.toggle('open');
    });
  }

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function() {});
  }
});
