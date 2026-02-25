/**
 * CebuRentMarket - Form Submission Handler
 * Friendly validation + Web3Forms integration
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
  var SAVE_KEY = 'crm_form_draft';

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
        // Show a friendly restore message (purple theme)
        var restoreMsg = document.createElement('div');
        restoreMsg.style.cssText = 'background:#7B1FA2; color:#fff; padding:12px 20px; border-radius:8px; margin-bottom:16px; font-size:0.9rem;';
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

  // Generate reference ID (CRM prefix for CebuRentMarket)
  function generateRefId() {
    var timestamp = Date.now().toString(36).toUpperCase();
    var random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return 'CRM-' + timestamp + '-' + random;
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
  // FRIENDLY VALIDATION
  // ==========================================

  // Friendly messages for each field (rental-specific)
  var fieldMessages = {
    'owner_name': 'Please enter your full name so we know who to contact.',
    'contact_number': 'Please enter your phone number (e.g. 09XX XXX XXXX).',
    'email': 'Please enter a valid email address so we can send you updates.',
    'property_title': 'Give your rental a short title (e.g. "2BR Condo in IT Park, Cebu City").',
    'property_type': 'Please select what type of rental property this is.',
    'location': 'Please select the municipality where your rental is located.',
    'monthly_rent': 'Please enter the monthly rent amount in pesos.',
    'bedrooms': 'Please enter the number of bedrooms.',
    'bathrooms': 'Please enter the number of bathrooms.',
    'furnish_status': 'Please select the furnishing status.',
    'floor_area': 'Please enter the floor area in square meters.',
    'lease_term': 'Please specify the minimum lease term (e.g. 6 months, 1 year).',
    'deposit': 'Please specify the deposit requirement (e.g. 2 months advance, 1 month deposit).',
    'availability': 'Please indicate when the property is available for move-in.',
    'documents_available': 'Please select what documents you currently have.',
    'ownership_status': 'Please let us know if you are the property owner or authorized agent.',
    'property_issues': 'Please let us know if there are any issues with the property.',
    'document_links': 'Please share links to your property documents so we can verify them.',
    'description': 'Please add a short description of your rental property.',
    'digital_signature': 'Please type your full name as your digital signature to confirm the rental listing terms.',
    'agreement_confirmed': 'Please confirm that you agree to the rental listing terms by checking the box.'
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
            var container = field.parentElement;
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

    // Send to Web3Forms
    var action = form.getAttribute('action');
    fetch(action, {
      method: 'POST',
      body: formData
    })
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.success) {
        showSuccess(refId);
      } else {
        alert('Submission failed. Please try again or message us on Messenger.');
      }
      submitBtn.textContent = originalText;
      submitBtn.disabled = false;
    })
    .catch(function() {
      alert('Network error. Please try again or message us on Messenger.');
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