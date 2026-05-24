/* CebuVehicleMarket - Listings Rendering */

var currentFilter = 'all';

function renderListings(filter) {
  filter = filter || 'all';
  var grid = document.getElementById('listings-grid');
  if (!grid) return;

  var vehicles = getActiveVehicles();
  if (filter !== 'all') {
    vehicles = vehicles.filter(function(v) { return v.type === filter; });
  }

  if (vehicles.length === 0) {
    grid.innerHTML = '<div class="empty"><h3>No vehicles listed yet</h3><p>Be the first to list a vehicle in this category. <a href="submit.html">List your vehicle →</a></p></div>';
    return;
  }

  var html = '';
  vehicles.forEach(function(v) {
    var img = v.photo_url || 'images/placeholder-vehicle.jpg';
    var sold = v.status === 'sold';
    var displayPrice = formatPrice(applyFee(v.price));
    var typeLabel = (v.type || 'car').toUpperCase();

    html += '<a class="card" href="vehicle.html?id=' + esc(v.id) + '">';
    html += '  <div class="card-image">';
    html += '    <img src="' + esc(img) + '" alt="' + esc(v.title) + '" loading="lazy">';
    html += sold
      ? '    <span class="badge sold">Sold</span>'
      : '    <span class="badge">' + esc(typeLabel) + '</span>';
    html += '  </div>';
    html += '  <div class="card-body">';
    html += '    <div class="card-title">' + esc(v.title) + '</div>';
    html += '    <div class="card-meta">';
    if (v.year) html += '<span>📅 ' + esc(v.year) + '</span>';
    if (v.mileage_km) html += '<span>🛣️ ' + formatNumber(v.mileage_km) + ' km</span>';
    if (v.transmission) html += '<span>⚙️ ' + esc(v.transmission) + '</span>';
    html += '    </div>';
    html += '    <div class="card-price">' + displayPrice + '</div>';
    if (v.location) html += '    <div class="card-loc">📍 ' + esc(v.location) + '</div>';
    html += '  </div>';
    html += '</a>';
  });
  grid.innerHTML = html;
}

function setupFilters() {
  var buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      buttons.forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.getAttribute('data-filter') || 'all';
      renderListings(currentFilter);
    });
  });
}

function renderVehicleDetail() {
  var container = document.getElementById('vehicle-detail');
  if (!container) return;

  var id = getQueryParam('id');
  var v = getVehicleById(id);

  if (!v) {
    container.innerHTML = '<div class="empty"><h3>Vehicle not found</h3><p><a href="index.html">← Back to listings</a></p></div>';
    return;
  }

  var img = v.photo_url || 'images/placeholder-vehicle.jpg';
  var sold = v.status === 'sold';
  var displayPrice = formatPrice(applyFee(v.price));

  document.title = v.title + ' — CebuVehicleMarket';

  var html = '';
  html += '<a class="detail-back" href="index.html">← Back to listings</a>';
  html += '<div class="detail-hero">';
  html += '  <div class="detail-image"><img src="' + esc(img) + '" alt="' + esc(v.title) + '"></div>';
  html += '  <div class="detail-body">';
  html += '    <h1 class="detail-title">' + esc(v.title) + '</h1>';
  if (v.location) html += '    <div class="detail-loc">📍 ' + esc(v.location) + '</div>';
  html += '    <div class="detail-price">' + displayPrice + (sold ? ' <span style="font-size:1rem;color:var(--danger);">· SOLD</span>' : '') + '</div>';

  html += '    <div class="specs">';
  if (v.year) html += '<div class="spec-item"><div class="label">Year</div><div class="value">' + esc(v.year) + '</div></div>';
  if (v.brand) html += '<div class="spec-item"><div class="label">Brand</div><div class="value">' + esc(v.brand) + '</div></div>';
  if (v.transmission) html += '<div class="spec-item"><div class="label">Transmission</div><div class="value">' + esc(v.transmission) + '</div></div>';
  if (v.fuel) html += '<div class="spec-item"><div class="label">Fuel</div><div class="value">' + esc(v.fuel) + '</div></div>';
  if (v.mileage_km) html += '<div class="spec-item"><div class="label">Mileage</div><div class="value">' + formatNumber(v.mileage_km) + ' km</div></div>';
  if (v.color) html += '<div class="spec-item"><div class="label">Color</div><div class="value">' + esc(v.color) + '</div></div>';
  html += '    </div>';

  if (v.description) {
    html += '    <div class="detail-section"><h3>Description</h3><p>' + esc(v.description) + '</p></div>';
  }

  if (v.features) {
    var feats = v.features.split(',').map(function(f) { return f.trim(); }).filter(Boolean);
    html += '    <div class="detail-section"><h3>Features</h3><ul class="features-list">';
    feats.forEach(function(f) { html += '<li>✓ ' + esc(f) + '</li>'; });
    html += '    </ul></div>';
  }

  if (v.verification && v.verification.code) {
    html += '    <div class="detail-section"><h3>Verification</h3>';
    html += '<p>This listing has been verified by CebuVehicleMarket. Verification code: <strong>' + esc(v.verification.code) + '</strong></p></div>';
  }

  if (!sold) {
    html += '    <div class="contact-bar">';
    if (v.messenger) html += '<a class="btn btn-primary" href="' + esc(v.messenger) + '" target="_blank" rel="noopener">💬 Messenger</a>';
    if (v.phone) html += '<a class="btn btn-secondary" style="background:var(--primary);color:white;" href="tel:' + esc(v.phone) + '">📞 Call</a>';
    if (v.viber) html += '<a class="btn btn-secondary" style="background:#7360f2;color:white;" href="viber://chat?number=' + esc(v.viber) + '">Viber</a>';
    if (v.whatsapp) html += '<a class="btn btn-secondary" style="background:#25d366;color:white;" href="https://wa.me/' + esc(v.whatsapp) + '">WhatsApp</a>';
    html += '    </div>';
  }

  html += '  </div>';
  html += '</div>';

  container.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', function() {
  renderListings(currentFilter);
  setupFilters();
  renderVehicleDetail();
});
