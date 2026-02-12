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
var OWNER_LISTINGS = ['1']; // Owner's own listings — no fee applied
function applyFee(price, listingId) {
  if (listingId && OWNER_LISTINGS.indexOf(listingId) !== -1) return price;
  return Math.round(price * (1 + PLATFORM_FEE));
}

function createPropertyCard(listing) {
  var imageUrl = listing.photo_url || getPlaceholderImage(listing.title);
  var priceDisplay = formatPrice(applyFee(listing.total_price, listing.id));
  var pricePerSqm = listing.price_per_sqm ? formatPrice(applyFee(listing.price_per_sqm, listing.id)) + '/sqm' : '';
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
        '<span class="card-badge-verified">&#10003; Reviewed</span>' +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-price">' + priceDisplay + (pricePerSqm ? ' <small>' + pricePerSqm + '</small>' : '') + '</div>' +
        '<h3 class="card-title">' + escapeHtml(listing.title) + '</h3>' +
        '<div class="card-location">&#128205; ' + escapeHtml(locationDisplay) + ', Cebu</div>' +
        '<div class="card-meta">' +
          '<span>&#128207; ' + areaDisplay + '</span>' +
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
  var urlPrice = getUrlParam('price');
  var urlKeyword = getUrlParam('q');
  if (urlType) {
    var filterType = document.getElementById('filterType');
    if (filterType) filterType.value = urlType;
  }
  if (urlLocation) {
    var filterLoc = document.getElementById('filterLocation');
    if (filterLoc) filterLoc.value = urlLocation;
  }
  if (urlPrice) {
    var filterPr = document.getElementById('filterPrice');
    if (filterPr) filterPr.value = urlPrice;
  }
  if (urlKeyword) {
    var filterKw = document.getElementById('filterKeyword');
    if (filterKw) filterKw.value = urlKeyword;
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
  var keyword = ((document.getElementById('filterKeyword') || {}).value || '').trim().toLowerCase();
  var sort = (document.getElementById('sortBy') || {}).value || 'newest';

  var filtered = allListingsData.filter(function(listing) {
    if (location && listing.location !== location) return false;
    if (maxPrice && listing.total_price > maxPrice) return false;
    if (type && listing.type !== type) return false;
    if (minSize && listing.lot_area < minSize) return false;
    if (keyword) {
      var searchText = [
        listing.title || '',
        listing.description || '',
        listing.address || '',
        getLocationName(listing.location) || '',
        listing.location || '',
        listing.features || '',
        getTypeName(listing.type) || ''
      ].join(' ').toLowerCase();
      if (searchText.indexOf(keyword) === -1) return false;
    }
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
    document.title = listing.title + ' | ' + formatPrice(applyFee(listing.total_price, listing.id)) + ' — CebuLandMarket';
    var breadcrumb = document.getElementById('breadcrumbTitle');
    if (breadcrumb) breadcrumb.textContent = listing.title;

    // Update Open Graph meta tags for Facebook sharing
    var baseUrl = 'https://cebulandmarket.com/';
    var ogTitle = document.getElementById('ogTitle');
    var ogDesc = document.getElementById('ogDesc');
    var ogImage = document.getElementById('ogImage');
    var ogUrl = document.getElementById('ogUrl');
    if (ogTitle) ogTitle.setAttribute('content', listing.title + ' - ' + formatPrice(applyFee(listing.total_price, listing.id)));
    if (ogDesc) ogDesc.setAttribute('content', listing.description.substring(0, 200) + '...');
    if (ogImage) ogImage.setAttribute('content', baseUrl + (listing.photo_url || ''));
    if (ogUrl) ogUrl.setAttribute('content', baseUrl + 'property.html?id=' + listing.id);

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

    // Contact buttons — all inquiries go to CebuLandMarket (middleman)
    var contactHtml = '';
    contactHtml += '<a href="https://m.me/61587469756965" target="_blank" class="contact-btn messenger">&#128172; Message us on Messenger</a>';
    contactHtml += '<a href="https://wa.me/639687512330?text=' + encodeURIComponent('Hi, I\'m interested in: ' + listing.title) + '" target="_blank" class="contact-btn whatsapp">&#128172; WhatsApp us</a>';
    contactHtml += '<a href="viber://chat?number=639687512330" class="contact-btn viber">&#128222; Chat on Viber</a>';
    contactHtml += '<a href="mailto:cebulandmarket@gmail.com?subject=' + encodeURIComponent('Inquiry: ' + listing.title) + '" class="contact-btn phone">&#9993; Email us</a>';

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
            '<div class="price-tag">' + formatPrice(applyFee(listing.total_price, listing.id)) + '</div>' +
            (listing.price_per_sqm ? '<div class="price-per-sqm">' + formatPrice(applyFee(listing.price_per_sqm, listing.id)) + ' per sqm</div>' : '') +
            '<div class="detail-verified-badge">' +
              '<div class="badge-icon">&#10003;</div>' +
              '<div><div class="badge-text">Documents Reviewed</div><div class="badge-sub">Title &amp; documents reviewed by our team — not a legal guarantee</div></div>' +
            '</div>' +
            '<div class="detail-info">' +
              '<div class="info-item"><span class="info-label">Lot Area</span><span class="info-value">' + formatNumber(listing.lot_area) + ' sqm</span></div>' +
              '<div class="info-item"><span class="info-label">Property Type</span><span class="info-value">' + escapeHtml(getTypeName(listing.type)) + '</span></div>' +
              '<div class="info-item"><span class="info-label">Location</span><span class="info-value">' + escapeHtml(getLocationName(listing.location)) + '</span></div>' +
              '<div class="info-item"><span class="info-label">Title Status</span><span class="info-value">' + escapeHtml(listing.title_status || 'Inquire for details') + '</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="detail-card">' +
            '<h2>Inquire About This Property</h2>' +
            '<p style="font-size:0.85rem; color:var(--gray-500); margin-bottom:12px;">Inquiries are forwarded to the property owner. Buyer and seller deal directly.</p>' +
            '<div class="contact-buttons">' + contactHtml + '</div>' +
          '</div>' +
          '<div class="detail-card" style="text-align:center;">' +
            '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(baseUrl + 'listing-' + listing.id + '.html') + '" target="_blank" class="fb-share-prominent">' +
              '<svg viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>' +
              'Share This Property on Facebook' +
            '</a>' +
            '<p style="font-size:0.8rem; color:var(--gray-500); margin-top:8px;">Help a friend find their perfect land</p>' +
          '</div>' +
          '<div class="detail-card" style="background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border:2px solid #16a34a;">' +
            '<h2 style="color:#16a34a;">View Personal Page</h2>' +
            '<p style="font-size:0.9rem; color:var(--gray-600); margin-bottom:12px;">See the owner\'s story and vision for this property on its own dedicated page.</p>' +
            '<a href="share.html?id=' + listing.id + '" style="display:block; text-align:center; padding:12px; background:#16a34a; color:#fff; border-radius:8px; text-decoration:none; font-weight:600;">View Property Story</a>' +
          '</div>' +
          '<div class="detail-card share-card">' +
            '<h2>Share This Property</h2>' +
            '<div class="share-buttons">' +
              '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(baseUrl + 'listing-' + listing.id + '.html') + '" target="_blank" class="share-btn share-fb">&#128266; Share on Facebook</a>' +
              '<a href="#" onclick="navigator.clipboard.writeText(\'' + baseUrl + 'property.html?id=' + listing.id + '\');this.textContent=\'Link Copied!\';return false;" class="share-btn share-copy">&#128279; Copy Link</a>' +
              '<a href="#" onclick="window.print();return false;" class="share-btn share-copy">&#128424; Print Listing</a>' +
            '</div>' +
          '</div>' +
          '<div class="detail-card" style="background:var(--gray-100);">' +
            '<p style="font-size:0.85rem; color:var(--gray-500);"><strong>Disclaimer:</strong> CebuLandMarket is a listing platform only. Always verify property details and documents before making any transactions.</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Update mobile sticky bar WhatsApp link with listing title
    var stickyWa = document.getElementById('stickyWhatsapp');
    if (stickyWa) {
      stickyWa.href = 'https://wa.me/639687512330?text=' + encodeURIComponent('Hi, I\'m interested in: ' + listing.title);
    }

    // Init lightbox for gallery photos
    initLightbox(photoUrls);
  });
}

// Inquiry form handler
document.addEventListener('click', function(e) {
  if (e.target && e.target.closest('#inquiryForm button[type="submit"]')) {
    var form = document.getElementById('inquiryForm');
    if (!form) return;
    e.preventDefault();
    var name = form.querySelector('[name="buyer_name"]');
    var phone = form.querySelector('[name="buyer_phone"]');
    var oldMsg = form.querySelector('.inquiry-error');
    if (oldMsg) oldMsg.remove();
    if (!name.value.trim() || !phone.value.trim()) {
      var errMsg = document.createElement('p');
      errMsg.className = 'inquiry-error';
      errMsg.style.cssText = 'background:#e74c3c; color:#fff; padding:10px 14px; border-radius:6px; margin-bottom:12px; font-size:0.9rem; font-weight:600;';
      errMsg.textContent = 'Please enter your name and phone number.';
      form.insertBefore(errMsg, form.firstChild);
      return;
    }
    var btn = form.querySelector('button[type="submit"]');
    btn.textContent = 'Sending...';
    btn.disabled = true;
    fetch(form.action, { method: 'POST', body: new FormData(form), headers: { 'Accept': 'application/json' } })
    .then(function(r) {
      form.style.display = 'none';
      document.getElementById('inquirySuccess').style.display = 'block';
    })
    .catch(function() {
      form.style.display = 'none';
      document.getElementById('inquirySuccess').style.display = 'block';
    });
  }
});

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
  // Sync lightbox index
  for (var i = 0; i < lbPhotos.length; i++) {
    if (lbPhotos[i] === url) { lbIndex = i; break; }
  }
}

// Lightbox
var lbPhotos = [];
var lbIndex = 0;

function initLightbox(photos) {
  lbPhotos = photos;
  // Create lightbox element once
  if (!document.getElementById('photoLightbox')) {
    var lb = document.createElement('div');
    lb.className = 'photo-lightbox';
    lb.id = 'photoLightbox';
    lb.innerHTML =
      '<button class="lb-close" onclick="closeLb()">&times;</button>' +
      '<button class="lb-nav lb-prev" onclick="navLb(-1)">&#8249;</button>' +
      '<img id="lbImg" src="" alt="Photo">' +
      '<button class="lb-nav lb-next" onclick="navLb(1)">&#8250;</button>' +
      '<div class="lb-counter" id="lbCounter"></div>';
    document.body.appendChild(lb);
    lb.addEventListener('click', function(e) { if (e.target === lb) closeLb(); });
    document.addEventListener('keydown', function(e) {
      if (!document.getElementById('photoLightbox').classList.contains('active')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') navLb(-1);
      if (e.key === 'ArrowRight') navLb(1);
    });
  }
  // Use setTimeout to ensure DOM elements are rendered
  setTimeout(function() {
    // Make main photo clickable
    var mainImg = document.getElementById('galleryMain');
    if (mainImg) {
      mainImg.style.cursor = 'pointer';
      mainImg.onclick = function() { openLb(lbIndex); };
    }
    // Make each thumbnail also open lightbox on click
    var thumbs = document.querySelectorAll('.gallery-thumbs img');
    thumbs.forEach(function(thumb, idx) {
      thumb.addEventListener('dblclick', function() { openLb(idx); });
    });
  }, 50);
}

function openLb(index) {
  lbIndex = index;
  var lb = document.getElementById('photoLightbox');
  document.getElementById('lbImg').src = lbPhotos[lbIndex];
  document.getElementById('lbCounter').textContent = (lbIndex + 1) + ' / ' + lbPhotos.length;
  lb.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLb() {
  document.getElementById('photoLightbox').classList.remove('active');
  document.body.style.overflow = '';
}

function navLb(dir) {
  lbIndex = (lbIndex + dir + lbPhotos.length) % lbPhotos.length;
  document.getElementById('lbImg').src = lbPhotos[lbIndex];
  document.getElementById('lbCounter').textContent = (lbIndex + 1) + ' / ' + lbPhotos.length;
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
    var keyword = (document.getElementById('searchKeyword') || {}).value || '';

    var params = [];
    if (location) params.push('location=' + encodeURIComponent(location));
    if (price) params.push('price=' + encodeURIComponent(price));
    if (type) params.push('type=' + encodeURIComponent(type));
    if (keyword.trim()) params.push('q=' + encodeURIComponent(keyword.trim()));

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
