/* ============================================================
   Tempo — Personal calendar app
   100% client-side. localStorage only. International.
   ============================================================ */
(function () {
  'use strict';

  // ---------- CONFIG ----------
  var STORAGE_KEY = 'tempo_events_v1';
  var THEME_KEY = 'tempo_theme';
  var REMINDER_TIMERS = {};      // eventId -> timeout id
  var SYSTEM_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  var SYSTEM_LOCALE = navigator.language || 'en';

  // ---------- STATE ----------
  var events = [];   // {id, title, date, time, durationMin, location, notes, color, repeat, remindMin, createdAt}

  // ============================================================
  // STORAGE
  // ============================================================
  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      events = raw ? JSON.parse(raw) : [];
    } catch (e) { events = []; }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(events)); } catch (e) {}
  }

  // ============================================================
  // THEME
  // ============================================================
  function loadTheme() {
    var t = localStorage.getItem(THEME_KEY) || 'auto';
    document.body.dataset.theme = t;
  }
  function toggleTheme() {
    var cur = document.body.dataset.theme || 'auto';
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // auto → light → dark → auto
    var next;
    if (cur === 'auto') next = prefersDark ? 'light' : 'dark';
    else if (cur === 'light') next = 'dark';
    else next = 'light';
    document.body.dataset.theme = next;
    localStorage.setItem(THEME_KEY, next);
    toast('Theme: ' + next);
  }

  // ============================================================
  // LIVE CLOCK
  // Uses the user's own timezone — no hardcoded region.
  // ============================================================
  function tickClock() {
    var now = new Date();
    var timeEl = document.getElementById('clockTime');
    var dateEl = document.getElementById('clockDate');
    var tzEl = document.getElementById('clockTz');
    if (!timeEl) return;
    timeEl.textContent = new Intl.DateTimeFormat(SYSTEM_LOCALE, {
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(now);
    dateEl.textContent = new Intl.DateTimeFormat(SYSTEM_LOCALE, {
      weekday: 'long', month: 'long', day: 'numeric'
    }).format(now);
    tzEl.textContent = SYSTEM_TZ.replace(/_/g, ' ');
  }
  setInterval(tickClock, 1000);
  tickClock();

  // ============================================================
  // EVENT MODEL HELPERS
  // ============================================================
  function newId() {
    return 'e_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function eventStartDate(e) {
    // Treat date+time as user's local timezone (matches how they entered it)
    return new Date(e.date + 'T' + e.time);
  }
  function eventEndDate(e) {
    var s = eventStartDate(e);
    var dur = e.durationMin > 0 ? e.durationMin : 60;
    return new Date(s.getTime() + dur * 60000);
  }

  // For recurring events, compute the next occurrence on/after `from`
  function nextOccurrence(e, from) {
    if (e.repeat === 'none' || !e.repeat) return eventStartDate(e);
    var s = eventStartDate(e);
    if (s >= from) return s;
    if (e.repeat === 'daily') {
      var diffDays = Math.ceil((from - s) / 86400000);
      return new Date(s.getTime() + diffDays * 86400000);
    }
    if (e.repeat === 'weekly') {
      var diffWeeks = Math.ceil((from - s) / (7 * 86400000));
      return new Date(s.getTime() + diffWeeks * 7 * 86400000);
    }
    if (e.repeat === 'monthly') {
      var d = new Date(s);
      while (d < from) { d.setMonth(d.getMonth() + 1); }
      return d;
    }
    return s;
  }

  // ============================================================
  // QUICK PRESETS
  // ============================================================
  function applyPreset(key) {
    var now = new Date();
    var d = new Date(now);
    if (key === '30m') d = new Date(now.getTime() + 30 * 60000);
    else if (key === '1h') d = new Date(now.getTime() + 60 * 60000);
    else if (key === '3h') d = new Date(now.getTime() + 3 * 60 * 60000);
    else if (key === 'tom9') {
      d.setDate(now.getDate() + 1);
      d.setHours(9, 0, 0, 0);
    } else if (key === 'mon9') {
      var daysUntilMon = (8 - now.getDay()) % 7 || 7;
      d.setDate(now.getDate() + daysUntilMon);
      d.setHours(9, 0, 0, 0);
    }
    // Round 30m/1h/3h presets to nearest 5 min for cleanliness
    if (key === '30m' || key === '1h' || key === '3h') {
      var ms = 5 * 60 * 1000;
      d = new Date(Math.round(d.getTime() / ms) * ms);
    }
    document.getElementById('ev_date').value = isoDate(d);
    document.getElementById('ev_time').value = isoTime(d);
  }

  function isoDate(d) {
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function isoTime(d) {
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }

  // ============================================================
  // RENDER FEED
  // Groups: Now, Today, Tomorrow, This Week, Later, Past
  // ============================================================
  function render() {
    var feed = document.getElementById('eventFeed');
    var empty = document.getElementById('emptyState');
    feed.querySelectorAll('.event-group, .event-card').forEach(function (n) { n.remove(); });

    if (!events.length) {
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';

    var now = new Date();
    var todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
    var tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    var dayAfter = new Date(tomorrowStart); dayAfter.setDate(dayAfter.getDate() + 1);
    var weekEnd = new Date(todayStart); weekEnd.setDate(weekEnd.getDate() + 7);

    // Build a list of (event, effectiveStart) — using next occurrence for recurring
    var items = events.map(function (e) {
      var start = e.repeat && e.repeat !== 'none' ? nextOccurrence(e, now) : eventStartDate(e);
      return { e: e, start: start, end: new Date(start.getTime() + (e.durationMin > 0 ? e.durationMin : 60) * 60000) };
    });
    items.sort(function (a, b) { return a.start - b.start; });

    var buckets = { now: [], today: [], tomorrow: [], week: [], later: [], past: [] };
    items.forEach(function (it) {
      if (it.end < now) buckets.past.push(it);
      else if (it.start <= now && it.end >= now) buckets.now.push(it);
      else if (it.start < tomorrowStart) buckets.today.push(it);
      else if (it.start < dayAfter) buckets.tomorrow.push(it);
      else if (it.start < weekEnd) buckets.week.push(it);
      else buckets.later.push(it);
    });

    var groups = [
      ['Now', buckets.now],
      ['Today', buckets.today],
      ['Tomorrow', buckets.tomorrow],
      ['This Week', buckets.week],
      ['Later', buckets.later]
    ];
    groups.forEach(function (g) {
      if (!g[1].length) return;
      var h = document.createElement('div');
      h.className = 'group-header event-group';
      h.textContent = g[0];
      feed.appendChild(h);
      g[1].forEach(function (it) { feed.appendChild(renderCard(it.e, it.start, it.end)); });
    });

    // Past — collapsed at the bottom if any
    if (buckets.past.length) {
      var ph = document.createElement('div');
      ph.className = 'group-header event-group';
      ph.textContent = 'Past';
      feed.appendChild(ph);
      buckets.past.slice(-5).forEach(function (it) {
        feed.appendChild(renderCard(it.e, it.start, it.end, true));
      });
    }
  }

  function renderCard(e, start, end, isPast) {
    var card = document.createElement('button');
    card.className = 'event-card';
    if (isPast) card.classList.add('past');
    var now = new Date();
    if (start <= now && end >= now) card.classList.add('now');
    card.dataset.color = e.color || 'violet';
    card.dataset.id = e.id;
    card.type = 'button';

    var until = humanUntil(start, now, isPast);
    var timeStr = new Intl.DateTimeFormat(SYSTEM_LOCALE, {
      hour: '2-digit', minute: '2-digit'
    }).format(start);
    var dayStr = sameDay(start, now) ? '' :
      new Intl.DateTimeFormat(SYSTEM_LOCALE, { weekday: 'short', month: 'short', day: 'numeric' }).format(start);

    card.innerHTML =
      '<div class="event-stripe"></div>' +
      '<div class="event-body">' +
        '<div class="event-title">' + esc(e.title) + '</div>' +
        '<div class="event-when">' +
          '<span>' + (dayStr ? dayStr + ' · ' : '') + timeStr + '</span>' +
          (until ? '<span class="until-tag ' + until.cls + '">' + esc(until.text) + '</span>' : '') +
          (e.repeat && e.repeat !== 'none' ? '<span class="event-repeat">' + e.repeat.toUpperCase() + '</span>' : '') +
        '</div>' +
        (e.location ? '<div class="event-loc">&#128205; ' + esc(e.location) + '</div>' : '') +
      '</div>';

    card.addEventListener('click', function () { openDetail(e.id); });
    return card;
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
  }

  function humanUntil(target, now, isPast) {
    var diff = target - now;
    if (isPast || diff < -60000) {
      var absMs = Math.abs(diff);
      if (absMs < 3600000) return { text: Math.floor(absMs / 60000) + 'm ago', cls: 'past' };
      if (absMs < 86400000) return { text: Math.floor(absMs / 3600000) + 'h ago', cls: 'past' };
      return { text: Math.floor(absMs / 86400000) + 'd ago', cls: 'past' };
    }
    if (diff < 60000) return { text: 'now', cls: 'soon' };
    if (diff < 3600000) {
      var m = Math.floor(diff / 60000);
      return { text: 'in ' + m + 'm', cls: m < 30 ? 'soon' : '' };
    }
    if (diff < 86400000) {
      var h = Math.floor(diff / 3600000);
      var min = Math.floor((diff % 3600000) / 60000);
      return { text: 'in ' + h + 'h' + (min ? ' ' + min + 'm' : ''), cls: '' };
    }
    var days = Math.floor(diff / 86400000);
    return { text: 'in ' + days + 'd', cls: '' };
  }

  // Refresh "in X minutes" labels every 30s without re-rendering everything
  setInterval(function () { render(); }, 30000);

  // ============================================================
  // ADD / EDIT MODAL
  // ============================================================
  function openModal(eventId) {
    var modal = document.getElementById('modalShroud');
    var form = document.getElementById('eventForm');
    form.reset();
    document.getElementById('ev_id').value = '';
    document.getElementById('modalTitle').textContent = 'New event';
    document.getElementById('deleteBtn').hidden = true;

    // Default date/time = 1 hour from now, rounded
    var d = new Date(Date.now() + 60 * 60000);
    var mins = d.getMinutes();
    d.setMinutes(mins - (mins % 15) + 15, 0, 0);
    document.getElementById('ev_date').value = isoDate(d);
    document.getElementById('ev_time').value = isoTime(d);
    selectColor('violet');

    if (eventId) {
      var e = events.find(function (x) { return x.id === eventId; });
      if (e) {
        document.getElementById('modalTitle').textContent = 'Edit event';
        document.getElementById('ev_id').value = e.id;
        document.getElementById('ev_title').value = e.title;
        document.getElementById('ev_date').value = e.date;
        document.getElementById('ev_time').value = e.time;
        document.getElementById('ev_duration').value = e.durationMin;
        document.getElementById('ev_repeat').value = e.repeat || 'none';
        document.getElementById('ev_location').value = e.location || '';
        document.getElementById('ev_notes').value = e.notes || '';
        document.getElementById('ev_remind').checked = e.remindMin !== null && e.remindMin !== undefined;
        if (e.remindMin) document.getElementById('ev_remind_when').value = e.remindMin;
        selectColor(e.color || 'violet');
        document.getElementById('deleteBtn').hidden = false;
      }
    }
    modal.hidden = false;
    setTimeout(function () { document.getElementById('ev_title').focus(); }, 100);
  }
  function closeModal() {
    document.getElementById('modalShroud').hidden = true;
  }

  function selectColor(c) {
    document.querySelectorAll('.swatch').forEach(function (s) {
      s.classList.toggle('selected', s.dataset.color === c);
    });
  }

  // Save event
  document.getElementById('eventForm').addEventListener('submit', function (ev) {
    ev.preventDefault();
    var id = document.getElementById('ev_id').value || newId();
    var existing = events.find(function (x) { return x.id === id; });
    var selectedSwatch = document.querySelector('.swatch.selected');
    var color = selectedSwatch ? selectedSwatch.dataset.color : 'violet';
    var remind = document.getElementById('ev_remind').checked;

    var payload = {
      id: id,
      title: document.getElementById('ev_title').value.trim(),
      date: document.getElementById('ev_date').value,
      time: document.getElementById('ev_time').value,
      durationMin: parseInt(document.getElementById('ev_duration').value, 10),
      repeat: document.getElementById('ev_repeat').value,
      location: document.getElementById('ev_location').value.trim(),
      notes: document.getElementById('ev_notes').value.trim(),
      color: color,
      remindMin: remind ? parseInt(document.getElementById('ev_remind_when').value, 10) : null,
      createdAt: existing ? existing.createdAt : new Date().toISOString()
    };

    if (!payload.title || !payload.date || !payload.time) {
      toast('Please fill in title, date, and time');
      return;
    }

    if (existing) {
      Object.assign(existing, payload);
    } else {
      events.push(payload);
    }
    save();
    scheduleReminders();
    closeModal();
    render();
    toast(existing ? 'Event updated' : 'Event saved');

    if (remind && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  });

  // Color swatches
  document.getElementById('colorRow').addEventListener('click', function (e) {
    var sw = e.target.closest('.swatch');
    if (sw) selectColor(sw.dataset.color);
  });

  // Quick presets
  document.getElementById('quickPresets').addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (chip) applyPreset(chip.dataset.preset);
  });

  // Delete event
  document.getElementById('deleteBtn').addEventListener('click', function () {
    var id = document.getElementById('ev_id').value;
    if (!id) return;
    if (!confirm('Delete this event?')) return;
    events = events.filter(function (x) { return x.id !== id; });
    save();
    clearReminder(id);
    closeModal();
    closeDetail();
    render();
    toast('Event deleted');
  });

  document.getElementById('cancelBtn').addEventListener('click', closeModal);
  document.getElementById('modalClose').addEventListener('click', closeModal);

  // Click outside to close modals
  ['modalShroud', 'detailShroud', 'aboutShroud'].forEach(function (id) {
    document.getElementById(id).addEventListener('click', function (e) {
      if (e.target === this) this.hidden = true;
    });
  });

  // ============================================================
  // DETAIL SHEET
  // ============================================================
  function openDetail(id) {
    var e = events.find(function (x) { return x.id === id; });
    if (!e) return;
    var modal = document.getElementById('detailShroud');
    var start = e.repeat && e.repeat !== 'none' ? nextOccurrence(e, new Date()) : eventStartDate(e);
    var end = new Date(start.getTime() + (e.durationMin > 0 ? e.durationMin : 60) * 60000);

    document.getElementById('detailTitle').textContent = e.title;
    var body = document.getElementById('detailBody');
    body.innerHTML =
      '<div class="detail-row"><span class="detail-label">When</span><span class="detail-value large">' +
        new Intl.DateTimeFormat(SYSTEM_LOCALE, { weekday:'long', month:'long', day:'numeric', year:'numeric' }).format(start) +
      '</span></div>' +
      '<div class="detail-row"><span class="detail-label">Time</span><span class="detail-value mono">' +
        new Intl.DateTimeFormat(SYSTEM_LOCALE, { hour:'2-digit', minute:'2-digit' }).format(start) + ' – ' +
        new Intl.DateTimeFormat(SYSTEM_LOCALE, { hour:'2-digit', minute:'2-digit' }).format(end) +
      '</span></div>' +
      (e.location ? '<div class="detail-row"><span class="detail-label">Where</span><span class="detail-value">' + esc(e.location) + '</span></div>' : '') +
      (e.notes ? '<div class="detail-row"><span class="detail-label">Notes</span><span class="detail-value">' + esc(e.notes) + '</span></div>' : '') +
      (e.repeat && e.repeat !== 'none' ? '<div class="detail-row"><span class="detail-label">Repeats</span><span class="detail-value">' + e.repeat + '</span></div>' : '') +
      (e.remindMin ? '<div class="detail-row"><span class="detail-label">Reminder</span><span class="detail-value">' + e.remindMin + ' min before</span></div>' : '');

    document.getElementById('detailIcs').href = makeIcsDataUrl(e, start, end);
    document.getElementById('detailIcs').download = (e.title || 'event').replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.ics';
    document.getElementById('detailGcal').href = makeGoogleCalUrl(e, start, end);
    document.getElementById('detailOutlook').href = makeOutlookUrl(e, start, end);
    document.getElementById('detailEdit').onclick = function () { closeDetail(); openModal(e.id); };

    modal.hidden = false;
  }
  function closeDetail() { document.getElementById('detailShroud').hidden = true; }
  document.getElementById('detailClose').addEventListener('click', closeDetail);

  // ============================================================
  // .ICS GENERATION + CALENDAR LINKS
  // The .ics file is the precision-timing backbone — its VALARM
  // creates OS-level reminders that fire even with the app closed.
  // ============================================================
  function icsTime(d) {
    return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' +
      pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z';
  }
  function makeIcsDataUrl(e, start, end) {
    var uid = e.id + '@tempo.app';
    var trigger = e.remindMin ? '-PT' + e.remindMin + 'M' : '-PT10M';
    var lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Tempo//Calendar//EN',
      'CALSCALE:GREGORIAN',
      'BEGIN:VEVENT',
      'UID:' + uid,
      'DTSTAMP:' + icsTime(new Date()),
      'DTSTART:' + icsTime(start),
      'DTEND:' + icsTime(end),
      'SUMMARY:' + icsEsc(e.title)
    ];
    if (e.location) lines.push('LOCATION:' + icsEsc(e.location));
    if (e.notes) lines.push('DESCRIPTION:' + icsEsc(e.notes));
    if (e.repeat === 'daily') lines.push('RRULE:FREQ=DAILY');
    else if (e.repeat === 'weekly') lines.push('RRULE:FREQ=WEEKLY');
    else if (e.repeat === 'monthly') lines.push('RRULE:FREQ=MONTHLY');
    if (e.remindMin) {
      lines.push('BEGIN:VALARM', 'ACTION:DISPLAY',
        'DESCRIPTION:' + icsEsc(e.title), 'TRIGGER:' + trigger, 'END:VALARM');
    }
    lines.push('END:VEVENT', 'END:VCALENDAR');
    return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(lines.join('\r\n'));
  }
  function icsEsc(s) {
    return String(s || '').replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
  }
  function makeGoogleCalUrl(e, start, end) {
    var p = new URLSearchParams({
      action: 'TEMPLATE',
      text: e.title,
      dates: icsTime(start) + '/' + icsTime(end),
      details: e.notes || '',
      location: e.location || ''
    });
    return 'https://calendar.google.com/calendar/render?' + p.toString();
  }
  function makeOutlookUrl(e, start, end) {
    var p = new URLSearchParams({
      path: '/calendar/action/compose',
      rru: 'addevent',
      subject: e.title,
      startdt: start.toISOString(),
      enddt: end.toISOString(),
      body: e.notes || '',
      location: e.location || ''
    });
    return 'https://outlook.live.com/calendar/0/deeplink/compose?' + p.toString();
  }

  // ============================================================
  // REMINDERS
  // Browser notifications fire via setTimeout while the app is
  // open. The .ics file handles the case where it's not.
  // ============================================================
  function scheduleReminders() {
    Object.keys(REMINDER_TIMERS).forEach(function (id) {
      clearTimeout(REMINDER_TIMERS[id]);
      delete REMINDER_TIMERS[id];
    });
    if (!('Notification' in window)) return;
    var now = Date.now();
    events.forEach(function (e) {
      if (!e.remindMin) return;
      var start = e.repeat && e.repeat !== 'none' ? nextOccurrence(e, new Date()) : eventStartDate(e);
      var fireAt = start.getTime() - e.remindMin * 60000;
      var ms = fireAt - now;
      if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
        REMINDER_TIMERS[e.id] = setTimeout(function () {
          if (Notification.permission === 'granted') {
            new Notification(e.title, {
              body: 'In ' + e.remindMin + ' min' + (e.location ? ' · ' + e.location : ''),
              icon: 'images/icon-192.png',
              tag: e.id
            });
          }
        }, ms);
      }
    });
  }
  function clearReminder(id) {
    if (REMINDER_TIMERS[id]) {
      clearTimeout(REMINDER_TIMERS[id]);
      delete REMINDER_TIMERS[id];
    }
  }

  // ============================================================
  // TOAST
  // ============================================================
  var toastTimer = null;
  function toast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 2200);
  }

  // ============================================================
  // EVENT WIRING
  // ============================================================
  document.getElementById('fabAdd').addEventListener('click', function () { openModal(); });
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);
  document.getElementById('aboutBtn').addEventListener('click', function () {
    document.getElementById('aboutShroud').hidden = false;
  });
  document.getElementById('aboutClose').addEventListener('click', function () {
    document.getElementById('aboutShroud').hidden = true;
  });

  // Keyboard: ESC closes modals, Cmd/Ctrl+N opens new event
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      ['modalShroud', 'detailShroud', 'aboutShroud'].forEach(function (id) {
        document.getElementById(id).hidden = true;
      });
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      openModal();
    }
  });

  // ---------- util ----------
  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------- bootstrap ----------
  loadTheme();
  load();
  render();
  scheduleReminders();

  // Re-schedule when tab regains focus (in case setTimeout was paused)
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) {
      scheduleReminders();
      render();
    }
  });

})();
