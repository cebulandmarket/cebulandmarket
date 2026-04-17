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
    var s = listing.status ? listing.status.toLowerCase() : '';
    return (s === 'active' || s === 'sold') && listing.title;
  });
  callback(listings);
}

function isSold(listing) {
  return listing.status && listing.status.toLowerCase() === 'sold';
}

// ==========================================
// RENDERING - PROPERTY CARDS
// ==========================================

// Platform fee (1%) added to seller's asking price
var PLATFORM_FEE = 0.01;
var OWNER_LISTINGS = ['1', '2']; // Owner's own listings — no fee applied
var currentListing = null; // Exposed for share-card.js

// CLM Trust Score system
var TRUST_CHECK_LABELS = {
  title_verified: 'Title Verified',
  tax_current: 'Tax Current',
  owner_confirmed: 'Owner Confirmed',
  documents_complete: 'Documents Complete',
  photos_authentic: 'Photos Authentic',
  no_encumbrance: 'No Encumbrance',
  boundary_clear: 'Boundary Clear',
  road_access: 'Road Access'
};

function calcTrustScore(verification) {
  if (!verification || !verification.checks) return 0;
  var checks = verification.checks;
  var total = 0;
  var passed = 0;
  for (var key in checks) {
    if (checks.hasOwnProperty(key)) {
      total++;
      if (checks[key]) passed++;
    }
  }
  if (total === 0) return 0;
  return Math.round((passed / total) * 100);
}

function trustScoreColor(score) {
  if (score >= 75) return 'green';
  if (score >= 50) return 'yellow';
  if (score >= 25) return 'orange';
  return 'red';
}

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
  var areaDisplay = listing.type === 'condo' ? (listing.parking_area ? formatNumber(listing.parking_area) + ' sqm parking' : 'With Parking') : formatNumber(listing.lot_area) + ' sqm';
  var floorDisplay = listing.floor_area ? formatNumber(listing.floor_area) + ' sqm floor' : '';

  var sold = isSold(listing);
  var soldBadge = sold ? '<div class="card-sold-overlay"><span class="card-sold-label">SOLD</span></div>' : '';

  var card = document.createElement('div');
  card.className = 'property-card' + (sold ? ' property-card-sold' : '');
  var cardContent =
      '<div class="card-image">' +
        '<img src="' + imageUrl + '" alt="' + escapeHtml(listing.title) + '" loading="lazy" onerror="this.src=getPlaceholderImage()">' +
        '<span class="card-badge">' + escapeHtml(typeDisplay) + '</span>' +
        soldBadge +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-price">' + priceDisplay + (pricePerSqm ? ' <small>' + pricePerSqm + '</small>' : '') + '</div>' +
        '<h3 class="card-title">' + escapeHtml(listing.title) + '</h3>' +
        '<div class="card-location">&#128205; ' + escapeHtml(locationDisplay) + ', Cebu</div>' +
        '<div class="card-meta">' +
          '<span>&#128207; ' + areaDisplay + '</span>' +
          (floorDisplay ? '<span>&#127970; ' + floorDisplay + '</span>' : '') +
        '</div>' +
      '</div>';

  if (sold) {
    card.style.cursor = 'default';
    card.innerHTML = cardContent;
  } else {
    card.innerHTML = '<a href="property.html?id=' + listing.id + '" style="text-decoration:none; color:inherit;">' + cardContent + '</a>';
  }

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

  // Sort: sold always last, then by selected sort
  filtered.sort(function(a, b) {
    var aSold = isSold(a) ? 1 : 0;
    var bSold = isSold(b) ? 1 : 0;
    if (aSold !== bSold) return aSold - bSold;
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
    resultsCount.style.display = 'none';
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

    // Store for share-card.js
    currentListing = listing;

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

    // Update canonical URL for SEO
    var canonicalUrl = document.getElementById('canonicalUrl');
    if (canonicalUrl) canonicalUrl.setAttribute('href', baseUrl + 'property.html?id=' + listing.id);

    // Update Twitter Card meta tags
    var twTitle = document.getElementById('twTitle');
    var twDesc = document.getElementById('twDesc');
    var twImage = document.getElementById('twImage');
    if (twTitle) twTitle.setAttribute('content', listing.title + ' - ' + formatPrice(applyFee(listing.total_price, listing.id)));
    if (twDesc) twDesc.setAttribute('content', listing.description.substring(0, 200) + '...');
    if (twImage) twImage.setAttribute('content', baseUrl + (listing.photo_url || ''));

    // Inject RealEstateListing JSON-LD
    var jsonLd = document.createElement('script');
    jsonLd.type = 'application/ld+json';
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": listing.title,
      "description": listing.description.substring(0, 300),
      "url": baseUrl + 'property.html?id=' + listing.id,
      "image": baseUrl + (listing.photo_url || ''),
      "offers": {
        "@type": "Offer",
        "price": applyFee(listing.total_price, listing.id),
        "priceCurrency": "PHP"
      },
      "address": {
        "@type": "PostalAddress",
        "addressLocality": getLocationName(listing.location),
        "addressRegion": "Cebu",
        "addressCountry": "PH"
      }
    });
    document.head.appendChild(jsonLd);

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

    // Contact buttons — pre-filled with property name and listing ID
    var listingCode = 'CLM-' + listing.id;
    var listingSlug = listing.title.replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-');
    var waText = encodeURIComponent('Hi CebuLandMarket! I\'m interested in: ' + listing.title + ' \u2014 Listing ID: ' + listingCode + '. Please send me the seller\'s contact info.');
    var viberText = encodeURIComponent('Hi CebuLandMarket! I\'m interested in: ' + listing.title + ' \u2014 Listing ID: ' + listingCode + '. Please send me the seller\'s contact info.');
    var emailSubject = encodeURIComponent('Property Inquiry \u2014 ' + listing.title + ' (' + listingCode + ')');
    var emailBody = encodeURIComponent('Hi CebuLandMarket,\n\nI am interested in the following property:\n\nProperty Name: ' + listing.title + '\nListing ID: ' + listingCode + '\n\nPlease send me the seller\'s contact information.\n\nThank you!');
    var contactHtml = '';
    contactHtml += '<a href="https://wa.me/639687512330?text=' + waText + '" target="_blank" class="contact-btn whatsapp">&#128172; Inquire on WhatsApp</a>';
    contactHtml += '<a href="https://m.me/61587469756965?ref=' + listingCode + '_' + listingSlug + '" target="_blank" class="contact-btn messenger">&#128172; Inquire on Messenger</a>';
    contactHtml += '<a href="viber://chat?number=639687512330&text=' + viberText + '" class="contact-btn viber">&#128222; Inquire on Viber</a>';
    contactHtml += '<a href="mailto:info@cebulandmarket.com?subject=' + emailSubject + '&body=' + emailBody + '" class="contact-btn phone">&#9993; Inquire by Email</a>';

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
            '<div class="detail-verified-badge"><div class="badge-icon">&#10003;</div><div><div class="badge-text">Documents Reviewed</div><div class="badge-sub">Title &amp; documents reviewed by our team — not a legal guarantee</div></div></div>' +
            '<div class="detail-info">' +
              '<div class="info-item"><span class="info-icon">&#128207;</span><span class="info-label">' + (listing.type === 'condo' ? 'Parking Area' : 'Lot Area') + '</span><span class="info-value">' + (listing.type === 'condo' ? (listing.parking_area ? formatNumber(listing.parking_area) + ' sqm' : 'Included') : formatNumber(listing.lot_area) + ' sqm') + '</span></div>' +
              (listing.floor_area ? '<div class="info-item"><span class="info-icon">&#127970;</span><span class="info-label">Floor Area</span><span class="info-value">' + formatNumber(listing.floor_area) + ' sqm</span></div>' : '') +
              '<div class="info-item"><span class="info-icon">&#127968;</span><span class="info-label">Property Type</span><span class="info-value">' + escapeHtml(getTypeName(listing.type)) + '</span></div>' +
              '<div class="info-item"><span class="info-icon">&#128205;</span><span class="info-label">Location</span><span class="info-value">' + escapeHtml(getLocationName(listing.location)) + ', Cebu</span></div>' +
              '<div class="info-item"><span class="info-icon">&#128196;</span><span class="info-label">Title Status</span><span class="info-value">' + escapeHtml(listing.title_status || 'Inquire for details') + '</span></div>' +
            '</div>' +
          '</div>' +
          '<div class="detail-card" style="background:linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border:2px solid #16a34a;">' +
            '<h2 style="color:#16a34a;">View Property Story</h2>' +
            '<p style="font-size:0.9rem; color:var(--gray-600); margin-bottom:12px;">See the owner\'s story and vision for this property on its own dedicated page.</p>' +
            '<a href="share.html?id=' + listing.id + '" style="display:block; text-align:center; padding:12px; background:#16a34a; color:#fff; border-radius:8px; text-decoration:none; font-weight:600;">View Property Story</a>' +
          '</div>' +
          '<div class="detail-card share-card">' +
            '<h2>Share This Property</h2>' +
            '<div class="share-buttons">' +
              '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(baseUrl + 'listing-' + listing.id + '.html') + '" target="_blank" class="share-btn share-fb">&#128266; Share on Facebook</a>' +
              '<a href="#" onclick="navigator.clipboard.writeText(\'' + baseUrl + 'property.html?id=' + listing.id + '\');this.textContent=\'Link Copied!\';return false;" class="share-btn share-copy">&#128279; Copy Link</a>' +
              '<a href="#" onclick="if(typeof generateShareCard===\'function\'&&currentListing)generateShareCard(currentListing);return false;" class="share-btn share-copy">&#128247; Download Share Card</a>' +
              '<a href="#" onclick="window.print();return false;" class="share-btn share-copy">&#128424; Print Listing</a>' +
            '</div>' +
          '</div>' +
          '<div class="detail-card" style="background:var(--gray-100);">' +
            '<p style="font-size:0.85rem; color:var(--gray-500);"><strong>Disclaimer:</strong> CebuLandMarket is a listing platform only. Always verify property details and documents before making any transactions.</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Gate contact buttons until inquiry form is submitted
    document.body.classList.add('contacts-gated');

    // Store listing info for inquiry modal
    window._inquiryListing = {
      id: listing.id,
      title: listing.title,
      code: listingCode
    };

    // Update floating buttons with listing-specific pre-filled messages
    var floatMessenger = document.querySelector('.float-messenger');
    var floatWhatsapp = document.querySelector('.float-whatsapp');
    var floatViber = document.querySelector('.float-viber');
    if (floatMessenger) floatMessenger.href = 'https://m.me/61587469756965?ref=' + listingCode + '_' + listingSlug;
    if (floatWhatsapp) floatWhatsapp.href = 'https://wa.me/639687512330?text=' + waText;
    if (floatViber) floatViber.href = 'viber://chat?number=639687512330&text=' + viberText;

    // Update mobile sticky bar with pre-filled messages
    var stickyWa = document.getElementById('stickyWhatsapp');
    if (stickyWa) {
      stickyWa.href = 'https://wa.me/639687512330?text=' + waText;
    }
    var stickyMsg = document.querySelector('.sticky-btn.messenger-btn');
    if (stickyMsg) {
      stickyMsg.href = 'https://m.me/61587469756965?ref=' + listingCode + '_' + listingSlug;
    }

    // Init lightbox for gallery photos
    initLightbox(photoUrls);
  });
}

// ==========================================
// INQUIRY REGISTRATION MODAL
// ==========================================

var _inquiryActiveTab = 'facebook';

function openInquiryModal() {
  var info = window._inquiryListing;
  if (!info) return;

  // Create modal once
  if (!document.getElementById('inquiryRegModal')) {
    var modal = document.createElement('div');
    modal.className = 'inquiry-modal';
    modal.id = 'inquiryRegModal';
    modal.innerHTML =
      '<div class="inquiry-modal-content">' +
        '<button class="inquiry-modal-close" onclick="closeInquiryModal()">&times;</button>' +
        '<h2>Inquiry Registration</h2>' +
        '<p class="inquiry-subtitle">Property: <strong>' + escapeHtml(info.title) + '</strong> (' + info.code + ')</p>' +
        '<div class="inquiry-notice">' +
          'For everyone\'s safety, we record all inquiries before releasing contact information. Your details are kept confidential and will only be used to verify your identity in case of any issues during the property viewing. By submitting, you agree to our <a href="terms.html" target="_blank">Terms of Service</a> and <a href="privacy.html" target="_blank">Privacy Policy</a>.' +
        '</div>' +
        '<form id="inquiryRegForm" onsubmit="submitInquiryRegistration(event)">' +
          '<div class="inquiry-form-row">' +
            '<div class="inquiry-form-group">' +
              '<label>Full Name <span class="required">*</span></label>' +
              '<input type="text" name="full_name" required placeholder="Your full name">' +
            '</div>' +
            '<div class="inquiry-form-group">' +
              '<label>Contact Number <span class="required">*</span></label>' +
              '<input type="tel" name="contact_number" required placeholder="e.g. 09XX XXX XXXX">' +
            '</div>' +
          '</div>' +
          '<div class="inquiry-form-group">' +
            '<label>Email Address <span class="required">*</span></label>' +
            '<input type="email" name="email" required placeholder="your@email.com">' +
          '</div>' +
          '<div class="inquiry-form-group">' +
            '<label>Intended Viewing Date</label>' +
            '<input type="date" name="viewing_date">' +
          '</div>' +
          '<div class="inquiry-form-group">' +
            '<label>Message</label>' +
            '<textarea name="message" placeholder="Any questions or details about your inquiry..."></textarea>' +
          '</div>' +
          '<div class="id-verify-section">' +
            '<label>Identity Verification <span class="required">*</span></label>' +
            '<div class="id-verify-tabs">' +
              '<button type="button" class="id-verify-tab active" onclick="switchIdTab(\'facebook\', this)">Facebook Link</button>' +
              '<button type="button" class="id-verify-tab" onclick="switchIdTab(\'selfie\', this)">Selfie Photo</button>' +
              '<button type="button" class="id-verify-tab" onclick="switchIdTab(\'valid-id\', this)">Valid ID Photo</button>' +
            '</div>' +
            '<div class="id-tab-panel active" id="idTab-facebook">' +
              '<div class="inquiry-form-group" style="margin-bottom:0;">' +
                '<input type="url" name="facebook_link" placeholder="https://facebook.com/yourprofile">' +
              '</div>' +
            '</div>' +
            '<div class="id-tab-panel" id="idTab-selfie">' +
              '<div class="inquiry-form-group" style="margin-bottom:0;">' +
                '<input type="file" name="attachment" accept="image/*" capture="user">' +
              '</div>' +
            '</div>' +
            '<div class="id-tab-panel" id="idTab-valid-id">' +
              '<div class="inquiry-form-group" style="margin-bottom:0;">' +
                '<input type="file" name="attachment" accept="image/*">' +
              '</div>' +
            '</div>' +
            '<p class="id-verify-note">This is for identity verification only. Your information will not be shared publicly and will only be used in case of issues during the property viewing.</p>' +
          '</div>' +
          '<button type="submit" class="inquiry-submit-btn">Submit Inquiry</button>' +
        '</form>' +
      '</div>';
    document.body.appendChild(modal);

    // Close on backdrop click
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeInquiryModal();
    });
  }

  var modal = document.getElementById('inquiryRegModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeInquiryModal() {
  var modal = document.getElementById('inquiryRegModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function switchIdTab(tabName, btn) {
  _inquiryActiveTab = tabName;
  // Update tab buttons
  var tabs = btn.parentElement.querySelectorAll('.id-verify-tab');
  for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
  btn.classList.add('active');

  // Update panels
  var panels = btn.parentElement.parentElement.querySelectorAll('.id-tab-panel');
  for (var j = 0; j < panels.length; j++) panels[j].classList.remove('active');
  document.getElementById('idTab-' + tabName).classList.add('active');

  // Clear inactive file inputs to avoid sending wrong file
  var inactivePanels = btn.parentElement.parentElement.querySelectorAll('.id-tab-panel:not(.active)');
  for (var k = 0; k < inactivePanels.length; k++) {
    var fileInput = inactivePanels[k].querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    var textInput = inactivePanels[k].querySelector('input[type="url"], input[type="text"]');
    if (textInput) textInput.value = '';
  }
}

function submitInquiryRegistration(e) {
  e.preventDefault();
  var form = document.getElementById('inquiryRegForm');
  if (!form) return;

  // Validate identity verification
  var hasId = false;
  if (_inquiryActiveTab === 'facebook') {
    var fbInput = form.querySelector('#idTab-facebook input');
    if (fbInput && fbInput.value.trim()) hasId = true;
  } else if (_inquiryActiveTab === 'selfie') {
    var selfieInput = form.querySelector('#idTab-selfie input[type="file"]');
    if (selfieInput && selfieInput.files.length > 0) hasId = true;
  } else if (_inquiryActiveTab === 'valid-id') {
    var idInput = form.querySelector('#idTab-valid-id input[type="file"]');
    if (idInput && idInput.files.length > 0) hasId = true;
  }

  if (!hasId) {
    alert('Please provide identity verification (Facebook link, selfie, or valid ID photo).');
    return;
  }

  var info = window._inquiryListing;
  var btn = form.querySelector('.inquiry-submit-btn');
  btn.textContent = 'Submitting...';
  btn.disabled = true;

  // Build FormData
  var fd = new FormData(form);
  fd.append('access_key', '09df7276-a4b9-440c-9342-b4c7971c1dce');
  fd.append('subject', 'New Inquiry \u2014 ' + info.title + ' (' + info.code + ')');
  fd.append('from_name', 'CebuLandMarket Inquiry');
  fd.append('property_name', info.title);
  fd.append('listing_id', info.code);
  fd.append('id_verification_method', _inquiryActiveTab === 'facebook' ? 'Facebook Profile Link' : _inquiryActiveTab === 'selfie' ? 'Selfie Photo' : 'Valid ID Photo');
  fd.append('inquiry_date_time', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila' }));

  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    body: fd
  }).then(function(res) {
    return res.json();
  }).then(function(data) {
    revealContacts();
  }).catch(function() {
    // Still reveal contacts on network error (form was attempted)
    revealContacts();
  });
}

function revealContacts() {
  closeInquiryModal();
  document.body.classList.remove('contacts-gated');

  var gateBtn = document.getElementById('inquiryGateBtn');
  if (gateBtn) gateBtn.style.display = 'none';

  var successMsg = document.getElementById('inquirySuccessMsg');
  if (successMsg) successMsg.style.display = 'block';

  var contactsContainer = document.getElementById('contactButtonsContainer');
  if (contactsContainer) contactsContainer.style.display = 'block';
}

// Close inquiry modal on Escape key
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    var modal = document.getElementById('inquiryRegModal');
    if (modal && modal.classList.contains('active')) {
      closeInquiryModal();
    }
  }
});

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
    fetch(form.action, { method: 'POST', body: new FormData(form), mode: 'no-cors' })
    .then(function() {
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
