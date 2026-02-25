/**
 * CebuRentMarket - Listings Logic
 * Reads listings from data/rentals.js and renders rental property cards.
 *
 * HOW TO ADD A NEW RENTAL:
 * 1. Open data/rentals.js on GitHub
 * 2. Click the pencil icon to edit
 * 3. Copy an existing listing block and change the values
 * 4. Make sure the "id" is unique (use next number)
 * 5. Set "status" to "active"
 * 6. Save/commit the file
 */

// ==========================================
// DATA FETCHING
// ==========================================

// Get listings from RENTALS_DATA (loaded from data/rentals.js)
function fetchListings(callback) {
  var allListings = (typeof RENTALS_DATA !== 'undefined') ? RENTALS_DATA : [];
  var listings = allListings.filter(function(listing) {
    var s = listing.status ? listing.status.toLowerCase() : '';
    return (s === 'active' || s === 'rented') && listing.title;
  });
  callback(listings);
}

function isRented(listing) {
  return listing.status && listing.status.toLowerCase() === 'rented';
}

// ==========================================
// RENDERING - RENTAL PROPERTY CARDS
// ==========================================

// NO platform fee for rentals
var currentListing = null; // Exposed for share-card.js

// CRM Trust Score system (rental-specific checks)
var TRUST_CHECK_LABELS = {
  owner_verified: 'Owner Verified',
  property_exists: 'Property Exists',
  photos_authentic: 'Photos Authentic',
  lease_terms_clear: 'Lease Terms Clear',
  no_disputes: 'No Disputes',
  utilities_confirmed: 'Utilities Confirmed'
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

function escapeHtml(text) {
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Format monthly rent display
function formatRent(rent) {
  if (!rent || isNaN(rent)) return '₱0/mo';
  return '₱' + Number(rent).toLocaleString('en-PH') + '/mo';
}

// Rental property type display names
var rentalTypeNames = {
  'condo': 'Condo / Apartment',
  'house': 'House',
  'room': 'Room',
  'studio': 'Studio',
  'townhouse': 'Townhouse',
  'commercial': 'Commercial Space',
  'warehouse': 'Warehouse',
  'office': 'Office Space',
  'other': 'Other'
};

// Get display name for rental property type
function getRentalTypeName(slug) {
  return rentalTypeNames[slug] || getTypeName(slug) || slug;
}

// Furnishing status display label
function getFurnishLabel(status) {
  if (!status) return '';
  if (status === 'fully-furnished') return 'Furnished';
  if (status === 'semi-furnished') return 'Semi-Furnished';
  if (status === 'unfurnished') return 'Unfurnished';
  return status;
}

// Create rental property card
function createPropertyCard(listing) {
  var imageUrl = listing.photo_url || getPlaceholderImage(listing.title);
  var rentDisplay = formatRent(listing.monthly_rent);
  var locationDisplay = getLocationName(listing.location);
  var typeDisplay = getRentalTypeName(listing.type);
  var floorDisplay = listing.floor_area ? formatNumber(listing.floor_area) + ' sqm' : '';

  // Build meta tags for bedrooms, bathrooms, furnishing
  var metaHtml = '';
  if (listing.bedrooms) {
    metaHtml += '<span class="card-rental-tag">' + listing.bedrooms + ' BR</span>';
  }
  if (listing.bathrooms) {
    metaHtml += '<span class="card-rental-tag">' + listing.bathrooms + ' BA</span>';
  }
  if (listing.furnish_status) {
    metaHtml += '<span class="card-rental-tag">' + escapeHtml(getFurnishLabel(listing.furnish_status)) + '</span>';
  }

  var rented = isRented(listing);
  var rentedBadge = rented ? '<div class="card-rented-overlay"><span class="card-rented-label">RENTED</span></div>' : '';

  var card = document.createElement('div');
  card.className = 'property-card' + (rented ? ' property-card-rented' : '');
  card.innerHTML =
    '<a href="property.html?id=' + listing.id + '" style="text-decoration:none; color:inherit;">' +
      '<div class="card-image">' +
        '<img src="' + imageUrl + '" alt="' + escapeHtml(listing.title) + '" loading="lazy" onerror="this.src=getPlaceholderImage()">' +
        '<span class="card-badge">' + escapeHtml(typeDisplay) + '</span>' +
        rentedBadge +
      '</div>' +
      '<div class="card-body">' +
        '<div class="card-price">' + rentDisplay + '</div>' +
        '<h3 class="card-title">' + escapeHtml(listing.title) + '</h3>' +
        '<div class="card-location">&#128205; ' + escapeHtml(locationDisplay) + ', Cebu</div>' +
        generateCardRatingHtml(listing.reviews) +
        '<div class="card-rental-meta">' +
          metaHtml +
          (floorDisplay ? '<span class="card-rental-tag">&#127970; ' + floorDisplay + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</a>';

  return card;
}

// ==========================================
// PAGE: HOME - FEATURED LISTINGS
// ==========================================

function renderFeaturedListings() {
  var container = document.getElementById('featuredListings');
  if (!container) return;

  fetchListings(function(listings) {
    container.innerHTML = '';

    // Sort: active first, rented at the bottom
    listings.sort(function(a, b) {
      var aR = isRented(a) ? 1 : 0;
      var bR = isRented(b) ? 1 : 0;
      return aR - bR;
    });

    // Show up to 6 featured listings
    var featured = listings.slice(0, 6);

    if (featured.length === 0) {
      container.innerHTML = '<div class="no-results"><h3>No rentals yet</h3><p>Be the first to list your rental property!</p></div>';
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
  var urlRent = getUrlParam('rent');
  var urlBedrooms = getUrlParam('bedrooms');
  var urlFurnishing = getUrlParam('furnishing');
  var urlKeyword = getUrlParam('q');

  if (urlType) {
    var filterType = document.getElementById('filterType');
    if (filterType) filterType.value = urlType;
  }
  if (urlLocation) {
    var filterLoc = document.getElementById('filterLocation');
    if (filterLoc) filterLoc.value = urlLocation;
  }
  if (urlRent) {
    var filterRent = document.getElementById('filterRent');
    if (filterRent) filterRent.value = urlRent;
  }
  if (urlBedrooms) {
    var filterBed = document.getElementById('filterBedrooms');
    if (filterBed) filterBed.value = urlBedrooms;
  }
  if (urlFurnishing) {
    var filterFurn = document.getElementById('filterFurnishing');
    if (filterFurn) filterFurn.value = urlFurnishing;
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
  var maxRent = parseFloat((document.getElementById('filterRent') || {}).value) || 0;
  var type = (document.getElementById('filterType') || {}).value || '';
  var bedrooms = (document.getElementById('filterBedrooms') || {}).value || '';
  var furnishing = (document.getElementById('filterFurnishing') || {}).value || '';
  var keyword = ((document.getElementById('filterKeyword') || {}).value || '').trim().toLowerCase();
  var sort = (document.getElementById('sortBy') || {}).value || 'newest';

  var filtered = allListingsData.filter(function(listing) {
    if (location && listing.location !== location) return false;
    if (maxRent && listing.monthly_rent > maxRent) return false;
    if (type && listing.type !== type) return false;
    if (bedrooms) {
      var bedroomVal = parseInt(bedrooms, 10);
      if (bedroomVal && listing.bedrooms !== bedroomVal) return false;
    }
    if (furnishing && listing.furnish_status !== furnishing) return false;
    if (keyword) {
      var searchText = [
        listing.title || '',
        listing.description || '',
        listing.address || '',
        getLocationName(listing.location) || '',
        listing.location || '',
        listing.features || '',
        getRentalTypeName(listing.type) || '',
        getFurnishLabel(listing.furnish_status) || ''
      ].join(' ').toLowerCase();
      if (searchText.indexOf(keyword) === -1) return false;
    }
    return true;
  });

  // Sort: rented always last, then by selected sort
  filtered.sort(function(a, b) {
    var aR = isRented(a) ? 1 : 0;
    var bR = isRented(b) ? 1 : 0;
    if (aR !== bR) return aR - bR;
    switch (sort) {
      case 'rent-low': return a.monthly_rent - b.monthly_rent;
      case 'rent-high': return b.monthly_rent - a.monthly_rent;
      case 'newest':
      default:
        return (b.date_listed || '').localeCompare(a.date_listed || '');
    }
  });

  // Render
  container.innerHTML = '';

  if (filtered.length === 0) {
    container.innerHTML = '<div class="no-results"><h3>No rentals found</h3><p>Try adjusting your filters or <a href="listings.html">view all rentals</a>.</p></div>';
  } else {
    filtered.forEach(function(listing) {
      container.appendChild(createPropertyCard(listing));
    });
  }

  if (resultsCount) {
    resultsCount.textContent = filtered.length + ' rental' + (filtered.length === 1 ? '' : 's') + ' found';
  }
}

// ==========================================
// REVIEWS - HELPERS & RENDERING
// ==========================================

var REVIEW_CATEGORY_LABELS = {
  communication: 'Landlord Communication',
  condition: 'Property Condition',
  cleanliness: 'Cleanliness',
  location: 'Location',
  value: 'Value for Money'
};

function calcAverageRating(reviews) {
  if (!reviews || reviews.length === 0) return 0;
  var sum = 0;
  for (var i = 0; i < reviews.length; i++) {
    sum += reviews[i].rating;
  }
  return Math.round((sum / reviews.length) * 10) / 10;
}

function calcCategoryAverage(reviews, category) {
  if (!reviews || reviews.length === 0) return 0;
  var sum = 0;
  var count = 0;
  for (var i = 0; i < reviews.length; i++) {
    if (reviews[i].categories && reviews[i].categories[category]) {
      sum += reviews[i].categories[category];
      count++;
    }
  }
  if (count === 0) return 0;
  return Math.round((sum / count) * 10) / 10;
}

function generateStarsHtml(rating) {
  var html = '';
  var full = Math.floor(rating);
  var half = (rating - full) >= 0.25 && (rating - full) < 0.75 ? 1 : 0;
  if ((rating - full) >= 0.75) { full++; half = 0; }
  var empty = 5 - full - half;
  for (var i = 0; i < full; i++) {
    html += '<span class="review-star full">&#9733;</span>';
  }
  if (half) {
    html += '<span class="review-star half">&#9733;</span>';
  }
  for (var j = 0; j < empty; j++) {
    html += '<span class="review-star empty">&#9733;</span>';
  }
  return html;
}

function generateCardRatingHtml(reviews) {
  if (!reviews || reviews.length === 0) return '';
  var avg = calcAverageRating(reviews);
  return '<div class="card-rating">' +
    '<span class="card-rating-star">&#9733;</span>' +
    '<span class="card-rating-score">' + avg.toFixed(1) + '</span>' +
    '<span class="card-rating-count">(' + reviews.length + ' review' + (reviews.length === 1 ? '' : 's') + ')</span>' +
  '</div>';
}

function formatReviewDate(dateStr) {
  if (!dateStr) return '';
  var parts = dateStr.split('-');
  if (parts.length < 2) return dateStr;
  var months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  var monthIndex = parseInt(parts[1], 10) - 1;
  return months[monthIndex] + ' ' + parts[0];
}

function buildReviewsSection(reviews, listingId, listingTitle) {
  var hasReviews = reviews && reviews.length > 0;
  var avg = calcAverageRating(reviews);

  // Category bars
  var catBarsHtml = '';
  for (var key in REVIEW_CATEGORY_LABELS) {
    if (REVIEW_CATEGORY_LABELS.hasOwnProperty(key)) {
      var catAvg = calcCategoryAverage(reviews, key);
      var fillPct = (catAvg / 5) * 100;
      catBarsHtml +=
        '<div class="review-category-row">' +
          '<span class="review-category-label">' + REVIEW_CATEGORY_LABELS[key] + '</span>' +
          '<div class="review-category-bar-track"><div class="review-category-bar-fill" style="width:' + fillPct + '%"></div></div>' +
          '<span class="review-category-score">' + catAvg.toFixed(1) + '</span>' +
        '</div>';
    }
  }

  // Review cards
  var cardsHtml = '';
  for (var i = 0; i < reviews.length; i++) {
    var r = reviews[i];
    var initial = r.name ? r.name.charAt(0).toUpperCase() : '?';
    var hiddenClass = i >= 3 ? ' review-card-hidden' : '';
    cardsHtml +=
      '<div class="review-card' + hiddenClass + '">' +
        '<div class="review-card-header">' +
          '<div class="review-avatar">' + initial + '</div>' +
          '<div class="review-meta">' +
            '<div class="review-meta-name">' + escapeHtml(r.name) + '</div>' +
            '<div class="review-meta-date">' + formatReviewDate(r.date) + '</div>' +
            (r.duration ? '<div class="review-meta-duration">Stayed ' + escapeHtml(r.duration) + '</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="review-card-stars">' + generateStarsHtml(r.rating) + '</div>' +
        '<div class="review-card-text">' + escapeHtml(r.text) + '</div>' +
      '</div>';
  }

  // Show all button
  var showAllBtn = '';
  if (reviews.length > 3) {
    showAllBtn = '<button class="review-show-all-btn" onclick="showAllReviews(this)">Show all ' + reviews.length + ' reviews</button>';
  }

  // Review form
  var formHtml =
    '<button class="review-form-toggle" onclick="toggleReviewForm()">Write a Review</button>' +
    '<div class="review-form-container" id="reviewFormContainer">' +
      '<h3>Share Your Experience</h3>' +
      '<form id="reviewForm" onsubmit="submitReviewForm(event)">' +
        '<input type="hidden" name="access_key" value="09df7276-a4b9-440c-9342-b4c7971c1dce">' +
        '<input type="hidden" name="subject" value="New Tenant Review: ' + escapeHtml(listingTitle) + ' (' + listingId + ')">' +
        '<input type="hidden" name="from_name" value="CebuRentMarket Review">' +
        '<div class="review-form-row">' +
          '<div class="review-form-group">' +
            '<label>Your Name</label>' +
            '<input type="text" name="reviewer_name" required placeholder="e.g. Juan D.">' +
          '</div>' +
          '<div class="review-form-group">' +
            '<label>How Long Did You Stay?</label>' +
            '<input type="text" name="duration" placeholder="e.g. 6 months">' +
          '</div>' +
        '</div>' +
        '<div class="review-form-group">' +
          '<label>Overall Rating</label>' +
          '<div class="star-selector" id="starSelector">' +
            '<span onclick="setStarRating(1)">&#9733;</span>' +
            '<span onclick="setStarRating(2)">&#9733;</span>' +
            '<span onclick="setStarRating(3)">&#9733;</span>' +
            '<span onclick="setStarRating(4)">&#9733;</span>' +
            '<span onclick="setStarRating(5)">&#9733;</span>' +
          '</div>' +
          '<input type="hidden" name="rating" id="reviewRatingInput" value="">' +
        '</div>' +
        '<div class="review-form-row">' +
          '<div class="review-form-group"><label>Landlord Communication</label><select name="cat_communication"><option value="">Select</option><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Terrible</option></select></div>' +
          '<div class="review-form-group"><label>Property Condition</label><select name="cat_condition"><option value="">Select</option><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Terrible</option></select></div>' +
        '</div>' +
        '<div class="review-form-row">' +
          '<div class="review-form-group"><label>Cleanliness</label><select name="cat_cleanliness"><option value="">Select</option><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Terrible</option></select></div>' +
          '<div class="review-form-group"><label>Location</label><select name="cat_location"><option value="">Select</option><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Terrible</option></select></div>' +
        '</div>' +
        '<div class="review-form-group"><label>Value for Money</label><select name="cat_value"><option value="">Select</option><option value="5">5 - Excellent</option><option value="4">4 - Good</option><option value="3">3 - Average</option><option value="2">2 - Poor</option><option value="1">1 - Terrible</option></select></div>' +
        '<div class="review-form-group">' +
          '<label>Your Review</label>' +
          '<textarea name="review_text" required placeholder="Tell us about your experience living here..."></textarea>' +
        '</div>' +
        '<button type="submit" class="review-submit-btn">Submit Review</button>' +
      '</form>' +
    '</div>';

  var summaryHtml = '';
  if (hasReviews) {
    summaryHtml =
      '<div class="review-summary">' +
        '<div class="review-score-block">' +
          '<div class="review-big-number">' + avg.toFixed(1) + '</div>' +
          '<div class="review-big-stars">' + generateStarsHtml(avg) + '</div>' +
          '<div class="review-count-label">' + reviews.length + ' review' + (reviews.length === 1 ? '' : 's') + '</div>' +
        '</div>' +
        '<div class="review-categories">' + catBarsHtml + '</div>' +
      '</div>' +
      '<div class="review-cards">' + cardsHtml + '</div>' +
      showAllBtn;
  } else {
    summaryHtml = '<p style="color:var(--gray-500); margin-bottom:16px;">No reviews yet. Be the first to share your experience!</p>';
  }

  return '<div class="detail-reviews">' +
    '<h2>Tenant Reviews</h2>' +
    summaryHtml +
    formHtml +
  '</div>';
}

function showAllReviews(btn) {
  var hidden = document.querySelectorAll('.review-card-hidden');
  for (var i = 0; i < hidden.length; i++) {
    hidden[i].classList.remove('review-card-hidden');
  }
  btn.style.display = 'none';
}

function toggleReviewForm() {
  var container = document.getElementById('reviewFormContainer');
  if (container) {
    container.classList.toggle('show');
  }
}

var selectedStarRating = 0;
function setStarRating(val) {
  selectedStarRating = val;
  var input = document.getElementById('reviewRatingInput');
  if (input) input.value = val;
  var stars = document.querySelectorAll('#starSelector span');
  for (var i = 0; i < stars.length; i++) {
    stars[i].classList.toggle('selected', i < val);
  }
}

function submitReviewForm(e) {
  e.preventDefault();
  var form = document.getElementById('reviewForm');
  if (!form) return;

  if (!selectedStarRating) {
    alert('Please select an overall rating.');
    return;
  }

  var btn = form.querySelector('.review-submit-btn');
  btn.textContent = 'Sending...';
  btn.disabled = true;

  fetch('https://api.web3forms.com/submit', {
    method: 'POST',
    body: new FormData(form)
  }).then(function(res) {
    return res.json();
  }).then(function(data) {
    form.innerHTML = '<p style="text-align:center; padding:20px; color:var(--primary); font-weight:600;">Thank you for your review! It will appear after our team verifies it.</p>';
  }).catch(function() {
    form.innerHTML = '<p style="text-align:center; padding:20px; color:var(--primary); font-weight:600;">Thank you! Your review has been submitted for approval.</p>';
  });
}

// ==========================================
// PAGE: PROPERTY DETAIL
// ==========================================

function renderPropertyDetail() {
  var container = document.getElementById('propertyContent');
  if (!container) return;

  var propertyId = getUrlParam('id');
  if (!propertyId) {
    container.innerHTML = '<div class="no-results"><h3>Rental not found</h3><p><a href="listings.html">Browse all rentals</a></p></div>';
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
      container.innerHTML = '<div class="no-results"><h3>Rental not found</h3><p>This listing may have been removed. <a href="listings.html">Browse all rentals</a></p></div>';
      return;
    }

    // Store for share-card.js
    currentListing = listing;

    // Update page title and breadcrumb
    document.title = listing.title + ' | ' + formatRent(listing.monthly_rent) + ' — CebuRentMarket';
    var breadcrumb = document.getElementById('breadcrumbTitle');
    if (breadcrumb) breadcrumb.textContent = listing.title;

    // Update Open Graph meta tags for Facebook sharing
    var baseUrl = 'https://cebulandmarket.com/rentals/';
    var ogTitle = document.getElementById('ogTitle');
    var ogDesc = document.getElementById('ogDesc');
    var ogImage = document.getElementById('ogImage');
    var ogUrl = document.getElementById('ogUrl');
    if (ogTitle) ogTitle.setAttribute('content', listing.title + ' - ' + formatRent(listing.monthly_rent));
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
    if (twTitle) twTitle.setAttribute('content', listing.title + ' - ' + formatRent(listing.monthly_rent));
    if (twDesc) twDesc.setAttribute('content', listing.description.substring(0, 200) + '...');
    if (twImage) twImage.setAttribute('content', baseUrl + (listing.photo_url || ''));

    // Inject RealEstateListing JSON-LD with rental price
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
        "price": listing.monthly_rent,
        "priceCurrency": "PHP",
        "priceSpecification": {
          "@type": "UnitPriceSpecification",
          "price": listing.monthly_rent,
          "priceCurrency": "PHP",
          "unitText": "MONTH"
        }
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

    // Rented status
    var rented = isRented(listing);
    var rentedBannerHtml = rented ? '<div class="detail-rented-banner"><span class="rented-banner-icon">&#10003;</span> This property has been rented' + (listing.rented_date ? ' — ' + escapeHtml(listing.rented_date) : '') + '</div>' : '';

    // Contact buttons — all inquiries go to CebuRentMarket (middleman)
    var contactHtml = '';
    if (rented) {
      contactHtml = '<div class="rented-notice"><p>This property is no longer available for rent.</p><a href="listings.html" class="btn btn-primary" style="display:block;text-align:center;margin-top:12px;">Browse Available Rentals</a></div>';
    } else {
      contactHtml += '<a href="https://m.me/61587469756965" target="_blank" class="contact-btn messenger">&#128172; Message us on Messenger</a>';
      contactHtml += '<a href="https://wa.me/639687512330?text=' + encodeURIComponent('Hi, I\'m interested in renting: ' + listing.title) + '" target="_blank" class="contact-btn whatsapp">&#128172; WhatsApp us</a>';
      contactHtml += '<a href="viber://chat?number=639687512330" class="contact-btn viber">&#128222; Chat on Viber</a>';
      contactHtml += '<a href="mailto:info@cebulandmarket.com?subject=' + encodeURIComponent('Rental Inquiry: ' + listing.title) + '" class="contact-btn phone">&#9993; Email us</a>';
    }

    // Build rental info items
    var rentalInfoHtml = '';
    rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#127968;</span><span class="info-label">Property Type</span><span class="info-value">' + escapeHtml(getRentalTypeName(listing.type)) + '</span></div>';
    rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#128205;</span><span class="info-label">Location</span><span class="info-value">' + escapeHtml(getLocationName(listing.location)) + ', Cebu</span></div>';

    if (listing.bedrooms) {
      rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#128716;</span><span class="info-label">Bedrooms</span><span class="info-value">' + listing.bedrooms + '</span></div>';
    }
    if (listing.bathrooms) {
      rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#128704;</span><span class="info-label">Bathrooms</span><span class="info-value">' + listing.bathrooms + '</span></div>';
    }
    if (listing.furnish_status) {
      rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#128722;</span><span class="info-label">Furnishing</span><span class="info-value">' + escapeHtml(getFurnishLabel(listing.furnish_status)) + '</span></div>';
    }
    if (listing.floor_area) {
      rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#127970;</span><span class="info-label">Floor Area</span><span class="info-value">' + formatNumber(listing.floor_area) + ' sqm</span></div>';
    }
    if (listing.lease_term) {
      rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#128197;</span><span class="info-label">Lease Term</span><span class="info-value">' + escapeHtml(listing.lease_term) + '</span></div>';
    }
    if (listing.deposit) {
      rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#128176;</span><span class="info-label">Deposit</span><span class="info-value">' + escapeHtml(listing.deposit) + '</span></div>';
    }
    if (listing.availability) {
      rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#128197;</span><span class="info-label">Available</span><span class="info-value">' + escapeHtml(listing.availability) + '</span></div>';
    }
    if (typeof listing.parking !== 'undefined') {
      rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#128663;</span><span class="info-label">Parking</span><span class="info-value">' + (listing.parking ? 'Yes' : 'No') + '</span></div>';
    }
    if (typeof listing.pets !== 'undefined') {
      rentalInfoHtml += '<div class="info-item"><span class="info-icon">&#128054;</span><span class="info-label">Pets Allowed</span><span class="info-value">' + (listing.pets ? 'Yes' : 'No') + '</span></div>';
    }

    // Trust score section
    var trustHtml = '';
    if (listing.verification) {
      var score = calcTrustScore(listing.verification);
      var color = trustScoreColor(score);
      trustHtml = '<div class="detail-card trust-card">' +
        '<h2>CRM Trust Score</h2>' +
        '<div class="trust-score-display">' +
          '<div class="trust-score-circle trust-' + color + '">' + score + '%</div>' +
          '<p class="trust-score-label">' + (score >= 75 ? 'High Trust' : score >= 50 ? 'Moderate Trust' : score >= 25 ? 'Low Trust' : 'Unverified') + '</p>' +
        '</div>' +
        '<div class="trust-checks">';
      var checks = listing.verification.checks || {};
      for (var key in TRUST_CHECK_LABELS) {
        if (TRUST_CHECK_LABELS.hasOwnProperty(key)) {
          var passed = checks[key] || false;
          trustHtml += '<div class="trust-check-item">' +
            '<span class="trust-check-icon">' + (passed ? '&#10003;' : '&#10007;') + '</span>' +
            '<span class="trust-check-label">' + TRUST_CHECK_LABELS[key] + '</span>' +
          '</div>';
        }
      }
      trustHtml += '</div>';
      if (listing.verification.verified_date) {
        trustHtml += '<p class="trust-date">Verified: ' + escapeHtml(listing.verification.verified_date) + '</p>';
      }
      trustHtml += '</div>';
    }

    // Render full detail page
    container.innerHTML =
      rentedBannerHtml +
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
          buildReviewsSection(listing.reviews, listing.id, listing.title) +
          (listing.map_url ? '<div class="detail-map mt-2"><h2>Property Location</h2><div class="map-container"><iframe src="https://maps.google.com/maps?q=' + encodeURIComponent(listing.map_url) + '&output=embed" frameborder="0" allowfullscreen style="width:100%;height:100%;border-radius:8px;"></iframe></div></div>' : '') +
        '</div>' +
        '<div class="detail-sidebar">' +
          '<div class="detail-card">' +
            '<div class="price-tag">' + formatRent(listing.monthly_rent) + '</div>' +
            '<div class="detail-verified-badge"><div class="badge-icon">&#10003;</div><div><div class="badge-text">Rental Verified</div><div class="badge-sub">Property &amp; lease terms reviewed by our team — not a legal guarantee</div></div></div>' +
            '<div class="detail-info">' +
              rentalInfoHtml +
            '</div>' +
          '</div>' +
          '<div class="detail-card">' +
            '<h2>' + (rented ? 'Property Rented' : 'Inquire About This Rental') + '</h2>' +
            (rented ? '' : '<p style="font-size:0.85rem; color:var(--gray-500); margin-bottom:12px;">Inquiries are forwarded to the property owner. Tenant and owner deal directly.</p>') +
            '<div class="contact-buttons">' + contactHtml + '</div>' +
          '</div>' +
          '<div class="detail-card" style="background:linear-gradient(135deg, #f3e5f5 0%, #ede7f6 100%); border:2px solid #7B1FA2;">' +
            '<h2 style="color:#7B1FA2;">View Property Story</h2>' +
            '<p style="font-size:0.9rem; color:var(--gray-600); margin-bottom:12px;">See the owner\'s story and details about this rental on its own dedicated page.</p>' +
            '<a href="share.html?id=' + listing.id + '" style="display:block; text-align:center; padding:12px; background:#7B1FA2; color:#fff; border-radius:8px; text-decoration:none; font-weight:600;">View Property Story</a>' +
          '</div>' +
          trustHtml +
          '<div class="detail-card share-card">' +
            '<h2>Share This Rental</h2>' +
            '<div class="share-buttons">' +
              '<a href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(baseUrl + 'property.html?id=' + listing.id) + '" target="_blank" class="share-btn share-fb">&#128266; Share on Facebook</a>' +
              '<a href="#" onclick="navigator.clipboard.writeText(\'' + baseUrl + 'property.html?id=' + listing.id + '\');this.textContent=\'Link Copied!\';return false;" class="share-btn share-copy">&#128279; Copy Link</a>' +
              '<a href="#" onclick="if(typeof generateShareCard===\'function\'&&currentListing)generateShareCard(currentListing);return false;" class="share-btn share-copy">&#128247; Download Share Card</a>' +
              '<a href="#" onclick="window.print();return false;" class="share-btn share-copy">&#128424; Print Listing</a>' +
            '</div>' +
          '</div>' +
          '<div class="detail-card" style="background:var(--gray-100);">' +
            '<p style="font-size:0.85rem; color:var(--gray-500);"><strong>Disclaimer:</strong> CebuRentMarket is a listing platform only. Always verify rental details and lease terms before signing any agreements.</p>' +
          '</div>' +
        '</div>' +
      '</div>';

    // Update mobile sticky bar WhatsApp link with listing title
    var stickyWa = document.getElementById('stickyWhatsapp');
    if (stickyWa) {
      stickyWa.href = 'https://wa.me/639687512330?text=' + encodeURIComponent('Hi, I\'m interested in renting: ' + listing.title);
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
    var rent = document.getElementById('searchRent').value;
    var type = document.getElementById('searchType').value;
    var keyword = (document.getElementById('searchKeyword') || {}).value || '';

    var params = [];
    if (location) params.push('location=' + encodeURIComponent(location));
    if (rent) params.push('rent=' + encodeURIComponent(rent));
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