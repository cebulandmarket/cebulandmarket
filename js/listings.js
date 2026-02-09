/**
 * CebuLandMarket - Listings Logic
 * Fetches listings from Google Sheets and renders property cards.
 * Also handles property detail page rendering.
 */

// ==========================================
// CONFIGURATION - UPDATE THESE VALUES
// ==========================================

// Google Sheets Configuration
// 1. Create a Google Sheet with these columns (Row 1 = headers):
//    A: id | B: title | C: type | D: location | E: address | F: lot_area
//    G: price_per_sqm | H: total_price | I: description | J: features
//    K: photo_url | L: photo_urls | M: messenger | N: viber | O: whatsapp
//    P: phone | Q: owner_name | R: status | S: date_listed
//
// 2. Publish the sheet: File > Share > Publish to web > CSV
// 3. Copy the Sheet ID from the URL and paste it below.

var SHEET_ID = 'YOUR_GOOGLE_SHEET_ID';
var SHEET_NAME = 'Sheet1';
var SHEET_URL = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:json&sheet=' + SHEET_NAME;

// Service fee percentage (1% markup on owner's price)
var SERVICE_FEE_RATE = 0.01;

// Calculate prices with 1% service fee included
function calcListingPrice(ownerPrice) {
  var fee = Math.round(ownerPrice * SERVICE_FEE_RATE);
  return {
    ownerPrice: ownerPrice,
    serviceFee: fee,
    totalPrice: ownerPrice + fee
  };
}

function calcPricePerSqm(ownerPricePerSqm) {
  return Math.round(ownerPricePerSqm * (1 + SERVICE_FEE_RATE));
}

// ==========================================
// SAMPLE DATA (used when Google Sheets is not configured)
// ==========================================
var SAMPLE_LISTINGS = [
  {
    id: '1',
    title: '14,724 sqm Lot in Ronda, Cebu',
    type: 'lot',
    location: 'ronda',
    address: 'Brgy. Cansabusab, Ronda, Cebu',
    lot_area: 14724,
    price_per_sqm: 750,
    total_price: 11043000,
    description: 'Spacious 14,724 square meter lot located in Ronda, Cebu. This is a great opportunity for those looking to invest in a large piece of land in the southern part of Cebu. The lot features a gentle slope with a beautiful view of the surrounding mountains and countryside. Access road is available, and the property is near the town center of Ronda. Perfect for farming, residential development, or long-term investment.',
    features: 'Road access,Mountain view,Near town center,Clean title,Flat to gentle slope,Electricity available,Water source nearby',
    photo_url: '',
    photo_urls: '',
    messenger: 'https://m.me/',
    viber: '',
    whatsapp: '',
    phone: '',
    owner_name: 'Property Owner',
    status: 'active',
    date_listed: '2025-01-01'
  },
  {
    id: '2',
    title: '500 sqm Residential Lot in Talisay City',
    type: 'lot',
    location: 'talisay',
    address: 'Brgy. Tabunoc, Talisay City, Cebu',
    lot_area: 500,
    price_per_sqm: 5000,
    total_price: 2500000,
    description: 'Prime residential lot in Talisay City, just 15 minutes from Cebu City. Subdivision lot with paved roads, water, and electricity already available. Ideal for building your dream home. Flood-free area with friendly neighbors.',
    features: 'Subdivision lot,Paved road,Flood-free,Near schools,Near market,Electricity,Water',
    photo_url: '',
    photo_urls: '',
    messenger: 'https://m.me/',
    viber: '',
    whatsapp: '',
    phone: '',
    owner_name: 'Property Owner',
    status: 'active',
    date_listed: '2025-01-15'
  },
  {
    id: '3',
    title: '1,200 sqm Farm Lot in Argao with River Access',
    type: 'farm',
    location: 'argao',
    address: 'Brgy. Bogo, Argao, Cebu',
    lot_area: 1200,
    price_per_sqm: 1200,
    total_price: 1440000,
    description: 'Beautiful farm lot in Argao with access to a clean river. The property has existing fruit trees including mango, coconut, and banana. Surrounded by lush greenery, perfect for a weekend getaway farm or eco-tourism project.',
    features: 'River access,Fruit trees,Mountain view,Clean air,Near highway,Tax declaration',
    photo_url: '',
    photo_urls: '',
    messenger: 'https://m.me/',
    viber: '',
    whatsapp: '',
    phone: '',
    owner_name: 'Property Owner',
    status: 'active',
    date_listed: '2025-02-01'
  }
];

// ==========================================
// DATA FETCHING
// ==========================================

// Parse Google Sheets JSON response
function parseSheetData(jsonText) {
  // Google Sheets returns JSONP-like format: google.visualization.Query.setResponse({...})
  var jsonString = jsonText.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\);?/);
  if (!jsonString || !jsonString[1]) return [];

  var data = JSON.parse(jsonString[1]);
  var rows = data.table.rows;
  var cols = data.table.cols;
  var listings = [];

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    var listing = {
      id: getCellValue(row, 0),
      title: getCellValue(row, 1),
      type: getCellValue(row, 2),
      location: getCellValue(row, 3),
      address: getCellValue(row, 4),
      lot_area: parseFloat(getCellValue(row, 5)) || 0,
      price_per_sqm: parseFloat(getCellValue(row, 6)) || 0,
      total_price: parseFloat(getCellValue(row, 7)) || 0,
      description: getCellValue(row, 8),
      features: getCellValue(row, 9),
      photo_url: getCellValue(row, 10),
      photo_urls: getCellValue(row, 11),
      messenger: getCellValue(row, 12),
      viber: getCellValue(row, 13),
      whatsapp: getCellValue(row, 14),
      phone: getCellValue(row, 15),
      owner_name: getCellValue(row, 16),
      status: getCellValue(row, 17),
      date_listed: getCellValue(row, 18)
    };

    // Only include active listings
    if (listing.status && listing.status.toLowerCase() === 'active' && listing.title) {
      listings.push(listing);
    }
  }

  return listings;
}

function getCellValue(row, colIndex) {
  if (row.c && row.c[colIndex] && row.c[colIndex].v !== null && row.c[colIndex].v !== undefined) {
    return String(row.c[colIndex].v);
  }
  return '';
}

// Fetch listings - tries Google Sheets first, falls back to sample data
function fetchListings(callback) {
  if (SHEET_ID === 'YOUR_GOOGLE_SHEET_ID') {
    // Google Sheets not configured, use sample data
    console.log('Using sample data. Configure SHEET_ID in listings.js to use Google Sheets.');
    callback(SAMPLE_LISTINGS);
    return;
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', SHEET_URL, true);
  xhr.onload = function() {
    if (xhr.status === 200) {
      var listings = parseSheetData(xhr.responseText);
      if (listings.length > 0) {
        callback(listings);
      } else {
        console.warn('No active listings found in Google Sheets. Using sample data.');
        callback(SAMPLE_LISTINGS);
      }
    } else {
      console.error('Failed to fetch Google Sheets. Using sample data.');
      callback(SAMPLE_LISTINGS);
    }
  };
  xhr.onerror = function() {
    console.error('Network error fetching Google Sheets. Using sample data.');
    callback(SAMPLE_LISTINGS);
  };
  xhr.send();
}

// ==========================================
// RENDERING - PROPERTY CARDS
// ==========================================

function createPropertyCard(listing) {
  var imageUrl = listing.photo_url || getPlaceholderImage(listing.title);
  var prices = calcListingPrice(listing.total_price);
  var priceDisplay = formatPrice(prices.totalPrice);
  var pricePerSqm = listing.price_per_sqm ? formatPrice(calcPricePerSqm(listing.price_per_sqm)) + '/sqm' : '';
  var locationDisplay = getLocationName(listing.location);
  var typeDisplay = getTypeName(listing.type);
  var areaDisplay = formatNumber(listing.lot_area) + ' sqm';

  var card = document.createElement('div');
  card.className = 'property-card';
  card.innerHTML =
    '<a href="property.html?id=' + listing.id + '" style="text-decoration:none; color:inherit;">' +
      '<div class="card-image">' +
        '<img src="' + imageUrl + '" alt="' + escapeHtml(listing.title) + '" loading="lazy" onerror="this.src=getPlaceholderImage()">' +
        '<span class="card-badge">' + escapeHtml(typeDisplay) + '</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-price">' + priceDisplay + (pricePerSqm ? ' <small>' + pricePerSqm + '</small>' : '') + '</div>' +
        '<h3 class="card-title">' + escapeHtml(listing.title) + '</h3>' +
        '<div class="card-location">&#128205; ' + escapeHtml(locationDisplay) + ', Cebu</div>' +
        '<div class="card-meta">' +
          '<span>&#128207; ' + areaDisplay + '</span>' +
          '<span>&#128197; ' + escapeHtml(listing.date_listed || 'Recent') + '</span>' +
        '</div>' +
      '</div>' +
    '</a>';

  return card;
}

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ==========================================
// PAGE: HOME - FEATURED LISTINGS
// ==========================================

function renderFeaturedListings() {
  var container = document.getElementById('featuredListings');
  if (!container) return;

  fetchListings(function(listings) {
    container.innerHTML = '';

    // Show up to 6 featured listings
    var featured = listings.slice(0, 6);

    if (featured.length === 0) {
      container.innerHTML = '<div class="no-results"><h3>No listings yet</h3><p>Be the first to list your property!</p></div>';
      return;
    }

    featured.forEach(function(listing) {
      container.appendChild(createPropertyCard(listing));
    });

    // Update stats
    var statEl = document.getElementById('statListings');
    if (statEl) {
      statEl.textContent = listings.length + '+';
    }
  });
}

// ==========================================
// PAGE: LISTINGS - ALL LISTINGS WITH FILTERS
// ==========================================

var allListingsData = [];

function renderAllListings() {
  var container = document.getElementById('allListings');
  if (!container) return;

  // Pre-set filters from URL params
  var urlType = getUrlParam('type');
  var urlLocation = getUrlParam('location');
  if (urlType) {
    var filterType = document.getElementById('filterType');
    if (filterType) filterType.value = urlType;
  }
  if (urlLocation) {
    var filterLoc = document.getElementById('filterLocation');
    if (filterLoc) filterLoc.value = urlLocation;
  }

  fetchListings(function(listings) {
    allListingsData = listings;
    applyFilters();
  });

  // Filter form
  var filterForm = document.getElementById('filterForm');
  if (filterForm) {
    filterForm.addEventListener('submit', function(e) {
      e.preventDefault();
      applyFilters();
    });
  }

  // Sort change
  var sortBy = document.getElementById('sortBy');
  if (sortBy) {
    sortBy.addEventListener('change', function() {
      applyFilters();
    });
  }
}

function applyFilters() {
  var container = document.getElementById('allListings');
  var resultsCount = document.getElementById('resultsCount');
  if (!container) return;

  var location = (document.getElementById('filterLocation') || {}).value || '';
  var maxPrice = parseFloat((document.getElementById('filterPrice') || {}).value) || 0;
  var type = (document.getElementById('filterType') || {}).value || '';
  var minSize = parseFloat((document.getElementById('filterSize') || {}).value) || 0;
  var sort = (document.getElementById('sortBy') || {}).value || 'newest';

  var filtered = allListingsData.filter(function(listing) {
    var displayPrice = calcListingPrice(listing.total_price).totalPrice;
    if (location && listing.location !== location) return false;
    if (maxPrice && displayPrice > maxPrice) return false;
    if (type && listing.type !== type) return false;
    if (minSize && listing.lot_area < minSize) return false;
    return true;
  });

  // Sort (using display prices with markup)
  filtered.sort(function(a, b) {
    var aPrice = calcListingPrice(a.total_price).totalPrice;
    var bPrice = calcListingPrice(b.total_price).totalPrice;
    switch (sort) {
      case 'price-low': return aPrice - bPrice;
      case 'price-high': return bPrice - aPrice;
      case 'size-large': return b.lot_area - a.lot_area;
      case 'newest':
      default:
        return (b.date_listed || '').localeCompare(a.date_listed || '');
    }
  });

  // Render
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results"><h3>No properties found</h3><p>Try adjusting your filters or <a href="listings.html">view all listings</a>.</p></div>';
  } else {
    filtered.forEach(function(listing) {
      container.appendChild(createPropertyCard(listing));
    });
  }

  if (resultsCount) {
    resultsCount.textContent = filtered.length + ' propert' + (filtered.length === 1 ? 'y' : 'ies') + ' found';
  }
}

// ==========================================
// PAGE: PROPERTY DETAIL
// ==========================================

function renderPropertyDetail() {
  var container = document.getElementById('propertyContent');
  if (!container) return;

  var propertyId = getUrlParam('id');
  if (!propertyId) {
    container.innerHTML = '<div class="no-results"><h3>Property not found</h3><p><a href="listings.html">Browse all listings</a></p></div>';
    return;
  }

  fetchListings(function(listings) {
    var listing = null;
    for (var i = 0; i < listings.length; i++) {
      if (listings[i].id === propertyId) {
        listing = listings[i];
        break;
      }
    }

    if (!listing) {
      container.innerHTML = '<div class="no-results"><h3>Property not found</h3><p>This listing may have been removed. <a href="listings.html">Browse all listings</a></p></div>';
      return;
    }

    // Update page title and breadcrumb
    document.title = listing.title + ' - CebuLandMarket';
    var breadcrumb = document.getElementById('breadcrumbTitle');
    if (breadcrumb) breadcrumb.textContent = listing.title;

    // Build photo gallery
    var mainPhoto = listing.photo_url || getPlaceholderImage(listing.title);
    var photoUrls = [];
    if (listing.photo_urls) {
      photoUrls = listing.photo_urls.split(',').map(function(url) { return url.trim(); }).filter(Boolean);
    }
    if (listing.photo_url && photoUrls.indexOf(listing.photo_url) === -1) {
      photoUrls.unshift(listing.photo_url);
    }
    if (photoUrls.length === 0) {
      photoUrls.push(mainPhoto);
    }

    var thumbsHtml = '';
    photoUrls.forEach(function(url, idx) {
      thumbsHtml += '<img src="' + url + '" alt="Photo ' + (idx + 1) + '" class="' + (idx === 0 ? 'active' : '') + '" onclick="changeMainPhoto(this, \'' + url.replace(/'/g, "\\'") + '\')" onerror="this.style.display=\'none\'">';
    });

    // Features list
    var features = listing.features ? listing.features.split(',').map(function(f) { return f.trim(); }).filter(Boolean) : [];
    var featuresHtml = '';
    if (features.length > 0) {
      featuresHtml = '<div class="detail-features"><h2>Property Features</h2><ul class="features-list">';
      features.forEach(function(f) {
        featuresHtml += '<li>' + escapeHtml(f) + '</li>';
      });
      featuresHtml += '</ul></div>';
    }

    // Contact buttons
    var contactHtml = '';
    if (listing.messenger) {
      contactHtml += '<a href="' + escapeHtml(listing.messenger) + '" target="_blank" class="contact-btn messenger">&#128172; Message on Messenger</a>';
    }
    if (listing.viber) {
      var viberNum = listing.viber.replace(/\s/g, '');
      contactHtml += '<a href="viber://chat?number=' + encodeURIComponent(viberNum) + '" class="contact-btn viber">&#128222; Chat on Viber</a>';
    }
    if (listing.whatsapp) {
      var waNum = listing.whatsapp.replace(/[\s\-]/g, '');
      contactHtml += '<a href="https://wa.me/' + encodeURIComponent(waNum) + '" target="_blank" class="contact-btn whatsapp">&#128172; WhatsApp</a>';
    }
    if (listing.phone) {
      contactHtml += '<a href="tel:' + escapeHtml(listing.phone) + '" class="contact-btn phone">&#9742; Call ' + escapeHtml(listing.phone) + '</a>';
    }
    if (!contactHtml) {
      contactHtml = '<p style="color:var(--gray-500); text-align:center;">Contact info not available. Please check back later.</p>';
    }

    // Calculate prices with 1% service fee
    var prices = calcListingPrice(listing.total_price);
    var displayPricePerSqm = listing.price_per_sqm ? calcPricePerSqm(listing.price_per_sqm) : 0;

    // Price breakdown HTML
    var priceBreakdownHtml =
      '<div class="price-breakdown">' +
        '<div class="breakdown-row"><span>Property Price</span><span>' + formatPrice(prices.ownerPrice) + '</span></div>' +
        '<div class="breakdown-row"><span>Platform Fee (1%)</span><span>' + formatPrice(prices.serviceFee) + '</span></div>' +
        '<div class="breakdown-row breakdown-total"><span>Total Price</span><span>' + formatPrice(prices.totalPrice) + '</span></div>' +
      '</div>';

    // Render full detail page
    container.innerHTML =
      '<div class="detail-grid">' +
        '<div>' +
          '<div class="gallery">' +
            '<img src="' + mainPhoto + '" alt="' + escapeHtml(listing.title) + '" class="gallery-main" id="galleryMain" onerror="this.src=getPlaceholderImage()">' +
            (photoUrls.length > 1 ? '<div class="gallery-thumbs">' + thumbsHtml + '</div>' : '') +
          '</div>' +
          '<div class="detail-description mt-2">' +
            '<h2>Description</h2>' +
            '<p>' + escapeHtml(listing.description).replace(/\n/g, '<br>') + '</p>' +
          '</div>' +
          featuresHtml +
        '</div>' +
        '<div class="detail-sidebar">' +
          '<div class="detail-card">' +
            '<div class="price-tag">' + formatPrice(prices.totalPrice) + '</div>' +
            (displayPricePerSqm ? '<div class="price-per-sqm">' + formatPrice(displayPricePerSqm) + ' per sqm</div>' : '') +
            priceBreakdownHtml +
            '<div class="detail-info">' +
              '<div class="info-item"><span class="info-label">Lot Area</span><span class="info-value">' + formatNumber(listing.lot_area) + ' sqm</span></div>' +
              '<div class="info-item"><span class="info-label">Property Type</span><span class="info-value">' + escapeHtml(getTypeName(listing.type)) + '</span></div>' +
              '<div class="info-item"><span class="info-label">Location</span><span class="info-value">' + escapeHtml(getLocationName(listing.location)) + '</span></div>' +
              '<div class="info-item"><span class="info-label">Title Status</span><span class="info-value">' + escapeHtml(listing.title_status || 'Ask seller') + '</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="detail-card">' +
            '<h2>Contact Seller</h2>' +
            '<div class="contact-buttons">' + contactHtml + '</div>' +
          '</div>' +
          '<div class="detail-card" style="background:var(--primary-light);">' +
            '<p style="font-size:0.9rem; color:var(--gray-700);"><strong>Note:</strong> Total price includes a 1% platform fee by CebuLandMarket for connecting buyers and sellers.</p>' +
          '</div>' +
          '<div class="detail-card" style="background:var(--gray-100);">' +
            '<p style="font-size:0.85rem; color:var(--gray-500);"><strong>Disclaimer:</strong> CebuLandMarket is a listing platform only. All transaction costs (taxes, notarial fees, transfer fees, etc.) are the responsibility of the buyer and seller. Always verify property details and documents before making any transactions.</p>' +
          '</div>' +
        '</div>' +
      '</div>';
  });
}

// Gallery photo switcher
function changeMainPhoto(thumbEl, url) {
  var mainImg = document.getElementById('galleryMain');
  if (mainImg) {
    mainImg.src = url;
  }
  // Update active state
  var thumbs = thumbEl.parentElement.querySelectorAll('img');
  thumbs.forEach(function(t) { t.classList.remove('active'); });
  thumbEl.classList.add('active');
}

// ==========================================
// HOME PAGE SEARCH -> LISTINGS PAGE
// ==========================================

function initHomeSearch() {
  var searchForm = document.getElementById('searchForm');
  if (!searchForm) return;

  searchForm.addEventListener('submit', function(e) {
    e.preventDefault();
    var location = document.getElementById('searchLocation').value;
    var price = document.getElementById('searchPrice').value;
    var type = document.getElementById('searchType').value;

    var params = [];
    if (location) params.push('location=' + encodeURIComponent(location));
    if (price) params.push('price=' + encodeURIComponent(price));
    if (type) params.push('type=' + encodeURIComponent(type));

    window.location.href = 'listings.html' + (params.length ? '?' + params.join('&') : '');
  });
}

// ==========================================
// INITIALIZATION
// ==========================================

document.addEventListener('DOMContentLoaded', function() {
  // Determine which page we're on and initialize accordingly
  var page = window.location.pathname.split('/').pop() || 'index.html';

  if (page === 'index.html' || page === '' || page === '/') {
    renderFeaturedListings();
    initHomeSearch();
  } else if (page === 'listings.html') {
    renderAllListings();
  } else if (page === 'property.html') {
    renderPropertyDetail();
  }
});
