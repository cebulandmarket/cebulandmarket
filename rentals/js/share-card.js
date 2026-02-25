/**
 * CebuRentMarket - Share Card Generator
 * Creates 1080x1080 downloadable JPG images for rental listings.
 */

function generateShareCard(listing) {
  if (!listing) return;

  var canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1080;
  var ctx = canvas.getContext('2d');

  // No platform fee for rentals — price is displayed as-is

  function formatRent(n) {
    return '\u20B1' + Number(n).toLocaleString() + '/mo';
  }

  function getLocationName(loc) {
    if (!loc) return '';
    return loc.split('-').map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ');
  }

  var price = formatRent(listing.monthly_rent);
  var location = getLocationName(listing.location) + ', Cebu';
  var area = listing.floor_area ? listing.floor_area.toLocaleString() + ' sqm' : '';
  var title = listing.title || 'Property for Rent';

  // Load the property photo
  var img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = function() {
    drawCard(ctx, img, title, price, location, area, listing);
    downloadCanvas(canvas, 'CebuRentMarket-' + (listing.id || 'property') + '.jpg');
  };
  img.onerror = function() {
    // Draw without photo
    ctx.fillStyle = '#e8e8e8';
    ctx.fillRect(0, 0, 1080, 648);
    ctx.fillStyle = '#999';
    ctx.font = '600 32px -apple-system, BlinkMacSystemFont, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Photo not available', 540, 340);
    drawBottom(ctx, title, price, location, area);
    downloadCanvas(canvas, 'CebuRentMarket-' + (listing.id || 'property') + '.jpg');
  };

  var photoUrl = listing.photo_url || '';
  if (photoUrl && !photoUrl.startsWith('http')) {
    photoUrl = window.location.origin + '/' + photoUrl;
  }
  img.src = photoUrl;
}

function drawCard(ctx, img, title, price, location, area, listing) {
  // Draw photo in top 60%
  var photoHeight = 648;
  var scale = Math.max(1080 / img.width, photoHeight / img.height);
  var w = img.width * scale;
  var h = img.height * scale;
  var x = (1080 - w) / 2;
  var y = (photoHeight - h) / 2;
  ctx.drawImage(img, x, y, w, h);

  // Gradient overlay on photo
  var gradient = ctx.createLinearGradient(0, photoHeight - 200, 0, photoHeight);
  gradient.addColorStop(0, 'rgba(0,0,0,0)');
  gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, photoHeight - 200, 1080, 200);

  // Price on photo
  ctx.fillStyle = '#fff';
  ctx.font = '800 56px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(price, 48, photoHeight - 40);

  drawBottom(ctx, title, price, location, area);
}

function drawBottom(ctx, title, price, location, area) {
  var photoHeight = 648;

  // Bottom section background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, photoHeight, 1080, 432);

  // Title (with word wrap)
  ctx.fillStyle = '#fff';
  ctx.font = '700 36px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  var words = title.split(' ');
  var lines = [];
  var currentLine = '';
  var maxWidth = 984;
  for (var i = 0; i < words.length; i++) {
    var testLine = currentLine ? currentLine + ' ' + words[i] : words[i];
    if (ctx.measureText(testLine).width > maxWidth) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  // Max 3 lines
  if (lines.length > 3) {
    lines = lines.slice(0, 3);
    lines[2] = lines[2].substring(0, lines[2].length - 3) + '...';
  }
  var titleY = photoHeight + 56;
  for (var j = 0; j < lines.length; j++) {
    ctx.fillText(lines[j], 48, titleY + j * 44);
  }

  // Location and area
  var infoY = titleY + lines.length * 44 + 16;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.font = '500 28px -apple-system, BlinkMacSystemFont, sans-serif';
  var infoText = location;
  if (area) infoText += '  |  ' + area;
  ctx.fillText(infoText, 48, infoY);

  // Branding bar at bottom
  var brandY = 1080 - 72;
  ctx.fillStyle = '#7B1FA2';
  ctx.fillRect(0, brandY, 1080, 72);

  // Logo text
  ctx.fillStyle = '#fff';
  ctx.font = '700 28px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CebuRentMarket', 48, brandY + 46);

  // URL
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.font = '500 24px -apple-system, BlinkMacSystemFont, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('cebulandmarket.com/rentals', 1032, brandY + 46);
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob(function(blob) {
    if (!blob) return;
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function() { URL.revokeObjectURL(url); }, 100);
  }, 'image/jpeg', 0.92);
}
