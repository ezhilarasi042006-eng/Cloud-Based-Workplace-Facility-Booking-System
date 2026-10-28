const facilityGrid = document.getElementById('facilityGrid');
const facilitySelect = document.getElementById('facilitySelect');
const bookingList = document.getElementById('bookingList');
const bookingForm = document.getElementById('bookingForm');
const formMessage = document.getElementById('formMessage');
let facilities = [];

const symbols = { 'Meeting Room': '▦', 'Conference Hall': '▤', 'Workspace': '⌂' };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const formatDateTime = value => new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });

async function api(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Something went wrong. Please try again.');
  return data;
}

async function loadFacilities() {
  facilities = await api('/api/facilities');
  facilityGrid.innerHTML = facilities.map(f => `
    <article class="facility-card"><div class="facility-symbol">${symbols[f.type] || '▦'}</div><div class="facility-type">${escapeHtml(f.type)}</div><h3>${escapeHtml(f.name)}</h3><div class="facility-meta">⌖ ${escapeHtml(f.location)}<br>♙ Capacity: ${f.capacity} people</div><div class="facility-features">${escapeHtml(f.features)}</div></article>`).join('');
  facilitySelect.innerHTML = '<option value="">Choose a facility</option>' + facilities.map(f => `<option value="${escapeHtml(f.id)}">${escapeHtml(f.name)} — ${f.capacity} people</option>`).join('');
  document.getElementById('facilityCount').textContent = facilities.length;
}

async function loadBookings() {
  const bookings = await api('/api/bookings');
  const confirmed = bookings.filter(b => b.status === 'Confirmed').length;
  document.getElementById('totalBookings').textContent = bookings.length;
  document.getElementById('activeBookings').textContent = confirmed;
  if (!bookings.length) {
    bookingList.innerHTML = '<div class="empty-state">No bookings yet. Reserve a facility to see it listed here.</div>';
    return;
  }
  bookingList.innerHTML = bookings.map(b => `
    <article class="booking-row"><div><div class="booking-name">${escapeHtml(b.facilityName)}</div><div class="booking-detail">${escapeHtml(b.id)} · ${escapeHtml(b.employeeName)}</div></div><div><div class="booking-name">${escapeHtml(b.date)}</div><div class="booking-detail">${escapeHtml(formatDateTime(b.start))} – ${escapeHtml(new Date(b.end).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}))}</div></div><div><span class="status ${b.status === 'Cancelled' ? 'cancelled' : ''}">${escapeHtml(b.status)}</span><div class="booking-detail">${escapeHtml(b.purpose)}</div></div><div class="booking-actions"><button class="cancel-button" data-cancel="${escapeHtml(b.id)}" ${b.status === 'Cancelled' ? 'disabled' : ''}>${b.status === 'Cancelled' ? 'Cancelled' : 'Cancel booking'}</button></div></article>`).join('');
}

bookingForm.addEventListener('submit', async event => {
  event.preventDefault();
  formMessage.textContent = '';
  formMessage.className = 'message';
  const formData = new FormData(bookingForm);
  const payload = Object.fromEntries(formData.entries());
  try {
    const booking = await api('/api/bookings', { method: 'POST', body: JSON.stringify(payload) });
    formMessage.textContent = `Booking confirmed! Your reference number is ${booking.id}.`;
    formMessage.classList.add('success');
    const keepName = payload.employeeName;
    const keepEmail = payload.employeeEmail;
    bookingForm.reset();
    bookingForm.elements.employeeName.value = keepName;
    bookingForm.elements.employeeEmail.value = keepEmail;
    bookingForm.elements.startTime.value = '10:00';
    bookingForm.elements.endTime.value = '11:00';
    await loadBookings();
    document.getElementById('bookings').scrollIntoView({ behavior: 'smooth', block: 'start' });
  } catch (error) {
    formMessage.textContent = error.message;
    formMessage.classList.add('error');
  }
});

bookingList.addEventListener('click', async event => {
  const button = event.target.closest('[data-cancel]');
  if (!button || button.disabled) return;
  if (!confirm('Are you sure you want to cancel this booking?')) return;
  try {
    await api(`/api/bookings/${encodeURIComponent(button.dataset.cancel)}/cancel`, { method: 'PATCH' });
    await loadBookings();
  } catch (error) { alert(error.message); }
});

document.getElementById('refreshButton').addEventListener('click', () => loadBookings().catch(error => alert(error.message)));
const dateInput = document.getElementById('bookingDate');
const localToday = new Date();
dateInput.min = `${localToday.getFullYear()}-${String(localToday.getMonth()+1).padStart(2,'0')}-${String(localToday.getDate()).padStart(2,'0')}`;
dateInput.value = dateInput.min;

Promise.all([loadFacilities(), loadBookings()]).catch(error => {
  facilityGrid.innerHTML = `<p class="muted">Could not load data: ${escapeHtml(error.message)}. Please refresh the page.</p>`;
  bookingList.innerHTML = `<p class="muted">${escapeHtml(error.message)}</p>`;
});
