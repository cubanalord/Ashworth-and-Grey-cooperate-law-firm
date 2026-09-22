/* ============================================
   Ashworth & Grey Solicitors LLP — Shared scripts
   Includes: footer year, smooth scroll, booking system
   ============================================ */

(function () {
  'use strict';

  /* ---------- Footer year ---------- */
  document.querySelectorAll('.year').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------- Smooth scroll + close mobile nav ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#' || href === '') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const nav = document.getElementById('mainNav');
        if (nav && nav.classList.contains('show')) {
          new bootstrap.Collapse(nav).hide();
        }
      }
    });
  });

  /* ============================================================
     BOOKING SYSTEM (contact page only)
     ============================================================ */
  const consultForm = document.getElementById('consultForm');
  if (!consultForm) return; // exit if not on contact page

  /* ---------- Config ---------- */
  const WORK_START = 9;     // 9:00 AM
  const WORK_END = 18;      // 6:00 PM (last slot 17:00)
  const STORAGE_KEY = 'ag_bookings';

  const partners = {
    corporate:  { name: 'Eleanor Ashworth',    role: 'Senior Partner · Corporate',    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80' },
    realestate: { name: 'Charlotte Pemberton', role: 'Partner · Real Estate',         img: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80' },
    litigation: { name: 'James Grey',          role: 'Managing Partner · Litigation', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80' },
    compliance: { name: 'Oliver Whitmore',     role: 'Associate · Compliance',        img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80' },
    oilgas:     { name: 'Eleanor Ashworth',    role: 'Senior Partner · Corporate',    img: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=200&q=80' },
    other:      { name: 'James Grey',          role: 'Managing Partner · Litigation', img: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200&q=80' }
  };

  /* ---------- Storage helpers ---------- */
  function loadBookings() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }
  function saveBookings(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
  }

  /* Seed a few pre-booked slots so the demo looks realistic */
  function seedFakeBookings() {
    const data = loadBookings();
    const base = new Date();
    for (let d = 1; d <= 12; d++) {
      const day = new Date(base);
      day.setDate(base.getDate() + d);
      if (day.getDay() === 0 || day.getDay() === 6) continue;
      const key = toDateKey(day);
      if (!data[key]) data[key] = {};
      const seeds = ['10:00', '13:00', '15:00'];
      seeds.forEach(function (t, i) {
        if ((d + i) % 3 === 0 && !data[key][t]) {
          data[key][t] = { ref: 'AG-SEED-' + d + i, name: 'Existing client', seeded: true };
        }
      });
    }
    saveBookings(data);
  }

  /* ---------- Date/time helpers ---------- */
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function toDateKey(date) {
    return date.getFullYear() + '-' + pad(date.getMonth() + 1) + '-' + pad(date.getDate());
  }
  function formatTimeLabel(hour) {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    let h = hour % 12; if (h === 0) h = 12;
    return h + ':00 ' + ampm;
  }
  function formatTimeKey(hour) { return pad(hour) + ':00'; }
  function isWeekend(date) { const d = date.getDay(); return d === 0 || d === 6; }
  function formatDateLong(date) {
    return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  }
  function generateRef() {
    const year = new Date().getFullYear();
    const a = Math.floor(1000 + Math.random() * 9000);
    const b = Math.floor(1000 + Math.random() * 9000);
    return 'AG-' + year + '-' + a + b;
  }

  /* ---------- DOM references ---------- */
  const dateInput = document.getElementById('prefDate');
  const slotGrid = document.getElementById('slotGrid');
  const slotEmptyMsg = document.getElementById('slotEmptyMsg');
  const slotLegend = document.getElementById('slotLegend');
  const selectedSlotInput = document.getElementById('selectedSlot');
  const slotError = document.getElementById('slotError');
  const dateHint = document.getElementById('dateHint');
  const practiceArea = document.getElementById('practiceArea');
  const partnerAvatar = document.getElementById('partnerAvatar');
  const partnerName = document.getElementById('partnerName');
  const partnerRole = document.getElementById('partnerRole');
  const bookingFormWrap = document.getElementById('bookingFormWrap');
  const bookingConfirmed = document.getElementById('bookingConfirmed');

  /* ---------- Init ---------- */
  seedFakeBookings();
  const today = new Date();
  dateInput.min = toDateKey(today);

  /* ---------- Render available slots for the chosen date ---------- */
  function countSlots(dayBookings) {
    let n = 0;
    for (let h = WORK_START; h < WORK_END; h++) {
      if (!dayBookings[formatTimeKey(h)]) n++;
    }
    return n;
  }

  function renderSlots() {
    const val = dateInput.value;
    slotGrid.innerHTML = '';
    slotGrid.classList.add('d-none');
    slotEmptyMsg.style.display = 'block';
    slotLegend.style.display = 'none';
    selectedSlotInput.value = '';
    dateHint.classList.remove('text-danger');
    dateHint.textContent = 'We are open Monday to Friday, 9:00 AM – 6:00 PM.';
    slotError.style.display = 'none';

    if (!val) {
      slotEmptyMsg.textContent = 'Please select a date above to see available slots.';
      return;
    }

    const selectedDate = new Date(val + 'T00:00:00');
    const todayKey = toDateKey(new Date());

    if (val < todayKey) {
      slotEmptyMsg.textContent = 'Please choose today or a future date.';
      return;
    }

    if (isWeekend(selectedDate)) {
      slotEmptyMsg.textContent = 'We are closed on Saturdays and Sundays. Please choose a weekday.';
      dateHint.textContent = 'Weekend bookings are not available.';
      dateHint.classList.add('text-danger');
      return;
    }

    const bookings = loadBookings();
    const dayBookings = bookings[val] || {};

    let availableCount = 0;
    for (let h = WORK_START; h < WORK_END; h++) {
      const key = formatTimeKey(h);
      const label = formatTimeLabel(h);

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'slot-btn';
      btn.textContent = label;
      btn.dataset.time = key;

      if (dayBookings[key]) {
        btn.disabled = true;
        btn.title = 'Already booked';
      } else {
        availableCount++;
        btn.addEventListener('click', function () {
          document.querySelectorAll('.slot-btn.selected').forEach(function (b) {
            b.classList.remove('selected');
          });
          btn.classList.add('selected');
          selectedSlotInput.value = key;
          slotError.style.display = 'none';
        });
      }
      slotGrid.appendChild(btn);
    }

    if (availableCount > 0) {
      slotGrid.classList.remove('d-none');
      slotEmptyMsg.style.display = 'none';
      slotLegend.style.display = 'block';
      dateHint.textContent = availableCount + ' available slot' + (availableCount === 1 ? '' : 's') + ' on ' + formatDateLong(selectedDate) + '.';
    } else {
      slotEmptyMsg.textContent = 'All slots for this date are booked. Please choose another day.';
    }
  }

  dateInput.addEventListener('change', renderSlots);

  /* ---------- Switch partner when practice area changes ---------- */
  practiceArea.addEventListener('change', function () {
    const p = partners[practiceArea.value];
    if (!p) return;
    partnerAvatar.src = p.img;
    partnerName.textContent = p.name;
    partnerRole.textContent = p.role;
  });

  /* ---------- Form submission ---------- */
  consultForm.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();

    let valid = consultForm.checkValidity();
    if (!selectedSlotInput.value) {
      slotError.style.display = 'block';
      valid = false;
    } else {
      slotError.style.display = 'none';
    }

    if (!valid) {
      consultForm.classList.add('was-validated');
      const firstInvalid = consultForm.querySelector(':invalid');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const dateVal = dateInput.value;
    const slotVal = selectedSlotInput.value;
    const area = practiceArea.value;
    const partner = partners[area];

    // Re-check availability right before confirming
    const bookings = loadBookings();
    if (!bookings[dateVal]) bookings[dateVal] = {};
    if (bookings[dateVal][slotVal]) {
      slotError.textContent = 'Sorry, that slot was just taken. Please pick another.';
      slotError.style.display = 'block';
      renderSlots();
      return;
    }

    const name = document.getElementById('fullName').value.trim();
    const company = document.getElementById('companyName').value.trim();
    const email = document.getElementById('emailAddr').value.trim();
    const phone = document.getElementById('phoneNum').value.trim();
    const message = document.getElementById('messageBox').value.trim();

    const ref = generateRef();

    // Save booking
    bookings[dateVal][slotVal] = {
      ref: ref,
      name: name,
      company: company,
      email: email,
      phone: phone,
      area: area,
      message: message,
      createdAt: new Date().toISOString()
    };
    saveBookings(bookings);

    // Populate confirmation card
    document.getElementById('confirmEmail').textContent = email;
    document.getElementById('confirmRef').textContent = ref;
    document.getElementById('confirmArea').textContent = practiceArea.options[practiceArea.selectedIndex].text;
    document.getElementById('confirmDate').textContent = formatDateLong(new Date(dateVal + 'T00:00:00'));
    document.getElementById('confirmTime').textContent = formatTimeLabel(parseInt(slotVal.split(':')[0], 10));
    document.getElementById('confirmPartner').textContent = partner.name;

    // Swap views
    bookingFormWrap.classList.add('d-none');
    bookingConfirmed.classList.remove('d-none');
    bookingConfirmed.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });

  /* ---------- "Book another slot" button ---------- */
  const newBookingBtn = document.getElementById('newBookingBtn');
  if (newBookingBtn) {
    newBookingBtn.addEventListener('click', function () {
      consultForm.reset();
      consultForm.classList.remove('was-validated');
      selectedSlotInput.value = '';
      slotGrid.innerHTML = '';
      slotGrid.classList.add('d-none');
      slotEmptyMsg.style.display = 'block';
      slotEmptyMsg.textContent = 'Please select a date above to see available slots.';
      slotLegend.style.display = 'none';
      dateHint.textContent = 'We are open Monday to Friday, 9:00 AM – 6:00 PM.';
      dateHint.classList.remove('text-danger');

      // reset partner card
      partnerAvatar.src = partners.corporate.img;
      partnerName.textContent = partners.corporate.name;
      partnerRole.textContent = partners.corporate.role;

      bookingConfirmed.classList.add('d-none');
      bookingFormWrap.classList.remove('d-none');
      bookingFormWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

})();