/**
 * CebuLandMarket - Listings Logic
 * Reads listings from data/listings.js and renders property cards.
 *
 * HOW TO ADD A NEW LISTING:
 * 1. Open data/listings.js on GitHub
 * 2. Click the pencil icon to edit
 * 3. Copy an existing listing block and change the values
 * 4. Make sure the "id" is unique (use next number)
 * 5. Set "status" to "active"
 * 6. Save/commit the file
 */

// ==========================================
// DATA FETCHING
// ==========================================

// Get listings from LISTINGS_DATA (loaded from data/listings.js)
function fetchListings(callback) {
  var allListings = (typeof LISTINGS_DATA !== 'undefined') ? LISTINGS_DATA : [];
  var listings = allListings.filter(function(listing) {
    return listing.status && listing.status.toLowerCase() === 'active' && listing.title;
  });
  callback(listings);
}

// ==========================================
// RENDERING - PROPERTY CARDS
// ==========================================

// Platform fee (1%) added to seller's asking price
var PLATFORM_FEE = 0.01;
function applyFee(price) { return Math.round(price * (1 + PLATFORM_FEE)); }

function createPropertyCard(listing) {
  var imageUrl = listing.photo_url || getPlaceholderImage(listing.title);
  var priceDisplay = formatPrice(applyFee(listing.total_price));
  var pricePerSqm = listing.price_per_sqm ? formatPrice(applyFee(listing.price_per_sqm)) + '/sqm' : '';
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
    if (location && listing.location !== location) return false;
    if (maxPrice && listing.total_price > maxPrice) return false;
    if (type && listing.type !== type) return false;
    if (minSize && listing.lot_area < minSize) return false;
    return true;
  });

  // Sort
  filtered.sort(function(a, b) {
    switch (sort) {
      case 'price-low': return a.total_price - b.total_price;
      case 'price-high': return b.total_price - a.total_price;
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

    // Render full detail page
    container.innerHTML =
      '<div class="detail-grid">' +
        '<div>' +
          '<div class="gallery">' +
            '<img src="' + mainPhoto + '" alt="' + escapeHtml(listing.title) + '" class="gallery-main" id="galleryMain" onerror="this.src=getPlaceholderImage()">' +
            (photoUrls.length > 1 ? '<div class="gallery-thumbs">' + thumbsHtml + '</div>' : '') +
          '</div>' +
          (listing.video_url ? '<div class="detail-video mt-2"><h2>Property Video</h2><div class="video-container">' + (listing.video_url.indexOf('youtu') !== -1 ? '<iframe src="https://www.youtube-nocookie.com/embed/' + listing.video_url.replace(/.*(?:shorts\/|watch\?v=|youtu\.be\/)/, '').replace(/[?&].*/, '') + '?modestbranding=1&rel=0&showinfo=0" frameborder="0" allowfullscreen></iframe>' : '<video controls playsinline style="width:100%;border-radius:8px;"><source src="' + listing.video_url + '" type="video/mp4">Your browser does not support the video tag.</video>') + '</div></div>' : '') +
          '<div class="detail-description mt-2">' +
            '<h2>Description</h2>' +
            '<p>' + escapeHtml(listing.description).replace(/\n/g, '<br>') + '</p>' +
          '</div>' +
          featuresHtml +
          (listing.map_url ? '<div class="detail-map mt-2"><h2>Property Location</h2><div class="map-container"><iframe src="https://maps.google.com/maps?q=' + encodeURIComponent(listing.map_url) + '&output=embed" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:8px;"></iframe></div></div>' : '') +
        '</div>' +
        '<div class="detail-sidebar">' +
          '<div class="detail-card">' +
            '<div class="price-tag">' + formatPrice(applyFee(listing.total_price)) + '</div>' +
            (listing.price_per_sqm ? '<div class="price-per-sqm">' + formatPrice(applyFee(listing.price_per_sqm)) + ' per sqm</div>' : '') +
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
          '<div class="detail-card" style="background:var(--gray-100);">' +
            '<p style="font-size:0.85rem; color:var(--gray-500);"><strong>Disclaimer:</strong> CebuLandMarket is a listing platform only. Always verify property details and documents before making any transactions.</p>' +
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
