/**
 * CebuLandMarket - Form Submission Handler
 * Handles the property submission form with Formspree integration.
 * Includes live 1% service fee preview calculator.
 */

// 1% service fee rate (must match listings.js)
var SERVICE_FEE_RATE = 0.01;

function formatPeso(num) {
  if (!num || isNaN(num)) return '₱0';
  return '₱' + Number(num).toLocaleString('en-PH');
}

document.addEventListener('DOMContentLoaded', function() {
  var form = document.getElementById('submitForm');
  var formCard = document.getElementById('formCard');
  var formSuccess = document.getElementById('formSuccess');
  var refIdEl = document.getElementById('refId');

  if (!form) return;

  // Generate reference ID
  function generateRefId() {
    var timestamp = Date.now().toString(36).toUpperCase();
    var random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return 'CLM-' + timestamp + '-' + random;
  }

  // ==========================================
  // LIVE PRICE PREVIEW (with 1% fee)
  // ==========================================
  var lotAreaInput = form.querySelector('[name="lot_area"]');
  var pricePerSqmInput = form.querySelector('[name="price_per_sqm"]');
  var ownerPriceInput = document.getElementById('ownerPrice');
  var pricePreview = document.getElementById('pricePreview');
  var prevOwner = document.getElementById('prevOwner');
  var prevFee = document.getElementById('prevFee');
  var prevTotal = document.getElementById('prevTotal');

  function updatePricePreview() {
    var area = parseFloat(lotAreaInput ? lotAreaInput.value : 0) || 0;
    var pps = parseFloat(pricePerSqmInput ? pricePerSqmInput.value : 0) || 0;
    var ownerPrice = parseFloat(ownerPriceInput ? ownerPriceInput.value : 0) || 0;

    // Auto-fill total price from area x price_per_sqm if total is empty
    if (area > 0 && pps > 0 && !ownerPriceInput.value) {
      ownerPrice = Math.round(area * pps);
      ownerPriceInput.value = ownerPrice;
    }

    // Show/hide preview
    if (ownerPrice > 0 && pricePreview) {
      var fee = Math.round(ownerPrice * SERVICE_FEE_RATE);
      var total = ownerPrice + fee;

      prevOwner.textContent = formatPeso(ownerPrice);
      prevFee.textContent = formatPeso(fee);
      prevTotal.textContent = formatPeso(total);
      pricePreview.style.display = 'block';
    } else if (pricePreview) {
      pricePreview.style.display = 'none';
    }
  }

  // Listen to all price-related inputs
  if (lotAreaInput) lotAreaInput.addEventListener('input', updatePricePreview);
  if (pricePerSqmInput) pricePerSqmInput.addEventListener('input', updatePricePreview);
  if (ownerPriceInput) ownerPriceInput.addEventListener('input', updatePricePreview);

  // ==========================================
  // FORM SUBMISSION
  // ==========================================
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    var submitBtn = form.querySelector('button[type="submit"]');
    var originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    var refId = generateRefId();

    // Collect form data
    var formData = new FormData(form);
    formData.append('reference_id', refId);
    formData.append('submission_date', new Date().toISOString());

    // Add the calculated buyer price for admin reference
    var ownerPrice = parseFloat(ownerPriceInput ? ownerPriceInput.value : 0) || 0;
    var fee = Math.round(ownerPrice * SERVICE_FEE_RATE);
    formData.append('service_fee_1pct', fee);
    formData.append('buyer_total_price', ownerPrice + fee);

    // Check if Formspree is configured
    var action = form.getAttribute('action');
    if (action && action.indexOf('YOUR_FORM_ID') === -1) {
      // Send to Formspree
      fetch(action, {
        method: 'POST',
        body: formData,
        headers: { 'Accept': 'application/json' }
      })
      .then(function(response) {
        if (response.ok) {
          showSuccess(refId);
        } else {
          throw new Error('Form submission failed');
        }
      })
      .catch(function(error) {
        console.error('Submission error:', error);
        showSuccess(refId);
        alert('Note: The form may not have been sent via email. Please take a screenshot of your Reference ID and send it to us directly via Messenger or email.');
      })
      .finally(function() {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      });
    } else {
      // Formspree not configured - simulate success
      console.log('Formspree not configured. Form data:', Object.fromEntries(formData));
      setTimeout(function() {
        showSuccess(refId);
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 1000);
    }
  });

  function showSuccess(refId) {
    form.style.display = 'none';
    if (pricePreview) pricePreview.style.display = 'none';
    if (formSuccess) {
      formSuccess.classList.add('show');
    }
    if (refIdEl) {
      refIdEl.textContent = refId;
    }
    if (formCard) {
      formCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }
});
