/**
 * CebuLandMarket - Form Submission Handler
 * Friendly validation + Formspree integration
 */

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

  // Auto-calculate total price
  var lotAreaInput = form.querySelector('[name="lot_area"]');
  var pricePerSqmInput = form.querySelector('[name="price_per_sqm"]');
  var ownerPriceInput = document.getElementById('ownerPrice');

  function autoCalcTotal() {
    if (lotAreaInput && pricePerSqmInput && ownerPriceInput) {
      var area = parseFloat(lotAreaInput.value) || 0;
      var pps = parseFloat(pricePerSqmInput.value) || 0;
      if (area > 0 && pps > 0 && !ownerPriceInput.value) {
        ownerPriceInput.value = Math.round(area * pps);
      }
    }
  }

  if (lotAreaInput) lotAreaInput.addEventListener('input', autoCalcTotal);
  if (pricePerSqmInput) pricePerSqmInput.addEventListener('input', autoCalcTotal);

  // Show 1% platform fee preview
  var feePreview = document.getElementById('feePreview');
  var feeAmount = document.getElementById('feeAmount');
  function showFeePreview() {
    if (ownerPriceInput && feePreview && feeAmount) {
      var price = parseFloat(ownerPriceInput.value) || 0;
      if (price > 0) {
        var withFee = Math.round(price * 1.01);
        feeAmount.textContent = '₱' + withFee.toLocaleString();
        feePreview.style.display = 'block';
      } else {
        feePreview.style.display = 'none';
      }
    }
  }
  if (ownerPriceInput) ownerPriceInput.addEventListener('input', showFeePreview);

  // ==========================================
  // FRIENDLY VALIDATION
  // ==========================================

  // Friendly messages for each field
  var fieldMessages = {
    'owner_name': 'Please enter your full name so we know who to contact.',
    'contact_number': 'Please enter your phone number (e.g. 09XX XXX XXXX).',
    'email': 'Please enter a valid email address so we can send you updates.',
    'property_title': 'Give your property a short title (e.g. "500 sqm Lot in Talisay").',
    'property_type': 'Please select what type of property you are listing.',
    'location': 'Please select the municipality where your property is located.',
    'lot_area': 'Please enter the lot area in square meters.',
    'total_price': 'Please enter your asking price in pesos.',
    'title_status': 'Please select the status of your property title.',
    'documents_available': 'Please select what documents you currently have.',
    'ownership_status': 'Please let us know if the property is under your name.',
    'tax_status': 'Please let us know if your real property taxes are updated.',
    'property_issues': 'Please let us know if there are any issues with the property.',
    'document_links': 'Please share links to your property documents so we can verify them.',
    'description': 'Please add a short description of your property.'
  };

  // Show friendly message next to a field
  function showFieldMessage(field, message) {
    clearFieldMessage(field);
    var msg = document.createElement('p');
    msg.className = 'field-message';
    msg.textContent = message;
    field.parentElement.appendChild(msg);
    field.classList.add('field-error');
    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Clear message from a field
  function clearFieldMessage(field) {
    field.classList.remove('field-error');
    var existing = field.parentElement.querySelector('.field-message');
    if (existing) existing.remove();
  }

  // Clear message when user starts typing/selecting
  form.querySelectorAll('input, select, textarea').forEach(function(field) {
    field.addEventListener('input', function() {
      clearFieldMessage(field);
    });
    field.addEventListener('change', function() {
      clearFieldMessage(field);
    });
  });

  // Validate email format
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Validate phone format (basic - just check it has digits)
  function isValidPhone(phone) {
    var digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
  }

  // Run validation before submit
  function validateForm() {
    var requiredFields = form.querySelectorAll('[required]');
    var firstError = null;
    var errorCount = 0;

    // Clear all previous messages
    form.querySelectorAll('.field-message').forEach(function(m) { m.remove(); });
    form.querySelectorAll('.field-error').forEach(function(f) { f.classList.remove('field-error'); });
    var oldSummary = document.getElementById('validationSummary');
    if (oldSummary) oldSummary.remove();

    for (var i = 0; i < requiredFields.length; i++) {
      var field = requiredFields[i];
      var name = field.getAttribute('name');
      var value = field.value.trim();

      // Check if empty
      if (!value) {
        var message = fieldMessages[name] || 'This field is required.';
        showFieldMessage(field, message);
        if (!firstError) firstError = field;
        errorCount++;
        continue;
      }

      // Check email format
      if (field.type === 'email' && !isValidEmail(value)) {
        showFieldMessage(field, 'This doesn\'t look like a valid email. Please check and try again (e.g. yourname@gmail.com).');
        if (!firstError) firstError = field;
        errorCount++;
        continue;
      }

      // Check phone format
      if (field.type === 'tel' && !isValidPhone(value)) {
        showFieldMessage(field, 'Please enter a valid phone number with at least 10 digits (e.g. 09XX XXX XXXX).');
        if (!firstError) firstError = field;
        errorCount++;
        continue;
      }
    }

    if (firstError) {
      // Show summary at top of form
      var summary = document.createElement('div');
      summary.id = 'validationSummary';
      summary.style.cssText = 'background:#e74c3c; color:#fff; padding:14px 20px; border-radius:8px; margin-bottom:20px; font-size:0.95rem; font-weight:600;';
      summary.textContent = 'Please fill in ' + errorCount + ' required field' + (errorCount > 1 ? 's' : '') + ' highlighted in red below.';
      form.insertBefore(summary, form.firstChild);

      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }

    return true;
  }

  // ==========================================
  // FORM SUBMISSION
  // ==========================================
  form.addEventListener('submit', function(e) {
    e.preventDefault();

    // Validate first
    if (!validateForm()) return;

    var submitBtn = form.querySelector('button[type="submit"]');
    var originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;

    var refId = generateRefId();

    // Collect form data
    var formData = new FormData(form);
    formData.append('reference_id', refId);
    formData.append('submission_date', new Date().toISOString());

    // Check if Formspree is configured
    var action = form.getAttribute('action');
    if (action && action.indexOf('YOUR_FORM_ID') === -1) {
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
