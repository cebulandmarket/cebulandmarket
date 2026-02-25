/**
 * CebuLandMarket - Main App Logic
 * Handles navigation, mobile menu, and shared utilities
 */

// Mobile hamburger menu toggle
document.addEventListener('DOMContentLoaded', function() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      hamburger.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close menu when clicking a link
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }

  // Close menu when clicking outside
  document.addEventListener('click', function(e) {
    if (navLinks && hamburger && !navLinks.contains(e.target) && !hamburger.contains(e.target)) {
      hamburger.classList.remove('active');
      navLinks.classList.remove('open');
    }
  });
});

// Back to top button visibility
window.addEventListener('scroll', function() {
  var btn = document.getElementById('backToTop');
  if (btn) {
    if (window.scrollY > 400) {
      btn.classList.add('visible');
    } else {
      btn.classList.remove('visible');
    }
  }
});

// Email notification signup form
document.addEventListener('DOMContentLoaded', function() {
  var notifyForm = document.getElementById('notifyForm');
  if (notifyForm) {
    notifyForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = notifyForm.querySelector('button[type="submit"]');
      btn.textContent = 'Sending...';
      btn.disabled = true;
      fetch(notifyForm.action, { method: 'POST', body: new FormData(notifyForm), mode: 'no-cors' })
      .then(function() {
        notifyForm.style.display = 'none';
        document.getElementById('notifySuccess').style.display = 'block';
      })
      .catch(function() {
        notifyForm.style.display = 'none';
        document.getElementById('notifySuccess').style.display = 'block';
      });
    });
  }
});

// Format price to PHP currency
function formatPrice(price) {
  if (!price || isNaN(price) || price === 0) return 'TBD';
  return '₱' + Number(price).toLocaleString('en-PH');
}

// Format number with commas
function formatNumber(num) {
  if (!num || isNaN(num)) return '0';
  return Number(num).toLocaleString('en-PH');
}

// Get URL parameter
function getUrlParam(param) {
  var params = new URLSearchParams(window.location.search);
  return params.get(param);
}

// Slugify text for URLs
function slugify(text) {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

// Location slug to display name mapping
var locationNames = {
  'cebu-city': 'Cebu City', 'banilad': 'Banilad', 'mandaue': 'Mandaue', 'lapu-lapu': 'Lapu-Lapu',
  'talisay': 'Talisay', 'toledo': 'Toledo', 'danao': 'Danao',
  'naga': 'Naga', 'carcar': 'Carcar', 'bogo': 'Bogo',
  'liloan': 'Liloan', 'consolacion': 'Consolacion', 'compostela': 'Compostela',
  'carmen': 'Carmen', 'catmon': 'Catmon', 'sogod': 'Sogod',
  'borbon': 'Borbon', 'tabogon': 'Tabogon', 'san-remigio': 'San Remigio',
  'medellin': 'Medellin', 'daanbantayan': 'Daanbantayan', 'bantayan': 'Bantayan',
  'madridejos': 'Madridejos', 'santa-fe': 'Santa Fe', 'tuburan': 'Tuburan',
  'tabuelan': 'Tabuelan', 'minglanilla': 'Minglanilla', 'san-fernando': 'San Fernando',
  'sibonga': 'Sibonga', 'argao': 'Argao', 'dalaguete': 'Dalaguete',
  'alcoy': 'Alcoy', 'boljoon': 'Boljoon', 'oslob': 'Oslob',
  'santander': 'Santander', 'samboan': 'Samboan', 'ginatilan': 'Ginatilan',
  'malabuyoc': 'Malabuyoc', 'alegria': 'Alegria', 'badian': 'Badian',
  'moalboal': 'Moalboal', 'ronda': 'Ronda', 'alcantara': 'Alcantara',
  'dumanjug': 'Dumanjug', 'barili': 'Barili', 'balamban': 'Balamban',
  'asturias': 'Asturias', 'pinamungajan': 'Pinamungajan', 'aloguinsan': 'Aloguinsan',
  'cordova': 'Cordova', 'olango': 'Olango', 'camotes': 'Camotes',
  'other': 'Other'
};

// Property type display names
var typeNames = {
  'lot': 'Lot / Land',
  'house-and-lot': 'House & Lot',
  'farm': 'Farm Land',
  'commercial': 'Commercial',
  'beach': 'Beach Property'
};

// Get display name for location
function getLocationName(slug) {
  return locationNames[slug] || slug;
}

// Get display name for property type
function getTypeName(slug) {
  return typeNames[slug] || slug;
}

// Generate a placeholder image with text
function getPlaceholderImage(text) {
  return 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">' +
    '<rect fill="#e0e0e0" width="400" height="300"/>' +
    '<text fill="#999" font-family="Arial" font-size="16" text-anchor="middle" x="200" y="145">' +
    (text || 'No Photo Available') + '</text>' +
    '<text fill="#bbb" font-family="Arial" font-size="40" text-anchor="middle" x="200" y="180">&#127968;</text>' +
    '</svg>'
  );
}
