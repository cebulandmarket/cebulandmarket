/* ============================================================
   CebuLandMarket Calendar — Booking App
   Static, no backend. Submits via Web3Forms, reminders via .ics
   ============================================================ */
(function () {
  'use strict';

  // ---------- CONFIG ----------
  var CONFIG = {
    web3formsKey: '09df7276-a4b9-440c-9342-b4c7971c1dce',
    web3formsUrl: 'https://api.web3forms.com/submit',
    timezone: 'Asia/Manila',
    workingHours: { start: 9, end: 17 },  // 9 AM – 5 PM
    slotMinutes: 30,
    lunchHour: 12,                         // 12:00–13:00 blocked
    daysAhead: 14,
    closedDays: [0],                       // Sunday = 0
    storageKey: 'clm_calendar_bookings_v1',
    ownerPhone: '+639687512330',
    ownerName: 'Rea (CebuLandMarket)',
    siteUrl: 'https://cebulandmarket.com/calendar/'
  };

  // ---------- STATE ----------
  var state = {
    step: 1,
    property: null,        // { id, title, address } or { id:'general', title:'…' }
    date: null,            // ISO YYYY-MM-DD
    time: null,            // 'HH:MM'
    name: '', phone: '', email: '', note: '',
    remind: true
  };

  // ============================================================
  // LIVE CLOCK — Cebu / GMT+8
  // Uses Intl.DateTimeFormat to render in the local Cebu TZ no
  // matter where the user actually is — important for precision.
  // ============================================================
  function tickClock() {
    var el = document.getElementById('liveClock');
    if (!el) return;
    var now = new Date();
    var fmt = new Intl.DateTimeFormat('en-PH', {
      timeZone: CONFIG.timezone,
      weekday: 'short', month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit', second: '2-digit',
      hour12: true
    });
    el.textContent = fmt.format(now);
  }
  setInterval(tickClock, 1000);
  tickClock();

  // ============================================================
  // STEP NAVIGATION
  // ============================================================
  function goToStep(n) {
    state.step = n;
    var steps = document.querySelectorAll('.step');
    steps.forEach(function (el) {
      el.classList.toggle('active', parseInt(el.dataset.step, 10) === n);
    });
    var progress = document.querySelectorAll('.progress-step');
    progress.forEach(function (el) {
      var s = parseInt(el.dataset.step, 10);
      el.classList.toggle('active', s === n);
      el.classList.toggle('done', s < n);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Back buttons
  document.querySelectorAll('[data-back]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      goToStep(parseInt(btn.dataset.back, 10));
    });
  });

  // ============================================================
  // STEP 1 — PROPERTY PICKER
  // Pulls from LISTINGS_DATA loaded via ../data/listings.js
  // ============================================================
  function renderProperties() {
    var list = document.getElementById('propertyList');
    if (typeof LISTINGS_DATA === 'undefined') return;

    var active = LISTINGS_DATA.filter(function (l) {
      return l.status === 'active';
    });

    active.forEach(function (l) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'property-card';
      btn.dataset.property = l.id;
      btn.innerHTML =
        '<div class="prop-emoji">' + (l.type === 'house' ? '&#127968;' : '&#127757;') + '</div>' +
        '<div class="prop-info">' +
          '<div class="prop-title">' + escape(l.title) + '</div>' +
          '<div class="prop-meta">' + escape(l.address || '') + '</div>' +
        '</div>';
      btn.addEventListener('click', function () { selectProperty(l, btn); });
      list.appendChild(btn);
    });

    // General consultation button (already in HTML)
    var generalBtn = list.querySelector('[data-property="general"]');
    generalBtn.addEventListener('click', function () {
      selectProperty({ id: 'general', title: 'General Consultation', address: 'To be agreed' }, generalBtn);
    });
  }

  function selectProperty(prop, btn) {
    state.property = prop;
    document.querySelectorAll('.property-card').forEach(function (c) {
      c.classList.remove('selected');
    });
    btn.classList.add('selected');
    document.getElementById('step1Next').disabled = false;
  }

  document.getElementById('step1Next').addEventListener('click', function () {
    if (!state.property) return;
    renderDates();
    goToStep(2);
  });

  // ============================================================
  // STEP 2 — DATE GRID
  // Generates next 14 days starting today (Cebu time), skipping
  // Sundays. "Today" is detected via Asia/Manila Intl date parts
  // so the picker is correct regardless of the user's device TZ.
  // ============================================================
  function cebuToday() {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: CONFIG.timezone,
      year: 'numeric', month: '2-digit', day: 'numeric'
    }).formatToParts(new Date());
    var y = parts.find(function (p) { return p.type === 'year'; }).value;
    var m = parts.find(function (p) { return p.type === 'month'; }).value;
    var d = parts.find(function (p) { return p.type === 'day'; }).value;
    return y + '-' + m + '-' + d;
  }

  function addDaysISO(iso, n) {
    var d = new Date(iso + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function dayOfWeekISO(iso) {
    // weekday in Cebu TZ
    return new Date(iso + 'T12:00:00+08:00').getUTCDay();
  }

  function renderDates() {
    var grid = document.getElementById('dateGrid');
    grid.innerHTML = '';
    var today = cebuToday();
    var count = 0;
    var offset = 0;
    while (count < CONFIG.daysAhead) {
      var iso = addDaysISO(today, offset);
      offset++;
      var dow = dayOfWeekISO(iso);
      var closed = CONFIG.closedDays.indexOf(dow) !== -1;

      var date = new Date(iso + 'T12:00:00+08:00');
      var dowName = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dow];
      var monthName = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getUTCMonth()];
      var dayNum = date.getUTCDate();

      var cell = document.createElement('button');
      cell.type = 'button';
      cell.className = 'date-cell';
      if (iso === today) cell.classList.add('today');
      cell.disabled = closed;
      cell.dataset.iso = iso;
      cell.innerHTML =
        '<span class="dow">' + dowName + '</span>' +
        '<span class="day-num">' + dayNum + '</span>' +
        '<span class="month">' + monthName + '</span>';
      if (!closed) {
        cell.addEventListener('click', function (e) { selectDate(this); });
      }
      grid.appendChild(cell);
      count++;
    }
  }

  function selectDate(cell) {
    state.date = cell.dataset.iso;
    document.querySelectorAll('.date-cell').forEach(function (c) {
      c.classList.remove('selected');
    });
    cell.classList.add('selected');
    document.getElementById('step2Next').disabled = false;
  }

  document.getElementById('step2Next').addEventListener('click', function () {
    if (!state.date) return;
    renderTimes();
    goToStep(3);
  });

  // ============================================================
  // STEP 3 — TIME SLOTS
  // 30-min slots within working hours. Lunch hour shown but
  // disabled. For TODAY in Cebu time, past slots are disabled.
  // ============================================================
  function nowCebuMinutes() {
    var parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: CONFIG.timezone,
      hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(new Date());
    var h = parseInt(parts.find(function (p) { return p.type === 'hour'; }).value, 10);
    var m = parseInt(parts.find(function (p) { return p.type === 'minute'; }).value, 10);
    return h * 60 + m;
  }

  function renderTimes() {
    var grid = document.getElementById('timeGrid');
    grid.innerHTML = '';
    var hint = document.getElementById('step3Hint');
    var date = new Date(state.date + 'T12:00:00+08:00');
    var pretty = date.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' });
    hint.textContent = 'Slots for ' + pretty + ' — Cebu time (GMT+8).';

    var isToday = state.date === cebuToday();
    var nowMin = nowCebuMinutes();

    for (var h = CONFIG.workingHours.start; h < CONFIG.workingHours.end; h++) {
      for (var m = 0; m < 60; m += CONFIG.slotMinutes) {
        var cell = document.createElement('button');
        cell.type = 'button';
        var slotMin = h * 60 + m;

        if (h === CONFIG.lunchHour) {
          cell.className = 'time-cell lunch';
          cell.disabled = true;
          cell.textContent = 'Lunch';
        } else {
          cell.className = 'time-cell';
          cell.textContent = format12h(h, m);
          var hh = h < 10 ? '0' + h : '' + h;
          var mm = m < 10 ? '0' + m : '' + m;
          cell.dataset.time = hh + ':' + mm;
          if (isToday && slotMin <= nowMin + 30) {
            // require at least 30min lead time
            cell.disabled = true;
          } else {
            cell.addEventListener('click', function () { selectTime(this); });
          }
        }
        grid.appendChild(cell);
      }
    }
  }

  function format12h(h, m) {
    var ampm = h >= 12 ? 'PM' : 'AM';
    var hr = h % 12 === 0 ? 12 : h % 12;
    return hr + ':' + (m < 10 ? '0' + m : m) + ' ' + ampm;
  }

  function selectTime(cell) {
    state.time = cell.dataset.time;
    document.querySelectorAll('.time-cell').forEach(function (c) {
      c.classList.remove('selected');
    });
    cell.classList.add('selected');
    document.getElementById('step3Next').disabled = false;
  }

  document.getElementById('step3Next').addEventListener('click', function () {
    if (!state.time) return;
    renderSummary();
    goToStep(4);
  });

  // ============================================================
  // STEP 4 — DETAILS + SUMMARY + SUBMIT
  // ============================================================
  function renderSummary() {
    var box = document.getElementById('summaryBox');
    var dt = new Date(state.date + 'T' + state.time + ':00+08:00');
    var prettyDate = dt.toLocaleDateString('en-PH', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    var prettyTime = dt.toLocaleTimeString('en-PH', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: CONFIG.timezone
    });
    box.innerHTML =
      '<div class="summary-row"><span class="label">Viewing:</span><span class="value">' + escape(state.property.title) + '</span></div>' +
      '<div class="summary-row"><span class="label">Date:</span><span class="value">' + prettyDate + '</span></div>' +
      '<div class="summary-row"><span class="label">Time:</span><span class="value">' + prettyTime + ' (Cebu time)</span></div>' +
      '<div class="summary-row"><span class="label">Duration:</span><span class="value">30 minutes</span></div>';
  }

  document.getElementById('bookingForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var form = e.target;
    state.name = form.name.value.trim();
    state.phone = form.phone.value.trim();
    state.email = form.email.value.trim();
    state.note = form.note.value.trim();
    state.remind = document.getElementById('bk_remind').checked;

    if (state.name.length < 2 || state.phone.length < 7) {
      alert('Please enter your name and a valid mobile number.');
      return;
    }

    var btn = document.getElementById('confirmBtn');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    submitBooking().then(function () {
      saveBookingLocal();
      scheduleReminder();
      renderConfirmation();
      goToStep(5);
    }).catch(function (err) {
      btn.disabled = false;
      btn.textContent = 'Confirm Booking';
      alert('Sorry, something went wrong sending your booking. Please call Rea directly at ' + CONFIG.ownerPhone);
      console.error(err);
    });
  });

  // ============================================================
  // SUBMIT — Web3Forms (matches the rest of CLM's submission path)
  // ============================================================
  function submitBooking() {
    var fd = new FormData();
    fd.append('access_key', CONFIG.web3formsKey);
    fd.append('subject', '[Calendar] Viewing booked — ' + state.property.title);
    fd.append('from_name', 'CLM Calendar');
    fd.append('Booking_Type', 'Property Viewing');
    fd.append('Property', state.property.title);
    fd.append('Property_Address', state.property.address || '');
    fd.append('Property_ID', state.property.id);
    fd.append('Date', state.date);
    fd.append('Time_Cebu', state.time + ' (GMT+8)');
    fd.append('Visitor_Name', state.name);
    fd.append('Visitor_Phone', state.phone);
    fd.append('Visitor_Email', state.email || 'not provided');
    fd.append('Note', state.note || '(none)');
    fd.append('Booked_At', new Date().toISOString());

    return fetch(CONFIG.web3formsUrl, { method: 'POST', body: fd })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        if (!data.success) throw new Error(data.message || 'Submission failed');
        return data;
      });
  }

  // ============================================================
  // LOCALSTORAGE — track this user's bookings
  // ============================================================
  function saveBookingLocal() {
    try {
      var list = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
      list.push({
        id: state.property.id,
        title: state.property.title,
        address: state.property.address,
        date: state.date,
        time: state.time,
        name: state.name,
        phone: state.phone,
        bookedAt: new Date().toISOString()
      });
      localStorage.setItem(CONFIG.storageKey, JSON.stringify(list));
    } catch (e) { /* private mode etc. */ }
  }

  function renderHistory() {
    try {
      var list = JSON.parse(localStorage.getItem(CONFIG.storageKey) || '[]');
      if (!list.length) return;
      var section = document.getElementById('myBookings');
      var box = document.getElementById('bookingHistory');
      box.innerHTML = '';
      list.slice().reverse().forEach(function (b) {
        var dt = new Date(b.date + 'T' + b.time + ':00+08:00');
        var pretty = dt.toLocaleString('en-PH', {
          weekday: 'short', month: 'short', day: 'numeric',
          hour: 'numeric', minute: '2-digit', hour12: true,
          timeZone: CONFIG.timezone
        });
        var item = document.createElement('div');
        item.className = 'booking-item';
        item.innerHTML =
          '<div class="bk-when">' + pretty + '</div>' +
          '<div class="bk-prop">' + escape(b.title) + '</div>';
        box.appendChild(item);
      });
      section.hidden = false;
    } catch (e) { /* ignore */ }
  }

  // ============================================================
  // REMINDER — request Notification permission, fire setTimeout
  // 60 minutes before the slot if the page is open.
  // Real reliability comes from the .ics file (OS calendar).
  // ============================================================
  function scheduleReminder() {
    if (!state.remind) return;
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
    var when = new Date(state.date + 'T' + state.time + ':00+08:00').getTime();
    var ms = when - Date.now() - 60 * 60 * 1000;
    if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
      setTimeout(function () {
        if (Notification.permission === 'granted') {
          new Notification('Property viewing in 1 hour', {
            body: state.property.title + ' — see you soon!',
            icon: 'images/icon-192.png'
          });
        }
      }, ms);
    }
  }

  // ============================================================
  // CONFIRMATION — .ics + Google Calendar link
  // The .ics file is the precision-timing backbone: it contains
  // a VALARM for 1 day + 1 hour before, so the user's native
  // calendar will alert them even with the browser closed.
  // ============================================================
  function renderConfirmation() {
    var dt = new Date(state.date + 'T' + state.time + ':00+08:00');
    var prettyDate = dt.toLocaleDateString('en-PH', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
    var prettyTime = dt.toLocaleTimeString('en-PH', {
      hour: 'numeric', minute: '2-digit', hour12: true, timeZone: CONFIG.timezone
    });

    document.getElementById('confirmDetails').innerHTML =
      '<div class="summary-row"><span class="label">What:</span><span class="value">' + escape(state.property.title) + '</span></div>' +
      '<div class="summary-row"><span class="label">When:</span><span class="value">' + prettyDate + '</span></div>' +
      '<div class="summary-row"><span class="label">Time:</span><span class="value">' + prettyTime + ' Cebu time</span></div>' +
      '<div class="summary-row"><span class="label">Where:</span><span class="value">' + escape(state.property.address || 'To be confirmed') + '</span></div>' +
      '<div class="summary-row"><span class="label">Owner:</span><span class="value">' + CONFIG.ownerName + ' — ' + CONFIG.ownerPhone + '</span></div>';

    // .ics download
    var icsUrl = makeIcsDataUrl();
    var dl = document.getElementById('downloadIcs');
    dl.href = icsUrl;
    dl.download = 'cebulandmarket-viewing.ics';

    // Google Calendar URL
    document.getElementById('addGoogle').href = makeGoogleCalUrl();
  }

  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // UTC timestamp formatted for ICS: YYYYMMDDTHHMMSSZ
  function icsTime(d) {
    return d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) + 'Z';
  }

  function makeIcsDataUrl() {
    var start = new Date(state.date + 'T' + state.time + ':00+08:00');
    var end = new Date(start.getTime() + 30 * 60 * 1000);
    var now = new Date();
    var uid = 'clm-' + start.getTime() + '-' + Math.random().toString(36).slice(2, 10) + '@cebulandmarket.com';

    var desc = 'Property viewing booked via CebuLandMarket.\\n\\n' +
      'Property: ' + state.property.title + '\\n' +
      'Location: ' + (state.property.address || 'TBC') + '\\n' +
      'Owner: ' + CONFIG.ownerName + '\\n' +
      'Phone: ' + CONFIG.ownerPhone + '\\n\\n' +
      'Booked by: ' + state.name + ' (' + state.phone + ')';

    var ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//CebuLandMarket//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + icsTime(now),
      'DTSTART:' + icsTime(start),
      'DTEND:' + icsTime(end),
      'SUMMARY:Property Viewing — ' + state.property.title,
      'DESCRIPTION:' + desc,
      'LOCATION:' + (state.property.address || 'Cebu, Philippines'),
      'URL:' + CONFIG.siteUrl,
      'STATUS:CONFIRMED',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Property viewing tomorrow',
      'TRIGGER:-P1D',
      'END:VALARM',
      'BEGIN:VALARM',
      'ACTION:DISPLAY',
      'DESCRIPTION:Property viewing in 1 hour',
      'TRIGGER:-PT1H',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
  }

  // Google Calendar pre-fill URL (works on web + mobile app)
  function makeGoogleCalUrl() {
    var start = new Date(state.date + 'T' + state.time + ':00+08:00');
    var end = new Date(start.getTime() + 30 * 60 * 1000);
    var params = new URLSearchParams({
      action: 'TEMPLATE',
      text: 'Property Viewing — ' + state.property.title,
      dates: icsTime(start) + '/' + icsTime(end),
      details: 'Booked via CebuLandMarket.\nOwner: ' + CONFIG.ownerName + ' — ' + CONFIG.ownerPhone,
      location: state.property.address || 'Cebu, Philippines'
    });
    return 'https://calendar.google.com/calendar/render?' + params.toString();
  }

  // "Book another" — reset state, back to step 1
  document.getElementById('newBookingBtn').addEventListener('click', function () {
    state = {
      step: 1, property: null, date: null, time: null,
      name: '', phone: '', email: '', note: '', remind: true
    };
    document.querySelectorAll('.property-card').forEach(function (c) {
      c.classList.remove('selected');
    });
    document.getElementById('bookingForm').reset();
    document.getElementById('step1Next').disabled = true;
    document.getElementById('step2Next').disabled = true;
    document.getElementById('step3Next').disabled = true;
    document.getElementById('confirmBtn').disabled = false;
    document.getElementById('confirmBtn').textContent = 'Confirm Booking';
    renderHistory();
    goToStep(1);
  });

  // ---------- UTIL ----------
  function escape(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- BOOTSTRAP ----------
  renderProperties();
  renderHistory();

})();
