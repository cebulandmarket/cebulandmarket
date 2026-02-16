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

  // ==========================================
  // AUTO-SAVE: Save form data so it's never lost
  // ==========================================
  var SAVE_KEY = 'clm_form_draft';

  // Restore saved data when page loads
  function restoreForm() {
    try {
      var saved = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!saved) return;
      var fields = form.querySelectorAll('input, select, textarea');
      var hasData = false;
      for (var i = 0; i < fields.length; i++) {
        var name = fields[i].getAttribute('name');
        if (name && saved[name]) {
          fields[i].value = saved[name];
          hasData = true;
        }
      }
      if (hasData) {
        // Show step 2 since they were already filling the form
        var step1 = document.getElementById('step1');
        var step2 = document.getElementById('step2');
        if (step1 && step2) {
          step1.style.display = 'none';
          step2.style.display = 'block';
        }
        // Show a friendly restore message
        var restoreMsg = document.createElement('div');
        restoreMsg.style.cssText = 'background:#2e7d32; color:#fff; padding:12px 20px; border-radius:8px; margin-bottom:16px; font-size:0.9rem;';
        restoreMsg.innerHTML = '<strong>Your previous form data has been restored.</strong> Continue where you left off.';
        form.insertBefore(restoreMsg, form.firstChild);
        setTimeout(function() { restoreMsg.remove(); }, 8000);
      }
    } catch(e) {}
  }

  // Save form data on every change
  function saveForm() {
    try {
      var fields = form.querySelectorAll('input, select, textarea');
      var data = {};
      for (var i = 0; i < fields.length; i++) {
        var name = fields[i].getAttribute('name');
        if (name && fields[i].value) {
          data[name] = fields[i].value;
        }
      }
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch(e) {}
  }

  // Clear saved data after successful submission
  function clearSavedForm() {
    try { localStorage.removeItem(SAVE_KEY); } catch(e) {}
  }

  // Listen for changes and save
  form.addEventListener('input', saveForm);
  form.addEventListener('change', saveForm);

  // Restore on page load
  restoreForm();

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

  // Show 1% platform fee preview based on fee option selected
  var feePreview = document.getElementById('feePreview');
  var feeAmount = document.getElementById('feeAmount');
  var feeLabel = document.getElementById('feeLabel');
  var feeExplanation = document.getElementById('feeExplanation');
  var feeRadios = form.querySelectorAll('input[name="fee_option"]');

  function showFeePreview() {
    if (!ownerPriceInput || !feePreview || !feeAmount) return;
    var price = parseFloat(ownerPriceInput.value) || 0;
    var selectedOption = form.querySelector('input[name="fee_option"]:checked');

    if (price > 0 && selectedOption) {
      if (selectedOption.value === 'add_on_top') {
        var withFee = Math.round(price * 1.01);
        feeLabel.textContent = 'Listing price (with 1% added):';
        feeAmount.textContent = '₱' + withFee.toLocaleString();
        feeExplanation.textContent = 'Buyers will see ₱' + withFee.toLocaleString() + ' on the listing. You receive your full ₱' + price.toLocaleString() + '.';
        feeExplanation.style.display = 'block';
      } else {
        var yourShare = Math.round(price / 1.01);
        var fee = price - yourShare;
        feeLabel.textContent = 'Listing price (1% included):';
        feeAmount.textContent = '₱' + price.toLocaleString();
        feeExplanation.textContent = 'Listing shows ₱' + price.toLocaleString() + '. Upon sale, you remit ₱' + fee.toLocaleString() + ' (1%) to CebuLandMarket.';
        feeExplanation.style.display = 'block';
      }
      feePreview.style.display = 'block';
    } else if (price > 0) {
      // Price entered but no option selected yet
      feePreview.style.display = 'none';
      feeExplanation.style.display = 'none';
    } else {
      feePreview.style.display = 'none';
      feeExplanation.style.display = 'none';
    }
  }

  if (ownerPriceInput) ownerPriceInput.addEventListener('input', showFeePreview);
  for (var r = 0; r < feeRadios.length; r++) {
    feeRadios[r].addEventListener('change', showFeePreview);
  }

  // ==========================================
  // DIGITAL SIGNATURE PREVIEW
  // ==========================================
  var signatureInput = document.getElementById('signatureName');
  var signaturePreview = document.getElementById('signaturePreview');
  var signatureDisplay = document.getElementById('signatureDisplay');
  var signatureDate = document.getElementById('signatureDate');

  function updateSignaturePreview() {
    if (!signatureInput || !signaturePreview) return;
    var name = signatureInput.value.trim();
    if (name.length > 0) {
      signatureDisplay.textContent = name;
      signatureDate.textContent = new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' });
      signaturePreview.style.display = 'block';
    } else {
      signaturePreview.style.display = 'none';
    }
  }

  if (signatureInput) signatureInput.addEventListener('input', updateSignaturePreview);

  // ==========================================
  // SELLING METHOD: WHOLE LOT vs PER CUT
  // ==========================================
  var sellingRadios = form.querySelectorAll('input[name="selling_method"]');
  var perCutDetails = document.getElementById('perCutDetails');
  var minCutInput = document.getElementById('minCutSize');
  var cutPriceInput = document.getElementById('cutPricePerSqm');
  var wholeLotNote = document.getElementById('wholeLotNote');

  function handleSellingMethod() {
    var selected = form.querySelector('input[name="selling_method"]:checked');
    if (!selected) return;

    if (selected.value === 'per_cut') {
      if (perCutDetails) perCutDetails.style.display = 'block';
      if (minCutInput) minCutInput.setAttribute('required', 'required');
      if (cutPriceInput) cutPriceInput.setAttribute('required', 'required');
      if (wholeLotNote) wholeLotNote.textContent = 'Total asking price if someone wants to buy the entire lot.';
    } else {
      if (perCutDetails) perCutDetails.style.display = 'none';
      if (minCutInput) minCutInput.removeAttribute('required');
      if (cutPriceInput) cutPriceInput.removeAttribute('required');
      if (wholeLotNote) wholeLotNote.textContent = 'Total asking price for the entire property.';
    }
  }

  for (var s = 0; s < sellingRadios.length; s++) {
    sellingRadios[s].addEventListener('change', handleSellingMethod);
  }

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
    'description': 'Please add a short description of your property.',
    'fee_option': 'Please select how you want the 1% platform fee handled.',
    'selling_method': 'Please select whether you want to sell the whole lot or per cut.',
    'min_cut_size': 'Please enter the minimum cut size in sqm.',
    'cut_price_per_sqm': 'Please enter the price per sqm for cuts.',
    'digital_signature': 'Please type your full name as your digital signature.',
    'agreement_confirmed': 'Please confirm that you agree to the terms by checking the box.'
  };

  // Show friendly message next to a field
  function showFieldMessage(field, message) {
    clearFieldMessage(field);
    var msg = document.createElement('p');
    msg.className = 'field-message';
    msg.textContent = message;
    field.parentElement.appendChild(msg);
    field.classList.add('field-error');
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

      // Check checkbox
      if (field.type === 'checkbox' && !field.checked) {
        var message = fieldMessages[name] || 'This field is required.';
        showFieldMessage(field.closest('.form-group') ? field : field, message);
        if (!firstError) firstError = field;
        errorCount++;
        continue;
      }

      // Check radio buttons (only validate once per group)
      if (field.type === 'radio') {
        var groupChecked = form.querySelector('input[name="' + name + '"]:checked');
        if (!groupChecked) {
          // Only show error once per radio group
          var alreadyShown = field.parentElement.parentElement.querySelector('.field-message');
          if (!alreadyShown) {
            var msg = fieldMessages[name] || 'Please select an option.';
            var container = field.closest('.fee-options') || field.parentElement;
            var msgEl = document.createElement('p');
            msgEl.className = 'field-message';
            msgEl.textContent = msg;
            container.appendChild(msgEl);
            if (!firstError) firstError = field;
            errorCount++;
          }
        }
        continue;
      }

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
    formData.append('signature_date', new Date().toLocaleDateString('en-PH', { year:'numeric', month:'long', day:'numeric' }));

    // Send to Google Apps Script
    var action = form.getAttribute('action');
    fetch(action, {
      method: 'POST',
      body: formData,
      mode: 'no-cors'
    })
    .then(function() {
      showSuccess(refId);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    })
    .catch(function() {
      showSuccess(refId);
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    });
  });

  function showSuccess(refId) {
    formSubmitted = true;
    clearSavedForm();
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

  // Warn user if they try to leave while filling out the form
  var formSubmitted = false;
  var formStarted = false;

  form.addEventListener('input', function() {
    formStarted = true;
  });
  form.addEventListener('change', function() {
    formStarted = true;
  });

  window.addEventListener('beforeunload', function(e) {
    if (formStarted && !formSubmitted) {
      e.preventDefault();
      e.returnValue = '';
    }
  });
});
